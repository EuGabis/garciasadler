type ClassValue = string | number | null | undefined | false | ClassValue[];

export function cn(...inputs: ClassValue[]): string {
  const out: string[] = [];
  const stack: ClassValue[] = [...inputs];
  while (stack.length > 0) {
    const v = stack.shift();
    if (!v) continue;
    if (Array.isArray(v)) {
      stack.unshift(...v);
      continue;
    }
    out.push(String(v));
  }
  return out.join(" ");
}
