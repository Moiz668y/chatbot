
import { DocumentChunk } from '../types';
import { geminiService } from './gemini';

export class VectorStore {
  private chunks: DocumentChunk[] = [];

  /**
   * Adds text chunks to the store and generates their embeddings.
   * Processes chunks in small parallel batches for significantly better performance.
   */
  async addChunks(chunks: Omit<DocumentChunk, 'id'>[], onProgress?: (current: number, total: number) => void): Promise<void> {
    const newChunksWithIds: DocumentChunk[] = [];
    const BATCH_SIZE = 5; // Process 5 chunks at a time in parallel
    const total = chunks.length;

    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);
      
      // Fixed: Added explicit return type Promise<DocumentChunk | null> to ensure compatibility with the filter predicate
      const batchPromises = batch.map(async (chunk): Promise<DocumentChunk | null> => {
        try {
          const embedding = await geminiService.getEmbedding(chunk.text);
          // Fixed: Cast the returned object to DocumentChunk to ensure the id property (string) is compatible with the inferred UUID type from crypto.randomUUID()
          return {
            ...chunk,
            id: crypto.randomUUID(),
            embedding,
          } as DocumentChunk;
        } catch (err) {
          console.error(`Failed to embed chunk of ${chunk.documentName}`, err);
          return null;
        }
      });

      const results = await Promise.all(batchPromises);
      // Fixed: The type predicate now works as DocumentChunk is assignable to the parameter type (DocumentChunk | null)
      const validResults = results.filter((r): r is DocumentChunk => r !== null);
      newChunksWithIds.push(...validResults);
      
      if (onProgress) {
        onProgress(Math.min(i + BATCH_SIZE, total), total);
      }

      // Small jittered pause between batches to be safe with rate limits
      await new Promise(r => setTimeout(r, 150));
    }

    if (newChunksWithIds.length === 0 && chunks.length > 0) {
      throw new Error("Failed to generate embeddings. Please check your network and try again.");
    }

    this.chunks = [...this.chunks, ...newChunksWithIds];
  }

  /**
   * Removes all chunks associated with a specific document ID.
   */
  removeDocument(documentId: string) {
    this.chunks = this.chunks.filter(c => c.documentId !== documentId);
  }

  /**
   * Performs semantic search to find the most relevant chunks.
   */
  async search(query: string, k: number = 3): Promise<DocumentChunk[]> {
    if (this.chunks.length === 0) return [];

    const queryEmbedding = await geminiService.getEmbedding(query);

    const scores = this.chunks.map(chunk => {
      if (!chunk.embedding) return { chunk, score: 0 };
      const score = this.cosineSimilarity(queryEmbedding, chunk.embedding);
      return { chunk, score };
    });

    // Sort by descending score
    return scores
      .sort((a, b) => b.score - a.score)
      .slice(0, k)
      .map(s => s.chunk);
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    return isNaN(similarity) ? 0 : similarity;
  }

  getChunkCount(): number {
    return this.chunks.length;
  }

  clear() {
    this.chunks = [];
  }
}

export const vectorStore = new VectorStore();
