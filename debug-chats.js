// Debug script to test chat API
const API_BASE_URL = 'http://localhost:8000';

async function testChatAPI() {
  try {
    // Get token from localStorage (simulate browser environment)
    const token = 'your_token_here'; // Replace with actual token
    
    console.log('Testing chat API...');
    
    // Test get user chats
    const response = await fetch(`${API_BASE_URL}/chat/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const chats = await response.json();
      console.log('Chats received:', chats);
      console.log('Number of chats:', chats.length);
    } else {
      const error = await response.text();
      console.error('Error response:', error);
    }
    
  } catch (error) {
    console.error('Network error:', error);
  }
}

// For Node.js environment
if (typeof window === 'undefined') {
  const fetch = require('node-fetch');
  testChatAPI();
}

// For browser environment
if (typeof window !== 'undefined') {
  window.testChatAPI = testChatAPI;
  console.log('Run testChatAPI() in browser console');
}