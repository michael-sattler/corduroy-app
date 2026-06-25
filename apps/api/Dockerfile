FROM node:22-bookworm-slim AS builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api ./apps/api
RUN npm ci
RUN npm run build --workspace=@corduroy/api

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN groupadd --system --gid 1001 nodejs && useradd --system --uid 1001 --gid nodejs api
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/package.json
RUN npm ci --omit=dev --workspace=@corduroy/api
COPY --from=builder /app/apps/api/dist ./apps/api/dist
USER api
EXPOSE 4000
# Railway injects PORT at runtime; local Docker Compose sets PORT=4000 in compose.
CMD ["node", "apps/api/dist/index.js"]
