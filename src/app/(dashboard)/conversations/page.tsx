import { MessageSquare } from "lucide-react";

export default function ConversationsEmptyState() {
  return (
    <div className="h-full w-full flex-1 flex items-center justify-center min-w-0">
      <div className="text-center max-w-sm px-6">
        <div className="mx-auto h-12 w-12 rounded-2xl bg-white dark:bg-stone-900 ring-1 ring-stone-200 dark:ring-stone-800 flex items-center justify-center mb-5 shadow-sm">
          <MessageSquare className="h-5 w-5 text-stone-400" />
        </div>
        <h2 className="text-base font-semibold text-stone-900 dark:text-stone-50 tracking-tight mb-1.5">
          Selecione uma conversa
        </h2>
        <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
          Escolha um contato à esquerda para ver as mensagens e responder.
        </p>
      </div>
    </div>
  );
}
