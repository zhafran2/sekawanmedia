import type { Booking, Approval } from "@/types/models";

type Status = Booking["status"] | Approval["status"];

export function StatusPill({ status }: { status: Status }) {
  const tone =
    status === "approved"
      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
      : status === "waiting"
        ? "bg-amber-100 text-amber-700 border-amber-200"
        : "bg-rose-100 text-rose-700 border-rose-200";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-1 text-[11px] font-semibold ${tone}`}
    >
      {status}
    </span>
  );
}

