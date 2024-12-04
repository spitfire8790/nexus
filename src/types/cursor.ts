export interface CursorPosition {
  x: number;
  y: number;
  timestamp: string;
}

export interface UserPresenceState {
  username?: string;
  isTyping: boolean;
  online_at: string;
  cursor?: CursorPosition;
  isAdmin?: boolean;
} 