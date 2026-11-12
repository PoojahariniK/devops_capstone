# ==============================================================================
# CAP-12 Warehouse Optimization - Frontend Dockerfile
# Lightweight Node.js static & proxy server
# ==============================================================================

FROM node:20-alpine
WORKDIR /app

# Copy application files
COPY package.json ./
COPY server.js ./
COPY public ./public
COPY src ./src
COPY index.html ./
COPY seed_data.js ./

# Set environment
ENV PORT=3000
ENV BACKEND_HOST=backend
ENV BACKEND_PORT=8080

EXPOSE 3000

CMD ["node", "server.js"]

