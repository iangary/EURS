import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { RequestDetail } from "@/components/RequestDetail";

export const dynamic = "force-dynamic";

export default async function MyRequestDetail({ params }: { params: { id: string } }) {
  const session = await requireUser();
  const r = await db.request.findUnique({
    where: { id: params.id },
    include: {
      items: true,
      attachments: true,
      logs: { orderBy: { changedAt: "asc" } },
      requester: true,
    },
  });
  if (!r) notFound();
  if (r.requesterId !== session.user.id && session.user.role !== "ADMIN") notFound();
  return <RequestDetail request={r as any} viewerRole={session.user.role} />;
}
