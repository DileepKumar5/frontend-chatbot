import { NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { OpenAI } from 'openai';  // Import OpenAI

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export const POST = async (req: NextRequest) => {
  try {
    console.log('API /api/message called');

    // Extract user authentication info
    const { userId } = getAuth(req);
    if (!userId) {
      console.error('Unauthorized request: No userId');
      return new Response('Unauthorized', { status: 401 });
    }

    const { content, conversationId } = await req.json();
    console.log('Request Body:', { content, conversationId });

    if (!content) {
      console.error('Missing message content');
      return new Response('Missing content', { status: 400 });
    }

    // Ensure the user exists or create a new user
    let user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      console.log('User not found, creating a new user...');
      user = await prisma.user.create({
        data: {
          id: userId,
          email: null,
          history: [],
        },
      });
    }

    // Create new conversation if not provided, or find existing one
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

    // Get bot's response from OpenAI
    const botResponse = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // Or the model you prefer
      messages: [{ role: 'user', content }],
    });

    // Check if the response has choices
    if (!botResponse.choices || botResponse.choices.length === 0) {
      console.error('No choices in response');
      return new Response('Bot response not available', { status: 500 });
    }

    // Create the user's message in the conversation
    const message = await prisma.message.create({
      data: {
        content,
        conversationId: convoId,
      },
    });

    // Save bot response as a message
    await prisma.message.create({
      data: {
        content: botResponse.choices[0]?.message?.content || "Bot response not available",
        conversationId: convoId,
      },
    });

    // Update user's history
    const updatedHistory = Array.isArray(user.history) ? [...user.history] : [];

    updatedHistory.push({
      content,
      conversationId: convoId,
      timestamp: new Date().toISOString(),
    });

    // Wrap the user update and message creation in a transaction for consistency
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { history: updatedHistory },
      }),
      prisma.message.create({
        data: {
          content: botResponse.choices[0]?.message?.content || "Bot response not available",
          conversationId: convoId,
        },
      }),
    ]);

    console.log('Message and history saved successfully');
    return new Response(
      JSON.stringify({
        messageId: message.id,
        conversationId: convoId,
        response: botResponse.choices[0]?.message?.content || "Bot response not available",
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in /api/message:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
};
