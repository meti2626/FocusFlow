
export enum Tab {
  FILES = 'FILES',
  EXPLORE = 'EXPLORE',
  PROGRESS = 'PROGRESS',
  WATCH = 'WATCH'
}

export interface Video {
  id: string;
  title: string;
  channel: string;
  description: string;
  thumbnailUrl: string;
  isEducational: boolean;
  source?: 'youtube' | 'vimeo' | 'other';
  embedUrl?: string;
  publishedAt?: string;
  viewCount?: string;
  likeCount?: string;
  duration?: string;
}

export interface StudyFile {
  id: string;
  name: string;
  type: string;
  lastOpened: Date;
  size: string;
  url?: string; // For object URLs or remote links
}

export interface Note {
  id: string;
  videoId: string;
  timestamp: number;
  content: string;
}

export enum PomodoroStatus {
  IDLE = 'IDLE',
  FOCUS = 'FOCUS',
  BREAK = 'BREAK'
}
