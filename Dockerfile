FROM node:20

# Create app directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install app dependencies
RUN npm install
# If you are building your code for production
# RUN npm ci --only=production


# Start the app
RUN npm install pm2 -g
RUN pm2 install pm2-logrotate


# Copy app source
COPY . .


#RUN pm2 start ecosystem.config.js
CMD [ "pm2-runtime", "start", "ecosystem.config.js" ]
