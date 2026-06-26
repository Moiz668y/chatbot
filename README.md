# RAG Chatbot

A React-based Retrieval-Augmented Generation chatbot that lets users upload documents, index them into a temporary browser-side knowledge base, and ask grounded questions against their own content using Google's Gemini models.

## Overview

This project turns uploaded files and fetched text content into searchable knowledge chunks. Each chunk is embedded with Gemini's `text-embedding-004` model, stored in an in-memory vector store, and retrieved with cosine similarity when the user asks a question. The most relevant context is then passed to Gemini to generate a concise, source-aware response.

The app is designed as an AI research assistant for summarizing documents, extracting key details, and answering questions from user-provided material instead of relying only on the model's general knowledge.

## Features

- Document upload for PDF, TXT, Markdown, CSV, and JSON-style text files
- PDF text extraction in the browser with PDF.js
- URL text ingestion for pages that allow browser access
- Text chunking with overlap for better retrieval coverage
- Gemini embeddings through `text-embedding-004`
- In-memory vector search using cosine similarity
- Streaming Gemini responses for a faster chat experience
- Source labels showing which documents informed an answer
- Knowledge base view for uploaded documents, previews, and deletion
- Background indexing status with progress feedback
- Responsive React UI built with Vite and Lucide icons

## How It Works

1. Upload a file or provide a supported URL from the Knowledge Base view.
2. The app extracts readable text from the source.
3. Text is split into overlapping chunks.
4. Each chunk is converted into an embedding with Gemini.
5. When a user asks a question, the query is embedded and compared against stored chunks.
6. The most relevant chunks are sent to Gemini as context.
7. Gemini streams a grounded answer back to the chat UI with source references.

## Tech Stack

- React 19
- TypeScript
- Vite
- Google GenAI SDK
- Gemini generation model
- `text-embedding-004` embeddings
- PDF.js
- Lucide React icons
- Tailwind-style utility classes

## Project Structure

```text
.
├── App.tsx
├── components/
│   ├── ChatInterface.tsx
│   ├── DocumentManager.tsx
│   └── Sidebar.tsx
├── services/
│   ├── documentProcessor.ts
│   ├── gemini.ts
│   └── vectorStore.ts
├── types.ts
├── vite.config.ts
└── package.json
```

## Getting Started

### Prerequisites

- Node.js
- A Gemini API key from Google AI Studio

### Installation

```bash
npm install
```

Create a `.env.local` file in the project root:

```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

Start the development server:

```bash
npm run dev
```

The app runs on:

```text
http://localhost:3000
```

## Build

```bash
npm run build
```

## Notes

- The vector store is kept in browser memory, so uploaded content and embeddings reset when the page is refreshed.
- URL ingestion can fail when a website blocks browser requests through CORS.
- Gemini API usage requires a valid API key and may be subject to rate limits.

## Future Improvements

- Persist document indexes in local storage or a database
- Add authentication and per-user knowledge bases
- Improve file parsing for richer formats
- Add citation-level chunk previews
- Add support for deleting document vectors from the store when documents are removed
- Deploy the app with a secure server-side API route for Gemini calls
