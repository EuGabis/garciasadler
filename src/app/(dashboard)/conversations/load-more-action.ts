"use server";

import { auth } from "@/auth";
import { listConversations, type ConversationListItem } from "@/lib/conversations";

export type LoadMoreResult =
  | { ok: true; items: ConversationListItem[]; hasMore: boolean }
  | { ok: false; error: string };

/**
 * Carrega o proximo batch de conversas pra scroll infinito da inbox.
 * Chamada pelo cliente quando o sentinel bottom entra no viewport.
 */
export async function loadMoreConversationsAction(input: {
  offset: number;
  limit: number;
  mineOnly: boolean;
}): Promise<LoadMoreResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Não autenticado." };

  const offset = Math.max(0, Math.floor(input.offset));
  const limit = Math.max(1, Math.min(200, Math.floor(input.limit)));

  const { items, hasMore } = await listConversations(session.user.workspaceId, {
    assignedToUserId: input.mineOnly ? session.user.id : undefined,
    offset,
    limit,
  });

  return { ok: true, items, hasMore };
}
