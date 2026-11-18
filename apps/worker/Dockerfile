# syntax=docker/dockerfile:1
# Build context is the repository root: docker build -f apps/worker/Dockerfile .
ARG NODE_IMAGE=node:22-slim
FROM ${NODE_IMAGE} AS base
RUN npm install -g pnpm@12.18.0
WORKDIR /app

FROM base AS build
ENV HUSKY=0
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/worker/package.json apps/worker/package.json
COPY packages/core/package.json packages/core/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/widget/package.json packages/widget/package.json
RUN --mount=type=cache,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile
COPY tsconfig.base.json ./
COPY apps/worker apps/worker
COPY packages packages
RUN pnpm --filter @earshot/worker build

FROM ${NODE_IMAGE} AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /app/apps/worker/dist ./dist
USER node
CMD ["node", "dist/index.js"]
