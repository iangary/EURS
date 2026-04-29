// 員工 API 客戶端 — http://172.16.105.117/emp
// FastAPI Swagger: /emp/docs#/
//
// 由於規格書尚未鎖定欄位名，採用「最小已知介面 + 最大相容」策略：
// - 嘗試常見欄位 (id/employee_id, name/cname, email, department/dept)
// - 連線失敗時回傳 null，由呼叫端 fallback 至本地 User 表

import { recordApiError, clearApiError } from "./api-health";

const BASE = process.env.EMP_API_BASE ?? "http://172.16.105.117/emp";
const API_KEY = process.env.SSO_API_KEY ?? "";

function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return API_KEY ? { ...extra, "X-API-Key": API_KEY } : extra;
}

export type Employee = {
  id: string;
  name: string;
  email: string;
  department: string;
};

function pickFirst<T>(o: any, keys: string[], fallback: T): T {
  for (const k of keys) {
    if (o?.[k] !== undefined && o[k] !== null && o[k] !== "") return o[k] as T;
  }
  return fallback;
}

function normalize(o: any): Employee | null {
  if (!o || typeof o !== "object") return null;
  const id = pickFirst<string>(o, ["id", "employee_id", "empId", "emp_id", "code"], "");
  if (!id) return null;
  return {
    id: String(id),
    name: pickFirst<string>(o, ["name", "cname", "chinese_name", "fullName", "full_name"], ""),
    email: pickFirst<string>(o, ["email", "mail"], ""),
    department: pickFirst<string>(o, ["department", "dept", "dept_name", "deptName", "site"], ""),
  };
}

async function safeJson(url: string): Promise<any | null> {
  try {
    const res = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
      headers: authHeaders(),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      await recordApiError("emp", res.status, `${res.status} ${text || res.statusText}`);
      return null;
    }
    await clearApiError("emp");
    return await res.json();
  } catch (e) {
    await recordApiError("emp", null, e instanceof Error ? e.message : String(e));
    return null;
  }
}

export async function getEmployee(id: string): Promise<Employee | null> {
  const data = await safeJson(`${BASE}/employees/${encodeURIComponent(id)}`);
  return data ? normalize(data) : null;
}

export async function searchEmployees(q: string): Promise<Employee[]> {
  if (!q.trim()) return [];
  const data = await safeJson(`${BASE}/employees?q=${encodeURIComponent(q)}`);
  if (!Array.isArray(data)) return [];
  return data.map(normalize).filter((x): x is Employee => x !== null);
}

export async function lookupByAcc(acc: string): Promise<Employee | null> {
  if (!acc.trim()) return null;
  try {
    const res = await fetch(`${BASE}/search`, {
      method: "POST",
      headers: authHeaders({ "content-type": "application/json" }),
      body: JSON.stringify({ Acc: acc }),
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      await recordApiError("emp", res.status, `${res.status} ${text || res.statusText}`);
      return null;
    }
    const json = await res.json();
    if (json?.result === false || !json?.data) {
      await clearApiError("emp");
      return null;
    }
    await clearApiError("emp");
    const d = json.data;
    const id = d.employee_no || d.acc || acc;
    const name = d.employee_name || d.name || "";
    if (!name) return null;
    return {
      id: String(id),
      name: String(name),
      email: String(d.email ?? ""),
      department: String(d.dept_name ?? d.cost_deptname ?? ""),
    };
  } catch (e) {
    await recordApiError("emp", null, e instanceof Error ? e.message : String(e));
    return null;
  }
}

export async function listEmployees(limit = 50): Promise<Employee[]> {
  const data = await safeJson(`${BASE}/employees?limit=${limit}`);
  if (!Array.isArray(data)) return [];
  return data.map(normalize).filter((x): x is Employee => x !== null);
}
