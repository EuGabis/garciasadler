import { MessageSquare } from "lucide-react";

export default function ConversationsEmptyState() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center max-w-sm px-6">
        <div className="mx-auto h-12 w-12 rounded-full bg-stone-200 dark:bg-stone-800 flex items-center justify-center mb-4">
          <MessageSquare className="h-5 w-5 text-stone-500" />
        </div>
        <h2 className="text-base font-semibold mb-1">Selecione uma conversa</h2>
        <p className="text-sm text-stone-500">
          Escolha um contato à esquerda pra ver as mensagens e responder.
        </p>
      </div>
    </div>
  );
}
