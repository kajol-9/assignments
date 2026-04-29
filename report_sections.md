# Project Report — CTO Assistant: AutoDataLoad BatchTrigger

---

## Overall Idea of the Project

The **CTO Assistant AutoDataLoad BatchTrigger** is a serverless, event-driven pipeline on AWS that automatically ingests documents uploaded to Amazon S3, converts them into vector embeddings, and loads them into Amazon OpenSearch for AI-powered semantic search. It forms the data ingestion backbone of the CTO Assistant knowledge base platform.

The workflow is triggered when a document is uploaded to S3. An AWS Lambda function validates the file type, then submits an AWS Batch job. The Batch container downloads the file, extracts text, splits it into chunks, generates embeddings via AWS Bedrock (Titan Embedding v2 — model ID `amazon.titan-embed-text-v2:0`), and bulk-uploads the results to OpenSearch. A final alias swap makes the new index live without downtime.

Supported formats: `.pdf`, `.doc`, `.docx`, `.txt`, `.msg`, `.xlsx`, `.xls`, `.json`.
Environments supported: `dev`, `staging`, `prod`, `test` — each with its own S3 bucket, Batch queue, and job definition configured in `lambda_config.json`.

---

## Project Work

### System Architecture

```
Amazon S3
    | ObjectCreated event
    v
AWS Lambda  (lambda_handler.py)
    · Validates file extension against supported types whitelist
    · Reads ENVIRONMENT, BATCH_JOB_QUEUE, BATCH_JOB_DEFINITION,
      DATA_SOURCE_TYPE, REGION from environment variables
    · Submits Batch job with container overrides:
        PROCESSING_MODE=s3, S3_BUCKET_NAME, S3_OBJECT_KEY,
        DATA_SOURCE_TYPE, LAMBDA_TRIGGERED=true, ENVIRONMENT
    · Publishes SNS notification if SNS_TOPIC_ARN is set
    · Returns HTTP 202 (accepted), 400 (bad input), or 500 (error)
    |
    v
AWS Batch Container  (loadOS.py)
    · Downloads file to /tmp/cto_documents/
    · Extracts text using format-specific loaders
    · Cleans email content (MSG files only)
    · Chunks with RecursiveCharacterTextSplitter
      (chunk_size=1024, chunk_overlap=128)
      separators: ["\n\n", "\n", ". ", " ", ""]
    |
    v
AWS Bedrock  (amazon.titan-embed-text-v2:0)
    · Generates vector embeddings per chunk
    |
    v
Amazon OpenSearch
    · Bulk upload in batches of 4000 documents
    · Creates timestamped index: {index_name}-YYYY-MM-DD-HH-MM-SS
    · Atomic alias update: removes old {index_name}-* pattern,
      adds new index to alias in one update_aliases call
```

---

### Components Built

#### 1. Lambda Trigger Handler (`src/lambda_handler.py`)

The Lambda function handles S3 `ObjectCreated` events. Key implementation details verified from source:

- `validate_document_type(key)` — converts extension to lowercase and checks against the set `{'.pdf', '.doc', '.docx', '.txt', '.msg', '.xlsx', '.xls', '.json'}`. Returns `False` for unsupported types; Lambda returns HTTP 400 without submitting a Batch job.
- `get_environment_config()` — reads five required environment variables (`ENVIRONMENT`, `BATCH_JOB_QUEUE`, `BATCH_JOB_DEFINITION`, `DATA_SOURCE_TYPE`, `REGION`). If any are missing, raises `DocumentLoadError` listing all missing keys.
- `submit_batch_job()` — builds the job name as `cto-document-load-{base[:80]}` (slashes replaced with hyphens, truncated to 80 characters). Passes S3 bucket/key and processing parameters as container environment variable overrides.
- `send_notification()` — publishes to SNS only if `SNS_TOPIC_ARN` is set; SNS failures are caught and logged but do not fail the Lambda response.
- Returns HTTP 202 on success, 400 for `DocumentLoadError`, 500 for all other exceptions.

#### 2. Batch Document Processor (`src/loadOS.py`)

The Batch container runs `main()` which orchestrates:

**Text Extraction — `load_document(file_path)`**

Each format uses a dedicated loader:

| Extension | Library Used |
|---|---|
| `.pdf` | `PyPDFLoader` (LangChain) |
| `.docx` / `.doc` | `Docx2txtLoader` (LangChain) |
| `.txt` | Native `open()` with UTF-8 encoding |
| `.msg` | `extract_msg.openMsg()`, then `email_clean_process()` |
| `.xlsx` / `.xls` | `UnstructuredExcelLoader` (LangChain, mode='elements') |
| `.json` | Native `json.load()`, serialised back with `json.dumps(indent=2)` |

**Email Cleaning — `clean_email_block()` / `email_clean_process()`**

MSG files are split on `^From:` lines into individual email blocks. For each block:
- `From:` and `To:` headers are extracted, then removed from the body
- The body is split on `Subject:` line to isolate content
- A hardcoded regex `CTO_SIGNATURE_PATTERN` removes the specific signature of *Luis Barbier, SVP and Chief Technology Officer, Underwriting Solutions, Verisk* (including phone numbers, social links, and privacy notice boilerplate)
- Common email closings (`Best regards`, `Sincerely`, `Regards`, etc.) are detected and everything after them is discarded
- Consecutive blank lines are collapsed to a single newline

**Chunking — `chunk_documents_hybrid()`**

Uses `RecursiveCharacterTextSplitter` with:
- `chunk_size=1024` (configurable via `CHUNK_SIZE` env var, default 1024)
- `chunk_overlap=128` (configurable via `CHUNK_OVERLAP`, default 128)
- `separators=["\n\n", "\n", ". ", " ", ""]`
- `keep_separator=False`

**OpenSearch Upload — `OpenSearchHelper`**

- Connects using `BedrockEmbeddings` with model `amazon.titan-embed-text-v2:0`
- SSL enabled, certificate verification on, HTTP compression on
- Uploads in a loop: `for i in range(0, total_chunks, bulk_size)` — default `bulk_size=4000` (configurable via `BULK_SIZE`)
- `AuthorizationException` is caught and logged separately from generic exceptions
- Index name format: `{base_index_name}-{datetime.utcnow().strftime("%Y-%m-%d-%H-%M-%S")}`
- `modify_existing_index()` calls `client.indices.update_aliases()` with a single body containing both the `remove` action (pattern `{index_name}-*`) and the `add` action for the new index

**AWS Client Configuration — `AWSClass`**

- Boto3 retry config: `max_attempts=10`, `mode='adaptive'`, `connect_timeout=10`, `read_timeout=1000`, `max_pool_connections=10`
- Auth for OpenSearch: `AWS4Auth` using session credentials (access key, secret key, session token)

#### 3. Configuration Layer (`src/config/config.py`)

`config.py` loads settings from environment variables first; if not all keys are present in `os.environ`, it falls back to `src/config/env.properties` (for local development). It then loads `lambda_config.json` for environment-to-resource mappings.

Defaults from source:
- `CHUNK_SIZE=1024`, `CHUNK_OVERLAP=128`, `BULK_SIZE=4000`
- `OPENSEARCH_ALIAS=techops-cto-chat-index-alias`
- `EMBEDDING_MODEL_ID=amazon.titan-embed-text-v2:0`
- `PROCESSING_MODE=s3`
- `OPENSEARCH_PORT=443`

Three data source routing paths exist: `chat`, `wiki`, `questionnaire` — each maps to a separate S3 prefix and OpenSearch index name.

#### 4. Test Suite

52 tests in `test_lambda_handler.py` and the `test_loadOS.py` test file covering the Batch processor, using `pytest`, `unittest`, and `unittest.mock`. No `moto` is used — all AWS clients are patched via `unittest.mock.patch`. The CI workflow runs both files with `pytest tests/ --cov=src`.

Test classes in `test_lambda_handler.py`:

| Class | Tests | What Is Tested |
|---|---|---|
| `TestValidateDocumentType` | 9 | All 8 supported types, unsupported types, no extension, case-insensitivity |
| `TestExtractS3EventDetails` | 8 | Valid event, multiple records, empty Records, missing bucket, missing key, missing s3 block, missing eventName |
| `TestGetEnvironmentConfig` | 8 | All 5 required vars present, with optional vars, each required var missing individually, all missing |
| `TestSubmitBatchJob` | 3 | Successful submission (verifies container env vars), long key truncation to 80 chars, slash-to-hyphen conversion |
| `TestSendNotification` | 5 | With SNS ARN, without SNS ARN (no boto3 call made), SNS publish exception, region propagation |
| `TestLambdaHandler` | 6 | Success (202), unsupported file (400), invalid event (400), missing env vars (400), Batch exception (500), all 6 supported types |
| `TestLambdaHandlerEdgeCases` | 7 | SNS failure does not affect 202 response, empty bucket, empty key, missing eventName, case-insensitive extensions, deep paths, special characters in filename |
| `TestLambdaHandlerBatchSubmissionEdgeCases` | 2 | prod environment config, optional env vars (OPENSEARCH_INDEX_NAME, SERVICE=aoss) |
| `TestLambdaHandlerErrorResponseFormats` | 2 | Error response structure (statusCode, body, status, message), success response structure (jobId, document, status) |
| `TestDocumentLoadError` | 2 | Exception message, inherits from Exception |

#### 5. CI/CD Pipeline (`.github/workflows/tests.yml`)

Triggered on push/PR to `master`, `main`, `develop`. Steps:
1. Matrix across Python **3.9, 3.10, 3.11** on `ubuntu-latest`
2. pip cache keyed on `requirements*.txt` hash
3. Install `requirements.txt` (3 packages: `opensearch-py>=2.0.0`, `extract-msg>=0.28.0`, `nltk>=3.8.0`) and `requirements-dev.txt`
4. Run `pytest tests/ --cov=src --cov-report=xml --cov-report=term-missing --junitxml=test-results.xml -v`
5. Upload `coverage.xml` to Codecov
6. SonarCloud scan on push (not PRs), using `coverage.xml` and `test-results.xml`
7. Archive `coverage.xml`, `test-results.xml`, `htmlcov/` as artifacts
8. Publish JUnit results via `EnricoMi/publish-unit-test-result-action@v2`

---

## Learning Outcomes

**1. Event-driven architecture on AWS**
Working through Lambda → Batch decoupling gave practical understanding of when to use stateless short-lived functions (Lambda, <15 min limit) versus managed batch compute (Batch, no time limit with up to 10 retry attempts). The Lambda returns HTTP 202 immediately after job submission — the caller does not wait for processing to complete.

**2. Vector search and embeddings pipeline**
Implementing the Bedrock → OpenSearch flow showed how text is converted to fixed-size vectors (`amazon.titan-embed-text-v2:0`) and stored for similarity search. The chunking step (1024 chars, 128 overlap) is necessary because embedding models have token input limits, and overlap preserves context across chunk boundaries.

**3. Real-world document parsing**
Each of the 8 supported formats required a different parsing approach. MSG files required the most work: splitting email chains on `^From:` boundaries, extracting only the body past the `Subject:` line, removing a specific CTO signature block by exact regex match, and discarding content after standard closing phrases. This is specific to how the organisation's emails are structured.

**4. Test isolation without cloud dependencies**
All AWS service calls (boto3 `batch.submit_job`, `sns.publish`, S3 download) are patched using `unittest.mock.patch` at the function import level (`@patch('src.lambda_handler.boto3.client')`). This means tests run with zero AWS credentials and zero cloud cost. Each test class uses `setUp` to set the required environment variables to known values before each test method runs.

**5. Atomic index management in OpenSearch**
Documents are always written to a new timestamped index. Once complete, `update_aliases` is called with a single request body that simultaneously removes the old `{index_name}-*` pattern and adds the new index. This means the alias is never pointing to nothing — active search queries continue resolving against the previous index until the swap completes.

**6. CI/CD pipeline configuration**
Configuring the GitHub Actions matrix (3 Python versions), wiring coverage output to both Codecov and SonarCloud from the same `coverage.xml`, and publishing JUnit XML results as PR check annotations required understanding how each tool consumes the output of `pytest --cov`.

---

## Problems Faced

### 1. Lambda Timeout for Large Documents

**Problem:** Lambda has a maximum timeout of 900 seconds (15 minutes), as set in `lambda_config.json` (`"timeout": 900`). For large PDFs with many pages or Excel files with many rows, running text extraction, chunking, embedding calls, and OpenSearch uploads inside Lambda would exceed this.

**Solution:** Lambda only validates the file type and submits the Batch job — operations that complete in seconds. All processing runs in the Batch container, which has no execution time limit. The Batch job is configured with `max_attempts: 10` and `mode: adaptive` retry.

---

### 2. Processing Both Single Files and Entire S3 Prefixes

**Problem:** The system needed to support two use cases: (a) Lambda-triggered processing of a single newly uploaded file, and (b) bulk reprocessing of an entire S3 prefix. These have different input sources and different file discovery logic.

**Solution:** A `PROCESSING_MODE` environment variable controls behaviour. In `s3` mode (Lambda-triggered), `S3_OBJECT_KEY` is read and a single file is downloaded to `/tmp/cto_documents/`. In `local` mode, `get_local_files()` walks a local directory. The rest of the pipeline (chunking, embedding, upload) is identical for both modes.

---

### 3. Email Content Containing Non-informational Boilerplate

**Problem:** MSG files from the CTO's mailbox contained the same signature block on every email — name, title, phone numbers, social media links, privacy notice — as well as forwarded message chains with repeated content. Indexing this would add noise to search results.

**Solution:** `email_clean_process()` splits the email chain into individual blocks on `^From:` boundaries (processing in reverse order to preserve chronological context), then `clean_email_block()` strips the `From:`/`To:` headers from the body text, removes the signature using `CTO_SIGNATURE_PATTERN` (a hardcoded regex matching the exact signature text of Luis Barbier, SVP/CTO at Verisk), and truncates content at common closing phrases such as `Best regards` or `Sincerely`.

---

### 4. OpenSearch Bulk Upload Batching

**Problem:** Sending all document chunks in one API call would exceed request size limits for large documents.

**Solution:** `add_documents_to_opensearch()` iterates in steps of `bulk_size` (default 4000): `for i in range(0, total_chunks, int(self.bulk_size))`. Each batch calls `db.add_documents(batch, bulk_size=self.bulk_size, index=self.index_name)`. `AuthorizationException` is caught and logged separately, allowing the loop to continue to the next batch rather than aborting all remaining uploads.

---

### 5. Index Alias Swap Edge Cases

**Problem:** The initial alias update logic tried to remove the old index alias and add the new one as separate operations. If no prior alias existed (first-time indexing), the remove operation would raise an exception, blocking the add.

**Solution:** `modify_existing_index()` builds an `actions` list. The remove action (`{"remove": {"index": remove_pattern, "alias": alias}}`) is only added if `remove_pattern` is not `None`. The add action is always appended. Both are submitted in a single `client.indices.update_aliases(body={"actions": actions})` call, which is atomic. The index name pattern is derived by splitting on `-` to extract the base prefix.

---

### 6. Environment Variable Configuration Across Four Environments

**Problem:** `dev`, `staging`, `prod`, and `test` each require different S3 bucket names, Batch queue names, and Batch job definitions. Hardcoding these or checking `if env == 'prod'` throughout the code creates maintenance issues.

**Solution:** All environment-to-resource mappings are in `src/config/lambda_config.json`. `config.py` reads the active `ENVIRONMENT` variable, looks it up in `CONFIG['environments']`, and exposes the resolved values (`S3_BUCKET`, `BATCH_JOB_QUEUE`, `BATCH_JOB_DEFINITION`) as module-level constants. Adding a new environment requires only a new entry in `lambda_config.json`.

---

## Conclusion

The CTO Assistant AutoDataLoad BatchTrigger project delivered a working, tested, serverless document ingestion pipeline that integrates AWS Lambda, Batch, S3, Bedrock, OpenSearch, and SNS into an automated flow triggered by S3 uploads.

The key architectural decision — keeping Lambda responsible only for validation and job submission, with all processing in Batch — directly resolves the Lambda execution timeout constraint and allows the system to handle documents of any size. The atomic index alias swap in OpenSearch ensures no gap in search availability during re-indexing.

The test suite of 52 tests for `lambda_handler.py` covers every function, all error paths, and boundary conditions such as case-insensitive extension validation, empty bucket names, and job name truncation for long S3 keys. The CI/CD pipeline runs these tests across Python 3.9, 3.10, and 3.11 on every push to `master`, `main`, and `develop`, with results published to Codecov and SonarCloud.

The most technically involved part of the project was the email cleaning pipeline for `.msg` files, which required understanding the specific structure of the organisation's email chains and building regex-based cleaning logic that removes a known signature block while preserving the actual message content.
