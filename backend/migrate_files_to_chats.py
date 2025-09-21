#!/usr/bin/env python3
"""
Миграция для привязки существующих файлов к чатам пользователей

Этот скрипт обновляет существующие файлы в коллекции file_metadata,
устанавливая chat_id для файлов, которые были загружены без привязки к чату.

Для каждого пользователя:
1. Находит все файлы без chat_id
2. Находит первый чат пользователя (или создает новый)
3. Привязывает файлы к этому чату
"""

import asyncio
import os
import sys
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import uuid

# Добавляем путь к src для импорта конфигурации
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from config import settings

class FileChatMigration:
    def __init__(self):
        self.client = None
        self.database = None
        
    async def connect(self):
        """Подключение к MongoDB"""
        try:
            self.client = AsyncIOMotorClient(settings.MONGODB_URL)
            self.database = self.client[settings.DATABASE_NAME]
            
            # Тестируем подключение
            await self.client.admin.command('ping')
            print("✅ Успешно подключились к MongoDB")
            
        except Exception as e:
            print(f"❌ Ошибка подключения к MongoDB: {e}")
            raise e
    
    async def disconnect(self):
        """Отключение от MongoDB"""
        if self.client:
            self.client.close()
            print("✅ Отключились от MongoDB")
    
    async def get_or_create_user_chat(self, user_id: str) -> str:
        """Получить первый чат пользователя или создать новый"""
        chats_collection = self.database["chats"]
        
        # Ищем существующий чат пользователя
        existing_chat = await chats_collection.find_one({"user_id": user_id})
        
        if existing_chat:
            chat_id = str(existing_chat["_id"])
            print(f"  📁 Найден существующий чат: {chat_id}")
            return chat_id
        
        # Создаем новый чат для пользователя
        now = datetime.utcnow()
        session_id = str(uuid.uuid4())
        
        new_chat = {
            "user_id": user_id,
            "title": "Файлы пользователя",
            "session_id": session_id,
            "last_message_preview": None,
            "message_count": 0,
            "created_at": now,
            "updated_at": now
        }
        
        result = await chats_collection.insert_one(new_chat)
        chat_id = str(result.inserted_id)
        print(f"  ➕ Создан новый чат: {chat_id}")
        return chat_id
    
    async def migrate_user_files(self, user_id: str) -> int:
        """Мигрировать файлы конкретного пользователя"""
        files_collection = self.database["file_metadata"]
        
        # Находим файлы без chat_id для данного пользователя
        files_without_chat = await files_collection.find({
            "user_id": user_id,
            "$or": [
                {"chat_id": None},
                {"chat_id": {"$exists": False}}
            ]
        }).to_list(None)
        
        if not files_without_chat:
            return 0
        
        print(f"  📄 Найдено {len(files_without_chat)} файлов без chat_id")
        
        # Получаем или создаем чат для пользователя
        chat_id = await self.get_or_create_user_chat(user_id)
        
        # Обновляем все файлы пользователя
        updated_count = 0
        for file_doc in files_without_chat:
            file_id = file_doc["_id"]
            filename = file_doc.get("filename", "unknown")
            
            result = await files_collection.update_one(
                {"_id": file_id},
                {
                    "$set": {
                        "chat_id": chat_id,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            if result.modified_count > 0:
                updated_count += 1
                print(f"    ✅ Обновлен файл: {filename} -> chat_id: {chat_id}")
            else:
                print(f"    ❌ Не удалось обновить файл: {filename}")
        
        return updated_count
    
    async def run_migration(self):
        """Запуск миграции для всех пользователей"""
        try:
            await self.connect()
            
            files_collection = self.database["file_metadata"]
            
            # Получаем всех уникальных пользователей с файлами без chat_id
            pipeline = [
                {
                    "$match": {
                        "$or": [
                            {"chat_id": None},
                            {"chat_id": {"$exists": False}}
                        ]
                    }
                },
                {
                    "$group": {
                        "_id": "$user_id",
                        "file_count": {"$sum": 1}
                    }
                }
            ]
            
            users_with_files = await files_collection.aggregate(pipeline).to_list(None)
            
            if not users_with_files:
                print("✅ Все файлы уже привязаны к чатам. Миграция не требуется.")
                return
            
            print(f"🔄 Начинаем миграцию для {len(users_with_files)} пользователей...")
            print()
            
            total_updated = 0
            
            for user_data in users_with_files:
                user_id = user_data["_id"]
                file_count = user_data["file_count"]
                
                print(f"👤 Обрабатываем пользователя: {user_id} ({file_count} файлов)")
                
                updated_count = await self.migrate_user_files(user_id)
                total_updated += updated_count
                
                print(f"  ✅ Обновлено файлов: {updated_count}/{file_count}")
                print()
            
            print(f"🎉 Миграция завершена!")
            print(f"📊 Всего обновлено файлов: {total_updated}")
            
        except Exception as e:
            print(f"❌ Ошибка во время миграции: {e}")
            raise e
        finally:
            await self.disconnect()

async def main():
    """Главная функция"""
    print("🚀 Запуск миграции файлов к чатам...")
    print("=" * 50)
    
    migration = FileChatMigration()
    await migration.run_migration()
    
    print("=" * 50)
    print("✅ Миграция завершена успешно!")

if __name__ == "__main__":
    asyncio.run(main())