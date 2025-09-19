FROM node:22.10-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

RUN npm install

# Copy the rest
COPY . .

# Expose Hardhat node port
EXPOSE 8545

CMD ["npx", "hardhat", "node"]
