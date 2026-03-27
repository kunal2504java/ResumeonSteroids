# ---- Stage 1: Dependencies (Alpine, small) ----
FROM node:20-alpine AS base
RUN npm install -g pnpm

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile

# ---- Stage 2: Build (Alpine, small) ----
FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY . .
RUN pnpm --filter @resumeai/api build

# ---- Stage 3: Runner (Debian for TeX Live) ----
# Using Debian instead of Alpine because TeX Live packages are not
# available on Alpine's apk, and the glibc-based packages work correctly.
FROM node:20-bullseye-slim AS runner
WORKDIR /app

# Install TeX Live packages needed to compile Jake's Resume template.
# texlive-latex-base   — core pdflatex engine
# texlive-latex-extra  — enumitem, titlesec, fancyhdr, tabularx, etc.
# texlive-fonts-recommended — standard fonts
# texlive-fonts-extra  — additional fonts (marvosym, etc.)
# texlive-plain-generic — glyphtounicode, babel
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      texlive-latex-base \
      texlive-latex-extra \
      texlive-fonts-recommended \
      texlive-fonts-extra \
      texlive-plain-generic && \
    rm -rf /var/lib/apt/lists/*

COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/templates ./templates
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/node_modules ./apps/api/node_modules

EXPOSE 4000
CMD ["node", "dist/index.js"]
