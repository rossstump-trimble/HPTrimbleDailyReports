import OpenAI from "openai";
import { NextResponse } from "next/server";
import {
  ChatCompletionMessageParam,
  ChatCompletionUserMessageParam,
  ChatCompletionSystemMessageParam,
  ChatCompletionAssistantMessageParam,
} from "openai/resources/chat/completions";

// Specify the Node.js runtime
export const runtime = "nodejs";

// Initialize OpenAI client with Gemini's base URL
const openai = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

// Using OpenAI's types for better compatibility with the API
type ContentItem =
  | { type: "text"; text: string }
  | {
      type: "image_url";
      image_url: { url: string; detail?: "low" | "high" | "auto" };
    };

// Our application message type
type AppMessage = {
  role: "user" | "assistant" | "system";
  content: string;
  id?: string;
  timestamp?: string;
};

export async function POST(req: Request) {
  console.log("API route called");

  if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is missing in environment");
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured" },
      { status: 500 }
    );
  }

  try {
    console.log("Processing chat request");
    const { messages, imageData } = (await req.json()) as {
      messages: AppMessage[];
      imageData?: string;
    };

    // Validate messages
    if (!messages || !Array.isArray(messages)) {
      console.error("Invalid messages format:", messages);
      return NextResponse.json(
        { error: "Invalid messages format" },
        { status: 400 }
      );
    }

    // Convert our app messages to Gemini format
    let apiMessages: ChatCompletionMessageParam[] = [];

    if (imageData) {
      console.log("Processing request with image data");
      // Get the last user message
      const lastUserMessage = messages[messages.length - 1];

      apiMessages = [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: lastUserMessage.content,
            },
            {
              type: "image_url",
              image_url: {
                url: imageData.startsWith("data:")
                  ? imageData
                  : `data:image/jpeg;base64,${imageData}`,
              },
            },
          ],
        },
      ];
    } else {
      // For text-only messages, keep the conversation history
      apiMessages = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));
    }

    console.log("Sending request to Gemini model");

    try {
      const stream = await openai.chat.completions.create({
        messages: apiMessages,
        model: "gemini-2.0-flash",
        temperature: 0.7,
        max_tokens: 4096,
        stream: true,
      });

      console.log("Stream created successfully");

      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of stream) {
              if (chunk.choices[0]?.delta?.content) {
                controller.enqueue(chunk.choices[0].delta.content);
              }
            }
            controller.close();
            console.log("Stream completed successfully");
          } catch (error) {
            console.error("Stream processing error:", error);
            controller.error(error);
          }
        },
      });

      return new Response(readableStream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    } catch (modelError) {
      console.error("Model execution error:", modelError);
      console.error("Error details:", {
        message:
          modelError instanceof Error ? modelError.message : "Unknown error",
        name: modelError instanceof Error ? modelError.name : "Unknown",
        stack: modelError instanceof Error ? modelError.stack : undefined,
      });

      return NextResponse.json(
        {
          error: "Failed to process with Gemini model",
          details:
            modelError instanceof Error
              ? modelError.message
              : "Unknown model error",
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Gemini API error:", error);
    return NextResponse.json(
      {
        error: "Failed to process request with Gemini",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
