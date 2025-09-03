import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
from bson import ObjectId
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

async def add_test_message():
    # Connect to MongoDB Atlas
    mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    database_name = os.getenv("DATABASE_NAME", "Choco")
    
    print(f"Connecting to: {mongodb_url}")
    client = AsyncIOMotorClient(mongodb_url)
    db = client[database_name]
    chats_collection = db["chats"]
    messages_collection = db["messages"]
    
    # Find an existing chat or create one
    chat = await chats_collection.find_one()
    if not chat:
        print("No chats found, creating a test chat")
        # Create a test chat
        test_chat = {
            "user_id": "test_user_id",
            "title": "Тестовый чат",
            "last_message_preview": None,
            "message_count": 0,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        result = await chats_collection.insert_one(test_chat)
        chat_id = str(result.inserted_id)
        print(f"Created test chat with ID: {chat_id}")
    else:
        chat_id = str(chat["_id"])
    print(f"Found chat: {chat_id}")
    
    # Add a test message
    test_message = {
        "chat_id": chat_id,
        "role": "user",
        "content": "Тестовое сообщение",
        "timestamp": datetime.utcnow(),
        "attachments": []
    }
    
    result = await messages_collection.insert_one(test_message)
    print(f"Added test message with ID: {result.inserted_id}")
    
    # Add AI response
    ai_message = {
        "chat_id": chat_id,
        "role": "assistant",
        "content": "Это тестовый ответ от AI",
        "timestamp": datetime.utcnow(),
        "attachments": []
    }
    
    result = await messages_collection.insert_one(ai_message)
    print(f"Added AI message with ID: {result.inserted_id}")
    
    # Update chat message count
    await chats_collection.update_one(
        {"_id": ObjectId(chat_id)},
        {
            "$set": {
                "last_message_preview": "Это тестовый ответ от AI",
                "updated_at": datetime.utcnow()
            },
            "$inc": {"message_count": 2}
        }
    )
    
    print("Updated chat with message count")
    
    # Check messages count
    count = await messages_collection.count_documents({"chat_id": chat_id})
    print(f"Total messages in chat: {count}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(add_test_message())