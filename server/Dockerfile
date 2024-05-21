# server/Dockerfile

# Use the official Node.js image as a base image
FROM node:20-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose port 5000 to the outside world
EXPOSE 8080

# Command to run the application
CMD ["npm", "start"]
