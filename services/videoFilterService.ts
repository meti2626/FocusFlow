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
 * Quick keyword-based pre-filter to catch obvious non-educational content
 */
const isLikelyEntertainment = (video: Video): boolean => {
  const title = video.title.toLowerCase();
  const channel = video.channel.toLowerCase();
  const description = video.description.toLowerCase();

  // Entertainment keywords that should be blocked
  const entertainmentKeywords = [
    // Music
    'music video', 'mv', 'official audio', 'song', 'album', 'single', 'lyrics', 'music',
    'rap', 'hip hop', 'pop song', 'dance music', 'remix', 'cover song',
    
    // Entertainment
    'movie', 'trailer', 'film', 'cinema', 'hollywood', 'actor', 'actress',
    'comedy', 'funny', 'prank', 'challenge', 'reaction', 'vlog', 'lifestyle',
    'celebrity', 'gossip', 'drama', 'entertainment', 'show', 'tv show',
    
    // Gaming (non-educational)
    'gameplay', 'let\'s play', 'walkthrough', 'gaming', 'playthrough',
    'speedrun', 'gamer', 'twitch', 'stream',
    
    // Other distractions
    'unboxing', 'haul', 'shopping', 'fashion', 'beauty', 'makeup',
    'cooking show', 'recipe', 'food', 'travel vlog', 'vacation'
  ];

  // Check if title, channel, or description contains entertainment keywords
  const text = `${title} ${channel} ${description}`;
  return entertainmentKeywords.some(keyword => text.includes(keyword));
};

/**
 * Filter a single video to determine if it's educational
 */
export const filterVideo = async (video: Video): Promise<EducationalScore> => {
  // Quick pre-filter: block obvious entertainment content
  if (isLikelyEntertainment(video)) {
    console.log(`🚫 Pre-filtered: "${video.title}" - detected entertainment keywords`);
    return {
      score: 0,
      isEducational: false,
      reasoning: "Detected entertainment keywords (music, movie, vlog, etc.)",
      categories: [],
      confidence: 0.9
    };
  }

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
          description: "True ONLY if the video is PRIMARILY educational (score >= 75). MUST be false for ANY entertainment content including: music videos, songs, movies, trailers, vlogs, pranks, challenges, reaction videos, gaming gameplay, celebrity content, lifestyle content, comedy sketches, or any non-educational material."
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
CRITICAL: This is a DISTRACTION-FREE STUDY APP. You MUST be very strict and block ALL entertainment content.

Analyze this video:

Title: "${video.title}"
Channel: "${video.channel}"
Description: "${video.description.substring(0, 500)}"

STRICT RULES - BLOCK (set isEducational = false) if the video contains ANY of:
- Music: songs, music videos, official audio, lyrics, albums, singles, remixes, covers
- Movies/TV: trailers, films, cinema, actors, shows, entertainment
- Entertainment: comedy, pranks, challenges, reactions, vlogs, lifestyle content
- Gaming: gameplay, let's play, walkthroughs, speedruns (UNLESS it's game development/education)
- Other: celebrity gossip, drama, unboxing, hauls, shopping, fashion, beauty, cooking shows, travel vlogs

ONLY ALLOW (set isEducational = true) if the video is:
- Educational tutorials, courses, lectures, how-to guides
- Documentaries and educational series
- Academic content, research explanations
- Skill-building and professional development
- Science, history, technology explanations
- Programming, mathematics, language learning
- Educational content that teaches something valuable

Be VERY strict. If there's ANY doubt, block it. Score must be >= 75 to be educational.
Rate this video's educational value (0-100) and provide reasoning.
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
    const score = result.score || 0;
    
    // Strict threshold: must be >= 75 to be considered educational
    const isEducational = score >= 75 && (result.isEducational === true);
    
    return {
      score: score,
      isEducational: isEducational,
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

CRITICAL: This is a DISTRACTION-FREE STUDY APP. Be VERY strict. Block ALL entertainment.

For each video, determine:
- Educational score (0-100) - must be >= 75 to be educational
- Is it educational? (true ONLY if score >= 75 AND it's clearly educational content)
- Brief reasoning
- Categories (tutorial, lecture, documentary, course, how-to, explanation, etc.)

STRICTLY FILTER OUT:
- Music: songs, music videos, official audio, lyrics, albums, remixes
- Movies/TV: trailers, films, cinema, shows, entertainment
- Entertainment: comedy, pranks, challenges, reactions, vlogs, lifestyle
- Gaming: gameplay, let's play, walkthroughs (unless game development/education)
- Other: celebrity gossip, drama, unboxing, shopping, fashion, beauty, cooking shows

ONLY ALLOW: Educational tutorials, courses, lectures, documentaries, academic content, skill-building, science/history/tech explanations, programming, math, language learning.

If there's ANY doubt, block it. Score must be >= 75.
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
        // Pre-filter entertainment keywords
        if (isLikelyEntertainment(video)) {
          return null;
        }
        
        const analysis = resultMap.get(video.id) as any;
        if (analysis) {
          // Strict threshold: score must be >= 75
          const score = analysis.score || 0;
          const isEducational = score >= 75 && (analysis.isEducational === true);
          
          return isEducational ? {
            ...video,
            isEducational: true
          } : null;
        }
        // If not in results, default to false (block it)
        return null;
      })
      .filter((video): video is Video => video !== null);

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

