# ═══════════════════════════════════════════════════════════════
# Deckora — frontend (Vite/React) + backend (Express/Socket.io)
# ═══════════════════════════════════════════════════════════════

FROM node:22-bookworm-slim AS builder

WORKDIR /app

RUN npm install -g pnpm@9

# Manifests primero (mejor cache de capas)
COPY package.json pnpm-workspace.yaml .npmrc ./
COPY tsconfig.base.json ./
COPY apps/web/package.json ./apps/web/
COPY apps/server/package.json ./apps/server/
COPY packages/shared/package.json ./packages/shared/

RUN pnpm install --prod=false

# Código fuente
COPY apps ./apps
COPY packages ./packages

# shared → web → server
RUN pnpm build

# ── Runtime ───────────────────────────────────────────────────
FROM node:22-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN npm install -g pnpm@9

COPY package.json pnpm-workspace.yaml .npmrc ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/server/package.json ./apps/server/
COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY --from=builder /app/apps/web/dist ./apps/web/dist
COPY --from=builder /app/packages/shared ./packages/shared

# pnpm necesita los package.json de workspaces para resolver
COPY --from=builder /app/apps/web/package.json ./apps/web/

EXPOSE 3000

# Arranque directo (sin filtro pnpm) — más fiable en contenedor
CMD ["node", "apps/server/dist/index.js"]
