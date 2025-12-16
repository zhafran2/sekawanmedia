type Tone = "emerald" | "amber" | "rose" | "blue";

export function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: Tone;
}) {
  const tones: Record<Tone, string> = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    rose: "bg-rose-50 text-rose-700 border-rose-100",
    blue: "bg-blue-50 text-blue-700 border-blue-100",
  };
  return (
    <div
      className={`rounded-2xl border p-4 shadow-sm ${tones[tone]} flex flex-col gap-1`}
    >
      <span className="text-xs font-semibold uppercase tracking-wide">
        {label}
      </span>
      <span className="text-2xl font-bold">{value}</span>
    </div>
  );
}

