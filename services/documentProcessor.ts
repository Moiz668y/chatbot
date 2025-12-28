
import { vectorStore } from './vectorStore';
import { DocumentSource } from '../types';

declare const pdfjsLib: any;

export const readFileContent = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
};

export const readPdfContent = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    fullText += pageText + '\n';
  }
  return fullText;
};

export const chunkText = (text: string, chunkSize: number, overlap: number): string[] => {
  const chunks: string[] = [];
  if (!text) return chunks;
  
  // Improvement: Instead of strict character slicing, we try to split near sentences
  // though for simplicity in this implementation, we use character slicing with overlap.
  for (let i = 0; i < text.length; i += (chunkSize - overlap)) {
    chunks.push(text.slice(i, i + chunkSize));
    if (i + chunkSize >= text.length) break;
  }
  return chunks;
};

export const processFile = async (
  file: File, 
  onProgress?: (current: number, total: number) => void
): Promise<DocumentSource> => {
  let content = '';
  if (file.type === 'application/pdf') {
    content = await readPdfContent(file);
  } else {
    content = await readFileContent(file);
  }

  const docId = crypto.randomUUID();
  const doc: DocumentSource = {
    id: docId,
    name: file.name,
    type: file.type || 'text/plain',
    size: file.size,
    uploadDate: new Date(),
    content: content
  };

  const chunks = chunkText(content, 1000, 100).map(text => ({
    documentId: docId,
    documentName: file.name,
    text: text
  }));

  // Passing the progress handler down to the vector store
  await vectorStore.addChunks(chunks, onProgress);
  return doc;
};
