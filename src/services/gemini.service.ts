import { Injectable } from '@angular/core';
import { GoogleGenAI, Chat, GenerateContentResponse } from '@google/genai';

export interface Message {
  role: 'user' | 'model';
  content: string;
}

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    if (!process.env.API_KEY) {
      throw new Error("API_KEY environment variable not set.");
    }
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  createChat(): Chat {
    return this.ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: 'You are a helpful and friendly AI assistant named Akin AI. Provide clear, concise, and informative answers.',
      },
    });
  }

  async sendMessageStream(
    chat: Chat,
    message: string
  ): Promise<AsyncGenerator<GenerateContentResponse>> {
    try {
      return await chat.sendMessageStream({ message });
    } catch (error) {
      console.error('Error sending message to Gemini API:', error);
      throw new Error('Failed to get response from AI. Please check your connection or API key.');
    }
  }
}
