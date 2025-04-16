import { Pinecone } from '@pinecone-database/pinecone';

// Initialize the Pinecone client
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!, // Ensure that your API key is set correctly
});

export const getPineconeClient = () => {
  return pinecone;
};

export const getPineconeIndex = async () => {
  const index = pinecone.Index(process.env.PINECONE_INDEX_NAME!);
  return index;
};
