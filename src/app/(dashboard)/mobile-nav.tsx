"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X, LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/ui";
import { SidebarNav } from "./sidebar-nav";
import { signOutAction } from "./sign-out-action";

type Props = {
  userName: string;
  userRole: string;
  userInitial: string;
};

export function MobileNav({ userName, userRole, userInitial }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Fecha drawer ao navegar
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Trava scroll do body quando drawer aberto
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  return (
    <>
      {/* Topbar fixo no mobile */}
      <header className="md:hidden h-14 shrink-0 flex items-center gap-3 px-4 border-b border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-stone-900">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="p-2 -ml-2 rounded-md text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2.5">
          <div className="relative h-8 w-8 rounded-lg gradient-brand text-white flex items-center justify-center font-bold text-[13px] shadow-md shadow-brand-900/20 ring-1 ring-inset ring-white/15">
            G
            <span aria-hidden className="absolute inset-x-1.5 bottom-1.5 h-px bg-white/35 rounded-full" />
          </div>
          <p className="text-[14px] font-semibold tracking-tight text-stone-900 dark:text-stone-50">
            Garcia Sadler
          </p>
        </div>
      </header>

      {/* Drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-stone-900/50 dark:bg-black/60"
          />

          {/* Painel */}
          <aside className="relative w-72 max-w-[85vw] h-full bg-white dark:bg-stone-900 flex flex-col shadow-2xl animate-slide-in-left">
            <span aria-hidden className="absolute inset-x-0 top-0 h-[2px] rule-brand opacity-90" />
            {/* Header */}
            <div className="px-4 py-4 flex items-center justify-between border-b border-stone-200/80 dark:border-stone-800/80">
              <div className="flex items-center gap-3">
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
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-md text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                aria-label="Fechar menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <SidebarNav />

            {/* Footer user */}
            <div className="px-3 py-3 border-t border-stone-200/80 dark:border-stone-800/80">
              <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg">
                <div className="h-8 w-8 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-[11px] font-semibold flex items-center justify-center ring-1 ring-stone-200 dark:ring-stone-700">
                  {userInitial}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold truncate text-stone-900 dark:text-stone-50">
                    {userName}
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.08em] font-medium text-stone-500 truncate">
                    {userRole}
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
        </div>
      )}
    </>
  );
}
