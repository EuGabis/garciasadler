"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessagesSquare,
  Users,
  Tag,
  Columns3,
  BarChart3,
  Settings,
} from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Visão geral", icon: LayoutDashboard },
  { href: "/conversations", label: "Conversas", icon: MessagesSquare },
  { href: "/contatos", label: "Contatos", icon: Users },
  { href: "/pipeline", label: "Pipeline", icon: Columns3 },
  { href: "/etiquetas", label: "Etiquetas", icon: Tag },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

export function SidebarNav() {
  const pathname = usePathname() ?? "";

  return (
    <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
      <p className="px-3 pt-1 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-400 dark:text-stone-500">
        Navegação
      </p>
      {NAV.map(({ href, label, icon: Icon }) => {
        const isActive =
          href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={`group relative flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-colors ${
              isActive
                ? "bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300"
                : "text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800/60 hover:text-stone-900 dark:hover:text-stone-100"
            }`}
          >
            {isActive && (
              <span aria-hidden className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full rule-brand" />
            )}
            <Icon
              className={`h-4 w-4 shrink-0 transition-colors ${
                isActive
                  ? "text-brand-600 dark:text-brand-400"
                  : "text-stone-400 group-hover:text-stone-500 dark:group-hover:text-stone-300"
              }`}
            />
            <span className="truncate">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
