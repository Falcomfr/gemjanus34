export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: { extensions?: Json; operationName?: string; query?: string; variables?: Json };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string;
          actor_id: string | null;
          created_at: string;
          entity_id: string | null;
          entity_type: string;
          id: number;
          metadata: NonNullable<Json>;
        };
        Insert: {
          action: string;
          actor_id?: string | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type: string;
          id?: never;
          metadata?: NonNullable<Json>;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string;
          id?: never;
          metadata?: NonNullable<Json>;
        };
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      contact_messages: {
        Row: {
          created_at: string;
          email: string;
          handled_at: string | null;
          handled_by: string | null;
          id: string;
          message: string;
          name: string;
          subject: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          handled_at?: string | null;
          handled_by?: string | null;
          id?: string;
          message: string;
          name: string;
          subject: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          handled_at?: string | null;
          handled_by?: string | null;
          id?: string;
          message?: string;
          name?: string;
          subject?: string;
        };
        Relationships: [
          {
            foreignKeyName: "contact_messages_handled_by_fkey";
            columns: ["handled_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      documents: {
        Row: {
          category: string;
          created_at: string;
          created_by: string | null;
          description: string;
          document_date: string;
          id: string;
          storage_path: string | null;
          title: string;
          url: string;
        };
        Insert: {
          category: string;
          created_at?: string;
          created_by?: string | null;
          description: string;
          document_date: string;
          id?: string;
          storage_path?: string | null;
          title: string;
          url: string;
        };
        Update: {
          category?: string;
          created_at?: string;
          created_by?: string | null;
          description?: string;
          document_date?: string;
          id?: string;
          storage_path?: string | null;
          title?: string;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "documents_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      news: {
        Row: {
          content: NonNullable<Json>;
          created_at: string;
          created_by: string;
          ends_at: string | null;
          excerpt: string;
          featured: boolean;
          id: string;
          starts_at: string;
          status: Database["public"]["Enums"]["content_status"];
          title: string;
          updated_at: string;
          updated_by: string;
        };
        Insert: {
          content?: NonNullable<Json>;
          created_at?: string;
          created_by: string;
          ends_at?: string | null;
          excerpt: string;
          featured?: boolean;
          id?: string;
          starts_at: string;
          status?: Database["public"]["Enums"]["content_status"];
          title: string;
          updated_at?: string;
          updated_by: string;
        };
        Update: {
          content?: NonNullable<Json>;
          created_at?: string;
          created_by?: string;
          ends_at?: string | null;
          excerpt?: string;
          featured?: boolean;
          id?: string;
          starts_at?: string;
          status?: Database["public"]["Enums"]["content_status"];
          title?: string;
          updated_at?: string;
          updated_by?: string;
        };
        Relationships: [
          {
            foreignKeyName: "news_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "news_updated_by_fkey";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      page_revisions: {
        Row: {
          content: NonNullable<Json>;
          created_at: string;
          created_by: string;
          id: string;
          page_id: string;
          status: Database["public"]["Enums"]["content_status"];
          summary: string;
          title: string;
        };
        Insert: {
          content: NonNullable<Json>;
          created_at?: string;
          created_by: string;
          id?: string;
          page_id: string;
          status: Database["public"]["Enums"]["content_status"];
          summary: string;
          title: string;
        };
        Update: {
          content?: NonNullable<Json>;
          created_at?: string;
          created_by?: string;
          id?: string;
          page_id?: string;
          status?: Database["public"]["Enums"]["content_status"];
          summary?: string;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "page_revisions_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "page_revisions_page_id_fkey";
            columns: ["page_id"];
            isOneToOne: false;
            referencedRelation: "pages";
            referencedColumns: ["id"];
          },
        ];
      };
      pages: {
        Row: {
          content: NonNullable<Json>;
          created_at: string;
          created_by: string;
          id: string;
          navigation_position: number | null;
          parent_id: string | null;
          published_at: string | null;
          slug: string;
          status: Database["public"]["Enums"]["content_status"];
          summary: string;
          title: string;
          updated_at: string;
          updated_by: string;
        };
        Insert: {
          content?: NonNullable<Json>;
          created_at?: string;
          created_by: string;
          id?: string;
          navigation_position?: number | null;
          parent_id?: string | null;
          published_at?: string | null;
          slug: string;
          status?: Database["public"]["Enums"]["content_status"];
          summary?: string;
          title: string;
          updated_at?: string;
          updated_by: string;
        };
        Update: {
          content?: NonNullable<Json>;
          created_at?: string;
          created_by?: string;
          id?: string;
          navigation_position?: number | null;
          parent_id?: string | null;
          published_at?: string | null;
          slug?: string;
          status?: Database["public"]["Enums"]["content_status"];
          summary?: string;
          title?: string;
          updated_at?: string;
          updated_by?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pages_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pages_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "pages";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pages_updated_by_fkey";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      planning_days: {
        Row: {
          closes_at: string | null;
          day: number;
          opens_at: string | null;
          team: string;
        };
        Insert: {
          closes_at?: string | null;
          day: number;
          opens_at?: string | null;
          team?: string;
        };
        Update: {
          closes_at?: string | null;
          day?: number;
          opens_at?: string | null;
          team?: string;
        };
        Relationships: [];
      };
      planning_settings: {
        Row: {
          effective_from: string;
          id: number;
          note: string;
          updated_at: string;
        };
        Insert: {
          effective_from: string;
          id?: number;
          note?: string;
          updated_at?: string;
        };
        Update: {
          effective_from?: string;
          id?: number;
          note?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      planning_slots: {
        Row: {
          day: number;
          description: string;
          ends_at: string;
          family: string;
          id: string;
          leader: string;
          note: string;
          starts_at: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          day: number;
          description?: string;
          ends_at: string;
          family: string;
          id?: string;
          leader?: string;
          note?: string;
          starts_at: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          day?: number;
          description?: string;
          ends_at?: string;
          family?: string;
          id?: string;
          leader?: string;
          note?: string;
          starts_at?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "planning_slots_day_fkey";
            columns: ["day"];
            isOneToOne: false;
            referencedRelation: "planning_days";
            referencedColumns: ["day"];
          },
        ];
      };
      profiles: {
        Row: {
          active: boolean;
          created_at: string;
          display_name: string;
          id: string;
          notify_on_publish: boolean;
          role: Database["public"]["Enums"]["app_role"];
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          created_at?: string;
          display_name: string;
          id: string;
          notify_on_publish?: boolean;
          role?: Database["public"]["Enums"]["app_role"];
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          created_at?: string;
          display_name?: string;
          id?: string;
          notify_on_publish?: boolean;
          role?: Database["public"]["Enums"]["app_role"];
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      archive_news: { Args: { news_id: string }; Returns: undefined };
      current_app_role: {
        Args: Record<PropertyKey, never>;
        Returns: Database["public"]["Enums"]["app_role"];
      };
      is_active_editor: { Args: Record<PropertyKey, never>; Returns: boolean };
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
      is_valid_rich_content: { Args: { value: Json }; Returns: boolean };
      list_news_with_authors: {
        Args: Record<PropertyKey, never>;
        Returns: {
          author_display_name: string;
          id: string;
          starts_at: string;
          status: Database["public"]["Enums"]["content_status"];
          title: string;
          updated_at: string;
        }[];
      };
      publish_news: { Args: { news_id: string }; Returns: undefined };
      publish_page: { Args: { page_id: string }; Returns: undefined };
      restore_news: { Args: { news_id: string }; Returns: undefined };
      restore_page_revision: { Args: { revision_id: string }; Returns: undefined };
      update_published_news: {
        Args: {
          new_content: Json;
          new_ends_at: string;
          new_excerpt: string;
          new_featured: boolean;
          new_starts_at: string;
          new_title: string;
          news_id: string;
        };
        Returns: undefined;
      };
      update_published_page: {
        Args: { new_content: Json; new_summary: string; new_title: string; page_id: string };
        Returns: undefined;
      };
    };
    Enums: {
      app_role: "admin" | "editor";
      content_status: "draft" | "published" | "archived";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["admin", "editor"],
      content_status: ["draft", "published", "archived"],
    },
  },
} as const;
