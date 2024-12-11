# Use the official Node.js image as the base image
FROM node:18

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and yarn.lock files
COPY package.json yarn.lock ./

# Clean node_modules and install dependencies
RUN rm -rf node_modules && yarn install

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 3030

# Start the application
CMD ["yarn", "start"]