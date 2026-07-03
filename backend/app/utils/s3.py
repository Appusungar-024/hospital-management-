import boto3
from botocore.exceptions import NoCredentialsError, ClientError
import uuid
import os
import mimetypes

MINIO_URL = os.getenv("MINIO_URL", "http://localhost:9000")
MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY", "minioadminpassword")
BUCKET_NAME = "lab-results"

s3_client = boto3.client(
    "s3",
    endpoint_url=MINIO_URL,
    aws_access_key_id=MINIO_ACCESS_KEY,
    aws_secret_access_key=MINIO_SECRET_KEY,
)

def init_s3():
    try:
        s3_client.head_bucket(Bucket=BUCKET_NAME)
    except ClientError:
        # Create bucket if it does not exist
        s3_client.create_bucket(Bucket=BUCKET_NAME)
        
        # Make bucket publicly readable for downloading reports easily from frontend
        policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": "*",
                    "Action": "s3:GetObject",
                    "Resource": f"arn:aws:s3:::{BUCKET_NAME}/*"
                }
            ]
        }
        import json
        s3_client.put_bucket_policy(Bucket=BUCKET_NAME, Policy=json.dumps(policy))

def upload_file_to_s3(file_bytes: bytes, filename: str) -> str:
    # Ensure bucket exists
    init_s3()
    
    unique_filename = f"{uuid.uuid4().hex}_{filename}"
    content_type, _ = mimetypes.guess_type(filename)
    
    s3_client.put_object(
        Bucket=BUCKET_NAME,
        Key=unique_filename,
        Body=file_bytes,
        ContentType=content_type or 'application/octet-stream'
    )
    
    return f"{MINIO_URL}/{BUCKET_NAME}/{unique_filename}"
