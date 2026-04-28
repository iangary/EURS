# EURS — 總務部設備／制服線上領取系統

Next.js 14 App Router + Prisma + PostgreSQL（Docker）。

完整規格請見 [SPEC.md](./SPEC.md)（目前 v1.2）。

## 快速啟動

本專案開發、建置、跑遷移**一律走 Docker**（詳見 [CLAUDE.md](./CLAUDE.md)）。

```bash
# 1. 建立 .env
cp .env.example .env

# 2. 啟動全部服務（db + web）
docker compose up -d --build

# 3. 建立 / 套用資料庫 schema
docker compose exec web npx prisma migrate deploy

# 4. 種子資料（擇一）
docker compose exec web npm run prisma:seed         # 最小必要帳號
docker compose exec web npm run prisma:seed-demo    # demo 用：載入 prisma/data/employees.json 員工資料集 + 範例申請單

# → http://localhost:3000
```

> 後續看 log：`docker compose logs -f web`；停掉：`docker compose down`。
> 例外：型別檢查（`npx tsc --noEmit`）、`prisma generate`、lint 可在主機直接跑，其餘走 docker compose。

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

## 近期重點（v1.2）

- 移除 `PROCESSING` 狀態（已透過 schema migration 收斂流程）
- 後台申請單清單改為**表頭內嵌欄位篩選**
- 匯出頁新增**預覽功能**並簡化篩選條件
- 退件單可**重新填寫並再次送出**
- 登入頁顯示管理員徽章；制服表單顯示匯款帳號

## 主要路徑

> 使用者頁面位於 `src/app/(app)/` route group。

| 路徑                     | 說明                                            |
| ------------------------ | ----------------------------------------------- |
| `/login`                 | 模擬登入                                        |
| `/`                      | 首頁（我的申請近 5 筆 + 三個快速申請）          |
| `/apply/helmet`          | 安全帽申請（含批量匯入）                        |
| `/apply/shoes`           | 安全鞋申請（含批量匯入）                        |
| `/apply/uniform`         | 制服申請（卡片化階層 + 批量匯入）               |
| `/my-requests`           | 我的申請                                        |
| `/admin/requests`        | 後台 · 申請單管理（表頭內嵌篩選、批次出貨）     |
| `/admin/export`          | 後台 · 匯出（萬年曆、預覽、Excel／CSV）         |
| `/admin/dashboard`       | 後台 · 儀表板（部門／類型／狀態統計）           |
| `/admin/settings`        | 後台 · 系統參數（匯款帳號、尺寸、白名單）       |
| `/api/templates/[type]`  | 下載批量範本（helmet／shoes／uniform）          |

## 外部 API

- 員工資料：`EMP_API_BASE`（預設 `http://172.16.105.117/emp`）
- 寄信服務：`MAIL_API_BASE`（預設 `http://172.16.105.117/app`）

兩者皆有失敗 fallback：員工資料連不到時退回本地 User 表；寄信失敗只寫 log，不阻擋主流程。

## 變更系統參數後不需重啟

`getSetting()` 內含 30 秒快取，改值 30 秒內生效。
