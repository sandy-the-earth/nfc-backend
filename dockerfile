FROM node:18-alpine
WORKDIR /app
COPY nfc_backend/package*.json ./
RUN npm install
COPY nfc_backend/ .
COPY ssl ./ssl
EXPOSE 5000
CMD ["npm", "start"]
