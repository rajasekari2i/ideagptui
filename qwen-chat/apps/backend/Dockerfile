FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

RUN node src/db/migrate.js || true

EXPOSE 8000

CMD ["npm", "start"]
