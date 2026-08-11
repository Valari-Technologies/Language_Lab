FROM node:20-alpine

WORKDIR /app

# Copy package configuration files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy frontend source files
COPY . .

# Expose Vite dev port
EXPOSE 5173

# Start Vite dev server exposing to host
CMD ["npm", "run", "dev", "--", "--host"]
