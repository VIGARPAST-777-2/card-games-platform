# Deckora — frontend + backend en una sola imagen Docker
FROM node:22-bookworm-slim

WORKDIR /app

# pnpm
RUN npm install -g pnpm@9

# Copiar todo el monorepo
COPY package.json pnpm-workspace.yaml .npmrc ./
COPY tsconfig.base.json ./
COPY apps ./apps
COPY packages ./packages

# Instalar (incluye devDependencies para el build) y compilar
RUN pnpm install --prod=false \
 && pnpm build \
 && pnpm prune --prod \
 && rm -rf apps/web/src apps/server/src apps/web/node_modules/.cache

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Render inyecta PORT; el server ya usa process.env.PORT
CMD ["pnpm", "start"]
