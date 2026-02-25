# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
# Install only production dependencies
RUN npm install --omit=dev
# Copy your .env for production (make sure variables are set for the container network)
COPY .env .env

EXPOSE 5000
CMD ["node", "dist/server.js"]