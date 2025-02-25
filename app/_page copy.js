import Head from "next/head";
import ChatBox from "../components/ChatBox";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Head>
        <title>RAG Chatbot</title>
      </Head>
      <h1 className="text-3xl font-bold mb-6">RAG Chatbot</h1>
      <ChatBox />
    </div>
  );
}
