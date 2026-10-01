#/usr/bin/bash
# Run this script to update Docker
# john146/javascript-apps:packs-nodejs-endpoint
echo "Logining in"
docker login
echo "Running NPM Build"
npm ci
echo "Running docker Build"
docker build . -t john146/javascript-apps:packs-nodejs-endpoint
echo "Running docker push to server"
docker push john146/javascript-apps:packs-nodejs-endpoint
