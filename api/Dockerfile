FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000
RUN apk add --no-cache openssl
COPY package*.json ./
RUN npm ci --omit=dev --fetch-timeout=600000 --fetch-retries=5 --fetch-retry-maxtimeout=120000
COPY . .
RUN npx prisma generate
USER node
EXPOSE 4000
CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
