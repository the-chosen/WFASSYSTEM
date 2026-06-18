FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json tsconfig.base.json .npmrc ./
COPY lib/db/package.json ./lib/db/package.json
COPY lib/api-zod/package.json ./lib/api-zod/package.json
COPY lib/api-client-react/package.json ./lib/api-client-react/package.json
COPY artifacts/api-server/package.json ./artifacts/api-server/package.json
COPY artifacts/wichi-quotation/package.json ./artifacts/wichi-quotation/package.json
COPY artifacts/mockup-sandbox/package.json ./artifacts/mockup-sandbox/package.json

RUN npm install -g pnpm@11
RUN pnpm install --no-frozen-lockfile

COPY lib ./lib
COPY artifacts ./artifacts
COPY scripts ./scripts

RUN pnpm run build

FROM node:22-alpine AS production

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY lib/db/package.json ./lib/db/package.json
COPY artifacts/api-server/package.json ./artifacts/api-server/package.json

RUN npm install -g pnpm@11
RUN pnpm install --prod --no-frozen-lockfile

COPY --from=builder /app/lib/db/dist ./lib/db/dist
COPY --from=builder /app/artifacts/api-server/dist ./artifacts/api-server/dist
COPY --from=builder /app/artifacts/wichi-quotation/dist ./artifacts/wichi-quotation/dist

EXPOSE 5000

CMD ["node", "--enable-source-maps", "./artifacts/api-server/dist/index.mjs"]