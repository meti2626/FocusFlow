<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1yZUmzbsoSp5tfPiH_Xb0VhvcE_nM6C7i

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file in the root directory with your API keys:
   ```env
   # Gemini AI API Key (for video filtering and query validation)
   # Get your API key from: https://makersuite.google.com/app/apikey
   VITE_API_KEY=your_gemini_api_key_here

   # YouTube Data API v3 Key (for searching videos)
   # Get your API key from: https://console.cloud.google.com/apis/credentials
   # Enable "YouTube Data API v3" in your Google Cloud project
   VITE_YOUTUBE_API_KEY=your_youtube_api_key_here
   ```

3. Run the app:
   ```bash
   npm run dev
   ```

## Features

- **YouTube API Integration**: Searches real YouTube videos based on your queries
- **AI-Powered Filtering**: Uses Gemini AI to filter out non-educational content automatically
- **Multi-Source Support**: Ready to integrate with Vimeo and other educational platforms
- **Smart Content Detection**: Analyzes video titles, descriptions, and metadata to identify educational content
