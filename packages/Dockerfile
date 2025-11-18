# syntax=docker/dockerfile:1.6

# Install dependencies only once (leverages Docker cache)
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable && pnpm i --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci --no-audit --no-fund; \
  else npm i; fi

# Build the Next.js application
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Accept build arguments for environment variables
ARG BROWSERBASE_API_KEY
ARG BROWSERBASE_PROJECT_ID
ARG OPENAI_API_KEY
ARG ZEP_API_KEY
ARG ANTHROPIC_API_KEY

# Set environment variables for the build process
ENV BROWSERBASE_API_KEY=$BROWSERBASE_API_KEY
ENV BROWSERBASE_PROJECT_ID=$BROWSERBASE_PROJECT_ID
ENV OPENAI_API_KEY=$OPENAI_API_KEY
ENV ZEP_API_KEY=$ZEP_API_KEY
ENV ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY

# Set memory allocation and clean build artifacts
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN npm run clean || true

# Use the explicit Next build script to avoid CRA build
RUN npm run next:build

# Run the Next.js server in production on port 80 (ECS maps port 80)
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0

# Copy only the necessary files for running the Next server
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/content ./content

EXPOSE 80
CMD ["npm", "run", "next:start", "--", "-H", "0.0.0.0", "-p", "80"]


