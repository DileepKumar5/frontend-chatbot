// import { getAuth } from "@clerk/nextjs/server";
// import { prisma } from "@/lib/prisma";
// import { NextRequest } from "next/server"; // Import NextRequest from next/server

// export async function GET(req: NextRequest) {
//   try {
//     // Use getAuth with the 'req' argument
//     const { userId } = getAuth(req); // Pass the req object to getAuth

//     if (!userId) {
//       return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
//     }

//     // Fetch the conversations for the authenticated user
//     const conversations = await prisma.conversation.findMany({
//       where: { userId },
//       include: {
//         messages: {
//           orderBy: {
//             createdAt: "desc",  // Sort the messages by the latest 'createdAt'
//           },
//         },
//       },
//     });

//     // Return the conversations in the response
//     return new Response(JSON.stringify(conversations), { status: 200 });
//   } catch (error) {
//     console.error("Error fetching conversations:", error);
//     return new Response(JSON.stringify({ message: "Internal Server Error" }), { status: 500 });
//   }
// }
