import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

# MongoDB connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "choco_data")

async def check_files():
    """Check files in MongoDB"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DATABASE_NAME]
    files_collection = db["files"]
    
    try:
        # Count total files
        total_count = await files_collection.count_documents({})
        print(f"📊 Total files in database: {total_count}")
        
        if total_count > 0:
            # Get all files
            cursor = files_collection.find({}).limit(10)
            files = await cursor.to_list(length=10)
            
            print("\n📁 Files in database:")
            for i, file_doc in enumerate(files, 1):
                print(f"\n{i}. File: {file_doc.get('filename', 'Unknown')}")
                print(f"   ID: {file_doc.get('_id')}")
                print(f"   User ID: {file_doc.get('user_id', 'Unknown')}")
                print(f"   Tags: {file_doc.get('tags', [])}")
                print(f"   File Type: {file_doc.get('file_type', 'Unknown')}")
                print(f"   Size: {file_doc.get('file_size', 0)} bytes")
                print(f"   Created: {file_doc.get('created_at', 'Unknown')}")
                
            # Check for knowledge-base tagged files
            kb_count = await files_collection.count_documents({"tags": "knowledge-base"})
            print(f"\n🏷️ Files with 'knowledge-base' tag: {kb_count}")
            
            if kb_count > 0:
                kb_cursor = files_collection.find({"tags": "knowledge-base"})
                kb_files = await kb_cursor.to_list(length=5)
                print("\n📚 Knowledge base files:")
                for kb_file in kb_files:
                    print(f"   - {kb_file.get('filename')} (tags: {kb_file.get('tags')})")
        else:
            print("\n❌ No files found in database")
            
    except Exception as e:
        print(f"❌ Error checking files: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(check_files())