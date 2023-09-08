# Use an official Node.js runtime as a parent image
FROM node:14

# Set the working directory in the container to /app
WORKDIR /app

# Add the current directory contents into the container at /app
COPY package*.json ./

# Copy the specific directories into the container
COPY web-server/ web-server/
COPY views/ views/
COPY public/ public/
COPY .env .env

# Install any needed packages specified in package.json
RUN npm install

# Make port 3000 available to the world outside this container
EXPOSE 3000

# Run app.js when the container launches
CMD [ "node", "web-server/index.js" ]