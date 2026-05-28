 
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      ai_meeting_notes: {
        Row: {
          confidence: number | null
          created_at: string | null
          id: string
          meeting_id: string
          metadata: Json | null
          note_type: string | null
          sentiment: number | null
          speaker_id: string | null
          speaker_name: string | null
          text: string
          timestamp: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          id?: string
          meeting_id: string
          metadata?: Json | null
          note_type?: string | null
          sentiment?: number | null
          speaker_id?: string | null
          speaker_name?: string | null
          text: string
          timestamp: string
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          id?: string
          meeting_id?: string
          metadata?: Json | null
          note_type?: string | null
          sentiment?: number | null
          speaker_id?: string | null
          speaker_name?: string | null
          text?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_meeting_notes_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_meeting_notes_speaker_id_fkey"
            columns: ["speaker_id"]
            isOneToOne: false
            referencedRelation: "meeting_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_processing_jobs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          input_data: Json | null
          job_type: string
          meeting_id: string | null
          output_data: Json | null
          recording_id: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          input_data?: Json | null
          job_type: string
          meeting_id?: string | null
          output_data?: Json | null
          recording_id?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          input_data?: Json | null
          job_type?: string
          meeting_id?: string | null
          output_data?: Json | null
          recording_id?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_processing_jobs_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_processing_jobs_recording_id_fkey"
            columns: ["recording_id"]
            isOneToOne: false
            referencedRelation: "meeting_recordings"
            referencedColumns: ["id"]
          },
        ]
      }
      breakout_assignments: {
        Row: {
          created_at: string | null
          id: string
          room_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          room_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "breakout_assignments_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "breakout_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      breakout_rooms: {
        Row: {
          created_at: string | null
          id: string
          meeting_id: string
          room_name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          meeting_id: string
          room_name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          meeting_id?: string
          room_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "breakout_rooms_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_conversations: {
        Row: {
          created_at: string | null
          escalated_to_human: boolean | null
          escalation_reason: string | null
          id: string
          satisfaction_rating: number | null
          session_id: string
          status: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          escalated_to_human?: boolean | null
          escalation_reason?: string | null
          id?: string
          satisfaction_rating?: number | null
          session_id: string
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          escalated_to_human?: boolean | null
          escalation_reason?: string | null
          id?: string
          satisfaction_rating?: number | null
          session_id?: string
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          conversation_id: string | null
          created_at: string | null
          id: string
          is_helpful: boolean | null
          message_metadata: Json | null
          message_text: string
          sender_type: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          is_helpful?: boolean | null
          message_metadata?: Json | null
          message_text: string
          sender_type: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          is_helpful?: boolean | null
          message_metadata?: Json | null
          message_text?: string
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      content_exports: {
        Row: {
          completed_at: string | null
          content_id: string
          created_at: string | null
          error_message: string | null
          export_destination: string | null
          export_format: string
          file_url: string | null
          id: string
          metadata: Json | null
          status: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          content_id: string
          created_at?: string | null
          error_message?: string | null
          export_destination?: string | null
          export_format: string
          file_url?: string | null
          id?: string
          metadata?: Json | null
          status?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          content_id?: string
          created_at?: string | null
          error_message?: string | null
          export_destination?: string | null
          export_format?: string
          file_url?: string | null
          id?: string
          metadata?: Json | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_exports_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "generated_content"
            referencedColumns: ["id"]
          },
        ]
      }
      content_templates: {
        Row: {
          config: Json
          created_at: string | null
          description: string | null
          id: string
          is_public: boolean | null
          name: string
          template_type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          config: Json
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          template_type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          config?: Json
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          template_type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      course_modules: {
        Row: {
          course_id: string
          created_at: string | null
          description: string | null
          duration_seconds: number
          id: string
          is_preview: boolean | null
          key_points: string[] | null
          module_number: number
          thumbnail_url: string | null
          title: string
          transcript: string | null
          updated_at: string | null
          video_end_time: number
          video_start_time: number
          video_url: string | null
        }
        Insert: {
          course_id: string
          created_at?: string | null
          description?: string | null
          duration_seconds: number
          id?: string
          is_preview?: boolean | null
          key_points?: string[] | null
          module_number: number
          thumbnail_url?: string | null
          title: string
          transcript?: string | null
          updated_at?: string | null
          video_end_time: number
          video_start_time: number
          video_url?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string | null
          description?: string | null
          duration_seconds?: number
          id?: string
          is_preview?: boolean | null
          key_points?: string[] | null
          module_number?: number
          thumbnail_url?: string | null
          title?: string
          transcript?: string | null
          updated_at?: string | null
          video_end_time?: number
          video_start_time?: number
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          difficulty_level: string | null
          enrollments_count: number | null
          id: string
          is_published: boolean | null
          meeting_id: string | null
          price_idr: number | null
          published_at: string | null
          rating_average: number | null
          rating_count: number | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          total_duration_seconds: number | null
          total_modules: number | null
          updated_at: string | null
          user_id: string
          views_count: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          difficulty_level?: string | null
          enrollments_count?: number | null
          id?: string
          is_published?: boolean | null
          meeting_id?: string | null
          price_idr?: number | null
          published_at?: string | null
          rating_average?: number | null
          rating_count?: number | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          total_duration_seconds?: number | null
          total_modules?: number | null
          updated_at?: string | null
          user_id: string
          views_count?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          difficulty_level?: string | null
          enrollments_count?: number | null
          id?: string
          is_published?: boolean | null
          meeting_id?: string | null
          price_idr?: number | null
          published_at?: string | null
          rating_average?: number | null
          rating_count?: number | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          total_duration_seconds?: number | null
          total_modules?: number | null
          updated_at?: string | null
          user_id?: string
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_content: {
        Row: {
          content_type: string
          created_at: string | null
          description: string | null
          downloads_count: number | null
          file_type: string | null
          file_url: string | null
          id: string
          is_published: boolean | null
          meeting_id: string | null
          metadata: Json | null
          processing_job_id: string | null
          published_at: string | null
          title: string
          updated_at: string | null
          user_id: string
          views_count: number | null
        }
        Insert: {
          content_type: string
          created_at?: string | null
          description?: string | null
          downloads_count?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_published?: boolean | null
          meeting_id?: string | null
          metadata?: Json | null
          processing_job_id?: string | null
          published_at?: string | null
          title: string
          updated_at?: string | null
          user_id: string
          views_count?: number | null
        }
        Update: {
          content_type?: string
          created_at?: string | null
          description?: string | null
          downloads_count?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_published?: boolean | null
          meeting_id?: string | null
          metadata?: Json | null
          processing_job_id?: string | null
          published_at?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "generated_content_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_content_processing_job_id_fkey"
            columns: ["processing_job_id"]
            isOneToOne: false
            referencedRelation: "ai_processing_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_users: {
        Row: {
          created_at: string | null
          display_name: string
          guest_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          display_name: string
          guest_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          display_name?: string
          guest_id?: string
          id?: string
        }
        Relationships: []
      }
      helpdesk_articles: {
        Row: {
          category: string
          content: string
          created_at: string | null
          helpful_count: number | null
          id: string
          is_published: boolean | null
          keywords: string[] | null
          not_helpful_count: number | null
          title: string
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          category: string
          content: string
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          is_published?: boolean | null
          keywords?: string[] | null
          not_helpful_count?: number | null
          title: string
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          category?: string
          content?: string
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          is_published?: boolean | null
          keywords?: string[] | null
          not_helpful_count?: number | null
          title?: string
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      learner_achievements: {
        Row: {
          achievement_description: string | null
          achievement_title: string
          achievement_type: string
          badge_icon_url: string | null
          earned_at: string | null
          id: string
          metadata: Json | null
          points_earned: number | null
          user_id: string
        }
        Insert: {
          achievement_description?: string | null
          achievement_title: string
          achievement_type: string
          badge_icon_url?: string | null
          earned_at?: string | null
          id?: string
          metadata?: Json | null
          points_earned?: number | null
          user_id: string
        }
        Update: {
          achievement_description?: string | null
          achievement_title?: string
          achievement_type?: string
          badge_icon_url?: string | null
          earned_at?: string | null
          id?: string
          metadata?: Json | null
          points_earned?: number | null
          user_id?: string
        }
        Relationships: []
      }
      learner_progress: {
        Row: {
          completed_at: string | null
          course_id: string
          created_at: string | null
          id: string
          last_position_seconds: number | null
          module_id: string | null
          progress_percentage: number | null
          quiz_attempts: number | null
          quiz_score: number | null
          status: string
          time_spent_seconds: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          created_at?: string | null
          id?: string
          last_position_seconds?: number | null
          module_id?: string | null
          progress_percentage?: number | null
          quiz_attempts?: number | null
          quiz_score?: number | null
          status: string
          time_spent_seconds?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          created_at?: string | null
          id?: string
          last_position_seconds?: number | null
          module_id?: string | null
          progress_percentage?: number | null
          quiz_attempts?: number | null
          quiz_score?: number | null
          status?: string
          time_spent_seconds?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learner_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learner_progress_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_chat: {
        Row: {
          created_at: string | null
          id: string
          meeting_id: string | null
          message: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          meeting_id?: string | null
          message: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          meeting_id?: string | null
          message?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_chat_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_ctas: {
        Row: {
          button_color: string | null
          button_text: string
          clicks_count: number | null
          created_at: string | null
          creator_id: string
          description: string | null
          duration_seconds: number | null
          id: string
          is_active: boolean | null
          link_url: string
          meeting_id: string
          price: number | null
          title: string
        }
        Insert: {
          button_color?: string | null
          button_text: string
          clicks_count?: number | null
          created_at?: string | null
          creator_id: string
          description?: string | null
          duration_seconds?: number | null
          id?: string
          is_active?: boolean | null
          link_url: string
          meeting_id: string
          price?: number | null
          title: string
        }
        Update: {
          button_color?: string | null
          button_text?: string
          clicks_count?: number | null
          created_at?: string | null
          creator_id?: string
          description?: string | null
          duration_seconds?: number | null
          id?: string
          is_active?: boolean | null
          link_url?: string
          meeting_id?: string
          price?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_ctas_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_participants: {
        Row: {
          display_name: string
          hand_raised: boolean | null
          id: string
          is_camera_on: boolean | null
          is_mic_on: boolean | null
          is_screen_sharing: boolean | null
          joined_at: string | null
          left_at: string | null
          meeting_id: string | null
          user_id: string | null
        }
        Insert: {
          display_name: string
          hand_raised?: boolean | null
          id?: string
          is_camera_on?: boolean | null
          is_mic_on?: boolean | null
          is_screen_sharing?: boolean | null
          joined_at?: string | null
          left_at?: string | null
          meeting_id?: string | null
          user_id?: string | null
        }
        Update: {
          display_name?: string
          hand_raised?: boolean | null
          id?: string
          is_camera_on?: boolean | null
          is_mic_on?: boolean | null
          is_screen_sharing?: boolean | null
          joined_at?: string | null
          left_at?: string | null
          meeting_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_participants_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_polls: {
        Row: {
          created_at: string | null
          created_by: string
          id: string
          is_active: boolean | null
          meeting_id: string
          options: Json
          question: string
        }
        Insert: {
          created_at?: string | null
          created_by: string
          id?: string
          is_active?: boolean | null
          meeting_id: string
          options?: Json
          question: string
        }
        Update: {
          created_at?: string | null
          created_by?: string
          id?: string
          is_active?: boolean | null
          meeting_id?: string
          options?: Json
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_polls_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_questions: {
        Row: {
          answer: string | null
          created_at: string | null
          id: string
          is_answered: boolean | null
          meeting_id: string
          question: string
          upvotes: number | null
          user_id: string
        }
        Insert: {
          answer?: string | null
          created_at?: string | null
          id?: string
          is_answered?: boolean | null
          meeting_id: string
          question: string
          upvotes?: number | null
          user_id: string
        }
        Update: {
          answer?: string | null
          created_at?: string | null
          id?: string
          is_answered?: boolean | null
          meeting_id?: string
          question?: string
          upvotes?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_questions_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_recordings: {
        Row: {
          created_at: string | null
          duration: number | null
          file_size: number | null
          id: string
          meeting_id: string
          recording_url: string
          status: string | null
          title: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          duration?: number | null
          file_size?: number | null
          id?: string
          meeting_id: string
          recording_url: string
          status?: string | null
          title?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          duration?: number | null
          file_size?: number | null
          id?: string
          meeting_id?: string
          recording_url?: string
          status?: string | null
          title?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_recordings_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_recordings_processing: {
        Row: {
          chapters: Json | null
          created_at: string | null
          generated_summary: string | null
          generated_title: string | null
          id: string
          meeting_id: string
          quiz_questions: Json | null
          status: string | null
          user_id: string
        }
        Insert: {
          chapters?: Json | null
          created_at?: string | null
          generated_summary?: string | null
          generated_title?: string | null
          id?: string
          meeting_id: string
          quiz_questions?: Json | null
          status?: string | null
          user_id: string
        }
        Update: {
          chapters?: Json | null
          created_at?: string | null
          generated_summary?: string | null
          generated_title?: string | null
          id?: string
          meeting_id?: string
          quiz_questions?: Json | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_recordings_processing_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          action_items: Json | null
          ai_summary: string | null
          allow_high_quality_audio: boolean | null
          created_at: string | null
          duration_minutes: number | null
          ended_at: string | null
          host_id: string | null
          id: string
          is_active: boolean | null
          is_locked: boolean | null
          key_moments: Json | null
          meeting_code: string
          metadata: Json | null
          started_at: string | null
          title: string | null
          transcription_data: Json | null
          transcription_status: string | null
        }
        Insert: {
          action_items?: Json | null
          ai_summary?: string | null
          allow_high_quality_audio?: boolean | null
          created_at?: string | null
          duration_minutes?: number | null
          ended_at?: string | null
          host_id?: string | null
          id?: string
          is_active?: boolean | null
          is_locked?: boolean | null
          key_moments?: Json | null
          meeting_code: string
          metadata?: Json | null
          started_at?: string | null
          title?: string | null
          transcription_data?: Json | null
          transcription_status?: string | null
        }
        Update: {
          action_items?: Json | null
          ai_summary?: string | null
          allow_high_quality_audio?: boolean | null
          created_at?: string | null
          duration_minutes?: number | null
          ended_at?: string | null
          host_id?: string | null
          id?: string
          is_active?: boolean | null
          is_locked?: boolean | null
          key_moments?: Json | null
          meeting_code?: string
          metadata?: Json | null
          started_at?: string | null
          title?: string | null
          transcription_data?: Json | null
          transcription_status?: string | null
        }
        Relationships: []
      }
      module_content: {
        Row: {
          content_data: Json | null
          content_type: string
          created_at: string | null
          file_size_bytes: number | null
          file_type: string | null
          file_url: string | null
          id: string
          module_id: string
          order_index: number | null
          title: string
        }
        Insert: {
          content_data?: Json | null
          content_type: string
          created_at?: string | null
          file_size_bytes?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          module_id: string
          order_index?: number | null
          title: string
        }
        Update: {
          content_data?: Json | null
          content_type?: string
          created_at?: string | null
          file_size_bytes?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          module_id?: string
          order_index?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_content_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      module_quizzes: {
        Row: {
          correct_answer: string
          created_at: string | null
          explanation: string | null
          id: string
          module_id: string
          options: Json | null
          points: number | null
          question_number: number
          question_text: string
          question_type: string
        }
        Insert: {
          correct_answer: string
          created_at?: string | null
          explanation?: string | null
          id?: string
          module_id: string
          options?: Json | null
          points?: number | null
          question_number: number
          question_text: string
          question_type: string
        }
        Update: {
          correct_answer?: string
          created_at?: string | null
          explanation?: string | null
          id?: string
          module_id?: string
          options?: Json | null
          points?: number | null
          question_number?: number
          question_text?: string
          question_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_quizzes_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_progress: {
        Row: {
          current_step: number | null
          last_updated: string | null
          steps_completed: Json | null
          user_id: string
        }
        Insert: {
          current_step?: number | null
          last_updated?: string | null
          steps_completed?: Json | null
          user_id: string
        }
        Update: {
          current_step?: number | null
          last_updated?: string | null
          steps_completed?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          amount: number
          created_at: string | null
          currency: string
          id: string
          metadata: Json | null
          payment_id: string | null
          payment_method: string | null
          status: string
          subscription_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string
          id?: string
          metadata?: Json | null
          payment_id?: string | null
          payment_method?: string | null
          status?: string
          subscription_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string
          id?: string
          metadata?: Json | null
          payment_id?: string | null
          payment_method?: string | null
          status?: string
          subscription_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "user_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_votes: {
        Row: {
          created_at: string | null
          id: string
          option_index: number
          poll_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          option_index: number
          poll_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          option_index?: number
          poll_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "meeting_polls"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          role: string | null
          subscription_expires_at: string | null
          subscription_plan: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          role?: string | null
          subscription_expires_at?: string | null
          subscription_plan?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          role?: string | null
          subscription_expires_at?: string | null
          subscription_plan?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      social_media_exports: {
        Row: {
          caption: string | null
          duration_seconds: number | null
          engagement_rate: number | null
          export_format: string
          exported_at: string | null
          hashtags: string[] | null
          id: string
          module_id: string | null
          platform: string
          thumbnail_url: string | null
          user_id: string
          video_url: string | null
          views_count: number | null
        }
        Insert: {
          caption?: string | null
          duration_seconds?: number | null
          engagement_rate?: number | null
          export_format: string
          exported_at?: string | null
          hashtags?: string[] | null
          id?: string
          module_id?: string | null
          platform: string
          thumbnail_url?: string | null
          user_id: string
          video_url?: string | null
          views_count?: number | null
        }
        Update: {
          caption?: string | null
          duration_seconds?: number | null
          engagement_rate?: number | null
          export_format?: string
          exported_at?: string | null
          hashtags?: string[] | null
          id?: string
          module_id?: string | null
          platform?: string
          thumbnail_url?: string | null
          user_id?: string
          video_url?: string | null
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "social_media_exports_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          cloud_storage_gb: number | null
          created_at: string | null
          description: string | null
          display_order: number | null
          features: Json | null
          id: string
          is_active: boolean | null
          max_duration_minutes: number | null
          max_participants: number
          name: string
          price_monthly: number
          price_yearly: number | null
          updated_at: string | null
        }
        Insert: {
          cloud_storage_gb?: number | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_duration_minutes?: number | null
          max_participants?: number
          name: string
          price_monthly?: number
          price_yearly?: number | null
          updated_at?: string | null
        }
        Update: {
          cloud_storage_gb?: number | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_duration_minutes?: number | null
          max_participants?: number
          name?: string
          price_monthly?: number
          price_yearly?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      usage_logs: {
        Row: {
          created_at: string | null
          duration_minutes: number | null
          event_type: string
          features_used: Json | null
          id: string
          meeting_id: string | null
          metadata: Json | null
          participant_count: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          duration_minutes?: number | null
          event_type: string
          features_used?: Json | null
          id?: string
          meeting_id?: string | null
          metadata?: Json | null
          participant_count?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          duration_minutes?: number | null
          event_type?: string
          features_used?: Json | null
          id?: string
          meeting_id?: string | null
          metadata?: Json | null
          participant_count?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usage_logs_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          display_name: string | null
          id: string
          onboarding_completed: boolean | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          id: string
          onboarding_completed?: boolean | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          onboarding_completed?: boolean | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          billing_cycle: string
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string
          current_period_start: string
          id: string
          plan_id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          billing_cycle?: string
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end: string
          current_period_start?: string
          id?: string
          plan_id: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          billing_cycle?: string
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string
          current_period_start?: string
          id?: string
          plan_id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      webrtc_signals: {
        Row: {
          created_at: string | null
          from_user_id: string | null
          id: string
          meeting_id: string | null
          signal_data: Json
          signal_type: string
          to_user_id: string | null
        }
        Insert: {
          created_at?: string | null
          from_user_id?: string | null
          id?: string
          meeting_id?: string | null
          signal_data: Json
          signal_type: string
          to_user_id?: string | null
        }
        Update: {
          created_at?: string | null
          from_user_id?: string | null
          id?: string
          meeting_id?: string | null
          signal_data?: Json
          signal_type?: string
          to_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webrtc_signals_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      award_achievement: {
        Args: {
          p_achievement_type: string
          p_description: string
          p_points?: number
          p_title: string
          p_user_id: string
        }
        Returns: string
      }
      check_meeting_limits: {
        Args: { p_meeting_id: string; p_user_id: string }
        Returns: Json
      }
      get_meeting_stats: { Args: { meeting_uuid: string }; Returns: Json }
      increment: {
        Args: { column_name: string; row_id: string; table_name: string }
        Returns: undefined
      }
      increment_article_views: {
        Args: { article_uuid: string }
        Returns: undefined
      }
      increment_downloads: { Args: { content_id: string }; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
