"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DayPicker } from "react-day-picker";
import { format } from "date-fns";
import "react-day-picker/style.css";
import { TYPE_LABEL, STATUS_LABEL, STATUS_BADGE_CLASS } from "@/lib/labels";
import { RequestDetailModal } from "./RequestDetailModal";
import { useT, useTEnum, useFormat } from "@/i18n/client";

type Req = {
  id: string;
  requestNo: string;
  type: keyof typeof TYPE_LABEL;
  status: keyof typeof STATUS_LABEL;
  requesterName: string;
  siteOrDept: string;
  submittedAt: string;
  shippedAt: string | null;
  items: any[];
};

export function AdminRequestList() {
  const t = useT();
  const tEnum = useTEnum();
  const fmt = useFormat();
  const [list, setList] = useState<Req[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [modalId, setModalId] = useState<string | null>(null);
  const [datesOpen, setDatesOpen] = useState(false);
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const dateBtnRef = useRef<HTMLButtonElement | null>(null);
  const datePopRef = useRef<HTMLDivElement | null>(null);
  const [datePos, setDatePos] = useState<{ top: number; left: number } | null>(null);

  const [fNo, setFNo] = useState("");
  const [fType, setFType] = useState<string>("");
  const [fRequester, setFRequester] = useState("");
  const [fDept, setFDept] = useState("");
  const [fStatus, setFStatus] = useState<string>("");

  const params = useMemo(() => {
    const sp = new URLSearchParams();
    if (selectedDates.size > 0) {
      sp.set("dates", Array.from(selectedDates).join(","));
    }
    return sp.toString();
  }, [selectedDates]);

  async function load() {
    setBusy(true);
    const res = await fetch(`/api/admin/requests?${params}`);
    setBusy(false);
    if (res.ok) setList(await res.json());
  }
  useEffect(() => {
    load();
  }, [params]);

  function toggle(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function ship(id: string) {
    if (!confirm(t("adminReq.confirm.ship"))) return;
    const res = await fetch(`/api/requests/${id}/ship`, { method: "POST" });
    if (res.ok) load();
    else alert(t("common.fail"));
  }

  async function reject(id: string, requestNo: string) {
    const reason = prompt(t("adminReq.prompt.reject", { requestNo }));
    if (!reason || !reason.trim()) return;
    const res = await fetch(`/api/requests/${id}/reject`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reason: reason.trim() }),
    });
    if (res.ok) load();
    else alert(t("common.fail"));
  }

  async function batchShip() {
    if (selected.size === 0) return;
    if (!confirm(t("adminReq.confirm.batchShip", { count: selected.size }))) return;
    const res = await fetch(`/api/requests/batch-ship`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selected) }),
    });
    if (res.ok) {
      setSelected(new Set());
      load();
    } else alert(t("common.fail"));
  }

  const selectedDateObjs = useMemo(
    () => Array.from(selectedDates).map((s) => new Date(s + "T00:00:00")),
    [selectedDates]
  );

  function handleDateSelect(d: Date[] | undefined) {
    setSelectedDates(new Set((d ?? []).map((x) => format(x, "yyyy-MM-dd"))));
  }

  function openDatePicker() {
    const r = dateBtnRef.current?.getBoundingClientRect();
    if (r) setDatePos({ top: r.bottom + 4, left: r.left });
    setDatesOpen(true);
  }

  useEffect(() => {
    if (!datesOpen) return;
    function reposition() {
      const r = dateBtnRef.current?.getBoundingClientRect();
      if (r) setDatePos({ top: r.bottom + 4, left: r.left });
    }
    function onDown(e: MouseEvent) {
      const t = e.target as Node;
      if (datePopRef.current?.contains(t) || dateBtnRef.current?.contains(t)) return;
      setDatesOpen(false);
    }
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    document.addEventListener("mousedown", onDown);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
      document.removeEventListener("mousedown", onDown);
    };
  }, [datesOpen]);

  const filtered = useMemo(() => {
    const norm = (s: string) => s.toLowerCase().trim();
    return list.filter((r) => {
      if (fNo && !norm(r.requestNo).includes(norm(fNo))) return false;
      if (fType && r.type !== fType) return false;
      if (fRequester && !norm(r.requesterName).includes(norm(fRequester))) return false;
      if (fDept && !norm(r.siteOrDept).includes(norm(fDept))) return false;
      if (fStatus && r.status !== fStatus) return false;
      return true;
    });
  }, [list, fNo, fType, fRequester, fDept, fStatus]);

  return (
    <div className="space-y-3">
      <div className="card">
        <div className="card-header flex items-center justify-between gap-3 flex-wrap">
          <span className="font-medium">{t("adminReq.list.title", { count: filtered.length })}</span>
          <button
            className="btn btn-primary"
            onClick={batchShip}
            disabled={selected.size === 0}
          >
            {t("adminReq.btn.batchShip", { count: selected.size })}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="p-2"></th>
                <th className="p-2">{t("adminReq.col.requestNo")}</th>
                <th className="p-2">{t("adminReq.col.date")}</th>
                <th className="p-2">{t("adminReq.col.type")}</th>
                <th className="p-2">{t("adminReq.col.requester")}</th>
                <th className="p-2">{t("adminReq.col.dept")}</th>
                <th className="p-2">{t("adminReq.col.status")}</th>
                <th className="p-2"></th>
              </tr>
              <tr className="bg-white border-t">
                <th className="p-1"></th>
                <th className="p-1">
                  <input
                    className="input !py-1 !px-2 text-xs"
                    placeholder={t("common.searchPlaceholder")}
                    value={fNo}
                    onChange={(e) => setFNo(e.target.value)}
                  />
                </th>
                <th className="p-1">
                  <button
                    ref={dateBtnRef}
                    type="button"
                    className="input !py-1 !px-2 text-xs w-full text-left"
                    onClick={() => (datesOpen ? setDatesOpen(false) : openDatePicker())}
                  >
                    {selectedDates.size === 0
                      ? t("adminReq.filter.dateAll")
                      : selectedDates.size === 1
                      ? Array.from(selectedDates)[0]
                      : t("adminReq.filter.dateSelected", { count: selectedDates.size })}
                    <span className="float-right">▾</span>
                  </button>
                </th>
                <th className="p-1">
                  <select
                    className="select !py-1 !px-2 text-xs"
                    value={fType}
                    onChange={(e) => setFType(e.target.value)}
                  >
                    <option value="">{t("adminReq.filter.typeAll")}</option>
                    {Object.keys(TYPE_LABEL).map((k) => (
                      <option key={k} value={k}>
                        {tEnum.type(k as keyof typeof TYPE_LABEL)}
                      </option>
                    ))}
                  </select>
                </th>
                <th className="p-1">
                  <input
                    className="input !py-1 !px-2 text-xs"
                    placeholder={t("common.searchPlaceholder")}
                    value={fRequester}
                    onChange={(e) => setFRequester(e.target.value)}
                  />
                </th>
                <th className="p-1">
                  <input
                    className="input !py-1 !px-2 text-xs"
                    placeholder={t("common.searchPlaceholder")}
                    value={fDept}
                    onChange={(e) => setFDept(e.target.value)}
                  />
                </th>
                <th className="p-1">
                  <select
                    className="select !py-1 !px-2 text-xs"
                    value={fStatus}
                    onChange={(e) => setFStatus(e.target.value)}
                  >
                    <option value="">{t("adminReq.filter.statusAll")}</option>
                    {Object.keys(STATUS_LABEL).map((k) => (
                      <option key={k} value={k}>
                        {tEnum.status(k as keyof typeof STATUS_LABEL)}
                      </option>
                    ))}
                  </select>
                </th>
                <th className="p-1"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {busy && (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-400">
                    {t("common.loading")}
                  </td>
                </tr>
              )}
              {!busy && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-400">
                    {t("common.noData")}
                  </td>
                </tr>
              )}
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="p-2">
                    <input
                      type="checkbox"
                      checked={selected.has(r.id)}
                      onChange={() => toggle(r.id)}
                    />
                  </td>
                  <td className="p-2 font-mono">
                    <button
                      className="text-brand-600 hover:underline"
                      onClick={() => setModalId(r.id)}
                    >
                      {r.requestNo}
                    </button>
                  </td>
                  <td className="p-2">
                    {fmt.date(r.submittedAt)}
                  </td>
                  <td className="p-2">{tEnum.type(r.type)}</td>
                  <td className="p-2">{r.requesterName}</td>
                  <td className="p-2">{r.siteOrDept}</td>
                  <td className="p-2">
                    <span className={`badge ${STATUS_BADGE_CLASS[r.status]}`}>
                      {tEnum.status(r.status)}
                    </span>
                  </td>
                  <td className="p-2 text-right whitespace-nowrap">
                    {r.status === "APPLYING" && (
                      <div className="flex gap-1 justify-end">
                        <button
                          className="btn btn-outline text-xs"
                          onClick={() => ship(r.id)}
                        >
                          {t("adminReq.btn.markShipped")}
                        </button>
                        <button
                          className="btn btn-danger text-xs"
                          onClick={() => reject(r.id, r.requestNo)}
                        >
                          {t("adminReq.btn.reject")}
                        </button>
                      </div>
                    )}
                    {r.status === "SHIPPED" && (
                      <span className="text-emerald-700 text-xs">{t("adminReq.tag.shipped")}</span>
                    )}
                    {r.status === "REJECTED" && (
                      <span className="text-rose-700 text-xs">{t("adminReq.tag.rejected")}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {datesOpen && datePos && typeof document !== "undefined" &&
        createPortal(
          <div
            ref={datePopRef}
            className="bg-white border border-slate-200 rounded-md shadow-lg p-2"
            style={{ position: "fixed", top: datePos.top, left: datePos.left, zIndex: 50 }}
          >
            <DayPicker
              mode="multiple"
              selected={selectedDateObjs}
              onSelect={handleDateSelect}
              captionLayout="dropdown"
            />
            <div className="flex justify-between text-xs px-1 pt-1 border-t">
              <button
                className="hover:underline text-slate-500"
                onClick={() => setSelectedDates(new Set())}
              >
                {t("adminReq.datePicker.clear")}
              </button>
              <button
                className="hover:underline text-slate-500"
                onClick={() => setDatesOpen(false)}
              >
                {t("adminReq.datePicker.close")}
              </button>
            </div>
          </div>,
          document.body
        )
      }

      {modalId && (
        <RequestDetailModal
          id={modalId}
          onClose={() => {
            setModalId(null);
            load();
          }}
        />
      )}
    </div>
  );
}
