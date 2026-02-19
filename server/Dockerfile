FROM node:20-alpine

WORKDIR /app

# Install OpenSSL (required for Prisma)
RUN apk add --no-cache openssl

# Copy package files
COPY package*.json ./

RUN npm install

# Copy entire project
COPY . .

# Generate Prisma client INSIDE container
RUN npx prisma generate

# Build TypeScript (if using TS)
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]
