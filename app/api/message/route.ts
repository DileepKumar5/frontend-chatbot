import { NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export const POST = async (req: NextRequest) => {
  try {
    console.log('API /api/message called');

    // Extract user authentication info
    const { userId } = getAuth(req);
    if (!userId) {
      console.error('Unauthorized request: No userId');
      return new Response('Unauthorized', { status: 401 });
    }

    // Get content and conversationId from the request body
    const { content, conversationId } = await req.json();
    console.log('Request Body:', { content, conversationId });

    // Ensure the content is provided in the request
    if (!content) {
      console.error('Missing message content');
      return new Response('Missing content', { status: 400 });
    }

    // Ensure the user exists or create a new user if not found
    let user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      console.log('User not found, creating a new user...');
      user = await prisma.user.create({
        data: {
          id: userId,
          email: null, // Adjust this to save the email if necessary
          history: [],
        },
      });
    }

    // Handle conversation creation or selection
    let convoId = conversationId;
    let conversation;
    if (!convoId) {
      console.log('No conversationId provided, creating new conversation...');
      conversation = await prisma.conversation.create({
        data: {
          title: 'New Conversation',
          userId: userId,
        },
      });
      convoId = conversation.id;
    } else {
      conversation = await prisma.conversation.findUnique({
        where: { id: convoId },
      });
      if (!conversation) {
        console.log('Provided conversationId does not exist, creating a new conversation...');
        conversation = await prisma.conversation.create({
          data: {
            title: 'New Conversation',
            userId: userId,
          },
        });
        convoId = conversation.id;
      }
    }

    // Send the message content to your custom API (replace with the correct endpoint)
    const apiResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/query/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json(); // Capture the response for debugging
      console.error('Failed API response:', errorData);
      return new Response('Failed to get response from custom API', { status: 500 });
    }

    const apiData = await apiResponse.json();
    const botResponse = apiData.response || "Bot response not available"; // Handle missing response gracefully

    // Update user history and create messages in a transaction
    const updatedHistory = [...(Array.isArray(user.history) ? user.history : [])];
    updatedHistory.push({
      content,
      conversationId: convoId,
      timestamp: new Date().toISOString(),
    });

    // Using a transaction to ensure atomicity of operations (create user message, bot response, and update history)
    const [userMessage, botMessage] = await prisma.$transaction([
      prisma.message.create({
        data: {
          content,
          conversationId: convoId,
          sender: 'user', // Make sure 'sender' exists in the Prisma schema
        },
      }),
      prisma.message.create({
        data: {
          content: botResponse,
          conversationId: convoId,
          sender: 'bot',
        },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { history: updatedHistory },
      }),
    ]);

    console.log('Message and history saved successfully');

    // Fetch the full conversation messages, ordered by creation time
    const conversationMessages = await prisma.message.findMany({
      where: { conversationId: convoId },
      orderBy: { createdAt: 'asc' },
    });

    // Return the updated conversation with both user and bot messages
    return new Response(
      JSON.stringify({
        conversationId: convoId,
        messages: conversationMessages,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in /query API:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
};
