FROM node:20-alpine AS development

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies)
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Development command
CMD ["npm", "run", "start:dev"]

FROM node:20-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production --ignore-scripts

# Copy built application from development stage
COPY --from=development /app/build ./build

# Set user to node for security
USER node

# Expose port
EXPOSE 3000

# Production command
CMD ["node", "build/main"]
