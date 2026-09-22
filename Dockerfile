# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
RUN apk add --no-cache libc6-compat

FROM base AS dependencies
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

FROM base AS builder
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

# Rewrites and the browser WebSocket CSP are generated during `next build`.
# Override both when building an image for a deployment topology that does not
# use the Compose service names/default public URL.
ARG API_PROXY_TARGET=http://backend:8000
ARG NEXT_PUBLIC_WS_URL=ws://localhost:8000
# Canonical public site URL for SEO metadata (src/lib/seo/pageMetadata.ts) -
# also only read at build time, previously not wired through here at all and
# silently falling back to http://localhost:3000 in every image.
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ENV API_PROXY_TARGET=${API_PROXY_TARGET}
ENV NEXT_PUBLIC_WS_URL=${NEXT_PUBLIC_WS_URL}
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
ENV NEXT_OUTPUT_STANDALONE=true

# Set BUILD_ENV=production (see .github/workflows/ci-cd.yml) for any image
# meant to actually serve traffic. Local/dev image builds that intentionally
# use the Compose service name / localhost defaults above are unaffected.
# This exists because API_PROXY_TARGET/NEXT_PUBLIC_WS_URL/NEXT_PUBLIC_SITE_URL
# are compiled into the rewrites, CSP, browser bundle and SEO metadata at this
# exact build step - a forgotten CI variable previously fell back to
# http://backend:8000 / ws://localhost:8000 / http://localhost:3000 with no
# error, baking a broken origin into a published production image.
ARG BUILD_ENV=development
RUN if [ "$BUILD_ENV" = "production" ]; then \
      for pair in "API_PROXY_TARGET:$API_PROXY_TARGET" "NEXT_PUBLIC_WS_URL:$NEXT_PUBLIC_WS_URL" "NEXT_PUBLIC_SITE_URL:$NEXT_PUBLIC_SITE_URL"; do \
        name="${pair%%:*}"; value="${pair#*:}"; \
        case "$value" in \
          ""|*localhost*|*127.0.0.1*) \
            echo "ERROR: BUILD_ENV=production but $name=$value is unset or a local-dev default. Set the real production value (see deployment/env/frontend.env.example)." >&2; \
            exit 1 ;; \
        esac; \
      done; \
      echo "Production env check passed: API_PROXY_TARGET=$API_PROXY_TARGET NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL"; \
    fi
RUN --mount=type=cache,target=/app/.next/cache npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

CMD ["node", "server.js"]

