import Link from "next/link";
import type { Metadata } from "next";
import {
  BookOpen,
  LayoutDashboard,
  MessagesSquare,
  Users,
  Columns3,
  Tag,
  BarChart3,
  Settings,
  Bot,
  Plug,
  Zap,
  Sparkles,
  UserCog,
  UserCircle,
  Webhook,
  AlertTriangle,
  ShieldCheck,
  Wrench,
  Rocket,
  HelpCircle,
  Package,
  ArrowRight,
  KeyRound,
  Archive,
  Send,
  Filter,
  MessageCircle,
  Info,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Manual - Garcia Sadler CRM",
  description:
    "Guia completo do CRM Garcia Sadler: atendimento WhatsApp, IA, integração Exato, pipeline, equipe.",
};

const sections = [
  { id: "intro", label: "Introdução", icon: BookOpen },
  { id: "login", label: "Login e acesso", icon: KeyRound },
  { id: "dashboard", label: "Visão geral (Dashboard)", icon: LayoutDashboard },
  { id: "conversas", label: "Conversas (WhatsApp)", icon: MessagesSquare },
  { id: "contatos", label: "Contatos", icon: Users },
  { id: "pipeline", label: "Pipeline (Kanban)", icon: Columns3 },
  { id: "etiquetas", label: "Etiquetas", icon: Tag },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "config", label: "Configurações", icon: Settings },
  { id: "ia", label: "Como a IA funciona", icon: Bot },
  { id: "fluxo", label: "Fluxo prático", icon: Rocket },
  { id: "problemas", label: "Problemas comuns", icon: AlertTriangle },
  { id: "faq", label: "Perguntas frequentes", icon: HelpCircle },
];

export default function ManualPage() {
  return (
    <main className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100">
      {/* Topbar */}
      <header className="sticky top-0 z-30 border-b border-stone-200/80 dark:border-stone-800/80 bg-white/85 dark:bg-stone-900/85 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
              G
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold tracking-tight leading-tight truncate">
                Garcia Sadler CRM
              </p>
              <p className="text-[10px] uppercase tracking-[0.08em] font-medium text-stone-500 leading-tight mt-0.5">
                Manual do operador
              </p>
            </div>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12.5px] font-medium bg-brand-600 hover:bg-brand-700 text-white transition-colors"
          >
            Acessar o sistema <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      {/* Layout */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12 grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">
        {/* Sidebar de navegação */}
        <aside className="lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
          <p className="text-[10.5px] uppercase tracking-[0.09em] font-semibold text-stone-500 mb-3 flex items-center gap-1.5">
            <BookOpen className="h-3 w-3" />
            Navegar
          </p>
          <nav className="space-y-0.5">
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[12.5px] text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800/60 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
              >
                <s.icon className="h-3.5 w-3.5 shrink-0 text-stone-400" />
                <span className="truncate">{s.label}</span>
              </a>
            ))}
          </nav>
          <div className="mt-6 rounded-lg border border-brand-600/20 bg-brand-50 dark:bg-brand-500/10 p-3">
            <p className="text-[11.5px] font-semibold text-brand-800 dark:text-brand-300 mb-1">
              Dica
            </p>
            <p className="text-[11.5px] leading-relaxed text-stone-600 dark:text-stone-400">
              Você pode usar o CRM pelo celular ou desktop. O layout se adapta
              automaticamente.
            </p>
          </div>
        </aside>

        {/* Conteúdo */}
        <article className="min-w-0 space-y-16">
          <Hero />

          <Intro />
          <LoginSection />
          <DashboardSection />
          <ConversasSection />
          <ContatosSection />
          <PipelineSection />
          <EtiquetasSection />
          <AnalyticsSection />
          <ConfigSection />
          <IaSection />
          <FluxoSection />
          <ProblemasSection />
          <FaqSection />

          <Footer />
        </article>
      </div>
    </main>
  );
}

/* ============================================================
 * COMPONENTES DE LAYOUT REUSÁVEIS
 * ========================================================== */

function Section({
  id,
  icon: Icon,
  title,
  eyebrow,
  children,
}: {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="mb-6">
        {eyebrow && (
          <p className="text-[10.5px] uppercase tracking-[0.09em] font-semibold text-brand-600 mb-2 flex items-center gap-1.5">
            <span className="h-3 w-[3px] rounded-full bg-brand-600" />
            {eyebrow}
          </p>
        )}
        <h2 className="text-2xl md:text-[28px] font-semibold tracking-tight flex items-center gap-2.5">
          <Icon className="h-5 w-5 text-brand-600" />
          {title}
        </h2>
      </div>
      <div className="space-y-5 text-[14px] leading-relaxed text-stone-700 dark:text-stone-300">
        {children}
      </div>
    </section>
  );
}

function Sub({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[16px] font-semibold tracking-tight text-stone-900 dark:text-stone-50 mt-6">
      {children}
    </h3>
  );
}

function Callout({
  variant = "info",
  title,
  children,
}: {
  variant?: "info" | "warn" | "success" | "danger";
  title?: string;
  children: React.ReactNode;
}) {
  const styles = {
    info: {
      wrap: "border-sky-200/60 dark:border-sky-500/20 bg-sky-50 dark:bg-sky-500/10",
      icon: "text-sky-600 dark:text-sky-400",
      Icon: Info,
    },
    warn: {
      wrap: "border-amber-200/60 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10",
      icon: "text-amber-600 dark:text-amber-400",
      Icon: AlertTriangle,
    },
    success: {
      wrap: "border-emerald-200/60 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10",
      icon: "text-emerald-600 dark:text-emerald-400",
      Icon: CheckCircle2,
    },
    danger: {
      wrap: "border-red-200/60 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10",
      icon: "text-red-600 dark:text-red-400",
      Icon: AlertCircle,
    },
  }[variant];
  const IconComp = styles.Icon;
  return (
    <div className={`rounded-lg border p-4 ${styles.wrap}`}>
      <div className="flex items-start gap-2.5">
        <IconComp className={`h-4 w-4 mt-0.5 shrink-0 ${styles.icon}`} />
        <div className="min-w-0 flex-1">
          {title && (
            <p className="text-[13px] font-semibold text-stone-900 dark:text-stone-50 mb-1">
              {title}
            </p>
          )}
          <div className="text-[13px] leading-relaxed text-stone-700 dark:text-stone-300 space-y-2">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function Steps({ items }: { items: React.ReactNode[] }) {
  return (
    <ol className="space-y-3 mt-3">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3">
          <span className="shrink-0 h-6 w-6 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center justify-center font-semibold text-[11.5px] tabular-nums">
            {i + 1}
          </span>
          <div className="flex-1 min-w-0 pt-0.5">{item}</div>
        </li>
      ))}
    </ol>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center rounded-md border border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 text-[11px] font-mono font-medium text-stone-700 dark:text-stone-300 shadow-[0_1px_0_0_rgba(0,0,0,0.03)]">
      {children}
    </kbd>
  );
}

/* ============================================================
 * SEÇÕES DE CONTEÚDO
 * ========================================================== */

function Hero() {
  return (
    <div className="rounded-2xl border border-stone-200/80 dark:border-stone-800/80 bg-gradient-to-br from-white to-brand-50/40 dark:from-stone-900 dark:to-brand-500/5 p-6 md:p-8">
      <p className="text-[10.5px] uppercase tracking-[0.09em] font-semibold text-brand-600 mb-2">
        Manual de treinamento
      </p>
      <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
        Como usar o Garcia Sadler CRM
      </h1>
      <p className="mt-3 text-[14.5px] text-stone-600 dark:text-stone-400 max-w-2xl leading-relaxed">
        Este guia explica cada tela e funcionalidade do sistema. Feito pra quem
        nunca usou, com passo a passo, dicas e soluções pros problemas mais
        comuns. Leia na sequência ou vá direto pela navegação lateral.
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 text-[11.5px] px-2.5 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
          <MessageCircle className="h-3 w-3" /> WhatsApp
        </span>
        <span className="inline-flex items-center gap-1.5 text-[11.5px] px-2.5 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
          <Bot className="h-3 w-3" /> IA integrada
        </span>
        <span className="inline-flex items-center gap-1.5 text-[11.5px] px-2.5 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
          <Plug className="h-3 w-3" /> Integração Exato
        </span>
        <span className="inline-flex items-center gap-1.5 text-[11.5px] px-2.5 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
          <Columns3 className="h-3 w-3" /> Pipeline Kanban
        </span>
      </div>
    </div>
  );
}

function Intro() {
  return (
    <Section id="intro" icon={BookOpen} title="Introdução" eyebrow="1">
      <p>
        O <strong>Garcia Sadler CRM</strong> é um sistema de atendimento que
        centraliza todas as conversas do WhatsApp da loja em um único painel.
        Vários atendentes podem responder ao mesmo tempo, com organização por
        etiquetas, filas, pipeline de vendas e uma IA que responde clientes
        automaticamente quando você quiser.
      </p>
      <Sub>O que você consegue fazer</Sub>
      <ul className="list-disc pl-5 space-y-1.5">
        <li>Responder mensagens do WhatsApp de qualquer lugar (celular ou computador)</li>
        <li>Organizar clientes com etiquetas coloridas e status</li>
        <li>Acompanhar oportunidades num quadro visual (Kanban)</li>
        <li>Deixar a IA responder cotações simples enquanto você atende as complexas</li>
        <li>Consultar o estoque em tempo real (via integração com o Exato)</li>
        <li>Ver quantas conversas rolam por dia e quem mais atende</li>
        <li>Convidar mais atendentes e distribuir conversas</li>
      </ul>
      <Sub>O que você precisa antes de começar</Sub>
      <ul className="list-disc pl-5 space-y-1.5">
        <li>Login e senha do sistema (recebido do administrador)</li>
        <li>Um navegador moderno (Chrome, Edge, Firefox, Safari)</li>
        <li>Internet estável</li>
      </ul>
    </Section>
  );
}

function LoginSection() {
  return (
    <Section id="login" icon={KeyRound} title="Login e acesso" eyebrow="2">
      <p>
        Abra o navegador e acesse o endereço do sistema (fornecido pelo
        administrador). Você verá uma tela com dois campos: <strong>Email</strong> e{" "}
        <strong>Senha</strong>.
      </p>
      <Steps
        items={[
          <>Digite seu e-mail cadastrado.</>,
          <>
            Digite sua senha (mínimo 8 caracteres). Se você não sabe a senha, peça
            pra um administrador resetar.
          </>,
          <>
            Clique em <strong>Entrar</strong>. Se estiver correto, você cai
            direto na <strong>Visão geral</strong>.
          </>,
        ]}
      />
      <Callout variant="warn" title="Esqueci a senha">
        Ainda não existe recuperação por e-mail. Se você esqueceu, avise o{" "}
        <strong>owner</strong> ou <strong>admin</strong> do seu workspace - eles
        conseguem redefinir a sua senha em <em>Configurações → Equipe → </em>.
      </Callout>
      <Sub>Papéis no sistema</Sub>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
        <RoleCard
          role="Owner"
          desc="Dono do workspace. Faz tudo: criar/apagar usuários (incluindo outros owners), configurar integrações, mexer em segurança."
        />
        <RoleCard
          role="Admin"
          desc="Gerencia equipe (menos outros owners), configura automações, edita workspace. Não pode alterar outros owners."
        />
        <RoleCard
          role="Agente"
          desc="Atende conversas, mexe em contatos, usa o pipeline. Não vê configurações do workspace."
        />
      </div>
    </Section>
  );
}

function RoleCard({ role, desc }: { role: string; desc: string }) {
  return (
    <div className="rounded-lg border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-stone-900 p-4">
      <p className="text-[10.5px] uppercase tracking-[0.08em] font-semibold text-brand-600 mb-1.5">
        {role}
      </p>
      <p className="text-[12.5px] text-stone-600 dark:text-stone-400 leading-relaxed">
        {desc}
      </p>
    </div>
  );
}

function DashboardSection() {
  return (
    <Section
      id="dashboard"
      icon={LayoutDashboard}
      title="Visão geral (Dashboard)"
      eyebrow="3"
    >
      <p>
        A primeira tela depois do login. Serve como um resumo rápido do que
        está rolando na loja hoje.
      </p>
      <Sub>O que aparece nos cards</Sub>
      <ul className="list-disc pl-5 space-y-1.5">
        <li>
          <strong>Conversas abertas</strong>: quantas conversas ainda precisam
          de resposta ou estão em andamento.
        </li>
        <li>
          <strong>Contatos</strong>: total de clientes cadastrados no workspace.
        </li>
        <li>
          <strong>Mensagens hoje</strong>: quantas mensagens (recebidas +
          enviadas) rolaram nas últimas 24h.
        </li>
        <li>
          <strong>Etiquetas</strong>: quantas etiquetas você tem pra organizar
          conversas.
        </li>
        <li>
          <strong>Pipeline</strong>: quantas colunas o quadro Kanban tem.
        </li>
      </ul>
      <p>
        O card <em>Conversas abertas</em> tem um destaque em laranja quando tem
        cliente aguardando - funciona como alerta pra não deixar ninguém sem
        resposta.
      </p>
      <Callout title="Saudação dinâmica" variant="info">
        A saudação (<em>Bom dia / Boa tarde / Boa noite</em>) muda automaticamente
        pelo horário de Brasília, mesmo com o servidor rodando em outro fuso.
      </Callout>
    </Section>
  );
}

function ConversasSection() {
  return (
    <Section
      id="conversas"
      icon={MessagesSquare}
      title="Conversas (WhatsApp)"
      eyebrow="4"
    >
      <p>
        Coração do sistema. É onde você lê e responde as mensagens que chegam do
        WhatsApp da loja. A tela é dividida em 3 partes:
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
        <MiniCard
          icon={Filter}
          title="Lista à esquerda"
          desc="Todas as conversas ordenadas pela mais recente. Filtros Todas / Minhas."
        />
        <MiniCard
          icon={MessagesSquare}
          title="Chat no meio"
          desc="A conversa selecionada, com o histórico completo de mensagens e mídia."
        />
        <MiniCard
          icon={Info}
          title="Perfil à direita"
          desc="Dados do contato: nome, telefone, notas, status, outras conversas dele."
        />
      </div>
      <Sub>Enviar uma mensagem</Sub>
      <Steps
        items={[
          <>Clique numa conversa da lista à esquerda.</>,
          <>
            Digite no campo <em>Digite sua mensagem…</em> na parte de baixo.
          </>,
          <>
            Clique em <strong>Enviar</strong> ou aperte <Kbd>Enter</Kbd>.
          </>,
          <>
            A mensagem aparece como bolha laranja (você enviou) e vai pro
            WhatsApp do cliente na hora. O ícone  mostra o status:{" "}
            <em>enviada, entregue, lida</em>.
          </>,
        ]}
      />
      <Sub>Respostas rápidas</Sub>
      <p>
        Ao lado do campo de mensagem tem o botão <strong>Rápidas</strong>. Ele
        abre uma lista de textos pré-cadastrados que você configura em{" "}
        <em>Configurações → Respostas rápidas</em>. Ideal pra mensagens que se
        repetem muito (horário, endereço, forma de pagamento).
      </p>
      <Sub>Áudio, foto, documento</Sub>
      <p>
        Toda mídia que o cliente manda aparece no chat inline: áudio com player,
        foto/vídeo em thumbnail, documento com link pra baixar. Se você usa
        celular, clique no clipe  ao lado do campo de mensagem pra anexar
        arquivo.
      </p>
      <Sub>Atribuir a um atendente</Sub>
      <p>
        Botão <strong>Atribuir</strong> no topo do chat abre um seletor. Escolha
        um membro da equipe e a conversa aparece pra ele em <em>Minhas</em>. Um
        cliente pode ter vários atendentes atribuídos ao mesmo tempo.
      </p>
      <Sub>Etiquetar</Sub>
      <p>
        Botão <strong>Etiquetar</strong> aplica etiquetas coloridas (ex:{" "}
        <em>Cliente novo, Aguardando pagamento, VIP</em>). Você configura as
        etiquetas em <em>Configurações → Etiquetas</em>. Ajuda a filtrar depois.
      </p>
      <Sub>Ligar/desligar a IA nesta conversa</Sub>
      <Callout variant="info" title="Badge IA no topo">
        <p>
          <strong>IA ON</strong> (laranja) = a IA responde automaticamente
          quando o cliente enviar mensagem.
        </p>
        <p>
          <strong>IA OFF</strong> (cinza) = só humano responde. Clique no badge
          pra alternar.
        </p>
        <p>
          Quando um <strong>agente humano envia uma mensagem</strong>, a IA
          desliga automaticamente naquela conversa - pra não gerar respostas
          conflitantes.
        </p>
      </Callout>
      <Sub>Painel do contato (lado direito)</Sub>
      <p>
        Mostra os dados do cliente: nome, telefone, e-mail, notas internas,
        produto de interesse, origem e todas as outras conversas dele. Você pode{" "}
        <strong>editar os campos direto ali</strong> - clique num campo pra
        virar editável.
      </p>
      <Callout variant="warn">
        <strong>Notas internas</strong> só a equipe vê, nunca vão pro cliente.
        Use pra registrar observações do tipo <em>"Cliente prefere entrega de
        manhã"</em>.
      </Callout>
      <Sub>Arquivar conversa</Sub>
      <p>
        Quando o atendimento acabou, mude o status pra <em>Resolvida</em> ou{" "}
        <em>Arquivada</em>. A conversa some da lista principal. Se o cliente
        voltar a mandar mensagem depois, a conversa reabre automaticamente
        (preservando o histórico anterior).
      </p>
    </Section>
  );
}

function MiniCard({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-lg border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-stone-900 p-4">
      <Icon className="h-4 w-4 text-brand-600 mb-2" />
      <p className="text-[13px] font-semibold tracking-tight text-stone-900 dark:text-stone-50 mb-1">
        {title}
      </p>
      <p className="text-[12px] text-stone-600 dark:text-stone-400 leading-relaxed">
        {desc}
      </p>
    </div>
  );
}

function ContatosSection() {
  return (
    <Section id="contatos" icon={Users} title="Contatos" eyebrow="5">
      <p>
        Base de clientes do workspace. Cada cliente que manda mensagem no
        WhatsApp vira contato automaticamente. Você também pode cadastrar manualmente.
      </p>
      <Sub>Buscar contato</Sub>
      <p>
        Use a busca no topo pra achar por <strong>nome, telefone ou e-mail</strong>.
        A busca ignora acento e maiúsculas.
      </p>
      <Sub>Cadastrar contato novo</Sub>
      <Steps
        items={[
          <>Clique no botão <strong>Novo contato</strong> no canto superior direito.</>,
          <>Preencha nome e telefone (obrigatório) e o que mais quiser.</>,
          <>Clique em <strong>Salvar</strong>. Ele aparece na lista.</>,
        ]}
      />
      <Sub>Status do contato</Sub>
      <ul className="list-disc pl-5 space-y-1.5">
        <li><strong>Ativo</strong>: cliente normal.</li>
        <li><strong>Arquivado</strong>: cliente inativo, some dos filtros padrão.</li>
        <li><strong>Bloqueado</strong>: cliente indesejado - mensagens dele não são processadas pela IA nem entram na fila.</li>
      </ul>
    </Section>
  );
}

function PipelineSection() {
  return (
    <Section id="pipeline" icon={Columns3} title="Pipeline (Kanban)" eyebrow="6">
      <p>
        Quadro visual pra acompanhar oportunidades de venda. Cada coluna é uma
        etapa (ex: <em>Novo lead, Cotação enviada, Aguardando pagamento,
        Fechado</em>). Cada card é uma conversa/cliente.
      </p>
      <Sub>Mover card entre colunas</Sub>
      <p>
        <strong>Arraste e solte</strong> o card pra outra coluna. A mudança fica
        salva na hora. Todos os atendentes veem a atualização em tempo real.
      </p>
      <Sub>Adicionar conversa ao pipeline</Sub>
      <Steps
        items={[
          <>Abra o pipeline.</>,
          <>Cada coluna tem um botão <strong>+</strong>: clique.</>,
          <>Escolha a conversa da lista suspensa (mostra só conversas abertas).</>,
          <>Card aparece na coluna.</>,
        ]}
      />
      <Callout variant="info" title="Limite WIP">
        Cada coluna pode ter um <strong>limite máximo</strong> de cards (WIP
        limit). Quando bate o limite, novos cards não são aceitos ali -
        te obriga a "fechar" alguém antes de puxar mais lead. Configura na
        engrenagem da coluna.
      </Callout>
    </Section>
  );
}

function EtiquetasSection() {
  return (
    <Section id="etiquetas" icon={Tag} title="Etiquetas" eyebrow="7">
      <p>
        Rótulos coloridos que você aplica em conversas. Exemplos:{" "}
        <em>Cliente novo, VIP, Reclamação, Aguardando pagamento</em>. Serve pra
        organizar e filtrar depois.
      </p>
      <Steps
        items={[
          <>Vá em <strong>Etiquetas</strong> no menu.</>,
          <>Clique em <strong>Nova etiqueta</strong>.</>,
          <>Escolha nome e cor.</>,
          <>Salve. A etiqueta aparece nas conversas quando você clicar em <em>Etiquetar</em>.</>,
        ]}
      />
    </Section>
  );
}

function AnalyticsSection() {
  return (
    <Section id="analytics" icon={BarChart3} title="Analytics" eyebrow="8">
      <p>
        Métricas de atendimento por período: hoje, últimos 7d, 30d, 90d.
      </p>
      <Sub>O que você vê</Sub>
      <ul className="list-disc pl-5 space-y-1.5">
        <li><strong>KPIs</strong>: conversas criadas, resolvidas, mensagens totais, contatos ativos, tempo médio de resposta.</li>
        <li><strong>Gráfico por dia</strong>: mensagens recebidas × enviadas.</li>
        <li><strong>Heatmap por hora</strong>: em qual hora do dia mais chega mensagem.</li>
        <li><strong>Top agentes</strong>: quem mais responde.</li>
        <li><strong>Distribuição por coluna do pipeline</strong>: quantos cards em cada etapa.</li>
        <li><strong>Etiquetas mais usadas</strong>.</li>
      </ul>
      <Callout variant="info">
        Use pra saber qual horário reforçar a equipe e identificar gargalos no
        pipeline (coluna com muitos cards parados = etapa que trava).
      </Callout>
    </Section>
  );
}

function ConfigSection() {
  return (
    <Section id="config" icon={Settings} title="Configurações" eyebrow="9">
      <p>
        Área do administrador. 9 abas, cada uma com uma responsabilidade
        diferente.
      </p>

      <ConfigTab
        icon={UserCircle}
        title="Workspace"
        desc="Nome e slug do seu workspace + credenciais da Evolution API (URL, instância, key). Só edite se souber o que está fazendo - se apagar, o WhatsApp para de receber mensagens."
      />

      <ConfigTab
        icon={Webhook}
        title="Webhook"
        desc="Mostra o endereço do webhook que a Evolution precisa enviar mensagens. Se você trocar de servidor Evolution, cole essa URL lá."
      />

      <ConfigTab
        icon={Plug}
        title="Integração Exato"
        desc="Conecta o CRM ao ERP Exato pra IA consultar produtos e (em breve) criar pedidos. Passos: 1) preencher usuário e senha da API PML → Salvar e testar. 2) Sincronizar lojas e escolher a loja padrão. 3) Testar busca de produto (ex: 'cimento')."
      />

      <ConfigTab
        icon={Zap}
        title="Automações"
        desc="Regras que rodam sozinhas. Exemplo: quando cliente mandar 'oi' pela primeira vez, responder com menu de opções. Ou: se cliente ficar 24h sem resposta, enviar follow-up automático."
      />

      <ConfigTab
        icon={Sparkles}
        title="Respostas rápidas"
        desc="Textos prontos pra você aplicar com 1 clique no chat. Cada resposta tem título e conteúdo. Ideal pra 'Endereço da loja', 'Formas de pagamento', 'Horário de funcionamento'."
      />

      <ConfigTab
        icon={UserCog}
        title="Equipe"
        desc="Adiciona/remove atendentes, muda papéis (owner/admin/agente), reseta senha de outros usuários (botão ). Cada usuário criado aqui recebe login separado."
      />

      <ConfigTab
        icon={UserCircle}
        title="Conta"
        desc="Sua conta pessoal. Trocar seu nome, seu e-mail, sua senha. Só afeta você."
      />

      <ConfigTab
        icon={Bot}
        title="IA"
        desc="Configura o assistente virtual. Ligar/desligar globalmente, colar chave OpenAI, escolher modelo (gpt-4o-mini padrão, gpt-4.1 premium), editar prompt (personalidade e regras), acompanhar consumo de tokens no mês."
      />

      <ConfigTab
        icon={AlertTriangle}
        title="Logs & Erros"
        desc="Registro de tudo que deu errado (falha na IA, falha no Exato, etc). Use quando algo não funcionar como esperado. Filtre por nível (Fatal, Error, Warn) e escopo (webhook, ai/openai, exato). Clique num erro pra expandir e ver detalhes."
      />
    </Section>
  );
}

function ConfigTab({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-lg border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-stone-900 p-4 mt-3">
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 rounded-lg bg-brand-50 dark:bg-brand-500/15 text-brand-700 dark:text-brand-400 flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold tracking-tight text-stone-900 dark:text-stone-50 mb-1">
            {title}
          </p>
          <p className="text-[12.5px] text-stone-600 dark:text-stone-400 leading-relaxed">
            {desc}
          </p>
        </div>
      </div>
    </div>
  );
}

function IaSection() {
  return (
    <Section id="ia" icon={Bot} title="Como a IA funciona" eyebrow="10">
      <p>
        A IA é um assistente virtual que <strong>lê a mensagem do cliente</strong>{" "}
        e responde automaticamente, seguindo regras que você configurou. Pra
        cotações simples ela resolve sozinha; pra casos complexos ou negociação,
        ela transfere pra um humano.
      </p>

      <Sub>Ferramentas que a IA tem</Sub>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <MiniCard
          icon={Package}
          title="buscar_produto"
          desc="Consulta o catálogo da Garcia Sadler no Exato. Retorna código, descrição, marca, preço. IA usa pra qualquer pergunta de preço/produto."
        />
        <MiniCard
          icon={Wrench}
          title="calcular_obra"
          desc="Calcula quanto material precisa pra obras: contrapiso, alvenaria, reboco, telhado, pintura, concreto, aço. IA usa quando cliente pergunta por metragem."
        />
      </div>

      <Sub>Regras que a IA sempre segue</Sub>
      <ul className="list-disc pl-5 space-y-1.5">
        <li>Nunca inventa preço - sempre consulta via <code className="text-[12px] bg-stone-100 dark:bg-stone-800 px-1 py-0.5 rounded font-mono">buscar_produto</code>.</li>
        <li>Não coleta dados pessoais até o cliente confirmar que quer fechar.</li>
        <li>Não gera protocolo até o cliente confirmar o pedido.</li>
        <li>Não fala de estoque com o cliente - pra o cliente, todo produto está disponível.</li>
        <li>Se acontecer erro em qualquer ferramenta, transfere pra atendente humano.</li>
        <li>Se cliente pedir desconto, brigar por valor, ou reclamar → transfere direto pra humano.</li>
      </ul>

      <Sub>Quando a IA responde vs quando pausa</Sub>
      <Callout variant="success" title="IA responde quando:">
        <p>
          1. IA está <strong>ligada globalmente</strong> em Configurações → IA
          <br />
          2. A conversa específica está com badge <strong>IA ON</strong>
          <br />
          3. Cliente NÃO enviou o comando <code className="text-[12px] bg-stone-200/60 dark:bg-stone-700/60 px-1 py-0.5 rounded font-mono">/atendente</code>
        </p>
      </Callout>
      <Callout variant="warn" title="IA pausa automaticamente quando:">
        <p>
          Um atendente humano envia mensagem naquela conversa. Isso evita
          respostas duplas confusas. Pra religar, clique no badge{" "}
          <strong>IA OFF</strong> e ele vira <strong>IA ON</strong> - a IA
          responde a próxima mensagem do cliente.
        </p>
      </Callout>

      <Sub>Custo de tokens</Sub>
      <p>
        Cada mensagem da IA gasta um pouco da sua cota OpenAI (medida em{" "}
        <strong>tokens</strong>). O contador mostra o consumo do mês. Você pode
        zerar o contador manualmente pra rastrear períodos.
      </p>

      <Sub>Editando o comportamento</Sub>
      <p>
        Em <em>Configurações → IA</em> tem uma caixa grande de texto (<em>System
        Prompt</em>) onde você pode ajustar o comportamento da IA - mudar tom
        de voz, adicionar regras específicas, ensinar termos usados na loja. Se
        deixar em branco, usa o prompt padrão da Garcia Sadler.
      </p>
      <Callout variant="danger" title="Cuidado ao editar o prompt">
        Mudanças no prompt afetam TODAS as próximas respostas da IA. Se editar
        errado, ela pode responder mal. Sempre teste com uma conversa de teste
        antes de deixar em produção.
      </Callout>
    </Section>
  );
}

function FluxoSection() {
  return (
    <Section id="fluxo" icon={Rocket} title="Fluxo prático de um atendimento" eyebrow="11">
      <p>
        Exemplo completo do que acontece do cliente mandar &quot;Olá&quot; até o pedido ser
        registrado.
      </p>
      <div className="rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-stone-900 p-5 mt-3">
        <ol className="space-y-4">
          <FluxoStep
            n={1}
            actor="Cliente"
            title="Manda mensagem no WhatsApp"
            desc="Ex: 'Bom dia, vocês têm cimento?'"
          />
          <FluxoStep
            n={2}
            actor="Sistema"
            title="Recebe via webhook Evolution"
            desc="Cria/atualiza contato e conversa no CRM. Se o cliente é novo, aparece na lista com badge de mensagem não lida."
          />
          <FluxoStep
            n={3}
            actor="IA (se ativa)"
            title="Analisa e responde"
            desc="Reconhece 'cimento' como termo genérico e pergunta a aplicação: 'Cimento é um produto genérico. Você quer pra assentamento, contrapiso ou estrutura?'"
          />
          <FluxoStep
            n={4}
            actor="Cliente"
            title="Responde 'assentamento'"
            desc="A IA chama buscar_produto('cimento cola'), lista os produtos disponíveis numerados."
          />
          <FluxoStep
            n={5}
            actor="Cliente"
            title="Escolhe o número, pede quantidade"
            desc="Ex: 'quero 10 sacos do 1'. IA adiciona ao carrinho, mostra subtotal, pergunta se quer mais alguma coisa."
          />
          <FluxoStep
            n={6}
            actor="Cliente"
            title="Confirma o pedido"
            desc="Ex: 'pode fechar'. IA coleta CPF, endereço, e-mail. Confirma tudo com o cliente."
          />
          <FluxoStep
            n={7}
            actor="IA"
            title="Cria o pedido e gera protocolo"
            desc="Envia pra Exato + mostra número do protocolo pro cliente + mensagem de pagamento (PIX/cartão)."
          />
          <FluxoStep
            n={8}
            actor="Atendente humano"
            title="Assume e finaliza"
            desc="Aparece o pedido na fila, confirma pagamento, agenda entrega. Cliente recebe confirmação final."
          />
        </ol>
      </div>
      <Callout variant="info">
        Você pode <strong>assumir a conversa a qualquer momento</strong>: basta
        enviar uma mensagem manual. A IA pausa naquela conversa automaticamente.
      </Callout>
    </Section>
  );
}

function FluxoStep({
  n,
  actor,
  title,
  desc,
}: {
  n: number;
  actor: string;
  title: string;
  desc: string;
}) {
  return (
    <li className="flex gap-3">
      <span className="shrink-0 h-7 w-7 rounded-md bg-brand-50 dark:bg-brand-500/15 text-brand-700 dark:text-brand-400 flex items-center justify-center font-semibold text-[12px] tabular-nums">
        {n}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[10.5px] uppercase tracking-[0.09em] font-semibold text-stone-500 mb-0.5">
          {actor}
        </p>
        <p className="text-[13.5px] font-semibold text-stone-900 dark:text-stone-50">
          {title}
        </p>
        <p className="text-[12.5px] text-stone-600 dark:text-stone-400 leading-relaxed mt-0.5">
          {desc}
        </p>
      </div>
    </li>
  );
}

function ProblemasSection() {
  return (
    <Section
      id="problemas"
      icon={AlertTriangle}
      title="Problemas comuns"
      eyebrow="12"
    >
      <Problem
        icon={XCircle}
        title="A IA respondeu 'Estou com dificuldade para acessar as informações dos produtos'"
        cause="A ferramenta buscar_produto falhou (Exato fora do ar, token expirado, ou termo estranho)."
        fix={[
          "Vá em Configurações → Integração Exato",
          "Clique em Testar conexão",
          "Se der erro, clique em Sincronizar lojas e re-selecione a loja",
          "Depois clique em Buscar produto (teste) com 'cimento'",
          "Se aparecer produto, a IA volta a funcionar normalmente na próxima mensagem",
        ]}
      />
      <Problem
        icon={XCircle}
        title="Mensagem do cliente não chegou no CRM"
        cause="Webhook da Evolution não está apontando pro sistema, ou o WhatsApp desconectou do Evolution."
        fix={[
          "Verifique se o WhatsApp está conectado no painel da Evolution",
          "Confira em Configurações → Workspace se URL, instância e key da Evolution estão certos",
          "Confirme que a Evolution está enviando pro nosso webhook (endereço em Configurações → Webhook)",
        ]}
      />
      <Problem
        icon={XCircle}
        title="'Algo deu errado' ao abrir o sistema"
        cause="O banco de dados ficou temporariamente indisponível (recovery, reboot, saldo do Railway acabou)."
        fix={[
          "Espera 1-5 minutos e recarrega (F5)",
          "Se persistir, avisa o administrador - pode precisar recarregar crédito ou reiniciar o serviço",
        ]}
      />
      <Problem
        icon={XCircle}
        title="Não consigo trocar minha senha"
        cause="Você não sabe a senha atual ou é um agente sem permissão."
        fix={[
          "Peça pro owner ou admin do workspace ir em Configurações → Equipe → clicar no ícone  do seu usuário",
          "Ele define uma nova senha e te passa por WhatsApp ou canal seguro",
          "Suas sessões antigas são invalidadas automaticamente - faça login com a senha nova",
        ]}
      />
      <Problem
        icon={XCircle}
        title="A IA está copiando resposta ruim de conversas antigas"
        cause="Vício de histórico - modelos pequenos tendem a imitar padrões repetidos."
        fix={[
          "Arquive a conversa problemática (some da lista principal)",
          "Se o cliente voltar, o histórico velho ainda existe. Pra zerar, o admin pode deletar o contato - próxima mensagem cria contato novo do zero",
        ]}
      />
      <Problem
        icon={XCircle}
        title="Não estou vendo a aba Configurações"
        cause="Você tem papel de agente (só owner/admin veem)."
        fix={[
          "Se você deveria ver, peça pro owner promover seu usuário pra admin em Configurações → Equipe",
        ]}
      />
    </Section>
  );
}

function Problem({
  icon: Icon,
  title,
  cause,
  fix,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  cause: string;
  fix: string[];
}) {
  return (
    <div className="rounded-lg border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-stone-900 p-4 mt-3">
      <p className="text-[13.5px] font-semibold text-stone-900 dark:text-stone-50 flex items-start gap-2">
        <Icon className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
        <span>{title}</span>
      </p>
      <p className="text-[12.5px] text-stone-500 mt-2 ml-6">
        <strong className="text-stone-700 dark:text-stone-300">Motivo:</strong>{" "}
        {cause}
      </p>
      <div className="ml-6 mt-2">
        <p className="text-[10.5px] uppercase tracking-[0.09em] font-semibold text-stone-500 mb-1.5">
          Como resolver
        </p>
        <ol className="space-y-1 list-decimal list-inside text-[12.5px] text-stone-600 dark:text-stone-400">
          {fix.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function FaqSection() {
  return (
    <Section
      id="faq"
      icon={HelpCircle}
      title="Perguntas frequentes"
      eyebrow="13"
    >
      <Faq
        q="Posso responder cliente pelo celular?"
        a="Sim. Abra o mesmo endereço do sistema no navegador do celular. O layout se adapta automaticamente. Você recebe notificações no navegador enquanto a aba estiver aberta."
      />
      <Faq
        q="Se eu enviar mensagem pelo meu WhatsApp pessoal (não pelo painel), ela aparece no sistema?"
        a="Sim. Toda mensagem que sair da instância WhatsApp conectada é sincronizada, independente de onde saiu (painel ou celular). Aparece como bolha laranja com o status."
      />
      <Faq
        q="A IA pode fechar pedidos sozinha?"
        a="No momento, a IA monta o pedido e coleta os dados, mas a criação no Exato ainda é feita por atendente humano. Estamos trabalhando pra automatizar isso (Fase D do roadmap)."
      />
      <Faq
        q="Quanto custa a IA por mês?"
        a="Depende do volume. Cada mensagem gasta tokens da sua cota OpenAI (o modelo gpt-4o-mini custa ~US$ 0.15 por 1M tokens de input). Você vê o consumo em Configurações → IA. Em média, ~R$ 30-80/mês pra loja de porte médio."
      />
      <Faq
        q="Posso ter mais de uma loja no mesmo sistema?"
        a="Sim. Cada loja é um 'workspace' separado. Owners diferentes, dados isolados. Fale com o administrador se quiser abrir um workspace novo."
      />
      <Faq
        q="O que acontece se o sistema cair?"
        a="Mensagens que chegam durante a queda ficam guardadas no WhatsApp e no painel da Evolution. Quando o sistema voltar, elas são processadas. Não perde nada."
      />
      <Faq
        q="A senha do cliente Exato é segura?"
        a="Sim. É criptografada no banco com AES-256-GCM. Nem o time de desenvolvimento consegue ler."
      />
      <Faq
        q="Como convido a equipe?"
        a="Vá em Configurações → Equipe → Adicionar agente. Defina nome, e-mail e senha inicial. Passe pro atendente por canal seguro. Ele muda depois em Conta → Trocar senha."
      />
      <Faq
        q="Preciso ficar com o navegador aberto pra a IA funcionar?"
        a="Não. A IA roda no servidor. Mesmo com todo mundo offline, se chegar mensagem, a IA responde. Você só precisa abrir pra ver o que rolou e atender casos complexos."
      />
      <Faq
        q="A IA aprende sozinha?"
        a="Não aprende. O comportamento é definido pelo prompt em Configurações → IA. Se quiser que ela responda diferente, edite o prompt. Reflexo imediato na próxima mensagem."
      />
    </Section>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <details className="group rounded-lg border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-stone-900 p-4 mt-2 [&_summary::-webkit-details-marker]:hidden">
      <summary className="cursor-pointer flex items-start gap-2 text-[13.5px] font-semibold text-stone-900 dark:text-stone-50">
        <span className="h-5 w-5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-500 flex items-center justify-center shrink-0 mt-0.5 group-open:rotate-90 transition-transform">
          <ArrowRight className="h-3 w-3" />
        </span>
        <span>{q}</span>
      </summary>
      <p className="mt-3 ml-7 text-[13px] text-stone-600 dark:text-stone-400 leading-relaxed">
        {a}
      </p>
    </details>
  );
}

function Footer() {
  return (
    <footer className="border-t border-stone-200/80 dark:border-stone-800/80 pt-8 mt-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-[12.5px] font-semibold tracking-tight text-stone-900 dark:text-stone-50 flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-brand-600" />
            Garcia Sadler CRM
          </p>
          <p className="text-[11.5px] text-stone-500 mt-1">
            Manual do operador · versão 1.0
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg text-[12.5px] font-medium bg-brand-600 hover:bg-brand-700 text-white transition-colors"
          >
            Acessar o sistema <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </footer>
  );
}
