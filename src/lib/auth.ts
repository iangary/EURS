import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "./db";
import { getEmployee } from "./emp-api";
import { getSettingJson, SettingKeys } from "./settings";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      department: string;
      role: "REQUESTER" | "ADMIN";
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid: string;
    department: string;
    role: "REQUESTER" | "ADMIN";
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      // 第一階段：模擬登入。輸入員工編號即登入。
      // 未來可在此處替換為 Azure AD / LDAP / Header SSO。
      name: "員工編號登入",
      credentials: { employeeId: { label: "員工編號", type: "text" } },
      async authorize(credentials) {
        const id = credentials?.employeeId?.trim();
        if (!id) return null;

        // 1) 嘗試從 /emp 取得最新員工資訊
        const emp = await getEmployee(id);

        // 2) 對應到本地 User（不存在則建立 / 更新）
        const adminIds = await getSettingJson<string[]>(SettingKeys.ADMIN_EMPLOYEE_IDS, []);
        const role = adminIds.includes(id) ? "ADMIN" : "REQUESTER";

        const local = await db.user.findUnique({ where: { id } });
        if (emp) {
          await db.user.upsert({
            where: { id },
            update: {
              name: emp.name || local?.name || id,
              email: emp.email || local?.email || "",
              department: emp.department || local?.department || "",
              role,
            },
            create: {
              id,
              name: emp.name || id,
              email: emp.email,
              department: emp.department,
              role,
            },
          });
        } else if (!local) {
          // 連線失敗且本地無此人 → 拒絕登入
          return null;
        } else if (local.role !== role) {
          await db.user.update({ where: { id }, data: { role } });
        }

        const u = await db.user.findUnique({ where: { id } });
        if (!u) return null;
        return { id: u.id, name: u.name, email: u.email, department: u.department, role: u.role } as any;
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 60, // 30 分鐘閒置自動登出（§2.2）
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as any;
        token.uid = u.id;
        token.name = u.name;
        token.email = u.email;
        token.department = u.department;
        token.role = u.role;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        id: token.uid,
        name: token.name as string,
        email: token.email as string,
        department: token.department,
        role: token.role,
      };
      return session;
    },
  },
  pages: { signIn: "/login" },
  secret: process.env.NEXTAUTH_SECRET,
};
