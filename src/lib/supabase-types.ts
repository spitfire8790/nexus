export interface Profile {
  id: string;
  username: string;
  avatar_url?: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  message: string;
  property_id?: string;
  rating?: number;
  location?: [number, number];
  created_at: string;
  is_general: boolean;
  moderated_message: string;
  profile?: Profile;
  reactions?: Array<{
    emoji: string;
    user_id: string;
    profile: {
      username: string;
    };
  }>;
}

export interface FeatureRequest {
  id: string;
  user_id: string;
  title: string;
  description: string;
  type: 'feature' | 'data' | 'bug';
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  created_at: string;
  vote_count?: number;
  has_voted?: boolean;
  profile?: Profile;
}

export interface FeatureRequestVote {
  id: string;
  feature_request_id: string;
  user_id: string;
  created_at: string;
} 