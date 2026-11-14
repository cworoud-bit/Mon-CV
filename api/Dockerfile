# syntax=docker/dockerfile:1

# Stage 1 : dépendances de production + client Prisma
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev --fetch-timeout=600000 --fetch-retries=5 --fetch-retry-maxtimeout=120000
COPY prisma ./prisma
RUN ./node_modules/.bin/prisma generate
COPY . .

# Stage 2 : image finale minimale, sans npm
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000
RUN apk add --no-cache openssl \
    && rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx
COPY --from=builder --chown=node:node /app ./
USER node
EXPOSE 4000
CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy && node server.js"]
