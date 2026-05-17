type Props = {
  /**
   * `fixed`: cobre a viewport inteira. Use em telas standalone (login, register, error).
   * `absolute` (default): preenche o container parent — parent precisa de `position: relative`
   * + `overflow: hidden`. Use em páginas dentro de um layout existente (dashboard).
   */
  variant?: "fixed" | "absolute";
};

/**
 * Fundo cinematográfico animado.
 * Renderiza 3 manchas de cor (CSS animations) + noise sutil em overlay.
 */
export function AuroraBackground({ variant = "absolute" }: Props) {
  const cls = variant === "fixed" ? "is-fixed" : "";
  return (
    <>
      <div className={`aurora-bg ${cls}`} aria-hidden>
        <div className="aurora-blob" />
      </div>
      <div className={`aurora-noise ${cls}`} aria-hidden />
    </>
  );
}
