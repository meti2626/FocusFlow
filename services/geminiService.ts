import { GoogleGenAI, Type } from "@google/genai";
import { Video } from "../types";
import { searchAllVideoSources, getTrendingEducationalVideos } from "./youtubeService";
import { smartFilterVideos } from "./videoFilterService";

// Helper to get the API client
const getAiClient = () => {
  const apiKey = import.meta.env.VITE_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API Key not found");
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Check if the search query itself is educational
 */
const validateQuery = async (query: string): Promise<{ isValid: boolean; message?: string }> => {
  try {
    const ai = getAiClient();
    
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        isValid: {
          type: Type.BOOLEAN,
          description: "True if the query is educational. False for entertainment, celebrity gossip, pure gaming, etc."
        },
        message: {
          type: Type.STRING,
          description: "A polite message if the query is not educational"
        }
      }
    };

    const prompt = `
Analyze this search query for a study app: "${query}"

Is this query educational? (tutorials, courses, lectures, documentaries, skill-building, academic topics)
Or is it entertainment? (music, movies, celebrity gossip, gaming gameplay, pranks, vlogs)

Respond with isValid=true for educational queries, false for entertainment.
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
      isValid: result.isValid !== false,
      message: result.message
    };
  } catch (error) {
    console.error("Query validation error:", error);
    // Default to valid if validation fails
    return { isValid: true };
  }
};

/**
 * Main function to search for educational videos
 * 1. Validates the query
 * 2. Searches YouTube and other sources
 * 3. Filters results using AI to keep only educational content
 */
export const searchEducationalVideos = async (query: string): Promise<Video[]> => {
  try {
    console.log('🚀 Starting video search for:', query);
    
    // Step 1: Validate the query itself
    console.log('📝 Validating query...');
    let queryValidation;
    try {
      queryValidation = await validateQuery(query);
      console.log('✅ Query validation result:', queryValidation.isValid ? 'Valid' : 'Blocked');
    } catch (validationError) {
      console.warn('⚠️ Query validation failed, proceeding anyway:', validationError);
      queryValidation = { isValid: true };
    }
    
    if (!queryValidation.isValid) {
      console.log('🚫 Query blocked as non-educational');
      return [{
        id: 'blocked',
        title: 'Distraction Blocked',
        channel: 'FocusFlow AI',
        description: queryValidation.message || "This search term seems distracting. Let's get back to studying.",
        thumbnailUrl: 'https://picsum.photos/seed/blocked/640/360',
        isEducational: false,
        source: 'system'
      }];
    }

    // Step 2: Search for videos from all sources (YouTube, Vimeo, etc.)
    console.log(`🔍 Searching video sources for: "${query}"`);
    const allVideos = await searchAllVideoSources(query);
    
    if (allVideos.length === 0) {
      console.error("❌ No videos found from API sources");
      console.error("Check your YouTube API key and make sure it's enabled in Google Cloud Console");
      return [];
    }

    console.log(`✅ Found ${allVideos.length} videos from API, now filtering for educational content...`);

    // Step 3: Filter videos using AI to identify educational content
    let educationalVideos: Video[];
    
    // Check if we should skip filtering (for debugging)
    const skipFiltering = import.meta.env.VITE_SKIP_FILTERING === 'true';
    
    if (skipFiltering) {
      console.warn('⚠️ Filtering is disabled (VITE_SKIP_FILTERING=true). Returning all videos.');
      educationalVideos = allVideos.map(v => ({ ...v, isEducational: true }));
    } else {
      try {
        educationalVideos = await smartFilterVideos(allVideos);
        console.log(`✅ Filtered to ${educationalVideos.length} educational videos`);
      } catch (filterError) {
        console.error('❌ Error during filtering:', filterError);
        // If filtering fails, return all videos but mark them as educational
        // This ensures users still see results even if AI filtering fails
        console.log('⚠️ Returning all videos due to filtering error');
        educationalVideos = allVideos.map(v => ({ ...v, isEducational: true }));
      }
    }

    // Return top educational videos (limit to 12 for UI)
    const results = educationalVideos.slice(0, 12);
    console.log(`🎉 Returning ${results.length} videos to display`);
    return results;

  } catch (error: any) {
    console.error("❌ Error searching educational videos:", error);
    console.error("Error details:", error?.message, error?.stack);
    return [];
  }
};

/**
 * Get trending/popular educational videos for the Explore page
 * Similar to YouTube's homepage, shows videos automatically
 */
export const getTrendingVideos = async (): Promise<Video[]> => {
  try {
    console.log('📚 Loading trending educational videos...');
    
    // Get trending videos from YouTube
    const allVideos = await getTrendingEducationalVideos(20);
    
    if (allVideos.length === 0) {
      console.warn('⚠️ No trending videos found');
      return [];
    }

    console.log(`✅ Found ${allVideos.length} trending videos, filtering for educational content...`);

    // Filter videos using AI to identify educational content
    let educationalVideos: Video[];
    
    // Check if we should skip filtering (for debugging)
    const skipFiltering = import.meta.env.VITE_SKIP_FILTERING === 'true';
    
    if (skipFiltering) {
      console.warn('⚠️ Filtering is disabled. Returning all trending videos.');
      educationalVideos = allVideos.map(v => ({ ...v, isEducational: true }));
    } else {
      try {
        educationalVideos = await smartFilterVideos(allVideos);
        console.log(`✅ Filtered to ${educationalVideos.length} educational videos`);
      } catch (filterError) {
        console.error('❌ Error during filtering:', filterError);
        // If filtering fails, return all videos but mark them as educational
        console.log('⚠️ Returning all videos due to filtering error');
        educationalVideos = allVideos.map(v => ({ ...v, isEducational: true }));
      }
    }

    // Return top educational videos (limit to 12 for UI)
    const results = educationalVideos.slice(0, 12);
    console.log(`🎉 Returning ${results.length} trending videos to display`);
    return results;

  } catch (error: any) {
    console.error("❌ Error loading trending videos:", error);
    console.error("Error details:", error?.message, error?.stack);
    return [];
  }
};