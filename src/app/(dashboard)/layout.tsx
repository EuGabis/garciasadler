import { redirect } from "next/navigation";
import Link from "next/link";
import { auth, signOut } from "@/auth";
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  Tag,
  Kanban,
  BarChart3,
  Zap,
  Settings,
  LogOut,
} from "lucide-react";

const nav = [
  { href: "/dashboard", label: "Visão geral", icon: LayoutDashboard },
  { href: "/conversations", label: "Conversas", icon: MessageSquare },
  { href: "/contatos", label: "Contatos", icon: Users },
  { href: "/pipeline", label: "Pipeline", icon: Kanban },
  { href: "/etiquetas", label: "Etiquetas", icon: Tag },
  { href: "/automacoes", label: "Automações", icon: Zap },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="min-h-screen flex bg-zinc-50 dark:bg-zinc-950">
      <aside className="w-60 shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col">
        <div className="px-5 py-5 border-b border-zinc-200 dark:border-zinc-800">
          <h1 className="text-base font-bold tracking-tight">Garcia Sadler</h1>
          <p className="text-xs text-zinc-500 mt-0.5">CRM de atendimento</p>
        </div>

        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="px-3 py-3 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg">
            <div className="h-8 w-8 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
              {session.user.name?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{session.user.name}</p>
              <p className="text-xs text-zinc-500 truncate">{session.user.role}</p>
            </div>
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="mt-1 w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-y-auto">{children}</main>
    </div>
  );
}
