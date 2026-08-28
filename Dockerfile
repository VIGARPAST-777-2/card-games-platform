# ── Deckora: frontend + backend en una sola imagen ──────────────────────────
FROM node:22-bookworm-slim AS base
WORKDIR /app

# pnpm
RUN npm install -g pnpm@9

# ── Dependencias (cache de capas) ────────────────────────────────────────────
FROM base AS deps
COPY package.json pnpm-workspace.yaml .npmrc ./
COPY apps/web/package.json ./apps/web/
COPY apps/server/package.json ./apps/server/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --prod=false

# ── Build ────────────────────────────────────────────────────────────────────
FROM deps AS build
COPY . .
RUN pnpm build

# ── Runtime ──────────────────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN npm install -g pnpm@9

# Solo lo necesario para arrancar
COPY --from=build /app/package.json /app/pnpm-workspace.yaml /app/.npmrc ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/server/package.json ./apps/server/
COPY --from=build /app/apps/server/dist ./apps/server/dist
COPY --from=build /app/apps/web/dist ./apps/web/dist
COPY --from=build /app/packages/shared ./packages/shared

EXPOSE 3000

# Healthcheck opcional (Render usa healthCheckPath HTTP)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["pnpm", "start"]
