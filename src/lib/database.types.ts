export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      chat_messages: {
        Row: {
          id: string
          user_id: string
          message: string
          property_id: string | null
          rating: number | null
          location: string | null
          created_at: string
          is_general: boolean
          moderated_message: string
        }
        Insert: {
          id?: string
          user_id: string
          message: string
          property_id?: string | null
          rating?: number | null
          location?: string | null
          created_at?: string
          is_general?: boolean
          moderated_message?: string
        }
        Update: {
          id?: string
          user_id?: string
          message?: string
          property_id?: string | null
          rating?: number | null
          location?: string | null
          created_at?: string
          is_general?: boolean
          moderated_message?: string
        }
      }
      feature_requests: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string
          type: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description: string
          type: string
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string
          type?: string
          status?: string
          created_at?: string
        }
      }
      feature_request_votes: {
        Row: {
          id: string
          feature_request_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          feature_request_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          feature_request_id?: string
          user_id?: string
          created_at?: string
        }
      }
    }
  }
} 