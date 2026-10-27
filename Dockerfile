FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY server.js ./
COPY public ./public
RUN mkdir -p /data
ENV PORT=3000
ENV DB_PATH=/data/attendance.db
EXPOSE 3000
CMD ["npm", "start"]
