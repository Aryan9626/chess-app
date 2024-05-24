# server/Dockerfile

# Use the official Node.js image based on Ubuntu
FROM node:20

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Copy the wait-for-it script
COPY wait-for-it.sh ./wait-for-it.sh
RUN chmod +x wait-for-it.sh

# Expose port 8081 to the outside world
EXPOSE 8081

# Command to run the application using wait-for-it
CMD ["./wait-for-it.sh", "mysql-container:3306", "--timeout=30", "--", "node", "server.js"]
