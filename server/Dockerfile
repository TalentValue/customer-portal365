FROM node:20-alpine
WORKDIR /app

# Copy workspace manifests
COPY package*.json ./
COPY server/package*.json ./server/

# Install all deps (dev included — prisma CLI needed at runtime for migrate)
RUN npm ci --workspace=server

# Copy source
COPY server/ ./server/

# Generate Prisma client and compile TypeScript
RUN cd server && npx prisma generate && npm run build

EXPOSE 3001

# Run pending migrations then start
CMD ["sh", "-c", "cd server && npx prisma migrate deploy && node dist/index.js"]
