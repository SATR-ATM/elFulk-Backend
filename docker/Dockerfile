FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY ../package*.json ./

# Install deps
RUN npm install

# Copy source
COPY .. .

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:dev"]
