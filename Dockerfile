FROM node:lts
WORKDIR /app

# Repository:
RUN git clone https://github.com/joacoc/neon-latency-benchmarks
WORKDIR /app/neon-latency-benchmarks

# Branch name:
RUN git checkout main

RUN npm ci
RUN rm .env.example

# Start the application in development mode
CMD ["npm", "run", "benchmark"]