import { notFound } from "next/navigation";
import Link from "next/link";
import { Check, CheckCheck, Clock, AlertCircle, ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getConversationWithMessages, markConversationRead } from "@/lib/conversations";
import { formatTime, formatPhone } from "@/lib/format";
import { MessageForm } from "./message-form";
import { MediaBubble } from "./media-bubble";
import { LabelPicker, AttachedLabels } from "./label-picker";
import { AssignPicker, AssignedBadges } from "./assign-picker";
import { ContactPanel } from "./contact-panel";
import { AiBadge } from "./ai-badge";
import { avatarColor, avatarInitial } from "@/lib/avatar-color";

function StatusIcon({ status, muted = false }: { status: string; muted?: boolean }) {
  const cls = muted ? "text-stone-500" : "text-stone-400";
  if (status === "read") return <CheckCheck className={`h-3 w-3 text-sky-500`} />;
  if (status === "delivered") return <CheckCheck className={`h-3 w-3 ${cls}`} />;
  if (status === "sent") return <Check className={`h-3 w-3 ${cls}`} />;
  if (status === "pending") return <Clock className={`h-3 w-3 ${cls}`} />;
  if (status === "failed") return <AlertCircle className="h-3 w-3 text-red-500" />;
  return null;
}

export const dynamic = "force-dynamic";

type Params = { id: string };

export default async function ConversationPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const session = await auth();
  const conversation = await getConversationWithMessages(session!.user.workspaceId, id);
  if (!conversation) notFound();

  if (conversation.unreadCount > 0) {
    await markConversationRead(session!.user.workspaceId, conversation.id);
  }

  const [availableLabels, quickReplies, team, otherConversations] = await Promise.all([
    prisma.label.findMany({
      where: { workspaceId: session!.user.workspaceId },
      select: { id: true, name: true, color: true },
      orderBy: { name: "asc" },
    }),
    prisma.quickReply.findMany({
      where: { workspaceId: session!.user.workspaceId },
      select: { id: true, title: true, content: true },
      orderBy: { title: "asc" },
    }),
    prisma.user.findMany({
      where: { workspaceId: session!.user.workspaceId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.conversation.findMany({
      where: {
        contactId: conversation.contact.id,
        workspaceId: session!.user.workspaceId,
        id: { not: conversation.id },
      },
      orderBy: { lastMessageAt: { sort: "desc", nulls: "last" } },
      select: { id: true, status: true, lastMessage: true, lastMessageAt: true },
      take: 10,
    }),
  ]);
  const attachedLabels = conversation.labels.map((l) => l.label);
  const assignedUsers = conversation.assignments.map((a) => a.user);

  const headerAvatar = avatarColor(conversation.contact.name);

  // Status como dot color mais discreta (sem pill uppercase)
  const statusDot =
    conversation.status === "open"
      ? "bg-emerald-500"
      : conversation.status === "resolved"
      ? "bg-stone-400"
      : "bg-amber-500";
  const statusLabel =
    conversation.status === "open" ? "Aberta" : conversation.status === "resolved" ? "Resolvida" : "Pendente";

  return (
    <div className="h-full w-full flex-1 flex relative min-w-0">
      <div className="flex-1 min-w-0 flex flex-col bg-stone-50 dark:bg-stone-950">
        {/* HEADER — 2 rows: identidade + toolbar */}
        <header className="border-b border-stone-200/60 dark:border-stone-800/60 bg-white/70 dark:bg-stone-900/70 backdrop-blur-sm px-3 md:px-6 py-3">
          <div className="flex items-center gap-2 md:gap-3">
            <Link
              href="/conversations"
              className="md:hidden p-1.5 -ml-1 rounded-md text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors shrink-0"
              aria-label="Voltar para conversas"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>

            <div
              className={`h-9 w-9 md:h-10 md:w-10 rounded-full ring-1 text-sm font-semibold flex items-center justify-center shrink-0 ${headerAvatar.bg} ${headerAvatar.text} ${headerAvatar.ring}`}
            >
              {avatarInitial(conversation.contact.name)}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 min-w-0">
                <p className="text-[14px] font-semibold truncate text-stone-900 dark:text-stone-50 tracking-tight">
                  {conversation.contact.name}
                </p>
                <span className="inline-flex items-center gap-1 text-[11px] text-stone-500 shrink-0">
                  <span className={`inline-block h-1.5 w-1.5 rounded-full ${statusDot}`} />
                  {statusLabel}
                </span>
              </div>
              <p className="text-[12px] text-stone-500 tabular-nums truncate">
                {formatPhone(conversation.contact.phone)}
              </p>
            </div>

            <div className="flex items-center gap-1">
              <AssignPicker
                conversationId={conversation.id}
                assigned={assignedUsers}
                team={team}
              />
              <LabelPicker
                conversationId={conversation.id}
                attached={attachedLabels}
                available={availableLabels}
              />
              <AiBadge conversationId={conversation.id} enabled={conversation.aiEnabled} />
            </div>
          </div>

          {(attachedLabels.length > 0 || assignedUsers.length > 0) && (
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              {assignedUsers.length > 0 && (
                <AssignedBadges conversationId={conversation.id} assigned={assignedUsers} />
              )}
              {attachedLabels.length > 0 && (
                <AttachedLabels conversationId={conversation.id} labels={attachedLabels} />
              )}
            </div>
          )}
        </header>

        {/* TIMELINE — coluna centralizada com padding generoso */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-3 md:px-6 py-6 md:py-8 space-y-3">
            {conversation.messages.length === 0 ? (
              <div className="text-center text-sm text-stone-500 py-16">
                Nenhuma mensagem ainda.
              </div>
            ) : (
              conversation.messages.map((m) => {
                const isInbound = m.direction === "inbound";
                const isTool = m.role === "tool";
                if (isTool) return null;
                if (m.role === "assistant" && !m.content?.trim()) return null;

                return (
                  <div
                    key={m.id}
                    className={`flex ${isInbound ? "justify-start" : "justify-end"}`}
                  >
                    <div className="max-w-[78%] group">
                      <div
                        className={
                          isInbound
                            ? "rounded-2xl rounded-tl-md px-3.5 py-2.5 text-[13.5px] leading-relaxed bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 ring-1 ring-stone-200/80 dark:ring-stone-800/60"
                            : "rounded-2xl rounded-tr-md px-3.5 py-2.5 text-[13.5px] leading-relaxed bg-stone-100 dark:bg-stone-800/70 text-stone-900 dark:text-stone-100 border-r-2 border-brand-500/70"
                        }
                      >
                        <MediaBubble
                          messageId={m.id}
                          type={m.type}
                          content={m.content}
                          hasMedia={m.type !== "text" && m.type !== "location"}
                          mediaUrl={m.mediaUrl}
                          fileName={m.fileName}
                          transcript={m.transcript}
                          variant={isInbound ? "inbound" : "outbound"}
                        />
                      </div>
                      {/* Meta OUT do balão, embaixo, minimal — sem status inline no chat body */}
                      <div
                        className={`mt-1 flex items-center gap-1.5 text-[10.5px] text-stone-400 dark:text-stone-500 px-1 ${
                          isInbound ? "justify-start" : "justify-end"
                        }`}
                      >
                        {!isInbound && m.sender?.name && (
                          <>
                            <span className="font-medium">{m.sender.name}</span>
                            <span>·</span>
                          </>
                        )}
                        <span className="tabular-nums">{formatTime(m.createdAt)}</span>
                        {!isInbound && (
                          <StatusIcon status={m.status} muted />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <MessageForm conversationId={conversation.id} quickReplies={quickReplies} />
      </div>

      <ContactPanel
        contact={{
          id: conversation.contact.id,
          name: conversation.contact.name,
          phone: conversation.contact.phone,
          email: conversation.contact.email,
          notes: conversation.contact.notes,
          productInterest: conversation.contact.productInterest,
          source: conversation.contact.source,
          status: conversation.contact.status,
          createdAt: conversation.contact.createdAt,
        }}
        conversationId={conversation.id}
        otherConversations={otherConversations}
      />
    </div>
  );
}
