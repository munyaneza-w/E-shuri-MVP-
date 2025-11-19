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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          created_at: string | null
          criteria: Json
          description: string | null
          icon: string | null
          id: string
          name: string
          points: number | null
        }
        Insert: {
          created_at?: string | null
          criteria: Json
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          points?: number | null
        }
        Update: {
          created_at?: string | null
          criteria?: Json
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          points?: number | null
        }
        Relationships: []
      }
      activity_logs: {
        Row: {
          activity_date: string
          activity_type: string
          created_at: string | null
          energy_points: number | null
          id: string
          student_id: string
        }
        Insert: {
          activity_date?: string
          activity_type: string
          created_at?: string | null
          energy_points?: number | null
          id?: string
          student_id: string
        }
        Update: {
          activity_date?: string
          activity_type?: string
          created_at?: string | null
          energy_points?: number | null
          id?: string
          student_id?: string
        }
        Relationships: []
      }
      assignment_submissions: {
        Row: {
          assignment_id: string
          created_at: string | null
          feedback: string | null
          file_paths: string[] | null
          grade: number | null
          graded_at: string | null
          graded_by: string | null
          id: string
          is_late: boolean | null
          status: string | null
          student_id: string
          submission_text: string | null
          submitted_at: string | null
          updated_at: string | null
        }
        Insert: {
          assignment_id: string
          created_at?: string | null
          feedback?: string | null
          file_paths?: string[] | null
          grade?: number | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          is_late?: boolean | null
          status?: string | null
          student_id: string
          submission_text?: string | null
          submitted_at?: string | null
          updated_at?: string | null
        }
        Update: {
          assignment_id?: string
          created_at?: string | null
          feedback?: string | null
          file_paths?: string[] | null
          grade?: number | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          is_late?: boolean | null
          status?: string | null
          student_id?: string
          submission_text?: string | null
          submitted_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignment_submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          allow_late_submission: boolean | null
          attachment_urls: string[] | null
          classroom_id: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          grading_type: string | null
          id: string
          instructions: string | null
          late_penalty_percentage: number | null
          points: number
          rubric: Json | null
          subject_id: string
          teacher_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          allow_late_submission?: boolean | null
          attachment_urls?: string[] | null
          classroom_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          grading_type?: string | null
          id?: string
          instructions?: string | null
          late_penalty_percentage?: number | null
          points?: number
          rubric?: Json | null
          subject_id: string
          teacher_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          allow_late_submission?: boolean | null
          attachment_urls?: string[] | null
          classroom_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          grading_type?: string | null
          id?: string
          instructions?: string | null
          late_penalty_percentage?: number | null
          points?: number
          rubric?: Json | null
          subject_id?: string
          teacher_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignments_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      cbc_standards: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          label: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          label: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          label?: string
        }
        Relationships: []
      }
      class_codes: {
        Row: {
          active: boolean | null
          classroom_id: string
          code: string
          created_at: string | null
          expires_at: string | null
          id: string
        }
        Insert: {
          active?: boolean | null
          classroom_id: string
          code: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
        }
        Update: {
          active?: boolean | null
          classroom_id?: string
          code?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_codes_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
        ]
      }
      classroom_teachers: {
        Row: {
          classroom_id: string
          created_at: string
          teacher_id: string
        }
        Insert: {
          classroom_id: string
          created_at?: string
          teacher_id: string
        }
        Update: {
          classroom_id?: string
          created_at?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "classroom_teachers_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classroom_teachers_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      classrooms: {
        Row: {
          class_code: string | null
          class_year: Database["public"]["Enums"]["class_year"]
          created_at: string
          id: string
          level: Database["public"]["Enums"]["level_type"]
          name: string
          school_id: string | null
        }
        Insert: {
          class_code?: string | null
          class_year: Database["public"]["Enums"]["class_year"]
          created_at?: string
          id?: string
          level: Database["public"]["Enums"]["level_type"]
          name: string
          school_id?: string | null
        }
        Update: {
          class_code?: string | null
          class_year?: Database["public"]["Enums"]["class_year"]
          created_at?: string
          id?: string
          level?: Database["public"]["Enums"]["level_type"]
          name?: string
          school_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classrooms_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      content: {
        Row: {
          book_cover_url: string | null
          content_text: string | null
          content_type: string
          content_url: string | null
          created_at: string
          description: string | null
          file_path: string | null
          id: string
          subject_id: string
          teacher_id: string
          title: string
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          book_cover_url?: string | null
          content_text?: string | null
          content_type: string
          content_url?: string | null
          created_at?: string
          description?: string | null
          file_path?: string | null
          id?: string
          subject_id: string
          teacher_id: string
          title: string
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          book_cover_url?: string | null
          content_text?: string | null
          content_type?: string
          content_url?: string | null
          created_at?: string
          description?: string | null
          file_path?: string | null
          id?: string
          subject_id?: string
          teacher_id?: string
          title?: string
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      content_progress: {
        Row: {
          completed: boolean | null
          completion_percentage: number | null
          content_id: string
          created_at: string | null
          id: string
          last_position: string | null
          progress_type: string
          student_id: string
          time_spent_seconds: number | null
          updated_at: string | null
        }
        Insert: {
          completed?: boolean | null
          completion_percentage?: number | null
          content_id: string
          created_at?: string | null
          id?: string
          last_position?: string | null
          progress_type: string
          student_id: string
          time_spent_seconds?: number | null
          updated_at?: string | null
        }
        Update: {
          completed?: boolean | null
          completion_percentage?: number | null
          content_id?: string
          created_at?: string | null
          id?: string
          last_position?: string | null
          progress_type?: string
          student_id?: string
          time_spent_seconds?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_progress_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          classroom_id: string
          enrolled_at: string
          student_id: string
        }
        Insert: {
          classroom_id: string
          enrolled_at?: string
          student_id: string
        }
        Update: {
          classroom_id?: string
          enrolled_at?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      item_cbc: {
        Row: {
          cbc_id: string
          item_id: string
        }
        Insert: {
          cbc_id: string
          item_id: string
        }
        Update: {
          cbc_id?: string
          item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_cbc_cbc_id_fkey"
            columns: ["cbc_id"]
            isOneToOne: false
            referencedRelation: "cbc_standards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_cbc_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
        ]
      }
      item_skills: {
        Row: {
          item_id: string
          skill_id: string
        }
        Insert: {
          item_id: string
          skill_id: string
        }
        Update: {
          item_id?: string
          skill_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_skills_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      mastery: {
        Row: {
          last_updated: string
          level: number
          skill_id: string
          student_id: string
        }
        Insert: {
          last_updated?: string
          level?: number
          skill_id: string
          student_id: string
        }
        Update: {
          last_updated?: string
          level?: number
          skill_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mastery_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mastery_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          link: string | null
          message: string
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          link?: string | null
          message: string
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          link?: string | null
          message?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          a_level_option: Database["public"]["Enums"]["a_level_option"] | null
          age: number | null
          avatar_url: string | null
          class_year: Database["public"]["Enums"]["class_year"] | null
          created_at: string
          current_streak: number | null
          energy_points: number | null
          full_name: string
          id: string
          language: string | null
          last_activity_date: string | null
          level: Database["public"]["Enums"]["level_type"] | null
          longest_streak: number | null
          school_id: string | null
          updated_at: string
        }
        Insert: {
          a_level_option?: Database["public"]["Enums"]["a_level_option"] | null
          age?: number | null
          avatar_url?: string | null
          class_year?: Database["public"]["Enums"]["class_year"] | null
          created_at?: string
          current_streak?: number | null
          energy_points?: number | null
          full_name: string
          id: string
          language?: string | null
          last_activity_date?: string | null
          level?: Database["public"]["Enums"]["level_type"] | null
          longest_streak?: number | null
          school_id?: string | null
          updated_at?: string
        }
        Update: {
          a_level_option?: Database["public"]["Enums"]["a_level_option"] | null
          age?: number | null
          avatar_url?: string | null
          class_year?: Database["public"]["Enums"]["class_year"] | null
          created_at?: string
          current_streak?: number | null
          energy_points?: number | null
          full_name?: string
          id?: string
          language?: string | null
          last_activity_date?: string | null
          level?: Database["public"]["Enums"]["level_type"] | null
          longest_streak?: number | null
          school_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_profiles_school"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          correct_answer: string
          created_at: string
          hints: Json | null
          id: string
          options: Json | null
          points: number
          question_text: string
          question_type: string
          quiz_id: string
          skill_id: string | null
        }
        Insert: {
          correct_answer: string
          created_at?: string
          hints?: Json | null
          id?: string
          options?: Json | null
          points?: number
          question_text: string
          question_type: string
          quiz_id: string
          skill_id?: string | null
        }
        Update: {
          correct_answer?: string
          created_at?: string
          hints?: Json | null
          id?: string
          options?: Json | null
          points?: number
          question_text?: string
          question_type?: string
          quiz_id?: string
          skill_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          answers: Json | null
          completed_at: string | null
          hints_used: number | null
          id: string
          max_score: number
          quiz_id: string
          score: number
          started_at: string
          student_id: string
          submission_file_path: string | null
        }
        Insert: {
          answers?: Json | null
          completed_at?: string | null
          hints_used?: number | null
          id?: string
          max_score: number
          quiz_id: string
          score?: number
          started_at?: string
          student_id: string
          submission_file_path?: string | null
        }
        Update: {
          answers?: Json | null
          completed_at?: string | null
          hints_used?: number | null
          id?: string
          max_score?: number
          quiz_id?: string
          score?: number
          started_at?: string
          student_id?: string
          submission_file_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          created_at: string
          deadline: string | null
          description: string | null
          id: string
          quiz_type: string
          subject_id: string
          teacher_id: string
          time_limit_minutes: number | null
          title: string
        }
        Insert: {
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          quiz_type?: string
          subject_id: string
          teacher_id: string
          time_limit_minutes?: number | null
          title: string
        }
        Update: {
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          quiz_type?: string
          subject_id?: string
          teacher_id?: string
          time_limit_minutes?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quizzes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          created_at: string
          district: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          district?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          district?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      skills: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          label: string
          subject_id: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          label: string
          subject_id: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          label?: string
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skills_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      student_achievements: {
        Row: {
          achievement_id: string
          id: string
          student_id: string
          unlocked_at: string | null
        }
        Insert: {
          achievement_id: string
          id?: string
          student_id: string
          unlocked_at?: string | null
        }
        Update: {
          achievement_id?: string
          id?: string
          student_id?: string
          unlocked_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      student_courses: {
        Row: {
          certificate_url: string | null
          completed: boolean | null
          completed_at: string | null
          enrolled_at: string
          id: string
          progress: number | null
          student_id: string
          subject_id: string
        }
        Insert: {
          certificate_url?: string | null
          completed?: boolean | null
          completed_at?: string | null
          enrolled_at?: string
          id?: string
          progress?: number | null
          student_id: string
          subject_id: string
        }
        Update: {
          certificate_url?: string | null
          completed?: boolean | null
          completed_at?: string | null
          enrolled_at?: string
          id?: string
          progress?: number | null
          student_id?: string
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_courses_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_courses_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          level: string | null
          name: string
          year_level: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          level?: string | null
          name: string
          year_level?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          level?: string | null
          name?: string
          year_level?: string | null
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          id: string
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      teacher_subjects: {
        Row: {
          subject_id: string
          teacher_id: string
        }
        Insert: {
          subject_id: string
          teacher_id: string
        }
        Update: {
          subject_id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_subjects_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          class_year: Database["public"]["Enums"]["class_year"]
          created_at: string
          description: string | null
          id: string
          subject_id: string
          title: string
          unit_number: number
          updated_at: string
        }
        Insert: {
          class_year: Database["public"]["Enums"]["class_year"]
          created_at?: string
          description?: string | null
          id?: string
          subject_id: string
          title: string
          unit_number: number
          updated_at?: string
        }
        Update: {
          class_year?: Database["public"]["Enums"]["class_year"]
          created_at?: string
          description?: string | null
          id?: string
          subject_id?: string
          title?: string
          unit_number?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "units_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      a_level_option: "PCB" | "PCM" | "MEG" | "HEG" | "HK" | "LKK"
      app_role: "admin" | "teacher" | "student"
      class_year: "S1" | "S2" | "S3" | "S4" | "S5"
      level_type: "O" | "A"
      user_role: "student" | "teacher"
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
    Enums: {
      a_level_option: ["PCB", "PCM", "MEG", "HEG", "HK", "LKK"],
      app_role: ["admin", "teacher", "student"],
      class_year: ["S1", "S2", "S3", "S4", "S5"],
      level_type: ["O", "A"],
      user_role: ["student", "teacher"],
    },
  },
} as const
