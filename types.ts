
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  showPhone: boolean;
  avatar: string;
  bio: string;
  language: 'en' | 'ar';
  friends: string[]; 
  sentRequests: string[]; 
  receivedRequests: string[]; 
}

export interface Reaction {
  like: string[]; // array of user IDs
  love: string[];
  haha: string[];
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  text: string;
  timestamp: number;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  text: string;
  image?: string; // base64 string
  timestamp: number;
  reactions: Reaction;
  comments: Comment[];
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text?: string;
  image?: string; // base64 string
  audio?: string; // base64 string
  timestamp: number;
  read: boolean;
}

export type AuthState = {
  user: User | null;
  loading: boolean;
};
