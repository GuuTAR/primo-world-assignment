# syntax=docker/dockerfile:1

# ---- deps: production dependencies only ----
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production && yarn cache clean

# ---- build: compile TypeScript ----
FROM node:24-alpine AS build
WORKDIR /app
# Skip mongodb-memory-server's ~200MB MongoDB download; it is only used by e2e tests.
ENV MONGOMS_DISABLE_POSTINSTALL=1
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY nest-cli.json tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN yarn build

# ---- runtime ----
FROM node:24-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json ./
USER node
EXPOSE 8000
CMD ["node", "dist/main.js"]
