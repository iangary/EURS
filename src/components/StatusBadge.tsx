import { STATUS_LABEL, STATUS_BADGE_CLASS } from "@/lib/labels";

export function StatusBadge({ status }: { status: keyof typeof STATUS_LABEL }) {
  return <span className={`badge ${STATUS_BADGE_CLASS[status]}`}>{STATUS_LABEL[status]}</span>;
}
