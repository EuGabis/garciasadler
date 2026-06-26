import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LogOut } from "lucide-react";
import { Notifications } from "./notifications";
import { ThemeToggle } from "@/components/ui";
import { SidebarNav } from "./sidebar-nav";
import { MobileNav } from "./mobile-nav";
import { signOutAction } from "./sign-out-action";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const initial = session.user.name?.[0]?.toUpperCase() ?? "?";

  return (
    <div className="h-screen flex flex-col md:flex-row bg-stone-50 dark:bg-stone-950 overflow-hidden">
      <Notifications workspaceId={session.user.workspaceId} />

      <MobileNav
        userName={session.user.name ?? ""}
        userRole={session.user.role}
        userInitial={initial}
      />

      <aside className="hidden md:flex w-60 shrink-0 border-r border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-stone-900 flex-col relative">
        {/* Fio-fundação no topo do shell */}
        <span aria-hidden className="absolute inset-x-0 top-0 h-[2px] rule-brand opacity-90" />

        {/* Brand */}
        <div className="px-4 py-5 flex items-center gap-3">
          <div className="relative h-9 w-9 rounded-xl gradient-brand text-white flex items-center justify-center font-bold text-[15px] shadow-md shadow-brand-900/20 ring-1 ring-inset ring-white/15">
            G
            <span aria-hidden className="absolute inset-x-[7px] bottom-[7px] h-px bg-white/35 rounded-full" />
          </div>
          <div className="min-w-0">
            <p className="text-[13.5px] font-semibold tracking-tight text-stone-900 dark:text-stone-50 leading-tight">
              Garcia Sadler
            </p>
            <p className="text-[10px] uppercase tracking-[0.14em] font-semibold text-brand-600/80 dark:text-brand-400/80 leading-tight mt-0.5">
              CRM · Atendimento
            </p>
          </div>
        </div>

        <SidebarNav />

        {/* User card */}
        <div className="px-3 py-3 border-t border-stone-200/80 dark:border-stone-800/80">
          <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg">
            <div className="h-8 w-8 rounded-full bg-brand-50 dark:bg-brand-500/15 text-brand-700 dark:text-brand-400 text-[11px] font-bold flex items-center justify-center ring-1 ring-brand-600/15 dark:ring-brand-400/20">
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold truncate text-stone-900 dark:text-stone-50">
                {session.user.name}
              </p>
              <p className="text-[10px] uppercase tracking-[0.08em] font-medium text-stone-500 truncate">
                {session.user.role}
              </p>
            </div>
            <ThemeToggle />
          </div>
          <form action={signOutAction} className="mt-1">
            <button
              type="submit"
              className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-[12px] font-medium text-stone-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sair
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 min-w-0 min-h-0 overflow-y-auto bg-stone-50 dark:bg-stone-950">
        {children}
      </main>
    </div>
  );
}
