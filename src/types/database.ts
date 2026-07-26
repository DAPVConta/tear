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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      attendance_records: {
        Row: {
          absence_reason: string | null
          attachment_path: string | null
          authorization_id: number | null
          billable_absence: boolean
          clinic_id: number
          created_at: string
          evolution_id: number | null
          guardian_ack_method: string | null
          guardian_signature: boolean
          id: number
          is_private: boolean
          justification: string | null
          notified_in_time: boolean | null
          patient_id: number
          professional_id: number
          session_date: string
          status: Database["public"]["Enums"]["attendance_status"]
        }
        Insert: {
          absence_reason?: string | null
          attachment_path?: string | null
          authorization_id?: number | null
          billable_absence?: boolean
          clinic_id: number
          created_at?: string
          evolution_id?: number | null
          guardian_ack_method?: string | null
          guardian_signature?: boolean
          id?: never
          is_private?: boolean
          justification?: string | null
          notified_in_time?: boolean | null
          patient_id: number
          professional_id: number
          session_date: string
          status: Database["public"]["Enums"]["attendance_status"]
        }
        Update: {
          absence_reason?: string | null
          attachment_path?: string | null
          authorization_id?: number | null
          billable_absence?: boolean
          clinic_id?: number
          created_at?: string
          evolution_id?: number | null
          guardian_ack_method?: string | null
          guardian_signature?: boolean
          id?: never
          is_private?: boolean
          justification?: string | null
          notified_in_time?: boolean | null
          patient_id?: number
          professional_id?: number
          session_date?: string
          status?: Database["public"]["Enums"]["attendance_status"]
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_authorization_id_fkey"
            columns: ["authorization_id"]
            isOneToOne: false
            referencedRelation: "authorizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_evolution_id_fkey"
            columns: ["evolution_id"]
            isOneToOne: false
            referencedRelation: "daily_evolutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          clinic_id: number | null
          created_at: string
          id: number
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          record_id: number | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          clinic_id?: number | null
          created_at?: string
          id?: never
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: number | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          clinic_id?: number | null
          created_at?: string
          id?: never
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: number | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      authorizations: {
        Row: {
          authorization_date: string
          authorized_quantity: number
          clinic_id: number
          created_at: string
          created_by: string | null
          expiration_date: string
          guide_number: string
          id: number
          observations: string | null
          patient_id: number
          procedure_code: string
          procedure_name: string
          specialty: Database["public"]["Enums"]["specialty"]
          status: Database["public"]["Enums"]["authorization_status"]
          updated_at: string
          used_quantity: number
        }
        Insert: {
          authorization_date: string
          authorized_quantity: number
          clinic_id: number
          created_at?: string
          created_by?: string | null
          expiration_date: string
          guide_number: string
          id?: never
          observations?: string | null
          patient_id: number
          procedure_code: string
          procedure_name: string
          specialty: Database["public"]["Enums"]["specialty"]
          status?: Database["public"]["Enums"]["authorization_status"]
          updated_at?: string
          used_quantity?: number
        }
        Update: {
          authorization_date?: string
          authorized_quantity?: number
          clinic_id?: number
          created_at?: string
          created_by?: string | null
          expiration_date?: string
          guide_number?: string
          id?: never
          observations?: string | null
          patient_id?: number
          procedure_code?: string
          procedure_name?: string
          specialty?: Database["public"]["Enums"]["specialty"]
          status?: Database["public"]["Enums"]["authorization_status"]
          updated_at?: string
          used_quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "authorizations_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "authorizations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "authorizations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_ai_settings: {
        Row: {
          clinic_id: number
          openai_token: string | null
          updated_at: string
        }
        Insert: {
          clinic_id: number
          openai_token?: string | null
          updated_at?: string
        }
        Update: {
          clinic_id?: number
          openai_token?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_ai_settings_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: true
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_invites: {
        Row: {
          active: boolean
          clinic_id: number
          code: string
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: number
          role: Database["public"]["Enums"]["member_role"]
        }
        Insert: {
          active?: boolean
          clinic_id: number
          code: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: never
          role?: Database["public"]["Enums"]["member_role"]
        }
        Update: {
          active?: boolean
          clinic_id?: number
          code?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: never
          role?: Database["public"]["Enums"]["member_role"]
        }
        Relationships: [
          {
            foreignKeyName: "clinic_invites_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_invites_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_members: {
        Row: {
          active: boolean
          clinic_id: number
          created_at: string
          id: number
          invited_at: string
          joined_at: string | null
          role: Database["public"]["Enums"]["member_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          clinic_id: number
          created_at?: string
          id?: never
          invited_at?: string
          joined_at?: string | null
          role: Database["public"]["Enums"]["member_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          clinic_id?: number
          created_at?: string
          id?: never
          invited_at?: string
          joined_at?: string | null
          role?: Database["public"]["Enums"]["member_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_members_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clinics: {
        Row: {
          active: boolean
          address: string | null
          city: string | null
          cnpj: string
          created_at: string
          email: string
          id: number
          logo_url: string | null
          max_patients: number
          max_professionals: number
          name: string
          phone: string | null
          plan: Database["public"]["Enums"]["clinic_plan"]
          plan_status: Database["public"]["Enums"]["clinic_plan_status"]
          state: string | null
          status: Database["public"]["Enums"]["clinic_status"]
          theme: Json
          trade_name: string | null
          trial_ends_at: string | null
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          active?: boolean
          address?: string | null
          city?: string | null
          cnpj: string
          created_at?: string
          email: string
          id?: never
          logo_url?: string | null
          max_patients?: number
          max_professionals?: number
          name: string
          phone?: string | null
          plan?: Database["public"]["Enums"]["clinic_plan"]
          plan_status?: Database["public"]["Enums"]["clinic_plan_status"]
          state?: string | null
          status?: Database["public"]["Enums"]["clinic_status"]
          theme?: Json
          trade_name?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          active?: boolean
          address?: string | null
          city?: string | null
          cnpj?: string
          created_at?: string
          email?: string
          id?: never
          logo_url?: string | null
          max_patients?: number
          max_professionals?: number
          name?: string
          phone?: string | null
          plan?: Database["public"]["Enums"]["clinic_plan"]
          plan_status?: Database["public"]["Enums"]["clinic_plan_status"]
          state?: string | null
          status?: Database["public"]["Enums"]["clinic_status"]
          theme?: Json
          trade_name?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Relationships: []
      }
      corrections: {
        Row: {
          clinic_id: number
          created_at: string
          created_by: string | null
          created_by_name: string | null
          description: string
          id: number
          images: string[]
          link: string | null
          status: Database["public"]["Enums"]["correction_status"]
          updated_at: string
        }
        Insert: {
          clinic_id: number
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          description: string
          id?: never
          images?: string[]
          link?: string | null
          status?: Database["public"]["Enums"]["correction_status"]
          updated_at?: string
        }
        Update: {
          clinic_id?: number
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          description?: string
          id?: never
          images?: string[]
          link?: string | null
          status?: Database["public"]["Enums"]["correction_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "corrections_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "corrections_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_evolutions: {
        Row: {
          addendum: Json | null
          attendance_type: Database["public"]["Enums"]["attendance_type"]
          authorization_id: number | null
          behavioral_intervention: string | null
          behavioral_notes: string | null
          clicksign: Json | null
          clinic_id: number
          created_at: string
          created_by: string | null
          digital_signature: Json | null
          end_time: string
          evolution_assessment: Database["public"]["Enums"]["evolution_assessment"]
          goals_worked: Json
          guardian_presence_validation: boolean
          guardian_validation_method:
            | Database["public"]["Enums"]["guardian_validation_method"]
            | null
          id: number
          incidents: string | null
          is_confidential: boolean
          is_private: boolean
          locked: boolean
          locked_at: string | null
          next_session_plan: string
          parent_feedback: Json | null
          patient_id: number
          plan_id: number | null
          professional_id: number
          professional_signature: boolean
          prompting_level: Database["public"]["Enums"]["prompting_level"]
          session_date: string
          session_duration_minutes: number
          session_summary: string
          signed_at: string | null
          skills_worked: Json
          start_time: string
          structured_data: Json | null
          supervisor_id: number | null
          supervisor_signature: Json | null
          supervisor_signed_at: string | null
          updated_at: string
          validation_status:
            | Database["public"]["Enums"]["technical_validation_status"]
            | null
        }
        Insert: {
          addendum?: Json | null
          attendance_type: Database["public"]["Enums"]["attendance_type"]
          authorization_id?: number | null
          behavioral_intervention?: string | null
          behavioral_notes?: string | null
          clicksign?: Json | null
          clinic_id: number
          created_at?: string
          created_by?: string | null
          digital_signature?: Json | null
          end_time: string
          evolution_assessment: Database["public"]["Enums"]["evolution_assessment"]
          goals_worked?: Json
          guardian_presence_validation?: boolean
          guardian_validation_method?:
            | Database["public"]["Enums"]["guardian_validation_method"]
            | null
          id?: never
          incidents?: string | null
          is_confidential?: boolean
          is_private?: boolean
          locked?: boolean
          locked_at?: string | null
          next_session_plan: string
          parent_feedback?: Json | null
          patient_id: number
          plan_id?: number | null
          professional_id: number
          professional_signature?: boolean
          prompting_level: Database["public"]["Enums"]["prompting_level"]
          session_date: string
          session_duration_minutes: number
          session_summary: string
          signed_at?: string | null
          skills_worked?: Json
          start_time: string
          structured_data?: Json | null
          supervisor_id?: number | null
          supervisor_signature?: Json | null
          supervisor_signed_at?: string | null
          updated_at?: string
          validation_status?:
            | Database["public"]["Enums"]["technical_validation_status"]
            | null
        }
        Update: {
          addendum?: Json | null
          attendance_type?: Database["public"]["Enums"]["attendance_type"]
          authorization_id?: number | null
          behavioral_intervention?: string | null
          behavioral_notes?: string | null
          clicksign?: Json | null
          clinic_id?: number
          created_at?: string
          created_by?: string | null
          digital_signature?: Json | null
          end_time?: string
          evolution_assessment?: Database["public"]["Enums"]["evolution_assessment"]
          goals_worked?: Json
          guardian_presence_validation?: boolean
          guardian_validation_method?:
            | Database["public"]["Enums"]["guardian_validation_method"]
            | null
          id?: never
          incidents?: string | null
          is_confidential?: boolean
          is_private?: boolean
          locked?: boolean
          locked_at?: string | null
          next_session_plan?: string
          parent_feedback?: Json | null
          patient_id?: number
          plan_id?: number | null
          professional_id?: number
          professional_signature?: boolean
          prompting_level?: Database["public"]["Enums"]["prompting_level"]
          session_date?: string
          session_duration_minutes?: number
          session_summary?: string
          signed_at?: string | null
          skills_worked?: Json
          start_time?: string
          structured_data?: Json | null
          supervisor_id?: number | null
          supervisor_signature?: Json | null
          supervisor_signed_at?: string | null
          updated_at?: string
          validation_status?:
            | Database["public"]["Enums"]["technical_validation_status"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_evolutions_authorization_id_fkey"
            columns: ["authorization_id"]
            isOneToOne: false
            referencedRelation: "authorizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_evolutions_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_evolutions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_evolutions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_evolutions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "therapeutic_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_evolutions_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_evolutions_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      data_deletion_requests: {
        Row: {
          id: number
          notes: string | null
          processed_at: string | null
          processed_by: string | null
          reason: string | null
          requested_at: string
          status: Database["public"]["Enums"]["deletion_request_status"]
          user_email: string
          user_id: string
        }
        Insert: {
          id?: never
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          reason?: string | null
          requested_at?: string
          status?: Database["public"]["Enums"]["deletion_request_status"]
          user_email: string
          user_id: string
        }
        Update: {
          id?: never
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          reason?: string | null
          requested_at?: string
          status?: Database["public"]["Enums"]["deletion_request_status"]
          user_email?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_deletion_requests_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_deletion_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_evolutions: {
        Row: {
          approved: boolean
          approved_at: string | null
          clinic_id: number
          conclusion: string | null
          created_at: string
          digital_signature: Json | null
          generated_summary: string
          goals_progress: Json
          id: number
          next_month_plan: string | null
          patient_id: number
          professional_id: number
          professional_review: string | null
          reference_month: number
          reference_year: number
          rejection_reason: string | null
          reviewed_at: string | null
          reviewer_id: number | null
          reviewer_name: string | null
          signed_at: string | null
          submitted_at: string | null
          total_absent: number
          total_present: number
          total_sessions: number
          updated_at: string
          workflow_status: Database["public"]["Enums"]["monthly_status"]
        }
        Insert: {
          approved?: boolean
          approved_at?: string | null
          clinic_id: number
          conclusion?: string | null
          created_at?: string
          digital_signature?: Json | null
          generated_summary: string
          goals_progress?: Json
          id?: never
          next_month_plan?: string | null
          patient_id: number
          professional_id: number
          professional_review?: string | null
          reference_month: number
          reference_year: number
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewer_id?: number | null
          reviewer_name?: string | null
          signed_at?: string | null
          submitted_at?: string | null
          total_absent: number
          total_present: number
          total_sessions: number
          updated_at?: string
          workflow_status?: Database["public"]["Enums"]["monthly_status"]
        }
        Update: {
          approved?: boolean
          approved_at?: string | null
          clinic_id?: number
          conclusion?: string | null
          created_at?: string
          digital_signature?: Json | null
          generated_summary?: string
          goals_progress?: Json
          id?: never
          next_month_plan?: string | null
          patient_id?: number
          professional_id?: number
          professional_review?: string | null
          reference_month?: number
          reference_year?: number
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewer_id?: number | null
          reviewer_name?: string | null
          signed_at?: string | null
          submitted_at?: string | null
          total_absent?: number
          total_present?: number
          total_sessions?: number
          updated_at?: string
          workflow_status?: Database["public"]["Enums"]["monthly_status"]
        }
        Relationships: [
          {
            foreignKeyName: "monthly_evolutions_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_evolutions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_evolutions_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_evolutions_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          active: boolean
          address: string | null
          birth_date: string
          cid10_primary: string
          cid10_secondary: string | null
          cid11_primary: string | null
          cid11_secondary: string | null
          clinic_id: number
          cpf: string | null
          created_at: string
          created_by: string | null
          diagnosis: string | null
          gender: Database["public"]["Enums"]["gender"]
          guardian_cpf: string
          guardian_email: string | null
          guardian_name: string
          guardian_phone: string
          health_plan_card: string | null
          health_plan_name: string | null
          id: number
          liminar_number: string | null
          name: string
          payment_type: Database["public"]["Enums"]["payment_type"]
          report_crm: string | null
          report_doctor: string | null
          report_issue_date: string | null
          report_path: string | null
          report_validity_date: string | null
          therapies: Json
          updated_at: string
        }
        Insert: {
          active?: boolean
          address?: string | null
          birth_date: string
          cid10_primary: string
          cid10_secondary?: string | null
          cid11_primary?: string | null
          cid11_secondary?: string | null
          clinic_id: number
          cpf?: string | null
          created_at?: string
          created_by?: string | null
          diagnosis?: string | null
          gender: Database["public"]["Enums"]["gender"]
          guardian_cpf: string
          guardian_email?: string | null
          guardian_name: string
          guardian_phone: string
          health_plan_card?: string | null
          health_plan_name?: string | null
          id?: never
          liminar_number?: string | null
          name: string
          payment_type?: Database["public"]["Enums"]["payment_type"]
          report_crm?: string | null
          report_doctor?: string | null
          report_issue_date?: string | null
          report_path?: string | null
          report_validity_date?: string | null
          therapies?: Json
          updated_at?: string
        }
        Update: {
          active?: boolean
          address?: string | null
          birth_date?: string
          cid10_primary?: string
          cid10_secondary?: string | null
          cid11_primary?: string | null
          cid11_secondary?: string | null
          clinic_id?: number
          cpf?: string | null
          created_at?: string
          created_by?: string | null
          diagnosis?: string | null
          gender?: Database["public"]["Enums"]["gender"]
          guardian_cpf?: string
          guardian_email?: string | null
          guardian_name?: string
          guardian_phone?: string
          health_plan_card?: string | null
          health_plan_name?: string | null
          id?: never
          liminar_number?: string | null
          name?: string
          payment_type?: Database["public"]["Enums"]["payment_type"]
          report_crm?: string | null
          report_doctor?: string | null
          report_issue_date?: string | null
          report_path?: string | null
          report_validity_date?: string | null
          therapies?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patients_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patients_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_specialties: {
        Row: {
          clinic_id: number
          created_at: string
          id: number
          professional_id: number
          specialty: Database["public"]["Enums"]["specialty"]
        }
        Insert: {
          clinic_id: number
          created_at?: string
          id?: never
          professional_id: number
          specialty: Database["public"]["Enums"]["specialty"]
        }
        Update: {
          clinic_id?: number
          created_at?: string
          id?: never
          professional_id?: number
          specialty?: Database["public"]["Enums"]["specialty"]
        }
        Relationships: [
          {
            foreignKeyName: "professional_specialties_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_specialties_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      professionals: {
        Row: {
          active: boolean
          clinic_id: number
          coordinator_specialty: Database["public"]["Enums"]["specialty"] | null
          council_number: string
          council_state: string
          council_type: string
          cpf: string
          created_at: string
          created_by: string | null
          email: string | null
          id: number
          is_at_supervisor: boolean
          name: string
          phone: string | null
          signature_path: string | null
          specialty: Database["public"]["Enums"]["specialty"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          active?: boolean
          clinic_id: number
          coordinator_specialty?:
            | Database["public"]["Enums"]["specialty"]
            | null
          council_number: string
          council_state: string
          council_type: string
          cpf: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: never
          is_at_supervisor?: boolean
          name: string
          phone?: string | null
          signature_path?: string | null
          specialty: Database["public"]["Enums"]["specialty"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          active?: boolean
          clinic_id?: number
          coordinator_specialty?:
            | Database["public"]["Enums"]["specialty"]
            | null
          council_number?: string
          council_state?: string
          council_type?: string
          cpf?: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: never
          is_at_supervisor?: boolean
          name?: string
          phone?: string | null
          signature_path?: string | null
          specialty?: Database["public"]["Enums"]["specialty"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professionals_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professionals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professionals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string | null
          platform_role: Database["public"]["Enums"]["platform_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          name?: string | null
          platform_role?: Database["public"]["Enums"]["platform_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          platform_role?: Database["public"]["Enums"]["platform_role"]
          updated_at?: string
        }
        Relationships: []
      }
      therapeutic_goals: {
        Row: {
          category: string
          clinic_id: number
          created_at: string
          current_progress: number
          description: string
          id: number
          plan_id: number
          status: Database["public"]["Enums"]["goal_status"]
          target_criteria: string
          updated_at: string
        }
        Insert: {
          category: string
          clinic_id: number
          created_at?: string
          current_progress?: number
          description: string
          id?: never
          plan_id: number
          status?: Database["public"]["Enums"]["goal_status"]
          target_criteria: string
          updated_at?: string
        }
        Update: {
          category?: string
          clinic_id?: number
          created_at?: string
          current_progress?: number
          description?: string
          id?: never
          plan_id?: number
          status?: Database["public"]["Enums"]["goal_status"]
          target_criteria?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "therapeutic_goals_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "therapeutic_goals_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "therapeutic_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      therapeutic_plans: {
        Row: {
          clinic_id: number
          created_at: string
          created_by: string | null
          end_date: string | null
          frequency: string
          general_objective: string
          id: number
          patient_id: number
          professional_id: number
          session_duration: number
          start_date: string
          status: Database["public"]["Enums"]["plan_status"]
          title: string
          updated_at: string
        }
        Insert: {
          clinic_id: number
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          frequency: string
          general_objective: string
          id?: never
          patient_id: number
          professional_id: number
          session_duration: number
          start_date: string
          status?: Database["public"]["Enums"]["plan_status"]
          title: string
          updated_at?: string
        }
        Update: {
          clinic_id?: number
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          frequency?: string
          general_objective?: string
          id?: never
          patient_id?: number
          professional_id?: number
          session_duration?: number
          start_date?: string
          status?: Database["public"]["Enums"]["plan_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "therapeutic_plans_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "therapeutic_plans_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "therapeutic_plans_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "therapeutic_plans_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      clinic_members_overview: {
        Args: { p_clinic_id: number }
        Returns: {
          active: boolean
          email: string
          invited_at: string
          joined_at: string
          member_id: number
          name: string
          role: Database["public"]["Enums"]["member_role"]
          user_id: string
        }[]
      }
      create_clinic: {
        Args: {
          p_cnpj: string
          p_email: string
          p_name: string
          p_phone?: string
          p_trade_name?: string
        }
        Returns: {
          active: boolean
          address: string | null
          city: string | null
          cnpj: string
          created_at: string
          email: string
          id: number
          logo_url: string | null
          max_patients: number
          max_professionals: number
          name: string
          phone: string | null
          plan: Database["public"]["Enums"]["clinic_plan"]
          plan_status: Database["public"]["Enums"]["clinic_plan_status"]
          state: string | null
          theme: Json
          trade_name: string | null
          trial_ends_at: string | null
          updated_at: string
          zip_code: string | null
        }
        SetofOptions: {
          from: "*"
          to: "clinics"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_clinic_invite: {
        Args: {
          p_clinic_id: number
          p_expires_days?: number
          p_role?: Database["public"]["Enums"]["member_role"]
        }
        Returns: {
          active: boolean
          clinic_id: number
          code: string
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: number
          role: Database["public"]["Enums"]["member_role"]
        }
        SetofOptions: {
          from: "*"
          to: "clinic_invites"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      export_my_data: { Args: never; Returns: Json }
      is_clinic_admin: { Args: { cid: number }; Returns: boolean }
      is_clinic_member: { Args: { cid: number }; Returns: boolean }
      is_monthly_coordinator: {
        Args: { p_clinic: number; p_professional_id: number }
        Returns: boolean
      }
      is_platform_admin: { Args: never; Returns: boolean }
      is_psychologist_in_clinic: {
        Args: { target_clinic_id: number }
        Returns: boolean
      }
      platform_clinics_overview: {
        Args: never
        Returns: {
          active: boolean
          admin_count: number
          city: string | null
          cnpj: string
          created_at: string
          email: string
          id: number
          member_count: number
          name: string
          owner_email: string | null
          owner_name: string | null
          patient_count: number
          phone: string | null
          plan: Database["public"]["Enums"]["clinic_plan"]
          plan_status: Database["public"]["Enums"]["clinic_plan_status"]
          sessions_30d: number
          state: string | null
          status: Database["public"]["Enums"]["clinic_status"]
          trade_name: string | null
        }[]
      }
      redeem_clinic_invite: { Args: { p_code: string }; Returns: number }
      request_my_data_deletion: {
        Args: { p_reason?: string }
        Returns: {
          id: number
          notes: string | null
          processed_at: string | null
          processed_by: string | null
          reason: string | null
          requested_at: string
          status: Database["public"]["Enums"]["deletion_request_status"]
          user_email: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "data_deletion_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      save_correction: {
        Args: {
          p_clinic_id: number
          p_description: string
          p_images?: string[]
          p_link?: string
        }
        Returns: {
          clinic_id: number
          created_at: string
          created_by: string | null
          created_by_name: string | null
          description: string
          id: number
          images: string[]
          link: string | null
          status: Database["public"]["Enums"]["correction_status"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "corrections"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      save_plan_with_goals: {
        Args: {
          p_deleted_goal_ids: number[]
          p_goals: Json
          p_plan: Json
          p_plan_id: number
        }
        Returns: number
      }
    }
    Enums: {
      attendance_status:
        | "presente"
        | "falta_justificada"
        | "falta_injustificada"
        | "cancelado_clinica"
        | "cancelado_paciente"
      attendance_type:
        | "individual_presencial"
        | "individual_domiciliar"
        | "individual_escolar"
        | "grupo_presencial"
        | "devolutiva_pais"
      authorization_status: "ativa" | "vencida" | "cancelada" | "esgotada"
      clinic_plan: "trial" | "basic" | "professional" | "enterprise"
      clinic_plan_status: "active" | "past_due" | "canceled" | "trialing"
      clinic_status: "em_implantacao" | "ativa" | "suspensa" | "encerrada"
      correction_status: "aberto" | "em_andamento" | "resolvido" | "cancelado"
      deletion_request_status: "pending" | "processed" | "denied"
      evolution_assessment:
        | "evolucao_significativa"
        | "evolucao_leve"
        | "estavel"
        | "retrocesso_leve"
        | "retrocesso_significativo"
      gender: "masculino" | "feminino" | "outro"
      goal_status:
        | "em_andamento"
        | "adquirida"
        | "em_manutencao"
        | "descontinuada"
      guardian_validation_method: "assinatura_digital" | "token" | "presencial"
      member_role:
        | "clinic_admin"
        | "clinic_owner"
        | "therapist"
        | "receptionist"
      monthly_status:
        | "rascunho"
        | "pendente_aprovacao"
        | "ajustes_solicitados"
        | "aguardando_assinatura"
        | "assinada"
      payment_type: "operadora" | "particular" | "liminar"
      plan_status: "ativo" | "revisao" | "encerrado"
      platform_role: "member" | "platform_admin"
      prompting_level:
        | "fisica_total"
        | "fisica_parcial"
        | "gestual"
        | "verbal"
        | "independente"
      specialty:
        | "psicologia_aba"
        | "fonoaudiologia"
        | "terapia_ocupacional_is"
        | "terapia_ocupacional_avds"
        | "fisioterapia"
        | "psicopedagogia"
        | "musicoterapia"
        | "neuropsicologia"
        | "terapia_ocupacional"
        | "neuropediatria"
        | "psiquiatria"
        | "nutricao"
        | "psicomotricidade_funcional"
        | "psicomotricidade_relacional"
        | "aplicador_aba_domiciliar"
        | "aplicador_aba_escolar"
      technical_validation_status: "pendente_validacao" | "homologada"
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
      attendance_status: [
        "presente",
        "falta_justificada",
        "falta_injustificada",
        "cancelado_clinica",
        "cancelado_paciente",
      ],
      attendance_type: [
        "individual_presencial",
        "individual_domiciliar",
        "individual_escolar",
        "grupo_presencial",
        "devolutiva_pais",
      ],
      authorization_status: ["ativa", "vencida", "cancelada", "esgotada"],
      clinic_plan: ["trial", "basic", "professional", "enterprise"],
      clinic_plan_status: ["active", "past_due", "canceled", "trialing"],
      clinic_status: ["em_implantacao", "ativa", "suspensa", "encerrada"],
      correction_status: ["aberto", "em_andamento", "resolvido", "cancelado"],
      deletion_request_status: ["pending", "processed", "denied"],
      evolution_assessment: [
        "evolucao_significativa",
        "evolucao_leve",
        "estavel",
        "retrocesso_leve",
        "retrocesso_significativo",
      ],
      gender: ["masculino", "feminino", "outro"],
      goal_status: [
        "em_andamento",
        "adquirida",
        "em_manutencao",
        "descontinuada",
      ],
      guardian_validation_method: ["assinatura_digital", "token", "presencial"],
      member_role: [
        "clinic_admin",
        "clinic_owner",
        "therapist",
        "receptionist",
      ],
      monthly_status: [
        "rascunho",
        "pendente_aprovacao",
        "ajustes_solicitados",
        "aguardando_assinatura",
        "assinada",
      ],
      payment_type: ["operadora", "particular", "liminar"],
      plan_status: ["ativo", "revisao", "encerrado"],
      platform_role: ["member", "platform_admin"],
      prompting_level: [
        "fisica_total",
        "fisica_parcial",
        "gestual",
        "verbal",
        "independente",
      ],
      specialty: [
        "psicologia_aba",
        "fonoaudiologia",
        "terapia_ocupacional_is",
        "terapia_ocupacional_avds",
        "fisioterapia",
        "psicopedagogia",
        "musicoterapia",
        "neuropsicologia",
        "terapia_ocupacional",
        "neuropediatria",
        "psiquiatria",
        "nutricao",
        "psicomotricidade_funcional",
        "psicomotricidade_relacional",
        "aplicador_aba_domiciliar",
        "aplicador_aba_escolar",
      ],
      technical_validation_status: ["pendente_validacao", "homologada"],
    },
  },
} as const

