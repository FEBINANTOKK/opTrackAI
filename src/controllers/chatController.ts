import { Request, Response } from "express";
import { generateChatResponse, ChatMessage } from "../services/chatService.js";

export const handleChat = async (req: Request, res: Response): Promise<void> => {
  try {
    const { messages, context } = req.body;

    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: "Missing or invalid 'messages' array" });
      return;
    }

    if (!context || !context.profile || !context.opportunities) {
      res.status(400).json({ error: "Missing or invalid 'context' object" });
      return;
    }

    const aiResponse = await generateChatResponse(messages, context);

    res.status(200).json({
      success: true,
      message: aiResponse,
    });
  } catch (error: any) {
    console.error("[ChatController] Error:", error.message);
    res.status(500).json({
      success: false,
      error: "Internal server error while processing chat.",
    });
  }
};
