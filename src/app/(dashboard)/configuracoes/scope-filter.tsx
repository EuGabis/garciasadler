"use client";

/**
 * Select client-only pra filtrar logs por scope.
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
      className="ml-auto px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
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
