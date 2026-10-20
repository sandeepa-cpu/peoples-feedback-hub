/** Row and insert shapes for `public.feedbacks` — aligned with supabase/feedbacks_table.sql */

export type FeedbackRow = {
  id: string;
  created_at: string;
  rating: number;
  message: string;
  name: string | null;
  phone_number: string | null;
  item_category: string | null;
  service_type: string | null;
  shop_location: string | null;
  quick_tags: string | null;
};

export type FeedbackInsert = {
  rating: number;
  message: string;
  name?: string | null;
  phone_number?: string | null;
  item_category?: string | null;
  service_type?: string | null;
  shop_location?: string | null;
  quick_tags?: string | null;
};

export type FeedbackUpdate = Partial<FeedbackInsert>;

export type Database = {
  public: {
    Tables: {
      feedbacks: {
        Row: FeedbackRow;
        Insert: FeedbackInsert;
        Update: FeedbackUpdate;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
