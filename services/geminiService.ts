
import { GoogleGenAI, Type } from "@google/genai";

// Creating a new instance right before calling is recommended for best results in dynamic environments
export const getSmartReply = async (context: string, lastMessage: string): Promise<string[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
        Context of conversation: ${context}
        Last message: "${lastMessage}"
        Based on the context and the last message, suggest 3 short, friendly, and natural-sounding replies.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING
          }
        }
      }
    });

    // Access the text property directly (not a method) as per SDK specifications
    const text = response.text || "[]";
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini suggestion error:", error);
    return ["Hey there!", "How's it going?", "Good to see you!"];
  }
};

export const summarizeChat = async (messages: string[]): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Summarize the following conversation in one short sentence: \n${messages.join("\n")}`,
    });
    // Access the text property directly (not a method)
    return response.text || "No summary available.";
  } catch (error) {
    return "Could not generate summary.";
  }
};
