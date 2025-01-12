FROM node:18 AS build

WORKDIR /app

COPY package.json .
RUN npm install

COPY . .
RUN npm run build

FROM node:18-slim
WORKDIR /app

COPY --from=build /app/build .

RUN npm install -g serve

EXPOSE 3000

CMD ["serve", "-s", "/app/build", "-l", "3000"]
