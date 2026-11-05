FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000
RUN apk add --no-cache openssl
COPY package*.json ./
RUN npm ci --omit=dev --fetch-timeout=600000 --fetch-retries=5 --fetch-retry-maxtimeout=120000
COPY . .
RUN npx prisma generate
# npm n'est plus utile à l'exécution : on le retire (faille CVE-2026-59873 dans tar)
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx
USER node
EXPOSE 4000
CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy && node server.js"]
