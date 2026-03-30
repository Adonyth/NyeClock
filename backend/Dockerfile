FROM node:20-alpine

WORKDIR /app

COPY backend/package.json backend/package-lock.json* ./
RUN npm install --omit=dev

COPY backend/server.js ./server.js
COPY Adonyth/tw_.html ./tw_.html
COPY Adonyth/manifest.json ./manifest.json

EXPOSE 8787

CMD ["node", "server.js"]
