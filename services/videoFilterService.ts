import { GoogleGenAI, Type } from "@google/genai";
import { Video } from "../types";

// Helper to get the AI client
const getAiClient = () => {
  const apiKey = import.meta.env.VITE_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API Key not found");
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Educational content filtering criteria
 */
interface EducationalScore {
  score: number; // 0-100, higher is more educational
  isEducational: boolean;
  reasoning: string;
  categories: string[]; // e.g., ["tutorial", "lecture", "documentary"]
  confidence: number; // 0-1
}

/**
 * Filter a single video to determine if it's educational
 */
export const filterVideo = async (video: Video): Promise<EducationalScore> => {
  try {
    const ai = getAiClient();

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        score: {
          type: Type.NUMBER,
          description: "Educational value score from 0-100. Higher means more educational."
        },
        isEducational: {
          type: Type.BOOLEAN,
          description: "True if the video is primarily educational (score >= 60). False for entertainment, vlogs, pranks, pure gaming gameplay, music videos, etc."
        },
        reasoning: {
          type: Type.STRING,
          description: "Brief explanation of why this video is or isn't educational"
        },
        categories: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Educational categories like: tutorial, lecture, documentary, course, how-to, explanation, research, academic, skill-building"
        },
        confidence: {
          type: Type.NUMBER,
          description: "Confidence level 0-1 in the assessment"
        }
      }
    };

    const prompt = `
Analyze this video to determine if it's educational content suitable for a study app:

Title: "${video.title}"
Channel: "${video.channel}"
Description: "${video.description.substring(0, 500)}"
Views: ${video.viewCount || 'unknown'}
Published: ${video.publishedAt || 'unknown'}

Educational content includes:
- Tutorials, courses, lectures, how-to guides
- Documentaries, educational series
- Academic content, research explanations
- Skill-building, professional development
- Science, history, technology explanations
- Programming, mathematics, language learning

NOT educational (should be filtered out):
- Entertainment: music videos, movie trailers, comedy sketches
- Vlogs, personal diaries, lifestyle content
- Gaming gameplay (unless it's game development/education)
- Pranks, challenges, reaction videos
- Celebrity gossip, drama, clickbait
- Pure entertainment without educational value

Rate this video's educational value and provide reasoning.
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
    
    return {
      score: result.score || 0,
      isEducational: result.isEducational || false,
      reasoning: result.reasoning || "Unable to determine",
      categories: result.categories || [],
      confidence: result.confidence || 0.5
    };

  } catch (error) {
    console.error("Video filtering error:", error);
    // Default to non-educational if filtering fails
    return {
      score: 0,
      isEducational: false,
      reasoning: "Error analyzing video",
      categories: [],
      confidence: 0
    };
  }
};

/**
 * Filter multiple videos in batch (more efficient)
 */
export const filterVideosBatch = async (videos: Video[]): Promise<Video[]> => {
  try {
    const ai = getAiClient();

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        results: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              videoId: { type: Type.STRING },
              score: { type: Type.NUMBER },
              isEducational: { type: Type.BOOLEAN },
              reasoning: { type: Type.STRING },
              categories: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        }
      }
    };

    // Create a summary of all videos for batch processing
    const videosSummary = videos.map(v => ({
      id: v.id,
      title: v.title,
      channel: v.channel,
      description: v.description.substring(0, 200)
    }));

    const prompt = `
Analyze these ${videos.length} videos to determine which are educational:

${videosSummary.map((v, i) => `
${i + 1}. ID: ${v.id}
   Title: "${v.title}"
   Channel: "${v.channel}"
   Description: "${v.description}"
`).join('\n')}

For each video, determine:
- Educational score (0-100)
- Is it educational? (true if score >= 60)
- Brief reasoning
- Categories (tutorial, lecture, documentary, course, how-to, explanation, etc.)

Filter out: entertainment, vlogs, gaming gameplay, pranks, music videos, clickbait.
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
    const filteredResults = result.results || [];

    // Map results back to videos
    const resultMap = new Map(
      filteredResults.map((r: any) => [r.videoId, r])
    );

    return videos
      .map(video => {
        const analysis = resultMap.get(video.id);
        if (analysis) {
          return {
            ...video,
            isEducational: analysis.isEducational || false
          };
        }
        // If not in results, default to false
        return {
          ...video,
          isEducational: false
        };
      })
      .filter(video => video.isEducational);

  } catch (error) {
    console.error("Batch filtering error:", error);
    // Fallback: filter videos one by one
    console.log("Falling back to individual video filtering...");
    const filteredVideos: Video[] = [];
    
    for (const video of videos) {
      const analysis = await filterVideo(video);
      if (analysis.isEducational) {
        filteredVideos.push({
          ...video,
          isEducational: true
        });
      }
    }
    
    return filteredVideos;
  }
};

/**
 * Smart filtering: Use batch processing for efficiency, fallback to individual if needed
 */
export const smartFilterVideos = async (videos: Video[]): Promise<Video[]> => {
  if (videos.length === 0) return [];
  
  // Check if API key is available
  const apiKey = import.meta.env.VITE_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    console.warn('⚠️ Gemini API key not found. Skipping AI filtering, returning all videos.');
    // Return all videos as educational if filtering is unavailable
    return videos.map(v => ({ ...v, isEducational: true }));
  }

  try {
    // For small batches, use individual filtering for better accuracy
    if (videos.length <= 5) {
      console.log(`🔍 Filtering ${videos.length} videos individually...`);
      const filtered: Video[] = [];
      for (const video of videos) {
        try {
          const analysis = await filterVideo(video);
          if (analysis.isEducational) {
            filtered.push({
              ...video,
              isEducational: true
            });
          }
        } catch (videoError) {
          console.warn(`⚠️ Error filtering video "${video.title}":`, videoError);
          // Include video if filtering fails (fail open)
          filtered.push({
            ...video,
            isEducational: true
          });
        }
      }
      return filtered;
    }

    // For larger batches, use batch processing
    console.log(`🔍 Filtering ${videos.length} videos in batch...`);
    return await filterVideosBatch(videos);
  } catch (error) {
    console.error('❌ Error in smart filtering:', error);
    // Fail open - return all videos if filtering completely fails
    console.warn('⚠️ Returning all videos due to filtering error');
    return videos.map(v => ({ ...v, isEducational: true }));
  }
};

