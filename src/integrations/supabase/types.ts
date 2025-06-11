export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      user_analytics_settings: {
        Row: {
          user_id: string
          daily_goal: number
          last_activity_date: string
          current_streak: number
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          daily_goal?: number
          last_activity_date?: string
          current_streak?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          daily_goal?: number
          last_activity_date?: string
          current_streak?: number
          created_at?: string
          updated_at?: string
        }
      }
      daily_activity_logs: {
        Row: {
          id: string
          user_id: string
          date: string
          questions_completed: number
          correct_answers: number
          study_minutes: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          questions_completed?: number
          correct_answers?: number
          study_minutes?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          questions_completed?: number
          correct_answers?: number
          study_minutes?: number
          created_at?: string
        }
      }
      topic_performance: {
        Row: {
          id: string
          user_id: string
          topic: string
          correct_answers: number
          total_questions: number
          study_minutes: number
          last_practiced: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          topic: string
          correct_answers?: number
          total_questions?: number
          study_minutes?: number
          last_practiced?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          topic?: string
          correct_answers?: number
          total_questions?: number
          study_minutes?: number
          last_practiced?: string
          created_at?: string
          updated_at?: string
        }
      }
      user_badges: {
        Row: {
          id: string
          user_id: string
          badge_name: string
          awarded_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          badge_name: string
          awarded_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          badge_name?: string
          awarded_at?: string
          created_at?: string
        }
      },
      mcqs: {
        Row: {
          chapter: string | null
          correct_answer: number
          created_at: string
          difficulty: string
          explanation: string
          id: string
          options: Json
          original_text: string | null
          question: string
          question_type: string
          user_id: string
        }
        Insert: {
          chapter?: string | null
          correct_answer: number
          created_at?: string
          difficulty: string
          explanation: string
          id?: string
          options: Json
          original_text?: string | null
          question: string
          question_type: string
          user_id: string
        }
        Update: {
          chapter?: string | null
          correct_answer?: number
          created_at?: string
          difficulty?: string
          explanation?: string
          id?: string
          options?: Json
          original_text?: string | null
          question?: string
          question_type?: string
          user_id?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          content: string
          created_at: string
          id: string
          original_text: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          original_text?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          original_text?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
