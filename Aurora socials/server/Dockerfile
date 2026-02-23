# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --omit=dev
RUN npx prisma generate

# Production stage
FROM node:20-alpine

WORKDIR /app

# Run as non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S aurora -u 1001

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY . .

# Create uploads directory (for local dev fallback)
RUN mkdir -p uploads && chown -R aurora:nodejs uploads

USER aurora

EXPOSE 5000

ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/auth/verify || exit 1

CMD ["node", "index.js"]
