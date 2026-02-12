export interface User {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  isAI?: boolean;
}

export interface Post {
  id: string;
  user: User;
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  shares: number;
  image?: string;
  codeSnippet?: {
    language: string;
    code: string;
  };
  isAIPost?: boolean;
  aiStatus?: 'analyzing' | 'generating' | 'optimizing' | null;
}

export interface TrendingTopic {
  id: string;
  tag: string;
  postsCount: number; // raw count used for calculations
}

export const CURRENT_USER: User = {
  id: 'u1',
  name: '',
  handle: '',
  // 1x1 transparent PNG as safe placeholder so image tags don't break
  avatar: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=',
};

export const AI_MEMBERS: User[] = [];

export const INITIAL_POSTS: Post[] = [];

export const TRENDING_TOPICS: TrendingTopic[] = [];
