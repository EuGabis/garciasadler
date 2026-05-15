import { redirect } from "next/navigation";
import Link from "next/link";
import { auth, signOut } from "@/auth";
import {
  LayoutDashboard,
  MessagesSquare,
  Users,
  Tag,
  Columns3,
  BarChart3,
  Zap,
  Settings,
  LogOut,
  Sparkles,
  UserCog,
} from "lucide-react";
import { Notifications } from "./notifications";
import { ThemeToggle } from "@/components/ui";

const nav = [
  { href: "/dashboard", label: "Visão geral", icon: LayoutDashboard },
  { href: "/conversations", label: "Conversas", icon: MessagesSquare },
  { href: "/contatos", label: "Contatos", icon: Users },
  { href: "/pipeline", label: "Pipeline", icon: Columns3 },
  { href: "/etiquetas", label: "Etiquetas", icon: Tag },
  { href: "/respostas-rapidas", label: "Respostas rápidas", icon: Sparkles },
  { href: "/automacoes", label: "Automações", icon: Zap },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/equipe", label: "Equipe", icon: UserCog },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const initial = session.user.name?.[0]?.toUpperCase() ?? "?";

  return (
    <div className="h-screen flex bg-slate-100 dark:bg-slate-950 overflow-hidden">
      <Notifications workspaceId={session.user.workspaceId} />

      <aside className="hidden md:flex w-64 shrink-0 gradient-brand-navy text-slate-100 flex-col">
        <div className="px-5 py-5 flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-brand-orange-500 text-white flex items-center justify-center font-extrabold">
            G
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold tracking-tight leading-tight">Garcia Sadler</p>
            <p className="text-[10px] uppercase tracking-wider text-brand-orange-300 leading-tight">
              CRM Atendimento
            </p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-300 hover:bg-white/10 hover:text-white transition"
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{label}</span>
            </Link>
          ))}
        </nav>

        <div className="px-3 py-3 border-t border-white/10">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg">
            <div className="h-9 w-9 rounded-full bg-brand-orange-500 text-white text-xs font-bold flex items-center justify-center shadow-md shadow-brand-orange-500/30">
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate text-white">{session.user.name}</p>
              <p className="text-[10px] uppercase tracking-wider text-brand-orange-300 truncate">
                {session.user.role}
              </p>
            </div>
            <ThemeToggle />
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
            className="mt-1"
          >
            <button
              type="submit"
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-red-300 hover:bg-red-500/10 transition"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sair
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-y-auto bg-slate-50 dark:bg-slate-950">
        {children}
      </main>
    </div>
  );
}
