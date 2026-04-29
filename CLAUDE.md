# EURS — Claude 工作守則

## 開發 / 建置一律使用 Docker

本專案的開發、建置、跑遷移都走 Docker，**不要直接在主機跑 `npm run dev` / `npm run build`**。

### 標準指令

```bash
# 啟動全部服務（含 db + web）
docker compose up -d --build

# 只開資料庫（本機開發時）
docker compose up -d db

# 重新 build web image
docker compose build web

# 看 log
docker compose logs -f web

# 停止
docker compose down
```

### 跑 Prisma migration

```bash
docker compose exec web npx prisma migrate dev --name <name>
# 或在 web 還沒起來前，臨時容器：
docker compose run --rm web npx prisma migrate deploy
```

### 跑 seed

```bash
docker compose exec web npm run prisma:seed
```

### 為什麼

- `.env` 的 `DATABASE_URL` 指向 `localhost:5433`（compose 對外 port），但 web 容器內部走 `db:5432`。直接在主機跑可能撞到 port / 主機名差異。
- 部署環境只用 Docker，本地行為若與容器一致才能避免「我這邊好的」問題。
- 外部 API（`EMP_API_BASE`、`MAIL_API_BASE`）的網段路由在容器內較穩。

### 例外

僅以下情況可在主機直接跑：
- `npx tsc --noEmit` 型別檢查
- `npx prisma generate` 重新生 client
- IDE / lint / 單元測試

其餘一律走 docker compose。

## 自動更新授權

若改動程式碼 / Prisma schema / Dockerfile / 相依套件後需要讓容器反映最新狀態，Claude 可在必要時自行執行：

```bash
docker compose up -d --build
```

不需另外徵詢同意。其他破壞性指令（`down -v`、`rm`、`reset` 等）仍須先確認。
