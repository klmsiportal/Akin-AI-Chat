import { ChangeDetectionStrategy, Component, inject, signal, OnInit, ElementRef, viewChild, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { GeminiService, Message } from './services/gemini.service';
import { Chat } from '@google/genai';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class AppComponent implements OnInit {
  private readonly geminiService = inject(GeminiService);
  private readonly chatContainer = viewChild<ElementRef<HTMLDivElement>>('chatContainer');

  messages = signal<Message[]>([]);
  chat = signal<Chat | null>(null);
  userInput = signal('');
  isLoading = signal(false);
  error = signal<string | null>(null);

  constructor() {
    effect(() => {
      if (this.messages() && this.chatContainer()) {
        setTimeout(() => this.scrollToBottom(), 0);
      }
    });
  }

  ngOnInit(): void {
    this.startChat();
  }
  
  startChat(): void {
    const newChat = this.geminiService.createChat();
    this.chat.set(newChat);
    this.messages.set([
      { role: 'model', content: 'Hello! I am Akin AI. How can I assist you today?' }
    ]);
  }

  async sendMessage(): Promise<void> {
    const userMessage = this.userInput().trim();
    if (!userMessage || this.isLoading()) {
      return;
    }

    const currentChat = this.chat();
    if (!currentChat) {
      this.error.set('Chat session not initialized.');
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);
    this.messages.update(msgs => [...msgs, { role: 'user', content: userMessage }]);
    this.userInput.set('');

    // Add a placeholder for the model's response
    this.messages.update(msgs => [...msgs, { role: 'model', content: '' }]);

    try {
      const stream = await this.geminiService.sendMessageStream(currentChat, userMessage);

      for await (const chunk of stream) {
        this.messages.update(msgs => {
          const lastMessage = msgs[msgs.length - 1];
          lastMessage.content += chunk.text;
          return [...msgs];
        });
      }

    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      this.error.set(`Error: ${errorMessage}`);
      // Remove the empty model message on error
      this.messages.update(msgs => msgs.slice(0, -1));
    } finally {
      this.isLoading.set(false);
      this.scrollToBottom();
    }
  }

  handleEnter(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  private scrollToBottom(): void {
    const container = this.chatContainer()?.nativeElement;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }
}
