# Use Node.js 10 base image
FROM node:10

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Update APT sources to access Debian Stretch archives and remove stretch-updates
RUN sed -i 's/deb.debian.org/archive.debian.org/g' /etc/apt/sources.list && \
    sed -i 's/security.debian.org\/debian-security/archive.debian.org\/debian-security/g' /etc/apt/sources.list && \
    sed -i '/stretch-updates/d' /etc/apt/sources.list && \
    apt-get update && \
    apt-get install -y apt-transport-https curl && \
    curl -fsSL https://packages.redis.io/gpg | apt-key add - && \
    echo "deb https://packages.redis.io/deb stretch main" | tee /etc/apt/sources.list.d/redis.list && \
    apt-get update && \
    apt-get install -y redis-server

# Configure Redis to bind to all IPs
RUN sed -i 's/^bind 127.0.0.1 ::1/bind 0.0.0.0/g' /etc/redis/redis.conf && \
    echo "protected-mode no" >> /etc/redis/redis.conf

# Expose Redis port
EXPOSE 6379

# Copy the entire project to the container
COPY . .

# Expose application ports
EXPOSE 3334:3334
EXPOSE 27017

# Start Redis and your application
CMD redis-server /etc/redis/redis.conf & npm start
