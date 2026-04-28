import { PrismaClient, Role, RequestType, RequestStatus, BloodType, Gender, UniformAction } from "@prisma/client";
import fs from "fs";
import path from "path";

const db = new PrismaClient();

type Emp = { employee_no: string; employee_name: string; dept_name?: string };

function loadEmployees(): Emp[] {
  const p = path.join(__dirname, "data", "employees.json");
  const raw = JSON.parse(fs.readFileSync(p, "utf-8"));
  const data = raw.data ?? raw;
  return Object.values(data) as Emp[];
}

function makeRng(seedStr: string) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let s = h >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

const rng = makeRng("EURS-DEMO");
const rand = (max: number) => Math.floor(rng() * max);
const pick = <T,>(arr: T[]): T => arr[rand(arr.length)];
const weightedPick = <T,>(items: { item: T; w: number }[]): T => {
  const total = items.reduce((s, x) => s + x.w, 0);
  let r = rng() * total;
  for (const x of items) { if ((r -= x.w) <= 0) return x.item; }
  return items[items.length - 1].item;
};

async function main() {
  const employees = loadEmployees();
  console.log(`載入 ${employees.length} 筆員工資料`);

  // 1. 清除既有業務資料（依 FK 順序）
  await db.statusLog.deleteMany();
  await db.attachment.deleteMany();
  await db.requestItem.deleteMany();
  await db.request.deleteMany();
  await db.user.deleteMany();
  console.log("已清除既有資料");

  // 2. 重新 upsert SystemSetting
  const settings: Record<string, string> = {
    BANK_BRANCH: "中崙分行",
    BANK_ACCOUNT: "045-031-0000-1898",
    SHOE_SIZES: JSON.stringify([36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46]),
    BLOOD_TYPES: JSON.stringify(["A", "B", "O", "AB"]),
    TOP_SIZES: JSON.stringify(["S", "M", "L", "XL", "2XL", "3XL"]),
    PANTS_WAIST: JSON.stringify([28, 30, 32, 34, 36, 38, 40, 42]),
    PANTS_LENGTH: JSON.stringify([28, 30, 32, 34, 36]),
    ADMIN_NOTIFY_EMAILS: JSON.stringify(["admin@example.com"]),
    ADMIN_EMPLOYEE_IDS: JSON.stringify(["RT024898"]),
  };
  for (const [key, value] of Object.entries(settings)) {
    await db.systemSetting.upsert({ where: { key }, update: { value }, create: { key, value } });
  }

  // 3. 建 4 位 User
  const empMap = new Map(employees.map((e) => [e.employee_no, e]));
  const adminId = "RT024898";
  const adminEmp = empMap.get(adminId);
  const adminUser = {
    id: adminId,
    name: adminEmp?.employee_name ?? "系統管理員",
    email: `${adminId.toLowerCase()}@example.com`,
    department: adminEmp?.dept_name ?? "資訊部",
    role: Role.ADMIN,
  };

  const others = employees.filter((e) => e.employee_no !== adminId);
  const requesterPicks: Emp[] = [];
  while (requesterPicks.length < 3 && others.length > 0) {
    const idx = rand(others.length);
    requesterPicks.push(others.splice(idx, 1)[0]);
  }
  const requesterUsers = requesterPicks.map((e) => ({
    id: e.employee_no,
    name: e.employee_name,
    email: `${e.employee_no.toLowerCase()}@example.com`,
    department: e.dept_name ?? "未指定",
    role: Role.REQUESTER,
  }));

  const allUsers = [adminUser, ...requesterUsers];
  for (const u of allUsers) {
    await db.user.create({ data: u });
  }
  console.log(`已建立 ${allUsers.length} 位 User: ${allUsers.map((u) => `${u.id}(${u.role})`).join(", ")}`);

  // 4. 生成虛擬 Requests
  const shoeSizes = JSON.parse(settings.SHOE_SIZES) as number[];
  const topSizes = JSON.parse(settings.TOP_SIZES) as string[];
  const pantsWaists = JSON.parse(settings.PANTS_WAIST) as number[];
  const pantsLengths = JSON.parse(settings.PANTS_LENGTH) as number[];
  const types: RequestType[] = [RequestType.HELMET, RequestType.SHOES, RequestType.UNIFORM];
  const typePrefix: Record<RequestType, string> = { HELMET: "H", SHOES: "S", UNIFORM: "U" };
  const reasons = ["新進人員", "原鞋損壞", "尺寸不合", "汰換", "工地需求"];
  const rejectReasons = ["附件不齊", "尺寸資訊有誤", "重複申請", "已超過年度配額"];

  let seq = 0;
  let stats = { total: 0, SUBMITTED: 0, SHIPPED: 0, REJECTED: 0, items: 0 };

  for (const u of allUsers) {
    const count = 8 + rand(8); // 8-15
    for (let i = 0; i < count; i++) {
      seq++;
      const type = pick(types);
      const status = weightedPick<RequestStatus>([
        { item: RequestStatus.SUBMITTED, w: 60 },
        { item: RequestStatus.SHIPPED, w: 30 },
        { item: RequestStatus.REJECTED, w: 10 },
      ]);
      const daysAgo = rand(60);
      const submittedAt = new Date(Date.now() - daysAgo * 86400000 - rand(86400000));
      const shippedAt = status === RequestStatus.SHIPPED ? new Date(submittedAt.getTime() + (1 + rand(7)) * 86400000) : null;
      const rejectReason = status === RequestStatus.REJECTED ? pick(rejectReasons) : null;
      const yyyymmdd = submittedAt.toISOString().slice(0, 10).replace(/-/g, "");
      const requestNo = `${yyyymmdd}-${typePrefix[type]}-${String(seq).padStart(4, "0")}`;

      const itemCount = 1 + rand(5);
      const itemsData = [] as any[];
      for (let j = 0; j < itemCount; j++) {
        const wearer = pick(employees);
        const base: any = {
          wearerAcc: wearer.employee_no,
          userName: wearer.employee_name,
          shippedAt: shippedAt,
        };
        if (type === RequestType.HELMET) {
          base.bloodType = pick([BloodType.A, BloodType.B, BloodType.O, BloodType.AB]);
        } else if (type === RequestType.SHOES) {
          base.shoeSize = pick(shoeSizes);
          if (rng() < 0.5) base.reason = pick(reasons);
        } else {
          base.gender = pick([Gender.MALE, Gender.FEMALE]);
          const wantTop = rng() < 0.7;
          const wantPants = rng() < 0.7 || !wantTop;
          if (wantTop) {
            base.topSelected = true;
            base.topSize = pick(topSizes);
            base.topQty = 1 + rand(3);
            base.topAction = pick([UniformAction.NEW, UniformAction.REPLACE, UniformAction.PURCHASE]);
          }
          if (wantPants) {
            base.pantsSelected = true;
            base.pantsWaist = pick(pantsWaists);
            base.pantsLength = pick(pantsLengths);
            base.pantsQty = 1 + rand(3);
            base.pantsAction = pick([UniformAction.NEW, UniformAction.REPLACE, UniformAction.PURCHASE]);
          }
        }
        itemsData.push(base);
      }

      const created = await db.request.create({
        data: {
          requestNo,
          type,
          requesterId: u.id,
          requesterName: u.name,
          siteOrDept: u.department,
          status,
          submittedAt,
          shippedAt,
          shippedById: status === RequestStatus.SHIPPED ? adminId : null,
          rejectReason,
          remark: rng() < 0.3 ? "備註：請盡快處理" : null,
          items: { create: itemsData },
        },
      });

      // StatusLog
      await db.statusLog.create({
        data: {
          requestId: created.id,
          fromStatus: null,
          toStatus: RequestStatus.SUBMITTED,
          changedById: u.id,
          changedAt: submittedAt,
        },
      });
      if (status === RequestStatus.SHIPPED && shippedAt) {
        await db.statusLog.create({
          data: {
            requestId: created.id,
            fromStatus: RequestStatus.SUBMITTED,
            toStatus: RequestStatus.SHIPPED,
            changedById: adminId,
            changedAt: shippedAt,
          },
        });
      } else if (status === RequestStatus.REJECTED) {
        await db.statusLog.create({
          data: {
            requestId: created.id,
            fromStatus: RequestStatus.SUBMITTED,
            toStatus: RequestStatus.REJECTED,
            changedById: adminId,
            changedAt: new Date(submittedAt.getTime() + 86400000),
            note: rejectReason,
          },
        });
      }

      stats.total++;
      stats[status]++;
      stats.items += itemCount;
    }
  }

  console.log("Seed Demo 完成", stats);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
