# EURS — 總務部設備／制服線上領取系統

Next.js 14 App Router + Prisma + PostgreSQL（Docker）。

完整規格請見 [SPEC.md](./SPEC.md)。

## 快速啟動

### 一、本機開發（推薦）

```bash
# 1. 啟動 PostgreSQL
docker compose up -d db

# 2. 安裝套件
npm install

# 3. 建立 .env
cp .env.example .env

# 4. 建立資料庫 schema 與種子資料
npx prisma migrate dev --name init
npx prisma db seed

# 5. 啟動開發伺服器
npm run dev
# → http://localhost:3000
```

### 二、全部容器化

```bash
docker compose up --build
# → 第一次啟動後，請另開終端執行 migrate：
docker compose exec web npx prisma migrate deploy
docker compose exec web npx tsx prisma/seed.ts
```

## 預設帳號（種子資料）

| 員工編號 | 姓名     | 角色   | 部門         |
| -------- | -------- | ------ | ------------ |
| `A001`   | 王總務   | 總務   | 總務部       |
| `E101`   | 陳工地   | 申請人 | 新北一工地   |
| `E102`   | 林工地   | 申請人 | 新北一工地   |
| `E201`   | 黃部門   | 申請人 | 工務部       |

登入頁可直接點選快速登入。

> 角色判定來自 `SystemSetting.ADMIN_EMPLOYEE_IDS`（預設 `["A001"]`）。
> 後台 → 系統參數 即可調整。

## 主要路徑

| 路徑                     | 說明                                            |
| ------------------------ | ----------------------------------------------- |
| `/login`                 | 模擬登入                                        |
| `/`                      | 首頁（我的申請近 5 筆 + 三個快速申請）          |
| `/apply/helmet`          | 安全帽申請（含批量匯入）                        |
| `/apply/shoes`           | 安全鞋申請（含批量匯入）                        |
| `/apply/uniform`         | 制服申請（卡片化階層 + 批量匯入）               |
| `/my-requests`           | 我的申請                                        |
| `/admin/requests`        | 後台 · 申請單管理（分頁籤、批次出貨）           |
| `/admin/export`          | 後台 · 匯出（萬年曆、Excel／CSV）              |
| `/admin/dashboard`       | 後台 · 儀表板（部門／類型／狀態統計）           |
| `/admin/settings`        | 後台 · 系統參數（匯款帳號、尺寸、白名單）       |
| `/api/templates/[type]`  | 下載批量範本（helmet／shoes／uniform）          |

## 外部 API

- 員工資料：`EMP_API_BASE`（預設 `http://172.16.105.117/emp`）
- 寄信服務：`MAIL_API_BASE`（預設 `http://172.16.105.117/app`）

兩者皆有失敗 fallback：員工資料連不到時退回本地 User 表；寄信失敗只寫 log，不阻擋主流程。

## 變更系統參數後不需重啟

`getSetting()` 內含 30 秒快取，改值 30 秒內生效。
