import { notFound } from "next/navigation";
import { Check, CheckCheck, Clock, AlertCircle } from "lucide-react";
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

function StatusIcon({ status }: { status: string }) {
  if (status === "read") return <CheckCheck className="h-3 w-3 text-sky-300" />;
  if (status === "delivered") return <CheckCheck className="h-3 w-3 text-white/60" />;
  if (status === "sent") return <Check className="h-3 w-3 text-white/60" />;
  if (status === "pending") return <Clock className="h-3 w-3 text-white/60" />;
  if (status === "failed") return <AlertCircle className="h-3 w-3 text-red-300" />;
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

  const statusColor =
    conversation.status === "open"
      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 ring-emerald-200/60 dark:ring-emerald-500/20"
      : conversation.status === "resolved"
      ? "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400 ring-stone-200/60 dark:ring-stone-700"
      : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 ring-amber-200/60 dark:ring-amber-500/20";

  return (
    <div className="h-full flex relative">
      <div className="flex-1 min-w-0 flex flex-col bg-stone-50 dark:bg-stone-950">
        <header className="border-b border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-stone-900 px-6 py-3">
          <div className="flex items-center gap-3">
            <div
              className={`h-10 w-10 rounded-full ring-1 text-sm font-semibold flex items-center justify-center ${headerAvatar.bg} ${headerAvatar.text} ${headerAvatar.ring}`}
            >
              {avatarInitial(conversation.contact.name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate text-stone-900 dark:text-stone-50 tracking-tight">
                {conversation.contact.name}
              </p>
              <p className="text-[12px] text-stone-500 tabular-nums">
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
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider ring-1 ${statusColor}`}
              >
                {conversation.status}
              </span>
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

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-2.5">
          {conversation.messages.length === 0 ? (
            <div className="text-center text-sm text-stone-500 py-16">
              Nenhuma mensagem ainda.
            </div>
          ) : (
            conversation.messages.map((m) => {
              const isInbound = m.direction === "inbound";
              const isTool = m.role === "tool";
              if (isTool) return null;

              return (
                <div
                  key={m.id}
                  className={`flex ${isInbound ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[72%] rounded-2xl px-4 py-2.5 text-[13.5px] leading-relaxed ${
                      isInbound
                        ? "bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 ring-1 ring-stone-200/80 dark:ring-stone-800/80 shadow-sm"
                        : "bg-brand-600 text-white shadow-sm shadow-brand-600/10"
                    }`}
                  >
                    <MediaBubble
                      messageId={m.id}
                      type={m.type}
                      content={m.content}
                      hasMedia={m.type !== "text" && m.type !== "location"}
                      mediaUrl={m.mediaUrl}
                      fileName={m.fileName}
                    />
                    <div
                      className={`mt-1.5 flex items-center gap-1.5 text-[10.5px] ${
                        isInbound ? "text-stone-400" : "text-white/70"
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
                        <>
                          <span>·</span>
                          <StatusIcon status={m.status} />
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
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
