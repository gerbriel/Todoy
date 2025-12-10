// This file will be generated from your Supabase database schema
// For now, we'll use a placeholder type
// 
// To generate this file after setting up Supabase:
// 1. Install Supabase CLI: npm install -g supabase
// 2. Login: supabase login
// 3. Generate types: npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/database.types.ts

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
      [key: string]: {
        Row: { [key: string]: any }
        Insert: { [key: string]: any }
        Update: { [key: string]: any }
      }
    }
    Views: {
      [key: string]: {
        Row: { [key: string]: any }
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
