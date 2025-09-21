import os
import boto3
from ..config import settings
from botocore.config import Config

# Set environment variables to fix S3 signature issues
os.environ['AWS_S3_DISABLE_MULTIPART_THRESHOLD'] = '1073741824'  # 1GB
os.environ['AWS_S3_PAYLOAD_SIGNING_ENABLED'] = 'false'
os.environ['AWS_S3_ADDRESSING_STYLE'] = 'path'

# S3 configuration to fix signature issues - try path-style addressing
s3_config = Config(
    signature_version='s3v4',
    s3={
        'addressing_style': 'path',
        'payload_signing_enabled': False
    },
    retries={
        'max_attempts': 3,
        'mode': 'adaptive'
    }
)

# Initialize S3 client
s3_client = boto3.client(
    's3',
    endpoint_url=settings.S3_ENDPOINT,
    aws_access_key_id=settings.S3_ACCESS_KEY,
    aws_secret_access_key=settings.S3_SECRET_KEY,
    region_name=settings.S3_REGION,
    config=s3_config
)



S3_BUCKET = settings.S3_BUCKET