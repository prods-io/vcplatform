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
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          linkedin_url: string | null
          avatar_url: string | null
          bio: string | null
          role: "founder" | "admin"
          onboarding_completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          linkedin_url?: string | null
          avatar_url?: string | null
          bio?: string | null
          role?: "founder" | "admin"
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          linkedin_url?: string | null
          avatar_url?: string | null
          bio?: string | null
          role?: "founder" | "admin"
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      startups: {
        Row: {
          id: string
          founder_id: string
          name: string
          slug: string
          tagline: string | null
          description: string | null
          website: string | null
          logo_url: string | null
          sector: string[] | null
          stage: string | null
          location_city: string | null
          location_country: string | null
          founded_year: number | null
          team_size: string | null
          pitch_deck_url: string | null
          funding_raised: number | null
          funding_target: number | null
          is_public: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          founder_id: string
          name: string
          slug?: string
          tagline?: string | null
          description?: string | null
          website?: string | null
          logo_url?: string | null
          sector?: string[] | null
          stage?: string | null
          location_city?: string | null
          location_country?: string | null
          founded_year?: number | null
          team_size?: string | null
          pitch_deck_url?: string | null
          funding_raised?: number | null
          funding_target?: number | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          founder_id?: string
          name?: string
          slug?: string
          tagline?: string | null
          description?: string | null
          website?: string | null
          logo_url?: string | null
          sector?: string[] | null
          stage?: string | null
          location_city?: string | null
          location_country?: string | null
          founded_year?: number | null
          team_size?: string | null
          pitch_deck_url?: string | null
          funding_raised?: number | null
          funding_target?: number | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "startups_founder_id_fkey"
            columns: ["founder_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      vc_firms: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          type: string
          website: string | null
          linkedin_url: string | null
          twitter_url: string | null
          crunchbase_url: string | null
          logo_url: string | null
          headquarters: string | null
          founded_year: number | null
          fund_size: string | null
          sectors: string[]
          investment_stages: string[]
          geographies: string[]
          check_size_min: number | null
          check_size_max: number | null
          portfolio_count: number | null
          email: string | null
          is_active: boolean
          data_quality_score: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          type: string
          website?: string | null
          linkedin_url?: string | null
          twitter_url?: string | null
          crunchbase_url?: string | null
          logo_url?: string | null
          headquarters?: string | null
          founded_year?: number | null
          fund_size?: string | null
          sectors?: string[]
          investment_stages?: string[]
          geographies?: string[]
          check_size_min?: number | null
          check_size_max?: number | null
          portfolio_count?: number | null
          email?: string | null
          is_active?: boolean
          data_quality_score?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          type?: string
          website?: string | null
          linkedin_url?: string | null
          twitter_url?: string | null
          crunchbase_url?: string | null
          logo_url?: string | null
          headquarters?: string | null
          founded_year?: number | null
          fund_size?: string | null
          sectors?: string[]
          investment_stages?: string[]
          geographies?: string[]
          check_size_min?: number | null
          check_size_max?: number | null
          portfolio_count?: number | null
          email?: string | null
          is_active?: boolean
          data_quality_score?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      vc_partners: {
        Row: {
          id: string
          vc_firm_id: string
          name: string
          title: string | null
          email: string | null
          linkedin_url: string | null
          twitter_url: string | null
          avatar_url: string | null
          bio: string | null
          sectors_of_interest: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          vc_firm_id: string
          name: string
          title?: string | null
          email?: string | null
          linkedin_url?: string | null
          twitter_url?: string | null
          avatar_url?: string | null
          bio?: string | null
          sectors_of_interest?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          vc_firm_id?: string
          name?: string
          title?: string | null
          email?: string | null
          linkedin_url?: string | null
          twitter_url?: string | null
          avatar_url?: string | null
          bio?: string | null
          sectors_of_interest?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vc_partners_vc_firm_id_fkey"
            columns: ["vc_firm_id"]
            isOneToOne: false
            referencedRelation: "vc_firms"
            referencedColumns: ["id"]
          }
        ]
      }
      saved_vcs: {
        Row: {
          id: string
          user_id: string
          vc_firm_id: string
          status: "saved" | "contacted" | "in_conversation" | "passed"
          notes: string | null
          contacted_at: string | null
          response_received: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          vc_firm_id: string
          status?: "saved" | "contacted" | "in_conversation" | "passed"
          notes?: string | null
          contacted_at?: string | null
          response_received?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          vc_firm_id?: string
          status?: "saved" | "contacted" | "in_conversation" | "passed"
          notes?: string | null
          contacted_at?: string | null
          response_received?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_vcs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_vcs_vc_firm_id_fkey"
            columns: ["vc_firm_id"]
            isOneToOne: false
            referencedRelation: "vc_firms"
            referencedColumns: ["id"]
          }
        ]
      }
      pitch_deck_analyses: {
        Row: {
          id: string
          user_id: string
          startup_id: string | null
          file_name: string
          file_url: string | null
          extracted_text: string | null
          score: number | null
          strengths: string[] | null
          improvements: string[] | null
          missing_sections: string[] | null
          suggestions: Record<string, string> | null
          vc_readiness: string | null
          analysis_data: Record<string, unknown> | null
          analyzed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          startup_id?: string | null
          file_name: string
          file_url?: string | null
          extracted_text?: string | null
          score?: number | null
          strengths?: string[] | null
          improvements?: string[] | null
          missing_sections?: string[] | null
          suggestions?: Record<string, string> | null
          vc_readiness?: string | null
          analysis_data?: Record<string, unknown> | null
          analyzed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          startup_id?: string | null
          file_name?: string
          file_url?: string | null
          extracted_text?: string | null
          score?: number | null
          strengths?: string[] | null
          improvements?: string[] | null
          missing_sections?: string[] | null
          suggestions?: Record<string, string> | null
          vc_readiness?: string | null
          analysis_data?: Record<string, unknown> | null
          analyzed_at?: string | null
          created_at?: string
          updated_at?: string
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
      user_role: "founder" | "admin"
      vc_status: "saved" | "contacted" | "in_conversation" | "passed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"]
export type Startup = Database["public"]["Tables"]["startups"]["Row"]
export type VCFirm = Database["public"]["Tables"]["vc_firms"]["Row"]
export type VCPartner = Database["public"]["Tables"]["vc_partners"]["Row"]
export type SavedVC = Database["public"]["Tables"]["saved_vcs"]["Row"]
export type PitchDeckAnalysis = Database["public"]["Tables"]["pitch_deck_analyses"]["Row"]
