FROM node:18

# Install FFmpeg
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Create temp directory
RUN mkdir -p temp

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "server.js"]