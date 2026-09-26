FROM node:22-alpine

WORKDIR /usr/src/app

COPY backend/package*.json ./
RUN npm install --omit=dev

COPY backend/server.js ./server.js
COPY index.html style.css app.js ./public/
COPY locales/ ./public/locales/

ENV PORT=3000
EXPOSE 3000

CMD ["node", "server.js"]
