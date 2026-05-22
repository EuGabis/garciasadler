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
      {NAV.map(({ href, label, icon: Icon }) => {
        const isActive =
          href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            className={`relative flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-colors ${
              isActive
                ? "bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-50"
                : "text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800/60 hover:text-stone-900 dark:hover:text-stone-100"
            }`}
          >
            {isActive && (
              <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-brand-600" />
            )}
            <Icon
              className={`h-4 w-4 shrink-0 ${
                isActive ? "text-brand-600" : "text-stone-400"
              }`}
            />
            <span className="truncate">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
