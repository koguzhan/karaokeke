# Backend Dockerfile for Render
FROM node:18-bookworm

# Install Python, pip, ffmpeg (required for yt-dlp and audio processing)
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Install yt-dlp globally
RUN pip3 install yt-dlp

# Set working directory
WORKDIR /app

# Copy package files
COPY backend/package*.json ./

# Install Node dependencies
RUN npm ci --only=production

# Copy backend code
COPY backend/ ./

# Create uploads directory
RUN mkdir -p uploads

# Expose port (Render will set PORT env var)
EXPOSE 3001

# Start server
CMD ["npm", "start"]
