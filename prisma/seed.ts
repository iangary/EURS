import { PrismaClient, Role } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  // 系統參數預設值
  const settings: Record<string, string> = {
    BANK_BRANCH: "中崙分行",
    BANK_ACCOUNT: "045-031-0000-1898",
    SHOE_SIZES: JSON.stringify([36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46]),
    BLOOD_TYPES: JSON.stringify(["A", "B", "O", "AB"]),
    TOP_SIZES: JSON.stringify(["S", "M", "L", "XL", "2XL", "3XL"]),
    PANTS_WAIST: JSON.stringify(Array.from({ length: 41 }, (_, i) => 70 + i)),
    PANTS_LENGTH: JSON.stringify(Array.from({ length: 21 }, (_, i) => 70 + i)),
    ADMIN_NOTIFY_EMAILS: JSON.stringify(["admin@example.com"]),
    ADMIN_EMPLOYEE_IDS: JSON.stringify(["A001"]),
  };
  for (const [key, value] of Object.entries(settings)) {
    await db.systemSetting.upsert({
      where: { key },
      update: {},
      create: { key, value },
    });
  }

  // 範例使用者（離線時可作為登入清單）
  const users = [
    { id: "A001", name: "王總務", email: "a001@example.com", department: "總務部", role: Role.ADMIN },
    { id: "E101", name: "陳工地", email: "e101@example.com", department: "新北一工地", role: Role.REQUESTER },
    { id: "E102", name: "林工地", email: "e102@example.com", department: "新北一工地", role: Role.REQUESTER },
    { id: "E201", name: "黃部門", email: "e201@example.com", department: "工務部", role: Role.REQUESTER },
  ];
  for (const u of users) {
    await db.user.upsert({ where: { id: u.id }, update: u, create: u });
  }

  console.log("Seed 完成");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
