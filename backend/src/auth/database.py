from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConnectionFailure
from ..config import settings
import logging

logger = logging.getLogger(__name__)

class MongoDB:
    client: AsyncIOMotorClient = None
    database = None

mongodb = MongoDB()

async def connect_to_mongo():
    """Create database connection with optimized settings"""
    try:
        mongodb.client = AsyncIOMotorClient(
            settings.MONGODB_URL,
            connectTimeoutMS=60000,  # 60 seconds for initial connection
            serverSelectionTimeoutMS=60000,  # 60 seconds for server selection
            socketTimeoutMS=60000,  # 60 seconds for socket operations
            maxPoolSize=10,  # Reduced pool size for container environments
            minPoolSize=1,   # Minimum connections
            maxIdleTimeMS=90000,  # Keep connections alive longer
            retryWrites=True,  # Enable retryable writes
            retryReads=True,   # Enable retryable reads
            heartbeatFrequencyMS=10000,  # More frequent heartbeats
            directConnection=False,  # Use replica set routing
            readPreference='primaryPreferred'  # Prefer primary but allow secondary reads
        )
        mongodb.database = mongodb.client[settings.DATABASE_NAME]
        
        # Test the connection
        await mongodb.client.admin.command('ping')
        logger.info("Successfully connected to MongoDB with optimized settings")
        
    except ConnectionFailure as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        raise e
    except Exception as e:
        logger.error(f"Unexpected error connecting to MongoDB: {e}")
        raise e

async def close_mongo_connection():
    """Close database connection"""
    if mongodb.client:
        mongodb.client.close()
        logger.info("Disconnected from MongoDB")

def get_database():
    """Get database instance"""
    return mongodb.database

def get_users_collection():
    """Get users collection"""
    return mongodb.database[settings.USERS_COLLECTION]