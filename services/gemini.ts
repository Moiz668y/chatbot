
// @google/genai SDK implementation for Gemini services
import { GoogleGenAI } from "@google/genai";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    // Initialize Gemini API client directly with the environment variable
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
  }

  /**
   * Generates embeddings for a given piece of text.
   */
  async getEmbedding(text: string, retries = 2): Promise<number[]> {
    try {
      // // Fixed: use 'contents' instead of 'content' and pass an array as per SDK requirements
      const response = await this.ai.models.embedContent({
        model: "text-embedding-004",
        contents: [{
          parts: [{ text }]
        }]
      });
      
      // // Fixed: check 'embeddings' array instead of 'embedding' property
      if (!response.embeddings || response.embeddings.length === 0) {
        throw new Error("No embedding values returned from API");
      }
      
      // // Fixed: access values from the first element of the 'embeddings' array
      return response.embeddings[0].values;
    } catch (error: any) {
      if (retries > 0 && (error.message?.includes('429') || error.message?.includes('rate limit'))) {
        // Wait 1 second and retry if rate limited
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.getEmbedding(text, retries - 1);
      }
      console.error("Error generating embedding:", error);
      throw error;
    }
  }

  /**
   * Generates a RAG-augmented response using Gemini.
   */
  async *generateRagResponse(query: string, context: string) {
    const systemInstruction = `
      You are an expert Research Assistant. Your task is to provide high-quality, concise, and grounded answers based strictly on the provided context.
      
      Guidelines:
      1. Use the provided context to answer the user's question accurately.
      2. If the context doesn't contain the answer, say "I'm sorry, I don't have enough information in my current knowledge base to answer that."
      3. For summarization requests: Provide a cohesive narrative summary that connects key ideas. Avoid just listing facts in a dry table-like format unless explicitly asked for a list.
      4. Tone: Professional, academic, and objective.
      5. Conciseness: Be direct. Do not use filler phrases like "Based on the document provided" or "The context states".
      6. Formatting: Use Markdown (bolding, lists) to improve readability of complex information.
    `;

    const fullPrompt = `
      Context Information:
      ${context}

      User Question: 
      ${query}

      Instructions: Answer the question using ONLY the context provided above.
    `;

    try {
      const responseStream = await this.ai.models.generateContentStream({
        model: 'gemini-3-flash-preview',
        contents: [{ parts: [{ text: fullPrompt }] }],
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.3,
          topP: 0.8,
          topK: 40,
        }
      });

      for await (const chunk of responseStream) {
        // // Use the .text property to extract content from the stream chunk
        if (chunk.text) {
          yield chunk.text;
        }
      }
    } catch (error) {
      console.error("Error generating text:", error);
      throw error;
    }
  }
}

export const geminiService = new GeminiService();
