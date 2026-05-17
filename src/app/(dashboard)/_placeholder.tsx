import { PageHeader } from "@/components/ui";

type Props = {
  title: string;
  description: string;
  phase: string;
};

export function Placeholder({ title, description, phase }: Props) {
  return (
    <div className="p-6 lg:p-10 max-w-3xl mx-auto text-stone-100">
      <PageHeader title={title} description={description} />
      <div className="rounded-2xl glass-light border-dashed border-2 border-white/10 p-12 text-center">
        <p className="text-sm text-stone-400">
          Esta tela será implementada na <span className="font-medium text-brand-300">{phase}</span>.
        </p>
      </div>
    </div>
  );
}
