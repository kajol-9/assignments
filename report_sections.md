# Project Report — CTO Assistant: AutoDataLoad BatchTrigger

---

## Overall Idea of the Project

Modern enterprises accumulate knowledge across diverse document formats — PDFs, emails, spreadsheets, and Word documents — making it difficult for leadership to retrieve relevant information quickly. The **CTO Assistant AutoDataLoad BatchTrigger** solves this by building a fully automated, cloud-native document ingestion pipeline on AWS that makes organisational knowledge instantly searchable through AI-powered semantic search.

The system works as follows: when a document is uploaded to an Amazon S3 bucket, an AWS Lambda function is triggered automatically. It validates the file, extracts metadata, and delegates processing to AWS Batch. The Batch container parses the document, splits it into chunks, generates vector embeddings using AWS Bedrock (Titan Embedding v2), and indexes them into Amazon OpenSearch — enabling natural language search over the organisation's knowledge base. The pipeline supports seven file formats (PDF, DOCX, XLSX, XLS, MSG, TXT, JSON), operates across multiple environments (dev/staging/prod), and is designed for zero-downtime index updates.

---

## Project Work

### Objective

The objective was to design and implement a production-grade, serverless document ingestion pipeline as the data backbone of the CTO Assistant knowledge base platform, following industry-standard engineering practices including automated testing, CI/CD, and multi-environment configuration management.

---

### System Architecture

The pipeline follows a decoupled, event-driven architecture where each component has a single, clearly defined responsibility:

```
Amazon S3 (Document Upload)
        |
        | ObjectCreated Event
        v
AWS Lambda — lambda_handler.py
  · Validates file type
  · Extracts S3 metadata
  · Submits Batch job
  · Publishes SNS notification
        |
        v
AWS Batch Container — loadOS.py
  · Downloads file from S3
  · Extracts text (format-specific parsers)
  · Cleans email noise (MSG files)
  · Chunks text: 1024 chars / 128 overlap
        |
        v
AWS Bedrock — Titan Embedding v2
  · Generates 1536-dimensional vectors
        |
        v
Amazon OpenSearch
  · Bulk upload (4000 docs/batch with retry)
  · Atomic index alias swap (zero downtime)
```

This separation ensures that failures are isolated, each component scales independently, and heavy processing does not interfere with Lambda's execution constraints.

---

### Components Developed

#### 1. Lambda Trigger Handler (`lambda_handler.py`)

The Lambda function acts as the pipeline's entry point. On each S3 `ObjectCreated` event, it:

- Parses the event payload to extract the bucket name, object key, and file metadata
- Validates the file extension against a supported-types whitelist
- Resolves environment-specific configuration (job queue, index name, data source type) from `lambda_config.json`
- Submits a dynamically named AWS Batch job with container environment variable overrides
- Publishes pipeline status updates to an Amazon SNS topic for alerting and monitoring
- Returns structured response codes (200/400/500) and logs all operations to CloudWatch

#### 2. Batch Document Processor (`loadOS.py`)

The Batch container performs the core seven-stage processing pipeline:

| Stage | Operation |
|---|---|
| 1. Download | Retrieves the document from S3 |
| 2. Extract | Parses text using format-specific libraries (PyPDF2, Docx2txt, extract-msg, openpyxl) |
| 3. Clean | Strips email signatures, forwarded chains, and boilerplate from MSG files using regex |
| 4. Chunk | Splits content using LangChain `RecursiveCharacterTextSplitter` (1024 chars, 128 overlap) |
| 5. Embed | Sends each chunk to AWS Bedrock Titan v2 for 1536-dimensional vector generation |
| 6. Upload | Bulk-uploads to OpenSearch in batches of 4000 with exponential backoff retry |
| 7. Alias Swap | Atomically re-points the search alias to the new index for zero-downtime cutover |

#### 3. Configuration and Auth Layer

`config.py` centralises all environment-specific settings — S3 buckets, OpenSearch endpoints, Batch queues, chunk parameters — into a single validated configuration object loaded from `lambda_config.json` or environment variables. `aws.py` provides an authenticated client factory for Bedrock, S3, and OpenSearch using IAM role credentials and adaptive retry configuration.

#### 4. Test Suite

A comprehensive suite of **170 unit tests** was written using `pytest`, `unittest.mock`, and `moto` (AWS service simulation):

| Test File | Tests | Scope |
|---|---|---|
| `test_lambda_handler.py` | 52 | File validation, S3 event parsing, Batch submission, SNS, error handling |
| `test_loadOS.py` | 118 | Document loaders, email cleaning, chunking, OpenSearch operations, AWS clients |

Shared fixtures in `conftest.py` manage mock AWS environment setup and teardown for test isolation.

#### 5. CI/CD Pipeline

A GitHub Actions workflow enforces quality on every commit:

- Full test suite executed across **Python 3.9, 3.10, and 3.11**
- Coverage reports uploaded to **Codecov** for threshold enforcement
- **SonarCloud** static analysis for code quality, security hotspots, and duplication
- **Black** and **Flake8** for consistent code formatting

---

### Technology Stack

| Layer | Technology |
|---|---|
| Serverless Trigger | AWS Lambda |
| Batch Processing | AWS Batch |
| Document Storage | Amazon S3 |
| Vector Embeddings | AWS Bedrock — Titan Embedding v2 |
| Vector Search | Amazon OpenSearch |
| Notifications | Amazon SNS |
| Monitoring | AWS CloudWatch |
| Language | Python 3.9 / 3.10 / 3.11 |
| Document Parsing | PyPDF2, Docx2txt, extract-msg, openpyxl |
| AI Framework | LangChain |
| AWS SDK | Boto3, opensearch-py |
| Testing | Pytest, Unittest, Moto, Coverage.py |
| Code Quality | SonarCloud, Pylint, Flake8, Black |
| CI/CD | GitHub Actions, Codecov |

---

## Learning Outcomes

### 1. Event-Driven Serverless Architecture
This project provided hands-on experience designing loosely coupled, asynchronous pipelines on AWS. A key insight was understanding the correct boundary between Lambda (short-lived, lightweight trigger logic) and Batch (long-running, compute-heavy processing) — a distinction that directly shaped the architecture and resolved the execution timeout problem.

### 2. Vector Embeddings and Semantic Search
Implementing the Bedrock embedding pipeline built a concrete understanding of how transformer models encode semantic meaning into dense vectors, enabling search results based on conceptual relevance rather than keyword matching. This understanding of RAG (Retrieval-Augmented Generation) architecture is foundational to modern enterprise AI development.

### 3. LangChain for AI Pipeline Orchestration
Practical experience was gained using LangChain's `RecursiveCharacterTextSplitter` for intelligent document chunking and its `OpenSearchVectorSearch` integration for abstracting bulk vector indexing — providing a reusable framework for building future AI-powered data pipelines.

### 4. Multi-Format Document Processing
Processing real-world enterprise documents exposed the complexity of parsing at scale — password-protected PDFs, malformed email chains, merged Excel cells, and multi-encoding text files all required individual handling strategies. This reinforced the importance of defensive programming and never assuming input data is well-formed.

### 5. Test-Driven Development with Mocked Cloud Services
Writing 170 tests against simulated AWS services using `moto` and `unittest.mock` developed strong skills in test isolation, dependency injection, and mock-based testing — enabling full test suite execution in under 30 seconds with zero cloud cost or network dependency.

### 6. Zero-Downtime Deployment Patterns
Implementing the OpenSearch atomic alias swap introduced an important class of deployment pattern: achieving consistent state transitions in distributed systems without service interruption. This pattern is broadly applicable to database migrations, blue/green deployments, and API versioning.

### 7. CI/CD and Engineering Discipline
Configuring a multi-stage GitHub Actions pipeline — with test coverage gates, SonarCloud quality thresholds, and multi-version compatibility checks — reinforced that automated quality enforcement is a core engineering practice, not optional overhead.

---

## Problems Faced

### 1. Lambda Execution Time Limit
**Problem:** AWS Lambda's 15-minute maximum timeout was insufficient for processing large documents, causing silent pipeline failures on large PDFs and spreadsheets.
**Solution:** The architecture was refactored to restrict Lambda to lightweight validation and job submission only (completing in under 10 seconds), delegating all processing to AWS Batch, which has no execution time limit and supports up to 10 automatic retries.

---

### 2. Heterogeneous Document Format Parsing
**Problem:** Seven document formats each required a different parsing library, each with unique failure modes — password-protected PDFs, empty DOCX files, malformed MSG structures, and Excel files with merged cells and hidden sheets.
**Solution:** A dispatch pattern was implemented mapping each file extension to a dedicated loader function with format-specific error handling. Post-extraction validation ensures content meets a minimum character threshold before proceeding.

---

### 3. Email Content Noise
**Problem:** MSG (Outlook email) files contained significant non-informational content — signature blocks, forwarded chains, reply headers, and legal disclaimers — that degraded search result quality when indexed.
**Solution:** A dedicated email cleaning module was developed using layered regex processing: forwarded chain detection, CTO-specific signature template matching, and whitespace normalisation. The cleaning pipeline was validated against real email exports.

---

### 4. OpenSearch Bulk Upload Failures
**Problem:** Uploading all document chunks in a single API request caused HTTP 413 (Payload Too Large) errors, memory exhaustion in the Batch container, and total loss of progress on transient network failures.
**Solution:** Uploads were redesigned into sequential batches of 4000 documents, each wrapped in a retry loop with exponential backoff. This bounds request size, retains partial upload progress on failure, and handles transient network issues transparently.

---

### 5. Mocking AWS Services in Tests
**Problem:** The pipeline depends on S3, Bedrock, and OpenSearch — running tests against real services would introduce cost, latency, and non-determinism. Incorrect mocks, however, risk creating tests that pass in isolation but fail against real services.
**Solution:** A shared `conftest.py` was created using `moto` for in-memory S3 simulation, `unittest.mock` for Bedrock API patching with deterministic test vectors, and mock OpenSearch response fixtures. Environment variables are isolated per test via setup/teardown methods.

---

### 6. Atomic Index Alias Management
**Problem:** The initial alias swap implementation sequentially removed the old alias and added the new one — creating a brief window where the alias pointed to nothing, returning empty search results to active users.
**Solution:** The logic was rewritten to use OpenSearch's `update_aliases` action, which performs the remove and add atomically in a single API call. A prior-alias existence check was added to handle first-time indexing without raising exceptions.

---

### 7. Multi-Environment Configuration
**Problem:** Managing different S3 buckets, OpenSearch hosts, and Batch queues across dev, staging, prod, and test environments led to hardcoded values scattered across the codebase, making configuration changes fragile.
**Solution:** All environment-specific configuration was centralised in `lambda_config.json` and loaded through a single validated `config.py` module. Adding a new environment requires only one file change; missing configuration fails fast at startup rather than silently at runtime.

---

## Conclusion

The CTO Assistant AutoDataLoad BatchTrigger project successfully delivered a production-ready, event-driven document ingestion pipeline that automates the transformation of raw enterprise documents into semantically searchable vector embeddings in Amazon OpenSearch. The system integrates eight AWS managed services, supports seven document formats, processes documents through a seven-stage pipeline, and achieves zero-downtime index updates — all validated by 170 automated tests across three Python versions.

The project's key architectural contribution is its strict separation of triggering (Lambda) from processing (Batch), a pattern that simultaneously solves execution time constraints, improves fault isolation, and optimises cloud cost. The atomic index alias swap further demonstrates how distributed systems can perform consistent state transitions without service downtime — a pattern with broad applicability beyond this project.

From a professional development perspective, the project provided immersive experience in cloud-native AI infrastructure: the intersection of serverless computing, vector search, foundation model APIs, and enterprise software engineering practices. The skills developed — in AWS architecture, RAG pipeline design, test-driven development, and CI/CD automation — are directly applicable to production AI system development and reflect the current direction of enterprise software engineering.

In conclusion, the project not only met its technical objectives but also reinforced the engineering principles of decoupling, defensive programming, testability, and quality automation — qualities that distinguish production-grade systems from prototype implementations.
