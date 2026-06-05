# ----------------------
# Build stage
# ----------------------

FROM ghcr.io/hazmi35/node:22.21.1-dev AS builder

WORKDIR /tmp/build

# Install Git
RUN apt-get update && apt-get install -y --no-install-recommends git && \
    apt-get remove -y gnupg curl && apt-get autoremove -y && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY package.json pnpm*.yaml ./

RUN git init && \
    git config --global user.email "builder@example.com" && \
    git config --global user.name "Builder" && \
    git commit --allow-empty -n -m "Initial commit."

RUN corepack enable && pnpm i --frozen-lockfile

# Build the application
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# The following line below disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED=1
ARG GIT_REF="unknown"

RUN ENVIRONMENT=$(case "$GIT_REF" in \
    refs/heads/production) echo "production" ;; \
    *) echo "staging" ;; \
    esac) && \
    pnpm run build

# ----------------------
# Prepare the runtime environment
# ----------------------

FROM ghcr.io/hazmi35/node:22.21.1 AS runner
WORKDIR /app

# The following line disable telemetry during runtime.
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown node:node .next

COPY --from=builder --chown=node:node /tmp/build/.next/standalone .
COPY --from=builder --chown=node:node /tmp/build/.next/static ./.next/static
COPY --from=builder --chown=node:node /tmp/build/.next/standalone/node_modules ./node_modules
COPY --from=builder --chown=node:node /tmp/build/public ./public
COPY --from=builder --chown=node:node /tmp/build/LICENSE .
USER node
EXPOSE 3000

ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENV ENVIRONMENT=staging

CMD ["node", "server.js"]