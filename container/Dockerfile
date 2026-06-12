FROM oven/bun:1.3.0-slim
WORKDIR /app
COPY container/package.json ./package.json
RUN bun install --production
COPY container/server.ts ./server.ts
EXPOSE 8080 2222
CMD ["bun", "run", "server.ts"]
