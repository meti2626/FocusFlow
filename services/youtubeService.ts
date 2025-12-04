import { Video } from '../types';

// YouTube API v3 types
interface YouTubeSearchResponse {
  items: YouTubeSearchItem[];
}

interface YouTubeSearchItem {
  id: {
    videoId: string;
  };
  snippet: {
    title: string;
    description: string;
    channelTitle: string;
    thumbnails: {
      high: {
        url: string;
      };
      medium: {
        url: string;
      };
      default: {
        url: string;
      };
    };
    publishedAt: string;
  };
}

interface YouTubeVideoDetailsResponse {
  items: Array<{
    statistics: {
      viewCount: string;
      likeCount: string;
    };
    contentDetails: {
      duration: string;
    };
  }>;
}

/**
 * Search YouTube for videos
 */
export const searchYouTubeVideos = async (
  query: string,
  maxResults: number = 20
): Promise<Video[]> => {
  const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
  
  if (!apiKey) {
    console.error('❌ YouTube API key not found in environment variables.');
    console.error('Make sure you have VITE_YOUTUBE_API_KEY in your .env file');
    return [];
  }

  console.log('🔍 Searching YouTube for:', query);

  try {
    // Search for videos - removed videoCategoryId filter as it might be too restrictive
    const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
    searchUrl.searchParams.append('part', 'snippet');
    searchUrl.searchParams.append('q', query);
    searchUrl.searchParams.append('type', 'video');
    searchUrl.searchParams.append('maxResults', maxResults.toString());
    searchUrl.searchParams.append('order', 'relevance');
    // Removed videoCategoryId to get more results - we'll filter with AI instead
    searchUrl.searchParams.append('key', apiKey);

    console.log('📡 Fetching from YouTube API...');
    const searchResponse = await fetch(searchUrl.toString());
    
    if (!searchResponse.ok) {
      const errorData = await searchResponse.json().catch(() => ({}));
      console.error('❌ YouTube API Error:', searchResponse.status, searchResponse.statusText);
      console.error('Error details:', errorData);
      throw new Error(`YouTube API error: ${searchResponse.status} ${searchResponse.statusText}`);
    }

    const searchData: YouTubeSearchResponse = await searchResponse.json();
    console.log(`✅ Found ${searchData.items?.length || 0} videos from YouTube`);

    if (!searchData.items || searchData.items.length === 0) {
      console.warn('⚠️ No videos found in search results');
      return [];
    }

    // Get video IDs for additional details
    const videoIds = searchData.items.map(item => item.id.videoId).join(',');

    // Fetch additional video details (views, likes, duration)
    const detailsUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
    detailsUrl.searchParams.append('part', 'statistics,contentDetails');
    detailsUrl.searchParams.append('id', videoIds);
    detailsUrl.searchParams.append('key', apiKey);

    let detailsData: YouTubeVideoDetailsResponse = { items: [] };
    try {
      const detailsResponse = await fetch(detailsUrl.toString());
      if (detailsResponse.ok) {
        detailsData = await detailsResponse.json();
      } else {
        console.warn('⚠️ Could not fetch video details, continuing without them');
      }
    } catch (detailsError) {
      console.warn('⚠️ Error fetching video details:', detailsError);
    }

    // Map to our Video interface
    return searchData.items.map((item, index) => {
      const details = detailsData.items[index];
      const thumbnail = item.snippet.thumbnails.high?.url || 
                       item.snippet.thumbnails.medium?.url || 
                       item.snippet.thumbnails.default?.url;

      return {
        id: item.id.videoId,
        title: item.snippet.title,
        channel: item.snippet.channelTitle,
        description: item.snippet.description,
        thumbnailUrl: thumbnail,
        isEducational: true, // Will be filtered by AI later
        source: 'youtube',
        embedUrl: `https://www.youtube.com/embed/${item.id.videoId}`,
        publishedAt: item.snippet.publishedAt,
        viewCount: details?.statistics?.viewCount || '0',
        likeCount: details?.statistics?.likeCount || '0',
        duration: details?.contentDetails?.duration || '',
      };
    });
  } catch (error: any) {
    console.error('❌ YouTube API Error:', error);
    console.error('Error message:', error?.message);
    console.error('Stack:', error?.stack);
    return [];
  }
};

/**
 * Search Vimeo for educational videos (alternative source)
 */
export const searchVimeoVideos = async (
  query: string,
  maxResults: number = 10
): Promise<Video[]> => {
  // Vimeo API requires authentication, but we can use their search endpoint
  // For now, return empty array - can be implemented later with Vimeo API key
  // This is a placeholder for future expansion
  return [];
};

/**
 * Get trending/popular educational videos
 */
export const getTrendingEducationalVideos = async (maxResults: number = 20): Promise<Video[]> => {
  const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
  
  if (!apiKey) {
    console.warn('YouTube API key not found. Cannot fetch trending videos.');
    return [];
  }

  // Popular educational topics to search for
  const educationalTopics = [
    'programming tutorial',
    'mathematics explained',
    'science documentary',
    'history lesson',
    'language learning',
    'computer science',
    'physics explained',
    'chemistry tutorial',
    'biology documentary',
    'philosophy lecture'
  ];

  // Pick a random topic or cycle through them
  const randomTopic = educationalTopics[Math.floor(Math.random() * educationalTopics.length)];
  
  console.log('📚 Fetching trending educational videos for topic:', randomTopic);
  return await searchYouTubeVideos(randomTopic, maxResults);
};

/**
 * Search multiple video sources
 */
export const searchAllVideoSources = async (
  query: string
): Promise<Video[]> => {
  const [youtubeVideos, vimeoVideos] = await Promise.all([
    searchYouTubeVideos(query, 20),
    searchVimeoVideos(query, 10),
  ]);

  return [...youtubeVideos, ...vimeoVideos];
};

