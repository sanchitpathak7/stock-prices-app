FROM --platform=linux/amd64 node:16-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy application code
COPY . .

# Create public directory if it doesn't exist
RUN mkdir -p src/public

# Ensure proper permissions
RUN chmod -R 755 /app

# Expose the application port
EXPOSE 3000

# Command to run the application
CMD ["node", "src/server.js"]