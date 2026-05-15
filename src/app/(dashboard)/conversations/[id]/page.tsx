import { notFound } from "next/navigation";
import { Check, CheckCheck, Clock, AlertCircle } from "lucide-react";
import { auth } from "@/auth";
import { getConversationWithMessages, markConversationRead } from "@/lib/conversations";
import { formatTime, formatPhone } from "@/lib/format";
import { MessageForm } from "./message-form";
import { MediaBubble } from "./media-bubble";

function StatusIcon({ status }: { status: string }) {
  if (status === "read") return <CheckCheck className="h-3 w-3 text-sky-300" />;
  if (status === "delivered") return <CheckCheck className="h-3 w-3 text-indigo-200" />;
  if (status === "sent") return <Check className="h-3 w-3 text-indigo-200" />;
  if (status === "pending") return <Clock className="h-3 w-3 text-indigo-200" />;
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
    await markConversationRead(conversation.id);
  }

  return (
    <div className="h-full flex flex-col">
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-5 py-3 flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-sm font-semibold flex items-center justify-center">
          {conversation.contact.name?.[0]?.toUpperCase() ?? "?"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{conversation.contact.name}</p>
          <p className="text-xs text-zinc-500">{formatPhone(conversation.contact.phone)}</p>
        </div>
        <span className="text-xs text-zinc-500 capitalize">{conversation.status}</span>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
        {conversation.messages.length === 0 ? (
          <div className="text-center text-sm text-zinc-500 py-12">
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
                      ? "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
                      : "bg-indigo-600 text-white"
                  }`}
                >
                  <MediaBubble
                    type={m.type}
                    content={m.content}
                    mediaBase64={m.mediaBase64}
                    mediaUrl={m.mediaUrl}
                    fileName={m.fileName}
                  />
                  <div
                    className={`mt-1 flex items-center gap-1 text-[10px] ${
                      isInbound ? "text-zinc-500" : "text-indigo-200"
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

      <MessageForm conversationId={conversation.id} />
    </div>
  );
}
