import { GoogleGenAI, Type } from "@google/genai";
import { Video } from "../types";

// Helper to get the API client
const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }
  return new GoogleGenAI({ apiKey });
};

export const searchEducationalVideos = async (query: string): Promise<Video[]> => {
  try {
    const ai = getAiClient();
    
    // Schema definition for the response
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        isEducationalContext: {
          type: Type.BOOLEAN,
          description: "True if the user's search query implies an intent to learn or study. False if it is purely entertainment, celebrity gossip, gaming (unless gamedev), or movies."
        },
        videos: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              channel: { type: Type.STRING },
              description: { type: Type.STRING },
              // We will ask Gemini to hallucinate a plausible YouTube ID structure or use a placeholder if it can't find real ones safely
              id: { type: Type.STRING, description: "A realistic 11-character string for a YouTube video ID" } 
            }
          }
        },
        refusalMessage: {
          type: Type.STRING,
          description: "A polite message if the content is deemed distracting/non-educational."
        }
      }
    };

    const prompt = `
      The user is searching for videos with the query: "${query}".
      
      This is for a "Distraction-Free Study App". 
      1. Analyze if the query is educational (academic, skill-building, documentary, tutorial, lecture).
      2. If it is entertainment (music videos, pranks, vlogs, pure gaming gameplay, movies), set isEducationalContext to false and provide a refusal message.
      3. If it is educational, generate 6 plausible video results that would be found on YouTube for this topic. 
      
      Do not generate real URLs, just the metadata.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    const result = JSON.parse(response.text || "{}");

    if (!result.isEducationalContext) {
      // Return a special "blocked" video object or throw suitable error handling in UI
      // For this implementation, we return an empty array to signal no results found/allowed
      // But we can attach the message in a special way. 
      // Let's return a single dummy video that explains the block.
      return [{
        id: 'blocked',
        title: 'Distraction Blocked',
        channel: 'FocusFlow AI',
        description: result.refusalMessage || "This search term seems distracting. Let's get back to studying.",
        thumbnailUrl: 'https://picsum.photos/seed/blocked/640/360',
        isEducational: false
      }];
    }

    // Map the results to our Video interface
    return result.videos.map((v: any, index: number) => ({
      id: v.id || `mock_id_${index}`,
      title: v.title,
      channel: v.channel,
      description: v.description,
      thumbnailUrl: `https://picsum.photos/seed/${v.title.replace(/\s/g, '')}/640/360`, // fast random image
      isEducational: true
    }));

  } catch (error) {
    console.error("Gemini Search Error:", error);
    return [];
  }
};