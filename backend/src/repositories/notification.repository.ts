import { asUser, query } from '../config/db.js';

export interface NotificationRow {
  id: string;
  organization_id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

/** Service context — notifications are system-generated events. */
export async function createNotification(input: {
  orgId: string;
  userId: string;
  type: string;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
}): Promise<void> {
  await query(
    `INSERT INTO public.notifications (organization_id, user_id, type, title, body, data)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [input.orgId, input.userId, input.type, input.title, input.body ?? null, JSON.stringify(input.data ?? {})],
  );
}

export async function listNotifications(userId: string, unreadOnly: boolean): Promise<NotificationRow[]> {
  return asUser(userId, async (c) => {
    const res = await c.query<NotificationRow>(
      `SELECT * FROM public.notifications
        WHERE user_id = $1 ${unreadOnly ? 'AND read_at IS NULL' : ''}
        ORDER BY created_at DESC LIMIT 100`,
      [userId],
    );
    return res.rows;
  });
}

export async function markRead(userId: string, id: string): Promise<number> {
  return asUser(userId, async (c) => {
    const res = await c.query(
      `UPDATE public.notifications SET read_at = now() WHERE id = $1 AND read_at IS NULL`,
      [id],
    );
    return res.rowCount ?? 0;
  });
}
