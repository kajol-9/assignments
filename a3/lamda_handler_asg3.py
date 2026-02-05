import boto3
import json
import re
from concurrent.futures import ThreadPoolExecutor, as_completed

# Initialize S3 client
s3 = boto3.client('s3')

SOURCE_BUCKET = 'kajol-src-asg3' 
DEST_BUCKET = 'kajol-dest-bucket'
MAX_THREADS = 5  

def clean_text(text_content):
    """Removes non-printable characters and collapses whitespace."""
    cleaned = re.sub(r'[^\x20-\x7E]+', ' ', text_content)
    return re.sub(r'\s+', ' ', cleaned).strip()

def process_single_file(file_key):
    """The task performed by each thread."""
    try:
        # 1. Download
        file_obj = s3.get_object(Bucket=SOURCE_BUCKET, Key=file_key)
        raw_text = file_obj['Body'].read().decode('utf-8')

        # 2. Transform
        cleaned_content = clean_text(raw_text)
        json_data = {
            "metadata": {"original_file": file_key},
            "content": cleaned_content
        }

        # 3. Upload
        dest_key = file_key.rsplit('.', 1)[0] + '.json'
        s3.put_object(
            Bucket=DEST_BUCKET,
            Key=dest_key,
            Body=json.dumps(json_data, indent=4),
            ContentType='application/json'
        )
        return True, file_key
    except Exception as e:
        return False, f"{file_key}: {str(e)}"

def lambda_handler(event, context):
    all_files = []
    
    # 1 Gather all .txt keys from source bucket
    paginator = s3.get_paginator('list_objects_v2')
    for page in paginator.paginate(Bucket=SOURCE_BUCKET):
        if 'Contents' in page:
            for obj in page['Contents']:
                if obj['Key'].endswith('.txt'):
                    all_files.append(obj['Key'])

    if not all_files:
        return {'statusCode': 200, 'body': "No .txt files found."}

    success_count = 0
    errors = []

    # 2 Process files concurrently
    with ThreadPoolExecutor(max_workers=MAX_THREADS) as executor:
        # Map the function to the list of files
        future_to_file = {executor.submit(process_single_file, key): key for key in all_files}
        
        for future in as_completed(future_to_file):
            success, result = future.result()
            if success:
                success_count += 1
                print(f"SUCCESS: {result}")
            else:
                errors.append(result)
                print(f"FAILED: {result}")

    return {
        'statusCode': 200 if not errors else 207,
        'body': {
            'total_processed': success_count,
            'failed_count': len(errors),
            'errors': errors
        }
    }
