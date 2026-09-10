FROM node:22.19.0-slim AS builder
WORKDIR /app

RUN apt-get update -o Acquire::ForceIPv4=true && apt-get install -y --no-install-recommends -o Acquire::ForceIPv4=true \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
ENV NODE_OPTIONS=--dns-result-order=ipv4first
RUN npm config set fetch-retries 5 fetch-timeout 60000 fetch-retry-mintimeout 20000 \
    && for i in 1 2 3 4 5; do npm ci && break || sleep 5; done

COPY . .

RUN npx prisma generate
RUN npm run build

FROM node:22.19.0-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

ARG GIT_SHA=unknown
ENV APP_VERSION=$GIT_SHA

RUN apt-get update -o Acquire::ForceIPv4=true && apt-get install -y --no-install-recommends -o Acquire::ForceIPv4=true \
    chromium fonts-liberation libnss3 libatk1.0-0 libatk-bridge2.0-0 \
    libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 \
    libxfixes3 libxrandr2 libgbm1 libasound2 libpangocairo-1.0-0 \
    && rm -rf /var/lib/apt/lists/*

ENV CHROME_PATH=/usr/bin/chromium

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/src/generated ./src/generated
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma7.config.ts ./prisma7.config.ts

EXPOSE 3000
CMD ["npx", "next", "start", "-p", "3000", "-H", "0.0.0.0"]
