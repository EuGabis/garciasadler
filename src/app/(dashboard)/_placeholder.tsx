type Props = {
  title: string;
  description: string;
  phase: string;
};

export function Placeholder({ title, description, phase }: Props) {
  return (
    <div className="p-8 max-w-3xl">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </header>
      <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center">
        <p className="text-sm text-slate-500">
          Esta tela será implementada na <span className="font-medium">{phase}</span>.
        </p>
      </div>
    </div>
  );
}
