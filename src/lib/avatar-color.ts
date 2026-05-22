/**
 * Gera cores de avatar consistentes por nome.
 * Mesmo nome sempre cai na mesma paleta — útil pra identificar contatos de relance.
 * Paleta dessaturada (não-saturada) pra manter ar profissional.
 */
const PALETTE = [
  { bg: "bg-rose-100 dark:bg-rose-500/15", text: "text-rose-700 dark:text-rose-300", ring: "ring-rose-200/60 dark:ring-rose-500/20" },
  { bg: "bg-orange-100 dark:bg-orange-500/15", text: "text-orange-700 dark:text-orange-300", ring: "ring-orange-200/60 dark:ring-orange-500/20" },
  { bg: "bg-amber-100 dark:bg-amber-500/15", text: "text-amber-700 dark:text-amber-300", ring: "ring-amber-200/60 dark:ring-amber-500/20" },
  { bg: "bg-emerald-100 dark:bg-emerald-500/15", text: "text-emerald-700 dark:text-emerald-300", ring: "ring-emerald-200/60 dark:ring-emerald-500/20" },
  { bg: "bg-teal-100 dark:bg-teal-500/15", text: "text-teal-700 dark:text-teal-300", ring: "ring-teal-200/60 dark:ring-teal-500/20" },
  { bg: "bg-sky-100 dark:bg-sky-500/15", text: "text-sky-700 dark:text-sky-300", ring: "ring-sky-200/60 dark:ring-sky-500/20" },
  { bg: "bg-indigo-100 dark:bg-indigo-500/15", text: "text-indigo-700 dark:text-indigo-300", ring: "ring-indigo-200/60 dark:ring-indigo-500/20" },
  { bg: "bg-violet-100 dark:bg-violet-500/15", text: "text-violet-700 dark:text-violet-300", ring: "ring-violet-200/60 dark:ring-violet-500/20" },
  { bg: "bg-fuchsia-100 dark:bg-fuchsia-500/15", text: "text-fuchsia-700 dark:text-fuchsia-300", ring: "ring-fuchsia-200/60 dark:ring-fuchsia-500/20" },
];

export type AvatarColor = (typeof PALETTE)[number];

export function avatarColor(name: string | null | undefined): AvatarColor {
  const s = (name ?? "?").trim().toLowerCase();
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash * 31 + s.charCodeAt(i)) | 0;
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export function avatarInitial(name: string | null | undefined): string {
  return name?.trim()?.[0]?.toUpperCase() ?? "?";
}
