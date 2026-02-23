# Use a stable Node.js runtime as the base image
FROM node:20-slim

# Create and define the application directory
WORKDIR /app

# Copy package files first to take advantage of Docker's layer caching
# This means npm install only runs if you change your dependencies
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy the rest of your backend source code
COPY . .

# Expose the port your Express app runs on (usually 5000)
EXPOSE 5000

# Start the application
CMD ["node", "src/app.js"]