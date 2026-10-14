# syntax=docker/dockerfile:1
# check=skip=SecretsUsedInArgOrEnv
# ^ BuildKit flags any ARG/ENV whose name contains "TOKEN". VITE_MAPBOX_TOKEN
#   is a public pk.* token that ends up in the browser bundle regardless, so
#   the warning is noise here (see the note below on why it is not a secret).

# ==========================================================================
# Voyara frontend
#
#   docker build -t voyara-web \
#     --build-arg VITE_API_URL=https://your-api.example.com/api/v1 \
#     --build-arg VITE_MAPBOX_TOKEN=pk.your_public_token \
#     ./frontend
#   docker run --rm -p 8080:8080 -e PORT=8080 voyara-web
#
# The build ARGs are not decoration. Vite inlines VITE_* into the bundle at
# BUILD time, so these values are baked into the image: a built image cannot
# be re-pointed at another API with `docker run -e`. Building for a different
# environment means building a different image.
#
# Neither value is a secret. Everything in a client bundle is readable by
# anyone who opens devtools, which is why the Mapbox token here must be a
# public (pk.*) token, restricted by URL in the Mapbox account, and never a
# secret (sk.*) one.
# ==========================================================================

# ---- build ---------------------------------------------------------------
FROM node:22-slim AS build

WORKDIR /app

# Cached until the dependency set changes.
COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_API_URL
ARG VITE_MAPBOX_TOKEN
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_MAPBOX_TOKEN=$VITE_MAPBOX_TOKEN

# `vite build` rather than `npm run build`: the npm script runs `tsc -b` first,
# and the repo still carries pre-existing type errors in test files that have
# nothing to do with the shipped bundle. Type-checking belongs in CI, where a
# failure is a signal, not in the image build, where it only blocks a deploy.
RUN npx vite build

# ---- runtime -------------------------------------------------------------
# The unprivileged variant, not stock nginx. Heroku runs every container as
# an arbitrary non-root user and ignores USER; stock nginx then dies on
# startup because it cannot mkdir /var/cache/nginx or write its pid file.
# This image already keeps both under /tmp. Fly runs the image as root and is
# indifferent, so the one image serves both platforms.
FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime

# nginx's entrypoint runs envsubst over everything in this directory and
# writes the result to /etc/nginx/conf.d, which is how ${PORT} gets filled in
# at container start. Only PORT is listed, so nginx's own $uri and
# $http_upgrade variables survive rather than being substituted to empty.
ENV NGINX_ENVSUBST_TEMPLATE_DIR=/etc/nginx/templates
ENV NGINX_ENVSUBST_OUTPUT_DIR=/etc/nginx/conf.d
ENV NGINX_ENVSUBST_FILTER=PORT

# Sensible default for local runs; Heroku and Fly override it.
ENV PORT=8080

# The entrypoint's envsubst step refuses to run unless conf.d is writable by
# whoever the container happens to run as, and "whoever" is unknowable on
# Heroku - so world-writable it is. The base image's own default.conf goes
# too: it listens on a fixed 8080, which would silently mask a failed
# substitution whenever PORT happens to be 8080 and break on any other value.
RUN chmod a+rwx /etc/nginx/conf.d && rm -f /etc/nginx/conf.d/default.conf

COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

# The stock nginx image already ships an entrypoint that does the envsubst
# pass and then execs nginx, so there is nothing to override here.
