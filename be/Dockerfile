# 1. Use a stable Node.js LTS image
FROM node:20-slim

# 2. Set the working directory inside the container
WORKDIR /app

# 3. Copy package files first to leverage Docker cache
COPY package*.json ./

# 4. Install production dependencies
# Note: We use 'npm install' to ensure all new packages (like axios/mongoose) are included
RUN npm install --production

# 5. Copy the rest of the source code
COPY . .

# 6. Expose the port your app runs on
EXPOSE 5000

# 7. Start the application
CMD ["node", "src/app.js"]