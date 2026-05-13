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
      cart_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      cities: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          cancelled_at: string | null
          completed_at: string | null
          confirmed_at: string | null
          created_at: string
          id: string
          order_id: string
          price: number
          product_id: string
          quantity: number
          shop_id: string
          status: string
          status_updated_at: string
        }
        Insert: {
          cancelled_at?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          id?: string
          order_id: string
          price: number
          product_id: string
          quantity: number
          shop_id?: string
          status?: string
          status_updated_at?: string
        }
        Update: {
          cancelled_at?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          id?: string
          order_id?: string
          price?: number
          product_id?: string
          quantity?: number
          shop_id?: string
          status?: string
          status_updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          checkout_source: string
          created_at: string
          id: string
          payment_method: string
          payment_status: string
          platform_fee: number
          status: string
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          checkout_source?: string
          created_at?: string
          id?: string
          payment_method?: string
          payment_status?: string
          platform_fee?: number
          status?: string
          total_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          checkout_source?: string
          created_at?: string
          id?: string
          payment_method?: string
          payment_status?: string
          platform_fee?: number
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          image_search_embedding: string | null
          is_active: boolean
          price: number
          search_embedding: string | null
          shop_id: string
          stock_quantity: number
          title: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          image_search_embedding?: string | null
          is_active?: boolean
          price: number
          search_embedding?: string | null
          shop_id: string
          stock_quantity?: number
          title: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          image_search_embedding?: string | null
          is_active?: boolean
          price?: number
          search_embedding?: string | null
          shop_id?: string
          stock_quantity?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          created_at: string
          id: string
          image_url: string
          is_primary: boolean
          position: number
          product_id: string
          storage_path: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          is_primary?: boolean
          position?: number
          product_id: string
          storage_path?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          is_primary?: boolean
          position?: number
          product_id?: string
          storage_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_pickup_locations: {
        Row: {
          address: string
          confirmed_at: string
          created_at: string
          latitude: number
          longitude: number
          osm_display_name: string | null
          osm_place_id: string | null
          pickup_instructions: string | null
          pickup_window: string | null
          shop_id: string
          updated_at: string
        }
        Insert: {
          address: string
          confirmed_at?: string
          created_at?: string
          latitude: number
          longitude: number
          osm_display_name?: string | null
          osm_place_id?: string | null
          pickup_instructions?: string | null
          pickup_window?: string | null
          shop_id: string
          updated_at?: string
        }
        Update: {
          address?: string
          confirmed_at?: string
          created_at?: string
          latitude?: number
          longitude?: number
          osm_display_name?: string | null
          osm_place_id?: string | null
          pickup_instructions?: string | null
          pickup_window?: string | null
          shop_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_pickup_locations_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: true
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_ai_credits: {
        Row: {
          balance: number
          lifetime_purchased: number
          lifetime_used: number
          seller_profile_id: string
          updated_at: string
        }
        Insert: {
          balance?: number
          lifetime_purchased?: number
          lifetime_used?: number
          seller_profile_id: string
          updated_at?: string
        }
        Update: {
          balance?: number
          lifetime_purchased?: number
          lifetime_used?: number
          seller_profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_ai_credits_seller_profile_id_fkey"
            columns: ["seller_profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_credit_purchases: {
        Row: {
          amount_paise: number
          created_at: string
          credited_at: string | null
          credits: number
          currency: string
          id: string
          pack_id: string
          provider: string
          provider_order_id: string | null
          provider_payment_id: string | null
          seller_profile_id: string
          status: string
          updated_at: string
        }
        Insert: {
          amount_paise: number
          created_at?: string
          credited_at?: string | null
          credits: number
          currency?: string
          id?: string
          pack_id: string
          provider?: string
          provider_order_id?: string | null
          provider_payment_id?: string | null
          seller_profile_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount_paise?: number
          created_at?: string
          credited_at?: string | null
          credits?: number
          currency?: string
          id?: string
          pack_id?: string
          provider?: string
          provider_order_id?: string | null
          provider_payment_id?: string | null
          seller_profile_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_credit_purchases_seller_profile_id_fkey"
            columns: ["seller_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_enhancement_jobs: {
        Row: {
          completed_at: string | null
          cost_credits: number
          created_at: string
          error_message: string | null
          id: string
          provider: string
          refunded_at: string | null
          seller_profile_id: string
          shop_id: string | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          cost_credits?: number
          created_at?: string
          error_message?: string | null
          id?: string
          provider?: string
          refunded_at?: string | null
          seller_profile_id: string
          shop_id?: string | null
          status?: string
        }
        Update: {
          completed_at?: string | null
          cost_credits?: number
          created_at?: string
          error_message?: string | null
          id?: string
          provider?: string
          refunded_at?: string | null
          seller_profile_id?: string
          shop_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_enhancement_jobs_seller_profile_id_fkey"
            columns: ["seller_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_enhancement_jobs_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_webhook_events: {
        Row: {
          event_type: string
          id: string
          processed_at: string
          provider: string
        }
        Insert: {
          event_type: string
          id: string
          processed_at?: string
          provider?: string
        }
        Update: {
          event_type?: string
          id?: string
          processed_at?: string
          provider?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      shops: {
        Row: {
          city_id: string | null
          created_at: string
          description: string | null
          id: string
          logo_url: string | null
          name: string
          seller_profile_id: string
          updated_at: string
        }
        Insert: {
          city_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          seller_profile_id: string
          updated_at?: string
        }
        Update: {
          city_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          seller_profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shops_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shops_seller_profile_id_fkey"
            columns: ["seller_profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlists: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_shop_wishlist_count: {
        Args: {
          p_shop_id: string
        }
        Returns: number
      }
      get_seller_ai_credit_balance: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      reserve_ai_enhancement_credit: {
        Args: {
          p_shop_id: string
        }
        Returns: string
      }
      complete_ai_enhancement_job: {
        Args: {
          p_job_id: string
        }
        Returns: undefined
      }
      refund_ai_enhancement_credit: {
        Args: {
          p_job_id: string
          p_error_message?: string | null
        }
        Returns: undefined
      }
      grant_ai_credits_for_paid_purchase: {
        Args: {
          p_purchase_id: string
          p_provider_payment_id: string
        }
        Returns: undefined
      }
      search_marketplace_products: {
        Args: {
          p_query_embedding: string
          p_category_id?: string | null
          p_max_price?: number | null
          p_prefer_cheap?: boolean
          p_match_count?: number
        }
        Returns: {
          id: string
          title: string
          description: string | null
          price: number
          image_url: string | null
          stock_quantity: number
          shop_name: string
          similarity: number
        }[]
      }
      search_marketplace_products_fuzzy: {
        Args: {
          p_search: string
          p_category_id?: string | null
          p_max_price?: number | null
          p_prefer_cheap?: boolean
          p_match_count?: number
        }
        Returns: {
          id: string
          title: string
          description: string | null
          price: number
          image_url: string | null
          stock_quantity: number
          shop_name: string
          similarity: number
        }[]
      }
      get_seller_order_items: {
        Args: {
          p_shop_id: string
        }
        Returns: {
          id: string
          quantity: number
          price: number
          status: string
          status_updated_at: string
          confirmed_at: string | null
          completed_at: string | null
          cancelled_at: string | null
          product_id: string
          product_title: string
          shop_id: string
          shop_name: string
          pickup_address: string | null
          pickup_latitude: number | null
          pickup_longitude: number | null
          pickup_window: string | null
          pickup_instructions: string | null
          order_id: string
          buyer_user_id: string
          payment_method: string
          payment_status: string
          order_status: string
          ordered_at: string
          order_total_amount: number
        }[]
      }
      get_buyer_order_items: {
        Args: Record<PropertyKey, never>
        Returns: {
          order_id: string
          order_user_id: string
          total_amount: number
          payment_method: string
          payment_status: string
          checkout_source: string
          platform_fee: number
          order_status: string
          order_created_at: string
          order_updated_at: string
          order_item_id: string
          quantity: number
          price: number
          item_status: string
          item_status_updated_at: string
          shop_id: string
          shop_name: string
          product_title: string
          pickup_address: string | null
          pickup_latitude: number | null
          pickup_longitude: number | null
          pickup_window: string | null
          pickup_instructions: string | null
        }[]
      }
      set_order_item_fulfillment_defaults: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      sync_order_status_from_items: {
        Args: {
          p_order_id: string
        }
        Returns: undefined
      }
      sync_order_status_from_items_trigger: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      get_shop_cart_quantity: {
        Args: {
          p_shop_id: string
        }
        Returns: number
      }
      place_cart_cod_order: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      place_direct_cod_order: {
        Args: {
          p_product_id: string
          p_quantity: number
        }
        Returns: string
      }
      seller_can_update_order_item_status: {
        Args: {
          p_order_item_id: string
        }
        Returns: boolean
      }
      update_seller_order_item_status: {
        Args: {
          p_order_item_id: string
          p_status: string
        }
        Returns: boolean
      }
    }
    Enums: {
      user_role: "buyer" | "seller" | "admin"
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
      user_role: ["buyer", "seller", "admin"],
    },
  },
} as const
