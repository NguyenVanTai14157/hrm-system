FROM node:22-bookworm-slim

WORKDIR /app

# Install OpenSSL required by Prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --no-audit || npm install --no-audit

COPY . .

ENV DATABASE_URL="mysql://dummy:dummy@localhost:3306/dummy"
RUN npx prisma generate
RUN npx nest build

EXPOSE 3002

ENV NODE_ENV=production
ENV PORT=3002
ENV DATABASE_URL="mysql://root:75SuauOg1etik5WzuyHoI00Jb8g6Dy1jmcaFMvGxv6srBTLgZLZURDjewrfj0H8N@ca6f0ar8iifbdwv6qoq8lauh:3306/hrm"
ENV JWT_ACCESS_SECRET="a81fbeb99ce8691fe2d2ca7a4ef18a30a64fcb02c1261018a6ff6276fc2bf5b81b66f7e6539a121afbf5e2083d556d7a"
ENV CORS_ORIGINS="https://hrm.cool.tvt.id.vn,http://localhost:3000,http://localhost:3001"

CMD ["node", "dist/main.js"]

