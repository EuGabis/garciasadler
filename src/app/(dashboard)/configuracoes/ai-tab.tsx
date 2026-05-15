import { Bot, Sparkles } from "lucide-react";
import { SectionCard } from "@/components/ui";

export function AiTab() {
  return (
    <SectionCard
      title="Assistente de IA"
      description="Tool use + integração com sua API de produtos."
    >
      <div className="py-8 text-center">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center mb-4">
          <Bot className="h-6 w-6" />
        </div>
        <p className="text-sm font-semibold mb-1">Disponível em breve</p>
        <p className="text-xs text-stone-500 max-w-xs mx-auto">
          AgentConfig por workspace, system prompt customizável e tool use plugado na sua API de
          produtos. Próxima sprint.
        </p>
        <span className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-brand-500/10 text-brand-600">
          <Sparkles className="h-3 w-3" />
          Sprint IA
        </span>
      </div>
    </SectionCard>
  );
}
