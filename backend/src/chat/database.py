from motor.motor_asyncio import AsyncIOMotorCollection
from auth.database import get_database
from config import settings

def get_chats_collection() -> AsyncIOMotorCollection:
    """Get chats collection"""
    database = get_database()
    return database["chats"]

def get_messages_collection() -> AsyncIOMotorCollection:
    """Get messages collection"""
    database = get_database()
    return database["messages"]

async def create_indexes():
    """Create database indexes for optimal performance"""
    chats_collection = get_chats_collection()
    messages_collection = get_messages_collection()
    
    # Create indexes for chats collection
    await chats_collection.create_index("user_id")
    await chats_collection.create_index([("user_id", 1), ("updated_at", -1)])
    
    # Create indexes for messages collection
    await messages_collection.create_index("chat_id")
    await messages_collection.create_index([("chat_id", 1), ("timestamp", 1)])
    await messages_collection.create_index("timestamp")