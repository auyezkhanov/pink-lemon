# Pink Lemon — single-container deploy (static site + Node backend + SQLite).
# node:sqlite needs Node >=22.5; node:22-slim tracks the current 22.x line.
FROM node:22-slim

WORKDIR /app
COPY . .

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "backend/server.js"]
