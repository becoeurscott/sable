import { asUser } from '../config/db.js';

export interface ConversationRow {
  id: string;
  organization_id: string;
  user_id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export interface MessageRow {
  id: string;
  conversation_id: string;
  organization_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

export async function getOrCreateConversation(
  userId: string,
  orgId: string,
  conversationId: string | undefined,
  title: string,
): Promise<ConversationRow> {
  return asUser(userId, async (c) => {
    if (conversationId) {
      const found = await c.query<ConversationRow>(
        `SELECT * FROM public.ai_conversations WHERE id = $1`,
        [conversationId],
      );
      if (found.rows[0]) return found.rows[0];
    }
    const res = await c.query<ConversationRow>(
      `INSERT INTO public.ai_conversations (organization_id, user_id, title)
       VALUES ($1,$2,$3) RETURNING *`,
      [orgId, userId, title.slice(0, 120)],
    );
    return res.rows[0]!;
  });
}

export async function addMessage(
  userId: string,
  orgId: string,
  conversationId: string,
  role: MessageRow['role'],
  content: string,
): Promise<MessageRow> {
  return asUser(userId, async (c) => {
    const res = await c.query<MessageRow>(
      `INSERT INTO public.ai_messages (conversation_id, organization_id, role, content)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [conversationId, orgId, role, content],
    );
    await c.query(`UPDATE public.ai_conversations SET updated_at = now() WHERE id = $1`, [
      conversationId,
    ]);
    return res.rows[0]!;
  });
}

export async function listMessages(userId: string, conversationId: string): Promise<MessageRow[]> {
  return asUser(userId, async (c) => {
    const res = await c.query<MessageRow>(
      `SELECT * FROM public.ai_messages WHERE conversation_id = $1 ORDER BY created_at ASC`,
      [conversationId],
    );
    return res.rows;
  });
}

export async function listConversations(userId: string, orgId: string): Promise<ConversationRow[]> {
  return asUser(userId, async (c) => {
    const res = await c.query<ConversationRow>(
      `SELECT * FROM public.ai_conversations WHERE organization_id = $1 AND user_id = $2
        ORDER BY updated_at DESC LIMIT 50`,
      [orgId, userId],
    );
    return res.rows;
  });
}
