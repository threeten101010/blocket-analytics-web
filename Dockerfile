# Base image
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code and build production pages
COPY . .
RUN npm run build

# Expose port and start Next.js production server
EXPOSE 3000
CMD ["npm", "run", "start"]
