// MongoDB initialization script
// This script runs when the MongoDB container starts for the first time

// Switch to the Choco database
db = db.getSiblingDB('Choco');

// Create collections if they don't exist
db.createCollection('Choco_users');
db.createCollection('chat_sessions');
db.createCollection('chat_messages');

// Create indexes for better performance
db.Choco_users.createIndex({ "email": 1 }, { unique: true });
db.Choco_users.createIndex({ "username": 1 }, { unique: true });

db.chat_sessions.createIndex({ "user_id": 1 });
db.chat_sessions.createIndex({ "created_at": 1 });

db.chat_messages.createIndex({ "session_id": 1 });
db.chat_messages.createIndex({ "created_at": 1 });

print('MongoDB initialization completed successfully!');
print('Collections created: Choco_users, chat_sessions, chat_messages');
print('Indexes created for optimal performance');