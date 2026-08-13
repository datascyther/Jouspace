# Jouspace Intelligence Runtime — production image
# node:20-slim → npm ci from the lockfile → run via tsx (no build step needed).
FROM node:20-slim

WORKDIR /app

# Install dependencies first for better layer caching.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy the runtime source.
COPY . .

# The runtime listens on PORT; HF Spaces sets PORT=7860 and routes the proxy to it.
EXPOSE 7860

# tsx runs the TypeScript entry directly; `start` script = `tsx index.ts`.
CMD ["npm", "start"]
