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
      event_transfers: {
        Row: {
          at: string
          by_user_id: string
          event_id: string
          from_host_id: string
          id: string
          to_host_id: string
        }
        Insert: {
          at?: string
          by_user_id: string
          event_id: string
          from_host_id: string
          id?: string
          to_host_id: string
        }
        Update: {
          at?: string
          by_user_id?: string
          event_id?: string
          from_host_id?: string
          id?: string
          to_host_id?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          capacity: number
          cover_image_url: string | null
          created_at: string
          description: string | null
          end_at: string
          hidden: boolean
          host_id: string
          id: string
          location_type: Database["public"]["Enums"]["location_type"]
          online_link: string | null
          pricing_type: string
          start_at: string
          status: Database["public"]["Enums"]["event_status"]
          timezone: string
          title: string
          venue_address: string | null
          visibility: Database["public"]["Enums"]["event_visibility"]
        }
        Insert: {
          capacity?: number
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          end_at: string
          hidden?: boolean
          host_id: string
          id?: string
          location_type?: Database["public"]["Enums"]["location_type"]
          online_link?: string | null
          pricing_type?: string
          start_at: string
          status?: Database["public"]["Enums"]["event_status"]
          timezone?: string
          title: string
          venue_address?: string | null
          visibility?: Database["public"]["Enums"]["event_visibility"]
        }
        Update: {
          capacity?: number
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          end_at?: string
          hidden?: boolean
          host_id?: string
          id?: string
          location_type?: Database["public"]["Enums"]["location_type"]
          online_link?: string | null
          pricing_type?: string
          start_at?: string
          status?: Database["public"]["Enums"]["event_status"]
          timezone?: string
          title?: string
          venue_address?: string | null
          visibility?: Database["public"]["Enums"]["event_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "events_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "hosts"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          comment: string | null
          created_at: string
          event_id: string
          id: string
          rating: number
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          event_id: string
          id?: string
          rating: number
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          event_id?: string
          id?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_photos: {
        Row: {
          created_at: string
          event_id: string
          hidden: boolean
          id: string
          image_url: string
          status: Database["public"]["Enums"]["gallery_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          hidden?: boolean
          id?: string
          image_url: string
          status?: Database["public"]["Enums"]["gallery_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          hidden?: boolean
          id?: string
          image_url?: string
          status?: Database["public"]["Enums"]["gallery_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gallery_photos_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      host_members: {
        Row: {
          created_at: string
          host_id: string
          id: string
          invite_email: string | null
          invite_token: string | null
          role: Database["public"]["Enums"]["host_member_role"]
          user_id: string | null
        }
        Insert: {
          created_at?: string
          host_id: string
          id?: string
          invite_email?: string | null
          invite_token?: string | null
          role: Database["public"]["Enums"]["host_member_role"]
          user_id?: string | null
        }
        Update: {
          created_at?: string
          host_id?: string
          id?: string
          invite_email?: string | null
          invite_token?: string | null
          role?: Database["public"]["Enums"]["host_member_role"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "host_members_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "hosts"
            referencedColumns: ["id"]
          },
        ]
      }
      hosts: {
        Row: {
          bio: string | null
          contact_email: string | null
          created_at: string
          id: string
          logo_url: string | null
          name: string
          owner_user_id: string
        }
        Insert: {
          bio?: string | null
          contact_email?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          owner_user_id: string
        }
        Update: {
          bio?: string | null
          contact_email?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          owner_user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          id: string
          name: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id: string
          name?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          id: string
          reason: string | null
          reportable_id: string
          reportable_type: Database["public"]["Enums"]["reportable_type"]
          reporter_user_id: string
          status: Database["public"]["Enums"]["report_status"]
        }
        Insert: {
          created_at?: string
          id?: string
          reason?: string | null
          reportable_id: string
          reportable_type: Database["public"]["Enums"]["reportable_type"]
          reporter_user_id: string
          status?: Database["public"]["Enums"]["report_status"]
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string | null
          reportable_id?: string
          reportable_type?: Database["public"]["Enums"]["reportable_type"]
          reporter_user_id?: string
          status?: Database["public"]["Enums"]["report_status"]
        }
        Relationships: []
      }
      rsvps: {
        Row: {
          cancelled_at: string | null
          created_at: string
          event_id: string
          id: string
          status: Database["public"]["Enums"]["rsvp_status"]
          user_id: string
          waitlist_position: number | null
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string
          event_id: string
          id?: string
          status: Database["public"]["Enums"]["rsvp_status"]
          user_id: string
          waitlist_position?: number | null
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string
          event_id?: string
          id?: string
          status?: Database["public"]["Enums"]["rsvp_status"]
          user_id?: string
          waitlist_position?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          checked_in_at: string | null
          checked_in_by_user_id: string | null
          created_at: string
          id: string
          rsvp_id: string
          ticket_code: string
        }
        Insert: {
          checked_in_at?: string | null
          checked_in_by_user_id?: string | null
          created_at?: string
          id?: string
          rsvp_id: string
          ticket_code?: string
        }
        Update: {
          checked_in_at?: string | null
          checked_in_by_user_id?: string | null
          created_at?: string
          id?: string
          rsvp_id?: string
          ticket_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_rsvp_id_fkey"
            columns: ["rsvp_id"]
            isOneToOne: true
            referencedRelation: "rsvps"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_host_invite: { Args: { _token: string }; Returns: string }
      cancel_rsvp: { Args: { _rsvp_id: string }; Returns: undefined }
      check_in_ticket: {
        Args: { _code: string; _event_id: string }
        Returns: {
          attendee_name: string
          message: string
          status: string
          ticket_id: string
        }[]
      }
      create_rsvp: {
        Args: { _event_id: string }
        Returns: {
          rsvp_id: string
          status: Database["public"]["Enums"]["rsvp_status"]
          ticket_code: string
          waitlist_position: number
        }[]
      }
      gen_ticket_code: { Args: never; Returns: string }
      get_invite_preview: {
        Args: { _token: string }
        Returns: {
          host_id: string
          host_name: string
          role: Database["public"]["Enums"]["host_member_role"]
        }[]
      }
      is_host_member: {
        Args: {
          _host_id: string
          _role?: Database["public"]["Enums"]["host_member_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_host_owner: {
        Args: { _host_id: string; _user_id: string }
        Returns: boolean
      }
      undo_check_in: { Args: { _ticket_id: string }; Returns: undefined }
    }
    Enums: {
      event_status: "draft" | "published"
      event_visibility: "public" | "unlisted"
      gallery_status: "pending" | "approved" | "rejected"
      host_member_role: "host" | "checker"
      location_type: "physical" | "online"
      report_status: "open" | "reviewed"
      reportable_type: "event" | "photo"
      rsvp_status: "confirmed" | "waitlisted" | "cancelled"
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
      event_status: ["draft", "published"],
      event_visibility: ["public", "unlisted"],
      gallery_status: ["pending", "approved", "rejected"],
      host_member_role: ["host", "checker"],
      location_type: ["physical", "online"],
      report_status: ["open", "reviewed"],
      reportable_type: ["event", "photo"],
      rsvp_status: ["confirmed", "waitlisted", "cancelled"],
    },
  },
} as const
