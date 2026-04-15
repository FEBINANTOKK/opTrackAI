import axios from "axios";

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "phi3";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export const generateChatResponse = async (
  messages: ChatMessage[],
  context: { profile: any; opportunities: any[] }
): Promise<string> => {
  // Construct the system prompt using the user's profile and top opportunities
  const systemPrompt: ChatMessage = {
    role: "system",
    content: `You are an expert career advisor and AI recommendation assistant for 'OpTrack AI'. 
Your primary goal is to help the user understand why certain opportunities are a good fit for them and guide them on their career journey.

USER PROFILE:
- Skills: ${(context.profile?.skills || []).join(", ") || "Not specified"}
- Target Roles: ${(context.profile?.targetAudience || []).join(", ") || "Any"}
- Location Preference: ${context.profile?.location || "Any"}

CURRENT TOP RECOMMENDED OPPORTUNITIES ON THEIR SCREEN:
${context.opportunities
  .slice(0, 8)
  .map(
    (c, i) =>
      `[Rank ${i + 1}] Title: ${c.title}, Company: ${c.company}, Skills Required: ${(c.skills || []).join(
        ", "
      )}, Location: ${c.location}, Type: ${c.type}\nMatch %: ${c.match}, AI Precision: ${
        c.matchPercentage
      }%, AI Reason: ${c.matchReason}`
  )
  .join("\n\n")}

RULES:
1. Provide concise, helpful, and encouraging answers. Keep paragraphs short.
2. Directly reference the opportunities listed above if the user asks about them (e.g. "The top role at [Company] is a great fit because...").
3. DO NOT use markdown format like JSON blocks. You can use standard markdown bold/italics for formatting text.
4. If they ask a general question, use your career expertise.
`,
  };

  // Combine system prompt with conversation history and the latest user message
  const fullConversation = [systemPrompt, ...messages];

  try {
    const response = await axios.post(
      `${OLLAMA_URL}/api/chat`,
      {
        model: OLLAMA_MODEL,
        messages: fullConversation,
        stream: false,
      },
      {
        timeout: 120000,
      }
    );

    return response.data.message?.content || "I'm sorry, I couldn't process that request.";
  } catch (error: any) {
    console.error("[ChatBot] Ollama API Error:", error.message);
    throw new Error("Failed to communicate with AI Engine");
  }
};
