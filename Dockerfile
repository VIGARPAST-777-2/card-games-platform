# Deckora — frontend + backend en una sola imagen Docker
FROM node:22-bookworm-slim

WORKDIR /app

RUN npm install -g pnpm@9

COPY package.json pnpm-workspace.yaml .npmrc ./
COPY tsconfig.base.json ./
COPY apps ./apps
COPY packages ./packages

# Instalar + compilar (shared → web → server)
RUN pnpm install --prod=false \
 && pnpm build \
 && pnpm prune --prod

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["pnpm", "start"]
