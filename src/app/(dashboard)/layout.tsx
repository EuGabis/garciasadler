import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { LogOut } from "lucide-react";
import { Notifications } from "./notifications";
import { ThemeToggle } from "@/components/ui";
import { SidebarNav } from "./sidebar-nav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const initial = session.user.name?.[0]?.toUpperCase() ?? "?";

  return (
    <div className="h-screen flex bg-stone-50 dark:bg-stone-950 overflow-hidden">
      <Notifications workspaceId={session.user.workspaceId} />

      <aside className="hidden md:flex w-60 shrink-0 border-r border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-stone-900 flex-col">
        {/* Brand */}
        <div className="px-4 py-5 flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
            G
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold tracking-tight text-stone-900 dark:text-stone-50 leading-tight">
              Garcia Sadler
            </p>
            <p className="text-[10px] uppercase tracking-[0.08em] font-medium text-stone-500 leading-tight mt-0.5">
              CRM
            </p>
          </div>
        </div>

        <SidebarNav />

        {/* User card */}
        <div className="px-3 py-3 border-t border-stone-200/80 dark:border-stone-800/80">
          <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg">
            <div className="h-8 w-8 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-[11px] font-semibold flex items-center justify-center ring-1 ring-stone-200 dark:ring-stone-700">
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
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
            className="mt-1"
          >
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

      <main className="flex-1 min-w-0 overflow-y-auto bg-stone-50 dark:bg-stone-950">
        {children}
      </main>
    </div>
  );
}
