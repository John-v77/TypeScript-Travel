# syntax=docker/dockerfile:1

# ==========================================================================
# Voyara API
#
#   docker build -t voyara-api ./backend
#   docker run --rm -p 3000:3000 --env-file backend/.env voyara-api
#
# Two stages. The first has a full toolchain and does all the installing and
# compiling; the second is a slim runtime that receives only the built output
# and the production dependency tree.
#
# Note where the dependency pruning happens. `bcrypt` is a node-gyp addon and
# `sharp` links against libvips, so both may need a compiler at install time.
# The slim image has none, so installing there is a coin toss on whether a
# prebuilt binary exists for the platform. Instead everything is installed in
# the build stage, which has the toolchain, then `npm prune --omit=dev` strips
# the dev packages from that same tree - the compiled native modules survive
# intact and are copied across. Both stages are bookworm on the same
# architecture, so those binaries are valid in the runtime image.
# ==========================================================================

# ---- build ---------------------------------------------------------------
FROM node:22 AS build

WORKDIR /app

# On their own so this layer stays cached until dependencies actually change -
# editing a controller should not trigger a reinstall.
COPY package*.json ./
RUN npm ci

COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npm run build

# Drop typescript, jest, nodemon and friends. Build tools have no business in
# a running image.
RUN npm prune --omit=dev

# ---- runtime -------------------------------------------------------------
FROM node:22-slim AS runtime

ENV NODE_ENV=production

WORKDIR /app

COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

# Node's own unprivileged user rather than root. The image writes nothing at
# runtime: uploads need object storage, not a container filesystem, which is
# ephemeral on both Heroku and Fly.
USER node

# Documentation only. The platform supplies the real port in PORT, which
# src/index.ts already reads.
EXPOSE 3000

# node directly, not `npm start`: npm sits between the platform and the
# process and does not forward SIGTERM, so the graceful shutdown in index.ts
# would never run and every deploy would end in a hard kill after the timeout.
CMD ["node", "dist/index.js"]
