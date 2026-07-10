export interface Database {
  public: {
    Tables: {
      exercises: {
        Row: { id: string; user_id: string; name: string; category: string; is_default: boolean; sort_order: number; created_at: string; updated_at: string }
        Insert: { id?: string; user_id: string; name: string; category?: string; is_default?: boolean; sort_order?: number; created_at?: string; updated_at?: string }
        Update: { name?: string; category?: string; is_default?: boolean; sort_order?: number; updated_at?: string }
        Relationships: []
      }
      personal_records: {
        Row: { id: string; user_id: string; exercise_id: string; weight: number; achieved_at: string; notes: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; user_id: string; exercise_id: string; weight: number; achieved_at?: string; notes?: string | null; created_at?: string; updated_at?: string }
        Update: { weight?: number; achieved_at?: string; notes?: string | null; updated_at?: string }
        Relationships: []
      }
      profiles: {
        Row: { id: string; display_name: string | null; avatar_url: string | null; default_bar_weight: number; rounding_mode: string; created_at: string; updated_at: string }
        Insert: { id: string; display_name?: string | null; avatar_url?: string | null; default_bar_weight?: number; rounding_mode?: string; created_at?: string; updated_at?: string }
        Update: { display_name?: string | null; avatar_url?: string | null; default_bar_weight?: number; rounding_mode?: string; updated_at?: string }
        Relationships: []
      }
      user_plates: {
        Row: { id: string; user_id: string; weight: number; quantity: number | null; enabled: boolean; created_at: string; updated_at: string }
        Insert: { id?: string; user_id: string; weight: number; quantity?: number | null; enabled?: boolean; created_at?: string; updated_at?: string }
        Update: { weight?: number; quantity?: number | null; enabled?: boolean; updated_at?: string }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
