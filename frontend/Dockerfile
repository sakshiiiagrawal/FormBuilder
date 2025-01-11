FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install
RUN npm install framer-motion

COPY . .

# Build-time argument for backend URL
ARG REACT_APP_BACKEND_URL=https://formbuilder-wxw0.onrender.com

# Set environment variable
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL

EXPOSE 3000

CMD ["npm", "start"] 