# STAGE 1: Builder
FROM node:22-slim AS builder
WORKDIR /app
COPY package*.json ./
COPY server/package*.json ./server/
RUN npm install --include=dev
RUN cd server && npm install --include=dev
COPY . .
RUN npm run build:server

# STAGE 2: Runner
FROM ghcr.io/puppeteer/puppeteer:latest
WORKDIR /app
USER root

# Copy built server and production manifests
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/server/package*.json ./server/
COPY --from=builder /app/server/dist ./server/dist

# Install ONLY production dependencies for the server
RUN cd server && npm install --production

ENV PORT 8080
ENV NODE_ENV production

# Run the compiled JS directly for speed and reliability
CMD [ "node", "server/dist/server/src/index.js" ]
