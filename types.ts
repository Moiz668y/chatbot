
export interface DocumentSource {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadDate: Date;
  content: string;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  documentName: string;
  text: string;
  embedding?: number[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: string[];
}

export enum AppView {
  CHAT = 'CHAT',
  DOCUMENTS = 'DOCUMENTS',
  SETTINGS = 'SETTINGS'
}
