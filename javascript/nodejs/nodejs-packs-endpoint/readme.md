# Setup Environment variables for database connections.

# Install ci for faster productions apps

# Export these for the app to start

export db=@localhost:27017
export NODE_ENV=test|production
export PORT=5005
export mongodb_user=[user]:[password]
export vidly_jwtPrivateKey=[SecertPrivateKey]

## Docker creation of the app

- Install docker : https://docs.docker.com/engine/install/ubuntu/
- Create docker nodejs image example : https://nodejs.org/en/docs/guides/nodejs-docker-webapp/
- Review docker best practices : https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md
- Create node.js app : package.json
- Create the Node.js app
- Create the Dockerfile in the app master directory
  - Add the node version for the app FROM node:12.22.9
  - Create the working directory for the app in the container WORKDIR /usr/src/app
  - Install app dependancies [NB] for Prod run npm ci
  - Copy the app source into the container
  - Set the app port to be exposed
  - Define the app start command
  - Create the .dockerignore file and add the exclude list
  - Build the docker image : docker build . -t <your username>/node-web-app
  - Check the build docker images
  - Run the image to check for errors : sudo docker run -p [localport]:[dockerport] -m "500M" --memory-swap "400M" -d <username>/node-web-app
  - Use -e "[VARIABLE]=[VALUE]" to set app settings
    - -e "PORT=5005"
    - -e "mongodb_user=[user]:[password]
  - Check docker app logs : docker logs [container id]
  - To get to the docker container use the exec command : docker exec -it [container id] /bin/bash
  - Test the endpoint : curl -i [ip address]:[port]
  - push new container to Docker Cloud

Example command to start the docker app:
sudo docker run -m "300m" --memory-swap "300M" --network host --name vidly-nodejs-endpoint --restart unless-stopped -e "PORT=5005" -e "db=@localhost:27017/packs" -e "mongodb_user=nodejs:nodejs" -e "vidly_jwtPrivateKey=SecertPrivateKey" -d john146/javascript-apps:packs-nodejs-endpoint

http://178.62.84.58:5005/api/instructors
http://178.62.84.58:5005/api/prodcuts
