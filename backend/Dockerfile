FROM node:22-bookworm-slim

WORKDIR /app

# Install OpenSSL required by Prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

RUN npx prisma generate
RUN npm run build

EXPOSE 3002

ENV NODE_ENV=production
ENV PORT=3002

CMD ["node", "dist/main.js"]
