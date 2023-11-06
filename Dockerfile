FROM node:latest

#set the working directory in the container to /app
WORKDIR /app

#copy the package and poackage-lock .json file to the working diorectory /app
COPY package*.json ./

RUN npm install

#copy rest of the code to the working diorectory
COPY . .

EXPOSE 8080

CMD ["node","index.js"]



