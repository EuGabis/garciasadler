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

function StatusIcon({ status }: { status: string }) {
  if (status === "read") return <CheckCheck className="h-3 w-3 text-sky-300" />;
  if (status === "delivered") return <CheckCheck className="h-3 w-3 text-brand-100" />;
  if (status === "sent") return <Check className="h-3 w-3 text-brand-100" />;
  if (status === "pending") return <Clock className="h-3 w-3 text-brand-100" />;
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

  return (
    <div className="h-full flex relative">
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-brand-500/10 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300 text-sm font-semibold flex items-center justify-center">
              {conversation.contact.name?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{conversation.contact.name}</p>
              <p className="text-xs text-stone-500">{formatPhone(conversation.contact.phone)}</p>
            </div>
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
            <span className="text-xs text-stone-500 capitalize">{conversation.status}</span>
          </div>
          {(attachedLabels.length > 0 || assignedUsers.length > 0) && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {assignedUsers.length > 0 && (
                <AssignedBadges conversationId={conversation.id} assigned={assignedUsers} />
              )}
              {attachedLabels.length > 0 && (
                <AttachedLabels conversationId={conversation.id} labels={attachedLabels} />
              )}
            </div>
          )}
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
          {conversation.messages.length === 0 ? (
            <div className="text-center text-sm text-stone-500 py-12">
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
                    className={`max-w-[70%] rounded-2xl px-3.5 py-2 text-sm ${
                      isInbound
                        ? "bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800"
                        : "bg-brand-500 text-white"
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
                      className={`mt-1 flex items-center gap-1 text-[10px] ${
                        isInbound ? "text-stone-500" : "text-brand-100"
                      }`}
                    >
                      {!isInbound && m.sender?.name && <span>{m.sender.name}</span>}
                      {!isInbound && m.sender?.name && <span>·</span>}
                      <span>{formatTime(m.createdAt)}</span>
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
