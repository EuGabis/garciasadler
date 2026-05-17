import { MessageSquare } from "lucide-react";

export default function ConversationsEmptyState() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center max-w-sm px-6 animate-fade-in">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-brand-500/10 ring-1 ring-brand-500/20 flex items-center justify-center mb-6">
          <MessageSquare className="h-6 w-6 text-brand-300" />
        </div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-brand-300 mb-3">
          Inbox
        </p>
        <h2 className="font-display text-3xl text-white tracking-tighter mb-3">
          Selecione uma conversa
        </h2>
        <p className="text-sm text-stone-400">
          Escolha um contato à esquerda pra ver as mensagens e responder.
        </p>
      </div>
    </div>
  );
}
