import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type ChatConversation = Database["public"]["Tables"]["chat_conversations"]["Row"];
type ChatMessage = Database["public"]["Tables"]["chat_messages"]["Row"];
type HelpdeskArticle = Database["public"]["Tables"]["helpdesk_articles"]["Row"];

/**
 * Chatbot Service
 * Handles AI chatbot conversations and helpdesk knowledge base
 */
export const chatbotService = {
  /**
   * Create a new conversation
   */
  async createConversation(userId?: string, sessionId?: string) {
    // Generate a session ID if not provided
    const sid = sessionId || crypto.randomUUID();
    
    const { data, error } = await supabase
      .from("chat_conversations")
      .insert({
        user_id: userId || null, // Allow null for anonymous users
        session_id: sid,
        status: "active",
      })
      .select()
      .single();

    return { data, error };
  },

  /**
   * Get conversation by ID
   */
  async getConversation(conversationId: string): Promise<{ data: ChatConversation | null; error: any }> {
    const { data, error } = await supabase
      .from("chat_conversations")
      .select("*")
      .eq("id", conversationId)
      .single();

    return { data, error };
  },

  /**
   * Get user's conversations
   */
  async getUserConversations(userId: string): Promise<{ data: ChatConversation[] | null; error: any }> {
    const { data, error } = await supabase
      .from("chat_conversations")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    return { data, error };
  },

  /**
   * Add message to conversation
   */
  async addMessage(
    conversationId: string,
    senderType: "user" | "bot" | "support",
    messageText: string,
    metadata?: Record<string, any>
  ): Promise<{ data: ChatMessage | null; error: any }> {
    const { data, error } = await supabase
      .from("chat_messages")
      .insert({
        conversation_id: conversationId,
        sender_type: senderType,
        message_text: messageText,
        message_metadata: metadata || {},
      })
      .select()
      .single();

    // Update conversation timestamp
    await supabase
      .from("chat_conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId);

    return { data, error };
  },

  /**
   * Get conversation messages
   */
  async getMessages(conversationId: string): Promise<{ data: ChatMessage[] | null; error: any }> {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    return { data, error };
  },

  /**
   * Mark conversation as resolved
   */
  async resolveConversation(conversationId: string, rating?: number): Promise<{ error: any }> {
    const { error } = await supabase
      .from("chat_conversations")
      .update({
        status: "resolved",
        satisfaction_rating: rating || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", conversationId);

    return { error };
  },

  /**
   * Escalate to human support
   */
  async escalateConversation(conversationId: string, reason: string): Promise<{ error: any }> {
    const { error } = await supabase
      .from("chat_conversations")
      .update({
        status: "escalated",
        escalated_to_human: true,
        escalation_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq("id", conversationId);

    return { error };
  },

  /**
   * Mark message as helpful/not helpful
   */
  async rateMessage(messageId: string, isHelpful: boolean): Promise<{ error: any }> {
    const { error } = await supabase
      .from("chat_messages")
      .update({ is_helpful: isHelpful })
      .eq("id", messageId);

    return { error };
  },

  /**
   * Search knowledge base articles
   */
  async searchArticles(query: string, category?: string): Promise<{ data: HelpdeskArticle[] | null; error: any }> {
    let queryBuilder = supabase
      .from("helpdesk_articles")
      .select("*")
      .eq("is_published", true);

    if (category) {
      queryBuilder = queryBuilder.eq("category", category);
    }

    // Simple text search (can be improved with full-text search)
    queryBuilder = queryBuilder.or(`title.ilike.%${query}%,content.ilike.%${query}%`);

    const { data, error } = await queryBuilder.limit(5);

    return { data, error };
  },

  /**
   * Get article by ID
   */
  async getArticle(articleId: string): Promise<{ data: HelpdeskArticle | null; error: any }> {
    // Increment view count
    await supabase.rpc("increment_article_views", { article_uuid: articleId });

    const { data, error } = await supabase
      .from("helpdesk_articles")
      .select("*")
      .eq("id", articleId)
      .single();

    return { data, error };
  },

  /**
   * Get articles by category
   */
  async getArticlesByCategory(category: string): Promise<{ data: HelpdeskArticle[] | null; error: any }> {
    const { data, error } = await supabase
      .from("helpdesk_articles")
      .select("*")
      .eq("category", category)
      .eq("is_published", true)
      .order("helpful_count", { ascending: false });

    return { data, error };
  },

  /**
   * Rate article as helpful/not helpful
   */
  async rateArticle(articleId: string, isHelpful: boolean): Promise<{ error: any }> {
    const column = isHelpful ? "helpful_count" : "not_helpful_count";
    
    const { error } = await supabase.rpc("increment", {
      table_name: "helpdesk_articles",
      row_id: articleId,
      column_name: column,
    });

    return { error };
  },

  /**
   * Subscribe to conversation messages (real-time)
   */
  subscribeToMessages(conversationId: string, callback: (message: ChatMessage) => void) {
    const channel = supabase
      .channel(`chat_${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          callback(payload.new as ChatMessage);
        }
      )
      .subscribe();

    return {
      unsubscribe: () => {
        channel.unsubscribe();
      },
    };
  },
};