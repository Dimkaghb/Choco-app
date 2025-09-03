import os
import asyncio
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# MongoDB configuration
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "Choco")

async def add_chart_message():
    # Connect to MongoDB
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    # Get collections
    chats_collection = db["chats"]
    messages_collection = db["messages"]
    
    try:
        # Find the first chat
        chat = await chats_collection.find_one()
        if not chat:
            print("No chats found in database")
            return
            
        chat_id = str(chat["_id"])
        print(f"Adding chart message to chat: {chat_id}")
        
        # Create a message with Plotly chart data
        chart_message = {
            "chat_id": chat_id,
            "role": "assistant",
            "content": "График отражает детальное распределение клиентов по категориям. Самые крупные группы — inactive и old members.",
            "plotly_chart": {
                "data": [
                    {"label": "Inactive", "value": 12},
                    {"label": "Old members", "value": 7},
                    {"label": "Social buyers", "value": 4},
                    {"label": "Deep buyers", "value": 3.5},
                    {"label": "Very good buyers", "value": 1},
                    {"label": "VIP", "value": 0.8},
                    {"label": "Good buyers", "value": 0.5},
                    {"label": "New members", "value": 0.3},
                    {"label": "VIP buyers", "value": 0.2}
                ],
                "type": "bar",
                "title": "Распределение клиентов по категориям"
            },
            "timestamp": datetime.utcnow(),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        # Insert the message
        result = await messages_collection.insert_one(chart_message)
        print(f"Chart message added with ID: {result.inserted_id}")
        
        # Update chat message count
        message_count = await messages_collection.count_documents({"chat_id": chat_id})
        await chats_collection.update_one(
            {"_id": ObjectId(chat_id)},
            {
                "$set": {
                    "message_count": message_count,
                    "last_message_preview": "График отражает детальное распределение клиентов...",
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        print(f"Chat updated with message count: {message_count}")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(add_chart_message())