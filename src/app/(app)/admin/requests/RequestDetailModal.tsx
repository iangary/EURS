"use client";

import { useEffect, useState } from "react";
import { RequestDetail } from "@/components/RequestDetail";
import { useT } from "@/i18n/client";

export function RequestDetailModal({
  id,
  onClose,
}: {
  id: string;
  onClose: () => void;
}) {
  const t = useT();
  const [data, setData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setError(null);
      const res = await fetch(`/api/requests/${id}`);
      if (cancelled) return;
      if (!res.ok) {
        setError(t("detail.loadFailed"));
        return;
      }
      setData(await res.json());
    })();
    return () => {
      cancelled = true;
    };
  }, [id, t]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <span className="font-semibold">{t("detail.modalTitle")}</span>
          <button
            className="text-slate-400 hover:text-slate-700 text-xl leading-none"
            onClick={onClose}
            aria-label={t("common.close")}
          >
            ×
          </button>
        </div>
        <div className="p-5">
          {error && <div className="text-rose-600 text-sm">{error}</div>}
          {!data && !error && (
            <div className="text-slate-400 text-sm py-10 text-center">{t("common.loading")}</div>
          )}
          {data && <RequestDetail request={data} viewerRole="ADMIN" />}
        </div>
      </div>
    </div>
  );
}
