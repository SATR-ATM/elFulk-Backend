FROM node:22.15.0-alpine3.21 AS development

RUN apk add --no-cache libc6-compat openssl
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install all dependencies (including devDependencies)
RUN pnpm install --ignore-scripts

# Copy source code
COPY . .

# Build the application
RUN pnpm run build

# Development command
CMD ["pnpm", "run", "start:dev"]

FROM node:22.15.0-alpine3.21 AS production

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install only production dependencies
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

# Copy built application from development stage
COPY --from=development /app/build ./build

# Set user to node for security
USER node

# Expose port
EXPOSE 3000

# Production command
CMD ["node", "build/main"]
