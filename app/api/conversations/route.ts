import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server"; // Import NextRequest from next/server

export async function GET(req: NextRequest) {
  // Use getAuth with the 'req' argument
  const { userId } = getAuth(req); // Pass the req object to getAuth

  if (!userId) return new Response("Unauthorized", { status: 401 });

  const conversations = await prisma.conversation.findMany({
    where: { userId },
    include: { messages: true },
    orderBy: { createdAt: "desc" },
  });

  return new Response(JSON.stringify(conversations), { status: 200 });
}
