import { Chat, ChatCreate, ChatUpdate, ChatWithMessages, Message, MessageCreate } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class ChatService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  async createChat(chatData: ChatCreate): Promise<Chat> {
    const response = await fetch(`${API_BASE_URL}/chat/`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(chatData),
    });
    return this.handleResponse<Chat>(response);
  }

  async getUserChats(limit: number = 50, skip: number = 0): Promise<Chat[]> {
    const response = await fetch(
      `${API_BASE_URL}/chat/?limit=${limit}&skip=${skip}`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      }
    );
    return this.handleResponse<Chat[]>(response);
  }

  async getChat(chatId: string): Promise<ChatWithMessages> {
    const response = await fetch(`${API_BASE_URL}/chat/${chatId}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<ChatWithMessages>(response);
  }

  async updateChat(chatId: string, updateData: ChatUpdate): Promise<Chat> {
    const response = await fetch(`${API_BASE_URL}/chat/${chatId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(updateData),
    });
    return this.handleResponse<Chat>(response);
  }

  async deleteChat(chatId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/chat/${chatId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    await this.handleResponse<{ message: string }>(response);
  }

  async addMessage(chatId: string, messageData: MessageCreate): Promise<Message> {
    const response = await fetch(`${API_BASE_URL}/chat/${chatId}/messages`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(messageData),
    });
    return this.handleResponse<Message>(response);
  }

  async getChatMessages(
    chatId: string,
    limit: number = 100,
    skip: number = 0
  ): Promise<Message[]> {
    const response = await fetch(
      `${API_BASE_URL}/chat/${chatId}/messages?limit=${limit}&skip=${skip}`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      }
    );
    return this.handleResponse<Message[]>(response);
  }

  async healthCheck(): Promise<{ status: string; service: string }> {
    const response = await fetch(`${API_BASE_URL}/chat/health`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<{ status: string; service: string }>(response);
  }
}

export const chatService = new ChatService();
export default chatService;