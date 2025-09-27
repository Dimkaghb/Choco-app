from typing import List, Optional
from datetime import datetime
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorCollection
from ..auth.database import get_database
from .models import (
    FileMetadataCreate, FileMetadataUpdate, FileMetadataResponse, 
    FileMetadataInDB, FileUploadRequest, FileUploadResponse
)
from .s3_client import s3_client, S3_BUCKET
import uuid
import logging

logger = logging.getLogger(__name__)

class FileStorageService:
    """Service for managing file metadata and S3 operations"""
    
    def __init__(self):
        self.collection_name = "file_metadata"
    
    def get_files_collection(self) -> AsyncIOMotorCollection:
        """Get files collection"""
        database = get_database()
        return database[self.collection_name]
    
    async def create_upload_url(self, request: FileUploadRequest, user_id: str) -> FileUploadResponse:
        """Create a presigned upload URL and store file metadata"""
        try:
            # Generate unique file key
            file_extension = request.filename.split('.')[-1] if '.' in request.filename else ''
            file_key = f"users/{user_id}/files/{uuid.uuid4()}.{file_extension}" if file_extension else f"users/{user_id}/files/{uuid.uuid4()}"
            
            # Generate presigned URL for upload with Content-Type
            presigned_url = s3_client.generate_presigned_url(
                'put_object',
                Params={
                    'Bucket': S3_BUCKET,
                    'Key': file_key,
                    'ContentType': request.file_type
                },
                ExpiresIn=300  # 5 minutes
            )
            
            # Create file metadata in database
            file_metadata = FileMetadataInDB(
                filename=request.filename,
                file_key=file_key,
                file_type=request.file_type,
                file_size=request.file_size,
                user_id=user_id,
                chat_id=request.chat_id,
                folder_id=request.folder_id,
                description=request.description,
                tags=request.tags or [],
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            
            collection = self.get_files_collection()
            result = await collection.insert_one(file_metadata.model_dump())
            file_id = str(result.inserted_id)
            
            return FileUploadResponse(
                upload_url=presigned_url,
                file_key=file_key,
                file_id=file_id,
                expires_in=300
            )
            
        except Exception as e:
            logger.error(f"Error creating upload URL: {e}")
            raise e
    
    async def get_file_metadata(self, file_id: str, user_id: str) -> Optional[FileMetadataResponse]:
        """Get file metadata by ID"""
        try:
            collection = self.get_files_collection()
            file_doc = await collection.find_one({
                "_id": ObjectId(file_id),
                "user_id": user_id
            })
            
            if not file_doc:
                return None
            
            # Generate download URL
            download_url = s3_client.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': S3_BUCKET,
                    'Key': file_doc['file_key']
                },
                ExpiresIn=3600  # 1 hour
            )
            
            file_doc['download_url'] = download_url
            # Convert ObjectId to string for Pydantic model
            file_doc['_id'] = str(file_doc['_id'])
            return FileMetadataResponse(**file_doc)
            
        except Exception as e:
            logger.error(f"Error getting file metadata: {e}")
            raise e
    
    async def get_file_metadata_by_id(self, file_id: str) -> Optional[FileMetadataResponse]:
        """Get file metadata by file ID without user filtering (for testing)"""
        try:
            collection = self.get_files_collection()
            file_doc = await collection.find_one({
                "_id": ObjectId(file_id)
            })
            
            if not file_doc:
                return None
            
            # Generate download URL
            download_url = s3_client.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': S3_BUCKET,
                    'Key': file_doc['file_key']
                },
                ExpiresIn=3600  # 1 hour
            )
            
            file_doc['download_url'] = download_url
            # Convert ObjectId to string for Pydantic model
            file_doc['_id'] = str(file_doc['_id'])
            return FileMetadataResponse(**file_doc)
            
        except Exception as e:
            logger.error(f"Error getting file metadata by ID: {e}")
            raise e
    
    async def list_user_files(self, user_id: str, chat_id: Optional[str] = None, 
                             page: int = 1, page_size: int = 20) -> dict:
        """List files for a user with pagination"""
        try:
            collection = self.get_files_collection()
            
            # Build query
            query = {"user_id": user_id}
            if chat_id:
                query["chat_id"] = chat_id
            
            # Calculate skip value
            skip = (page - 1) * page_size
            
            # Get total count
            total_count = await collection.count_documents(query)
            
            # Get files with pagination
            cursor = collection.find(query).sort("created_at", -1).skip(skip).limit(page_size)
            files = await cursor.to_list(length=page_size)
            
            # Generate download URLs for each file
            file_responses = []
            for file_doc in files:
                download_url = s3_client.generate_presigned_url(
                    'get_object',
                    Params={
                        'Bucket': S3_BUCKET,
                        'Key': file_doc['file_key']
                    },
                    ExpiresIn=3600  # 1 hour
                )
                file_doc['download_url'] = download_url
                # Convert ObjectId to string for Pydantic model
                file_doc['_id'] = str(file_doc['_id'])
                file_responses.append(FileMetadataResponse(**file_doc))
            
            return {
                "files": file_responses,
                "total_count": total_count,
                "page": page,
                "page_size": page_size,
                "has_next": skip + page_size < total_count,
                "has_previous": page > 1
            }
            
        except Exception as e:
            logger.error(f"Error listing user files: {e}")
            raise e
    
    async def update_file_metadata(self, file_id: str, user_id: str, 
                                 update_data: FileMetadataUpdate) -> Optional[FileMetadataResponse]:
        """Update file metadata"""
        try:
            collection = self.get_files_collection()
            
            # Prepare update data
            update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
            update_dict["updated_at"] = datetime.utcnow()
            
            result = await collection.update_one(
                {"_id": ObjectId(file_id), "user_id": user_id},
                {"$set": update_dict}
            )
            
            if result.matched_count == 0:
                return None
            
            return await self.get_file_metadata(file_id, user_id)
            
        except Exception as e:
            logger.error(f"Error updating file metadata: {e}")
            raise e
    
    async def delete_file(self, file_id: str, user_id: str) -> bool:
        """Delete file from S3 and database"""
        try:
            collection = self.get_files_collection()
            
            # Get file metadata first
            file_doc = await collection.find_one({
                "_id": ObjectId(file_id),
                "user_id": user_id
            })
            
            if not file_doc:
                return False
            
            # Delete from S3
            try:
                s3_client.delete_object(
                    Bucket=S3_BUCKET,
                    Key=file_doc['file_key']
                )
            except Exception as s3_error:
                logger.warning(f"Failed to delete file from S3: {s3_error}")
                # Continue with database deletion even if S3 deletion fails
            
            # Delete from database
            result = await collection.delete_one({
                "_id": ObjectId(file_id),
                "user_id": user_id
            })
            
            return result.deleted_count > 0
            
        except Exception as e:
            logger.error(f"Error deleting file: {e}")
            raise e
    
    async def create_indexes(self):
        """Create database indexes for optimal performance"""
        try:
            collection = self.get_files_collection()
            
            # Create indexes
            await collection.create_index("user_id")
            await collection.create_index("chat_id")
            await collection.create_index(["user_id", "created_at"])
            await collection.create_index(["user_id", "chat_id"])
            await collection.create_index("file_key", unique=True)
            
            logger.info("File storage indexes created successfully")
            
        except Exception as e:
            logger.error(f"Error creating file storage indexes: {e}")
            raise e
    
    async def test_list_all_files(self, page: int = 1, page_size: int = 50) -> dict:
        """Test method to list all files without user filtering - FOR TESTING ONLY"""
        try:
            collection = self.get_files_collection()
            
            # Calculate skip value for pagination
            skip = (page - 1) * page_size
            
            # Get total count
            total_count = await collection.count_documents({})
            
            # Get files with pagination
            cursor = collection.find({}).sort("created_at", -1).skip(skip).limit(page_size)
            files = await cursor.to_list(length=page_size)
            
            # Convert to response format
            file_responses = []
            for file_doc in files:
                try:
                    # Generate presigned download URL
                    download_url = s3_client.generate_presigned_url(
                        'get_object',
                        Params={'Bucket': S3_BUCKET, 'Key': file_doc['file_key']},
                        ExpiresIn=3600  # 1 hour
                    )
                    
                    file_response = FileMetadataResponse(
                        _id=str(file_doc['_id']),
                        filename=file_doc['filename'],
                        file_key=file_doc['file_key'],
                        download_url=download_url,
                        user_id=file_doc['user_id'],
                        chat_id=file_doc.get('chat_id'),
                        file_size=file_doc.get('file_size'),
                        content_type=file_doc.get('content_type'),
                        created_at=file_doc['created_at'],
                        updated_at=file_doc['updated_at']
                    )
                    file_responses.append(file_response)
                    
                except Exception as file_error:
                    logger.warning(f"Error processing file {file_doc.get('_id')}: {file_error}")
                    continue
            
            # Calculate pagination info
            has_next = skip + page_size < total_count
            has_previous = page > 1
            
            return {
                "files": file_responses,
                "total_count": total_count,
                "page": page,
                "page_size": page_size,
                "has_next": has_next,
                "has_previous": has_previous
            }
            
        except Exception as e:
            logger.error(f"Error listing all files: {e}")
            raise e
    
    async def test_s3_connection(self) -> dict:
        """Test S3 connection and basic operations"""
        try:
            # Test 1: List buckets (basic connection test)
            try:
                response = s3_client.list_buckets()
                buckets = [bucket['Name'] for bucket in response.get('Buckets', [])]
                bucket_test = f"✓ Connection successful. Found {len(buckets)} buckets"
            except Exception as e:
                bucket_test = f"✗ Connection failed: {str(e)}"
            
            # Test 2: Check if our bucket exists
            try:
                s3_client.head_bucket(Bucket=S3_BUCKET)
                bucket_exists = f"✓ Bucket '{S3_BUCKET}' exists and is accessible"
            except Exception as e:
                bucket_exists = f"✗ Bucket '{S3_BUCKET}' error: {str(e)}"
            
            # Test 3: Try to list objects in bucket
            try:
                response = s3_client.list_objects_v2(Bucket=S3_BUCKET, MaxKeys=5)
                object_count = response.get('KeyCount', 0)
                list_objects = f"✓ Can list objects. Found {object_count} objects (showing max 5)"
            except Exception as e:
                list_objects = f"✗ Cannot list objects: {str(e)}"
            
            # Test 4: Generate presigned URL
            try:
                test_key = "test/connection-test.txt"
                presigned_url = s3_client.generate_presigned_url(
                    'put_object',
                    Params={'Bucket': S3_BUCKET, 'Key': test_key},
                    ExpiresIn=300
                )
                presigned_test = f"✓ Can generate presigned URLs"
            except Exception as e:
                presigned_test = f"✗ Cannot generate presigned URLs: {str(e)}"
            
            return {
                "s3_endpoint": s3_client._endpoint.host,
                "s3_bucket": S3_BUCKET,
                "tests": {
                    "connection": bucket_test,
                    "bucket_access": bucket_exists,
                    "list_objects": list_objects,
                    "presigned_urls": presigned_test
                }
            }
            
        except Exception as e:
            logger.error(f"Error testing S3 connection: {e}")
            raise e
    
    async def list_s3_objects(self, max_keys: int = 100) -> dict:
        """List all objects in S3 bucket for debugging"""
        try:
            response = s3_client.list_objects_v2(Bucket=S3_BUCKET, MaxKeys=max_keys)
            
            objects = []
            if 'Contents' in response:
                for obj in response['Contents']:
                    objects.append({
                        'key': obj['Key'],
                        'size': obj['Size'],
                        'last_modified': obj['LastModified'].isoformat(),
                        'etag': obj['ETag']
                    })
            
            return {
                'bucket': S3_BUCKET,
                'object_count': len(objects),
                'objects': objects,
                'is_truncated': response.get('IsTruncated', False)
            }
            
        except Exception as e:
            logger.error(f"Error listing S3 objects: {e}")
            raise e
    
    async def get_file_content(self, file_key: str) -> str:
        """Get file content from S3 by file key"""
        try:
            import io
            from botocore.exceptions import ClientError
            
            # Download file from S3
            response = s3_client.get_object(Bucket=S3_BUCKET, Key=file_key)
            content_bytes = response['Body'].read()
            
            # Check if it's an Excel file
            if file_key.lower().endswith(('.xlsx', '.xls')):
                return await self._process_excel_file(content_bytes, file_key)
            
            # Try to decode as text
            try:
                # Try UTF-8 first
                content = content_bytes.decode('utf-8')
            except UnicodeDecodeError:
                try:
                    # Try with latin-1 as fallback
                    content = content_bytes.decode('latin-1')
                except UnicodeDecodeError:
                    # If still fails, return as base64 for binary files
                    import base64
                    content = base64.b64encode(content_bytes).decode('utf-8')
                    logger.warning(f"File {file_key} returned as base64 due to encoding issues")
            
            return content
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == 'NoSuchKey':
                logger.warning(f"File not found in S3: {file_key}")
                return "Content not available - file not found in storage"
            else:
                logger.error(f"S3 ClientError getting file content for {file_key}: {e}")
                return "Content not available - storage error"
        except Exception as e:
            logger.error(f"Error getting file content for {file_key}: {e}")
            return "Content not available - unknown error"
    
    async def _process_excel_file(self, content_bytes: bytes, file_key: str) -> str:
        """Process Excel file and extract structured data"""
        try:
            import pandas as pd
            import io
            
            # Create a BytesIO object from the content
            excel_buffer = io.BytesIO(content_bytes)
            
            # Read Excel file
            if file_key.lower().endswith('.xlsx'):
                df = pd.read_excel(excel_buffer, engine='openpyxl')
            else:  # .xls
                df = pd.read_excel(excel_buffer, engine='xlrd')
            
            # Convert to structured text format
            result = f"Excel file content ({len(df)} rows, {len(df.columns)} columns):\n\n"
            
            # Add column headers
            result += "Columns: " + ", ".join(df.columns.astype(str)) + "\n\n"
            
            # Add first few rows as sample data
            sample_rows = min(10, len(df))
            result += f"Sample data (first {sample_rows} rows):\n"
            result += df.head(sample_rows).to_string(index=False, max_cols=10)
            
            # Add summary statistics for numeric columns
            numeric_cols = df.select_dtypes(include=['number']).columns
            if len(numeric_cols) > 0:
                result += "\n\nNumeric columns summary:\n"
                result += df[numeric_cols].describe().to_string()
            
            return result
            
        except ImportError as e:
            logger.warning(f"Missing required library for Excel processing: {e}")
            return f"Excel file: {file_key} (Excel processing libraries not available - install pandas and openpyxl)"
        except Exception as e:
            logger.error(f"Error processing Excel file {file_key}: {e}")
            return f"Excel file: {file_key} (error processing file: {str(e)})"

# Global service instance
file_storage_service = FileStorageService()