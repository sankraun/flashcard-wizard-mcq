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
      achievements: {
        Row: {
          created_at: string
          criteria: Json
          description: string
          icon: string
          id: string
          name: string
          points: number
          rarity: string
          type: string
        }
        Insert: {
          created_at?: string
          criteria: Json
          description: string
          icon: string
          id?: string
          name: string
          points?: number
          rarity?: string
          type: string
        }
        Update: {
          created_at?: string
          criteria?: Json
          description?: string
          icon?: string
          id?: string
          name?: string
          points?: number
          rarity?: string
          type?: string
        }
        Relationships: []
      }
      collections: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          parent_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          parent_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collections_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
        ]
      }
      content_items: {
        Row: {
          collection_id: string | null
          content: Json
          created_at: string
          id: string
          tags: string[] | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          collection_id?: string | null
          content: Json
          created_at?: string
          id?: string
          tags?: string[] | null
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          collection_id?: string | null
          content?: Json
          created_at?: string
          id?: string
          tags?: string[] | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_activity_logs: {
        Row: {
          correct_answers: number | null
          created_at: string | null
          date: string
          id: string
          questions_completed: number | null
          study_minutes: number | null
          user_id: string | null
        }
        Insert: {
          correct_answers?: number | null
          created_at?: string | null
          date: string
          id?: string
          questions_completed?: number | null
          study_minutes?: number | null
          user_id?: string | null
        }
        Update: {
          correct_answers?: number | null
          created_at?: string | null
          date?: string
          id?: string
          questions_completed?: number | null
          study_minutes?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      flashcards: {
        Row: {
          back: string
          category: string | null
          created_at: string
          front: string
          id: string
          original_text: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          back: string
          category?: string | null
          created_at?: string
          front: string
          id?: string
          original_text?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          back?: string
          category?: string | null
          created_at?: string
          front?: string
          id?: string
          original_text?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      leaderboard_entries: {
        Row: {
          accuracy_percentage: number
          achievements_count: number
          created_at: string
          current_streak: number
          display_name: string
          id: string
          last_activity: string
          questions_answered: number
          total_points: number
          user_id: string
        }
        Insert: {
          accuracy_percentage?: number
          achievements_count?: number
          created_at?: string
          current_streak?: number
          display_name: string
          id?: string
          last_activity?: string
          questions_answered?: number
          total_points?: number
          user_id: string
        }
        Update: {
          accuracy_percentage?: number
          achievements_count?: number
          created_at?: string
          current_streak?: number
          display_name?: string
          id?: string
          last_activity?: string
          questions_answered?: number
          total_points?: number
          user_id?: string
        }
        Relationships: []
      }
      learning_paths: {
        Row: {
          created_at: string
          description: string
          difficulty: string
          estimated_duration_hours: number | null
          id: string
          is_active: boolean
          name: string
          prerequisites: string[] | null
          topics: string[]
        }
        Insert: {
          created_at?: string
          description: string
          difficulty: string
          estimated_duration_hours?: number | null
          id?: string
          is_active?: boolean
          name: string
          prerequisites?: string[] | null
          topics: string[]
        }
        Update: {
          created_at?: string
          description?: string
          difficulty?: string
          estimated_duration_hours?: number | null
          id?: string
          is_active?: boolean
          name?: string
          prerequisites?: string[] | null
          topics?: string[]
        }
        Relationships: []
      }
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
      practice_challenges: {
        Row: {
          created_at: string
          description: string
          end_date: string
          goals: Json
          id: string
          is_active: boolean
          name: string
          rewards: Json
          start_date: string
          type: string
        }
        Insert: {
          created_at?: string
          description: string
          end_date: string
          goals: Json
          id?: string
          is_active?: boolean
          name: string
          rewards: Json
          start_date: string
          type: string
        }
        Update: {
          created_at?: string
          description?: string
          end_date?: string
          goals?: Json
          id?: string
          is_active?: boolean
          name?: string
          rewards?: Json
          start_date?: string
          type?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      topic_performance: {
        Row: {
          correct_answers: number | null
          created_at: string | null
          id: string
          last_practiced: string | null
          study_minutes: number | null
          topic: string
          total_questions: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          correct_answers?: number | null
          created_at?: string | null
          id?: string
          last_practiced?: string | null
          study_minutes?: number | null
          topic: string
          total_questions?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          correct_answers?: number | null
          created_at?: string | null
          id?: string
          last_practiced?: string | null
          study_minutes?: number | null
          topic?: string
          total_questions?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          progress: Json | null
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          progress?: Json | null
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          progress?: Json | null
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_analytics_settings: {
        Row: {
          created_at: string | null
          current_streak: number | null
          daily_goal: number | null
          last_activity_date: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_streak?: number | null
          daily_goal?: number | null
          last_activity_date?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_streak?: number | null
          daily_goal?: number | null
          last_activity_date?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          awarded_at: string | null
          badge_name: string
          created_at: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          awarded_at?: string | null
          badge_name: string
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          awarded_at?: string | null
          badge_name?: string
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_challenge_progress: {
        Row: {
          challenge_id: string
          completed_at: string | null
          created_at: string
          id: string
          points_earned: number | null
          progress: Json
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          points_earned?: number | null
          progress?: Json
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          points_earned?: number | null
          progress?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_challenge_progress_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "practice_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_learning_paths: {
        Row: {
          completed_at: string | null
          current_topic_index: number
          id: string
          learning_path_id: string
          started_at: string
          topics_completed: string[] | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          current_topic_index?: number
          id?: string
          learning_path_id: string
          started_at?: string
          topics_completed?: string[] | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          current_topic_index?: number
          id?: string
          learning_path_id?: string
          started_at?: string
          topics_completed?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_learning_paths_learning_path_id_fkey"
            columns: ["learning_path_id"]
            isOneToOne: false
            referencedRelation: "learning_paths"
            referencedColumns: ["id"]
          },
        ]
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
