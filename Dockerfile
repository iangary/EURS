# 單一階段映像：簡單可靠，可從容器內跑 prisma migrate / seed。
FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl bash

# 1. 安裝依賴（含 devDependencies — 需要 prisma CLI 與 tsx 跑 seed）
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci --no-audit --no-fund

# 2. 複製原始碼並建置
COPY . .
RUN npx prisma generate && npm run build

# 3. 啟動腳本：先跑 migrate + seed，再啟動 server
RUN printf '#!/bin/sh\nset -e\nnpx prisma migrate deploy\nnpx prisma db seed || true\nexec npm run start\n' > /app/entrypoint.sh \
    && chmod +x /app/entrypoint.sh

RUN mkdir -p /app/uploads
EXPOSE 3000
CMD ["/app/entrypoint.sh"]
