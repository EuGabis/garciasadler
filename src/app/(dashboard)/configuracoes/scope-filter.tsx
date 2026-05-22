"use client";

/**
 * Select client-only para filtrar logs por scope.
 * Isolado em arquivo separado porque o resto do LogsTab é server-rendered.
 * Sem "use client" aqui, o onChange explode no React 19 Server Components:
 *   "Event handlers cannot be passed to Client Component props"
 */
export function ScopeFilter({
  scopes,
  active,
}: {
  scopes: string[];
  active?: string;
}) {
  return (
    <select
      defaultValue={active ?? ""}
      onChange={(e) => {
        const url = new URL(window.location.href);
        if (e.target.value) url.searchParams.set("scope", e.target.value);
        else url.searchParams.delete("scope");
        window.location.href = url.toString();
      }}
      className="h-7 px-2.5 pr-7 rounded-md text-[11.5px] font-medium border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 cursor-pointer"
    >
      <option value="">Todos os escopos</option>
      {scopes.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}
