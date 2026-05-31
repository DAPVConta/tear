export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      attendance_records: {
        Row: {
          absence_reason: string | null;
          attachment_path: string | null;
          authorization_id: number | null;
          billable_absence: boolean;
          clinic_id: number;
          created_at: string;
          evolution_id: number | null;
          guardian_ack_method: string | null;
          guardian_signature: boolean;
          id: number;
          is_private: boolean;
          justification: string | null;
          notified_in_time: boolean | null;
          patient_id: number;
          professional_id: number;
          session_date: string;
          status: Database["public"]["Enums"]["attendance_status"];
        };
        Insert: {
          absence_reason?: string | null;
          attachment_path?: string | null;
          authorization_id?: number | null;
          billable_absence?: boolean;
          clinic_id: number;
          created_at?: string;
          evolution_id?: number | null;
          guardian_ack_method?: string | null;
          guardian_signature?: boolean;
          id?: never;
          is_private?: boolean;
          justification?: string | null;
          notified_in_time?: boolean | null;
          patient_id: number;
          professional_id: number;
          session_date: string;
          status: Database["public"]["Enums"]["attendance_status"];
        };
        Update: {
          absence_reason?: string | null;
          attachment_path?: string | null;
          authorization_id?: number | null;
          billable_absence?: boolean;
          clinic_id?: number;
          created_at?: string;
          evolution_id?: number | null;
          guardian_ack_method?: string | null;
          guardian_signature?: boolean;
          id?: never;
          is_private?: boolean;
          justification?: string | null;
          notified_in_time?: boolean | null;
          patient_id?: number;
          professional_id?: number;
          session_date?: string;
          status?: Database["public"]["Enums"]["attendance_status"];
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          action: string;
          clinic_id: number | null;
          created_at: string;
          id: number;
          ip_address: string | null;
          new_values: Json | null;
          old_values: Json | null;
          record_id: number | null;
          table_name: string;
          user_id: string | null;
        };
        Insert: {
          action: string;
          clinic_id?: number | null;
          created_at?: string;
          id?: never;
          ip_address?: string | null;
          new_values?: Json | null;
          old_values?: Json | null;
          record_id?: number | null;
          table_name: string;
          user_id?: string | null;
        };
        Update: {
          action?: string;
          clinic_id?: number | null;
          created_at?: string;
          id?: never;
          ip_address?: string | null;
          new_values?: Json | null;
          old_values?: Json | null;
          record_id?: number | null;
          table_name?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      authorizations: {
        Row: {
          authorization_date: string;
          authorized_quantity: number;
          clinic_id: number;
          created_at: string;
          created_by: string | null;
          expiration_date: string;
          guide_number: string;
          id: number;
          observations: string | null;
          patient_id: number;
          procedure_code: string;
          procedure_name: string;
          specialty: Database["public"]["Enums"]["specialty"];
          status: Database["public"]["Enums"]["authorization_status"];
          updated_at: string;
          used_quantity: number;
        };
        Insert: {
          authorization_date: string;
          authorized_quantity: number;
          clinic_id: number;
          created_at?: string;
          created_by?: string | null;
          expiration_date: string;
          guide_number: string;
          id?: never;
          observations?: string | null;
          patient_id: number;
          procedure_code: string;
          procedure_name: string;
          specialty: Database["public"]["Enums"]["specialty"];
          status?: Database["public"]["Enums"]["authorization_status"];
          updated_at?: string;
          used_quantity?: number;
        };
        Update: {
          authorization_date?: string;
          authorized_quantity?: number;
          clinic_id?: number;
          created_at?: string;
          created_by?: string | null;
          expiration_date?: string;
          guide_number?: string;
          id?: never;
          observations?: string | null;
          patient_id?: number;
          procedure_code?: string;
          procedure_name?: string;
          specialty?: Database["public"]["Enums"]["specialty"];
          status?: Database["public"]["Enums"]["authorization_status"];
          updated_at?: string;
          used_quantity?: number;
        };
        Relationships: [];
      };
      clinic_members: {
        Row: {
          active: boolean;
          clinic_id: number;
          created_at: string;
          id: number;
          invited_at: string;
          joined_at: string | null;
          role: Database["public"]["Enums"]["member_role"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          active?: boolean;
          clinic_id: number;
          created_at?: string;
          id?: never;
          invited_at?: string;
          joined_at?: string | null;
          role: Database["public"]["Enums"]["member_role"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          active?: boolean;
          clinic_id?: number;
          created_at?: string;
          id?: never;
          invited_at?: string;
          joined_at?: string | null;
          role?: Database["public"]["Enums"]["member_role"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      clinics: {
        Row: {
          active: boolean;
          address: string | null;
          city: string | null;
          cnpj: string;
          created_at: string;
          email: string;
          id: number;
          logo_url: string | null;
          max_patients: number;
          max_professionals: number;
          name: string;
          phone: string | null;
          plan: Database["public"]["Enums"]["clinic_plan"];
          plan_status: Database["public"]["Enums"]["clinic_plan_status"];
          state: string | null;
          theme: Json;
          trade_name: string | null;
          trial_ends_at: string | null;
          updated_at: string;
          zip_code: string | null;
        };
        Insert: {
          active?: boolean;
          address?: string | null;
          city?: string | null;
          cnpj: string;
          created_at?: string;
          email: string;
          id?: never;
          logo_url?: string | null;
          max_patients?: number;
          max_professionals?: number;
          name: string;
          phone?: string | null;
          plan?: Database["public"]["Enums"]["clinic_plan"];
          plan_status?: Database["public"]["Enums"]["clinic_plan_status"];
          state?: string | null;
          theme?: Json;
          trade_name?: string | null;
          trial_ends_at?: string | null;
          updated_at?: string;
          zip_code?: string | null;
        };
        Update: {
          active?: boolean;
          address?: string | null;
          city?: string | null;
          cnpj?: string;
          created_at?: string;
          email?: string;
          id?: never;
          logo_url?: string | null;
          max_patients?: number;
          max_professionals?: number;
          name?: string;
          phone?: string | null;
          plan?: Database["public"]["Enums"]["clinic_plan"];
          plan_status?: Database["public"]["Enums"]["clinic_plan_status"];
          state?: string | null;
          theme?: Json;
          trade_name?: string | null;
          trial_ends_at?: string | null;
          updated_at?: string;
          zip_code?: string | null;
        };
        Relationships: [];
      };
      corrections: {
        Row: {
          clinic_id: number;
          created_at: string;
          created_by: string | null;
          created_by_name: string | null;
          description: string;
          id: number;
          images: string[];
          link: string | null;
          status: Database["public"]["Enums"]["correction_status"];
          updated_at: string;
        };
        Insert: {
          clinic_id: number;
          created_at?: string;
          created_by?: string | null;
          created_by_name?: string | null;
          description: string;
          id?: never;
          images?: string[];
          link?: string | null;
          status?: Database["public"]["Enums"]["correction_status"];
          updated_at?: string;
        };
        Update: {
          clinic_id?: number;
          created_at?: string;
          created_by?: string | null;
          created_by_name?: string | null;
          description?: string;
          id?: never;
          images?: string[];
          link?: string | null;
          status?: Database["public"]["Enums"]["correction_status"];
          updated_at?: string;
        };
        Relationships: [];
      };
      daily_evolutions: {
        Row: {
          addendum: Json | null;
          attendance_type: Database["public"]["Enums"]["attendance_type"];
          authorization_id: number | null;
          behavioral_intervention: string | null;
          behavioral_notes: string | null;
          clinic_id: number;
          created_at: string;
          created_by: string | null;
          digital_signature: Json | null;
          end_time: string;
          evolution_assessment: Database["public"]["Enums"]["evolution_assessment"];
          goals_worked: Json;
          guardian_presence_validation: boolean;
          guardian_validation_method:
            | Database["public"]["Enums"]["guardian_validation_method"]
            | null;
          id: number;
          incidents: string | null;
          is_private: boolean;
          locked: boolean;
          locked_at: string | null;
          next_session_plan: string;
          parent_feedback: Json | null;
          patient_id: number;
          plan_id: number | null;
          professional_id: number;
          professional_signature: boolean;
          prompting_level: Database["public"]["Enums"]["prompting_level"];
          session_date: string;
          session_duration_minutes: number;
          session_summary: string;
          signed_at: string | null;
          skills_worked: Json;
          start_time: string;
          updated_at: string;
        };
        Insert: {
          addendum?: Json | null;
          attendance_type: Database["public"]["Enums"]["attendance_type"];
          authorization_id?: number | null;
          behavioral_intervention?: string | null;
          behavioral_notes?: string | null;
          clinic_id: number;
          created_at?: string;
          created_by?: string | null;
          digital_signature?: Json | null;
          end_time: string;
          evolution_assessment: Database["public"]["Enums"]["evolution_assessment"];
          goals_worked?: Json;
          guardian_presence_validation?: boolean;
          guardian_validation_method?:
            | Database["public"]["Enums"]["guardian_validation_method"]
            | null;
          id?: never;
          incidents?: string | null;
          is_private?: boolean;
          locked?: boolean;
          locked_at?: string | null;
          next_session_plan: string;
          parent_feedback?: Json | null;
          patient_id: number;
          plan_id?: number | null;
          professional_id: number;
          professional_signature?: boolean;
          prompting_level: Database["public"]["Enums"]["prompting_level"];
          session_date: string;
          session_duration_minutes: number;
          session_summary: string;
          signed_at?: string | null;
          skills_worked?: Json;
          start_time: string;
          updated_at?: string;
        };
        Update: {
          addendum?: Json | null;
          attendance_type?: Database["public"]["Enums"]["attendance_type"];
          authorization_id?: number | null;
          behavioral_intervention?: string | null;
          behavioral_notes?: string | null;
          clinic_id?: number;
          created_at?: string;
          created_by?: string | null;
          digital_signature?: Json | null;
          end_time?: string;
          evolution_assessment?: Database["public"]["Enums"]["evolution_assessment"];
          goals_worked?: Json;
          guardian_presence_validation?: boolean;
          guardian_validation_method?:
            | Database["public"]["Enums"]["guardian_validation_method"]
            | null;
          id?: never;
          incidents?: string | null;
          is_private?: boolean;
          locked?: boolean;
          locked_at?: string | null;
          next_session_plan?: string;
          parent_feedback?: Json | null;
          patient_id?: number;
          plan_id?: number | null;
          professional_id?: number;
          professional_signature?: boolean;
          prompting_level?: Database["public"]["Enums"]["prompting_level"];
          session_date?: string;
          session_duration_minutes?: number;
          session_summary?: string;
          signed_at?: string | null;
          skills_worked?: Json;
          start_time?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      monthly_evolutions: {
        Row: {
          approved: boolean;
          approved_at: string | null;
          clinic_id: number;
          conclusion: string | null;
          created_at: string;
          digital_signature: Json | null;
          generated_summary: string;
          goals_progress: Json;
          id: number;
          next_month_plan: string | null;
          patient_id: number;
          professional_id: number;
          professional_review: string | null;
          reference_month: number;
          reference_year: number;
          rejection_reason: string | null;
          reviewed_at: string | null;
          reviewer_id: number | null;
          reviewer_name: string | null;
          signed_at: string | null;
          submitted_at: string | null;
          total_absent: number;
          total_present: number;
          total_sessions: number;
          updated_at: string;
          workflow_status: Database["public"]["Enums"]["monthly_status"];
        };
        Insert: {
          approved?: boolean;
          approved_at?: string | null;
          clinic_id: number;
          conclusion?: string | null;
          created_at?: string;
          digital_signature?: Json | null;
          generated_summary: string;
          goals_progress?: Json;
          id?: never;
          next_month_plan?: string | null;
          patient_id: number;
          professional_id: number;
          professional_review?: string | null;
          reference_month: number;
          reference_year: number;
          rejection_reason?: string | null;
          reviewed_at?: string | null;
          reviewer_id?: number | null;
          reviewer_name?: string | null;
          signed_at?: string | null;
          submitted_at?: string | null;
          total_absent: number;
          total_present: number;
          total_sessions: number;
          updated_at?: string;
          workflow_status?: Database["public"]["Enums"]["monthly_status"];
        };
        Update: {
          approved?: boolean;
          approved_at?: string | null;
          clinic_id?: number;
          conclusion?: string | null;
          created_at?: string;
          digital_signature?: Json | null;
          generated_summary?: string;
          goals_progress?: Json;
          id?: never;
          next_month_plan?: string | null;
          patient_id?: number;
          professional_id?: number;
          professional_review?: string | null;
          reference_month?: number;
          reference_year?: number;
          rejection_reason?: string | null;
          reviewed_at?: string | null;
          reviewer_id?: number | null;
          reviewer_name?: string | null;
          signed_at?: string | null;
          submitted_at?: string | null;
          total_absent?: number;
          total_present?: number;
          total_sessions?: number;
          updated_at?: string;
          workflow_status?: Database["public"]["Enums"]["monthly_status"];
        };
        Relationships: [];
      };
      patients: {
        Row: {
          active: boolean;
          address: string | null;
          birth_date: string;
          cid10_primary: string;
          cid10_secondary: string | null;
          clinic_id: number;
          cpf: string | null;
          created_at: string;
          created_by: string | null;
          diagnosis: string | null;
          gender: Database["public"]["Enums"]["gender"];
          guardian_cpf: string;
          guardian_email: string | null;
          guardian_name: string;
          guardian_phone: string;
          health_plan_card: string | null;
          health_plan_name: string | null;
          id: number;
          name: string;
          payment_type: Database["public"]["Enums"]["payment_type"];
          report_crm: string | null;
          report_doctor: string | null;
          report_issue_date: string | null;
          report_path: string | null;
          report_validity_date: string | null;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          address?: string | null;
          birth_date: string;
          cid10_primary: string;
          cid10_secondary?: string | null;
          clinic_id: number;
          cpf?: string | null;
          created_at?: string;
          created_by?: string | null;
          diagnosis?: string | null;
          gender: Database["public"]["Enums"]["gender"];
          guardian_cpf: string;
          guardian_email?: string | null;
          guardian_name: string;
          guardian_phone: string;
          health_plan_card?: string | null;
          health_plan_name?: string | null;
          id?: never;
          name: string;
          payment_type?: Database["public"]["Enums"]["payment_type"];
          report_crm?: string | null;
          report_doctor?: string | null;
          report_issue_date?: string | null;
          report_path?: string | null;
          report_validity_date?: string | null;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          address?: string | null;
          birth_date?: string;
          cid10_primary?: string;
          cid10_secondary?: string | null;
          clinic_id?: number;
          cpf?: string | null;
          created_at?: string;
          created_by?: string | null;
          diagnosis?: string | null;
          gender?: Database["public"]["Enums"]["gender"];
          guardian_cpf?: string;
          guardian_email?: string | null;
          guardian_name?: string;
          guardian_phone?: string;
          health_plan_card?: string | null;
          health_plan_name?: string | null;
          id?: never;
          name?: string;
          payment_type?: Database["public"]["Enums"]["payment_type"];
          report_crm?: string | null;
          report_doctor?: string | null;
          report_issue_date?: string | null;
          report_path?: string | null;
          report_validity_date?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      professionals: {
        Row: {
          active: boolean;
          clinic_id: number;
          coordinator_specialty:
            | Database["public"]["Enums"]["specialty"]
            | null;
          council_number: string;
          council_state: string;
          council_type: string;
          cpf: string;
          created_at: string;
          created_by: string | null;
          email: string | null;
          id: number;
          is_at_supervisor: boolean;
          name: string;
          phone: string | null;
          specialty: Database["public"]["Enums"]["specialty"];
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          active?: boolean;
          clinic_id: number;
          coordinator_specialty?:
            | Database["public"]["Enums"]["specialty"]
            | null;
          council_number: string;
          council_state: string;
          council_type: string;
          cpf: string;
          created_at?: string;
          created_by?: string | null;
          email?: string | null;
          id?: never;
          is_at_supervisor?: boolean;
          name: string;
          phone?: string | null;
          specialty: Database["public"]["Enums"]["specialty"];
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          active?: boolean;
          clinic_id?: number;
          coordinator_specialty?:
            | Database["public"]["Enums"]["specialty"]
            | null;
          council_number?: string;
          council_state?: string;
          council_type?: string;
          cpf?: string;
          created_at?: string;
          created_by?: string | null;
          email?: string | null;
          id?: never;
          is_at_supervisor?: boolean;
          name?: string;
          phone?: string | null;
          specialty?: Database["public"]["Enums"]["specialty"];
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      professional_specialties: {
        Row: {
          clinic_id: number;
          created_at: string;
          id: number;
          professional_id: number;
          specialty: Database["public"]["Enums"]["specialty"];
        };
        Insert: {
          clinic_id: number;
          created_at?: string;
          id?: never;
          professional_id: number;
          specialty: Database["public"]["Enums"]["specialty"];
        };
        Update: {
          clinic_id?: number;
          created_at?: string;
          id?: never;
          professional_id?: number;
          specialty?: Database["public"]["Enums"]["specialty"];
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string | null;
          id: string;
          name: string | null;
          platform_role: Database["public"]["Enums"]["platform_role"];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          id: string;
          name?: string | null;
          platform_role?: Database["public"]["Enums"]["platform_role"];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          id?: string;
          name?: string | null;
          platform_role?: Database["public"]["Enums"]["platform_role"];
          updated_at?: string;
        };
        Relationships: [];
      };
      therapeutic_goals: {
        Row: {
          category: string;
          clinic_id: number;
          created_at: string;
          current_progress: number;
          description: string;
          id: number;
          plan_id: number;
          status: Database["public"]["Enums"]["goal_status"];
          target_criteria: string;
          updated_at: string;
        };
        Insert: {
          category: string;
          clinic_id: number;
          created_at?: string;
          current_progress?: number;
          description: string;
          id?: never;
          plan_id: number;
          status?: Database["public"]["Enums"]["goal_status"];
          target_criteria: string;
          updated_at?: string;
        };
        Update: {
          category?: string;
          clinic_id?: number;
          created_at?: string;
          current_progress?: number;
          description?: string;
          id?: never;
          plan_id?: number;
          status?: Database["public"]["Enums"]["goal_status"];
          target_criteria?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      therapeutic_plans: {
        Row: {
          clinic_id: number;
          created_at: string;
          created_by: string | null;
          end_date: string | null;
          frequency: string;
          general_objective: string;
          id: number;
          patient_id: number;
          professional_id: number;
          session_duration: number;
          start_date: string;
          status: Database["public"]["Enums"]["plan_status"];
          title: string;
          updated_at: string;
        };
        Insert: {
          clinic_id: number;
          created_at?: string;
          created_by?: string | null;
          end_date?: string | null;
          frequency: string;
          general_objective: string;
          id?: never;
          patient_id: number;
          professional_id: number;
          session_duration: number;
          start_date: string;
          status?: Database["public"]["Enums"]["plan_status"];
          title: string;
          updated_at?: string;
        };
        Update: {
          clinic_id?: number;
          created_at?: string;
          created_by?: string | null;
          end_date?: string | null;
          frequency?: string;
          general_objective?: string;
          id?: never;
          patient_id?: number;
          professional_id?: number;
          session_duration?: number;
          start_date?: string;
          status?: Database["public"]["Enums"]["plan_status"];
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      create_clinic: {
        Args: {
          p_cnpj: string;
          p_email: string;
          p_name: string;
          p_phone?: string;
          p_trade_name?: string;
        };
        Returns: Database["public"]["Tables"]["clinics"]["Row"];
      };
      is_clinic_admin: { Args: { cid: number }; Returns: boolean };
      is_clinic_member: { Args: { cid: number }; Returns: boolean };
      is_platform_admin: { Args: Record<string, never>; Returns: boolean };
      save_correction: {
        Args: {
          p_clinic_id: number;
          p_description: string;
          p_link?: string | null;
          p_images?: string[];
        };
        Returns: Database["public"]["Tables"]["corrections"]["Row"];
      };
    };
    Enums: {
      attendance_status:
        | "presente"
        | "falta_justificada"
        | "falta_injustificada"
        | "cancelado_clinica"
        | "cancelado_paciente";
      attendance_type:
        | "individual_presencial"
        | "individual_domiciliar"
        | "individual_escolar"
        | "grupo_presencial"
        | "devolutiva_pais";
      authorization_status: "ativa" | "vencida" | "cancelada" | "esgotada";
      clinic_plan: "trial" | "basic" | "professional" | "enterprise";
      clinic_plan_status: "active" | "past_due" | "canceled" | "trialing";
      correction_status: "aberto" | "em_andamento" | "resolvido" | "cancelado";
      evolution_assessment:
        | "evolucao_significativa"
        | "evolucao_leve"
        | "estavel"
        | "retrocesso_leve"
        | "retrocesso_significativo";
      gender: "masculino" | "feminino" | "outro";
      goal_status:
        | "em_andamento"
        | "adquirida"
        | "em_manutencao"
        | "descontinuada";
      guardian_validation_method: "assinatura_digital" | "token" | "presencial";
      member_role: "clinic_admin" | "therapist" | "receptionist";
      monthly_status:
        | "rascunho"
        | "pendente_aprovacao"
        | "ajustes_solicitados"
        | "aguardando_assinatura"
        | "assinada";
      payment_type: "operadora" | "particular";
      plan_status: "ativo" | "revisao" | "encerrado";
      platform_role: "member" | "platform_admin";
      prompting_level:
        | "fisica_total"
        | "fisica_parcial"
        | "gestual"
        | "verbal"
        | "independente";
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
        | "at_is";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database["public"];

export type Tables<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Row"];
export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Update"];
export type Enums<T extends keyof PublicSchema["Enums"]> =
  PublicSchema["Enums"][T];
