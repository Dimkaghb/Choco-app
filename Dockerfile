# Simple Next.js Dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code (excluding .env files first)
COPY . .

# Copy .env file explicitly to ensure it's not overwritten
COPY .env ./

# Build the application
RUN npm run build

# Expose port
EXPOSE 9002

# Start the application
CMD ["npm", "start"]