FROM node:22-bookworm-slim AS builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/web ./apps/web
RUN npm ci
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build --workspace=@corduroy/web

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN groupadd --system --gid 1001 nodejs && useradd --system --uid 1001 --gid nodejs nextjs
COPY --from=builder /app/apps/web/public ./apps/web/public
RUN mkdir -p ./apps/web/public/uploads/avatars/portal \
    ./apps/web/public/uploads/avatars/staff \
    ./apps/web/public/uploads/logos \
  && chown -R nextjs:nodejs ./apps/web/public/uploads
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["node", "apps/web/server.js"]
