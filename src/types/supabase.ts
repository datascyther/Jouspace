// Hand-written Database type matching supabase/migrations/20260812000000_init_jouspace.sql.
// Will be regenerated canonically via `supabase gen types typescript` once the
// hosted project exists (see todo #8). Keep Row/Insert/Update in sync with the
// migration while this is the source of truth.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          joined_date: string;
          avatar_url: string | null;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string;
          joined_date?: string;
          avatar_url?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          joined_date?: string;
          avatar_url?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      journal_entries: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          title: string;
          theme: string;
          content: string;
          created_at: number;
          updated_at: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          date?: string;
          title?: string;
          theme?: string;
          content?: string;
          created_at?: number;
          updated_at?: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          title?: string;
          theme?: string;
          content?: string;
          created_at?: number;
          updated_at?: number;
        };
        Relationships: [];
      };
      custom_themes: {
        Row: {
          id: string;
          user_id: string;
          label: string;
          placeholder_title: string;
          placeholder_body: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          user_id: string;
          label: string;
          placeholder_title?: string;
          placeholder_body?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          label?: string;
          placeholder_title?: string;
          placeholder_body?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      ai_chat_history: {
        Row: { user_id: string; messages: Json; updated_at: string };
        Insert: { user_id: string; messages?: Json; updated_at?: string };
        Update: { user_id?: string; messages?: Json; updated_at?: string };
        Relationships: [];
      };
      ai_context: {
        Row: { user_id: string; selection: Json; updated_at: string };
        Insert: { user_id: string; selection?: Json; updated_at?: string };
        Update: { user_id?: string; selection?: Json; updated_at?: string };
        Relationships: [];
      };
      personalization: {
        Row: {
          user_id: string;
          schema_version: number;
          memory_notes: string;
          last_digest_at: number | null;
          last_entry_count: number;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          schema_version?: number;
          memory_notes?: string;
          last_digest_at?: number | null;
          last_entry_count?: number;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          schema_version?: number;
          memory_notes?: string;
          last_digest_at?: number | null;
          last_entry_count?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_prefs: {
        Row: {
          user_id: string;
          reminders_enabled: boolean;
          theme: string;
          nav: Json;
          draft: Json;
          runtime_url: string | null;
          onboarded: boolean;
          permissions: Json;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          reminders_enabled?: boolean;
          theme?: string;
          nav?: Json;
          draft?: Json;
          runtime_url?: string | null;
          onboarded?: boolean;
          permissions?: Json;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          reminders_enabled?: boolean;
          theme?: string;
          nav?: Json;
          draft?: Json;
          runtime_url?: string | null;
          onboarded?: boolean;
          permissions?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
