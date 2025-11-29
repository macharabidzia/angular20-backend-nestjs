FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

# Optional Nest CLI (safe)
RUN npm install -g @nestjs/cli

COPY . .

ENV CHOKIDAR_USEPOLLING=true
ENV WATCHPACK_POLLING=true
ENV NODE_ENV=development

EXPOSE 3000

CMD ["npm", "run", "start:dev"]
