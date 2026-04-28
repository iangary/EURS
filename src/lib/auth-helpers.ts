import { getServerSession, type Session } from "next-auth";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { authOptions } from "./auth";

export async function getSession(): Promise<Session | null> {
  return getServerSession(authOptions);
}

/** 頁面用：未登入導去 /login，回傳 session */
export async function requireUser(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

/** 頁面用：非 ADMIN 導去 / */
export async function requireAdminPage(): Promise<Session> {
  const s = await requireUser();
  if (s.user.role !== "ADMIN") redirect("/");
  return s;
}

/** API 用：未登入回 401 */
export async function apiRequireUser(): Promise<Session | NextResponse> {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "未登入" }, { status: 401 });
  return s;
}

export async function apiRequireAdmin(): Promise<Session | NextResponse> {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "未登入" }, { status: 401 });
  if (s.user.role !== "ADMIN") return NextResponse.json({ error: "無權限" }, { status: 403 });
  return s;
}
