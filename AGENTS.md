# ResumeAI Agent Guide

## Purpose

This repository is a `pnpm` + Turborepo monorepo for an AI-assisted resume builder.
There are two product layers that currently coexist:

1. A browser-first editing experience in `frontend` that stores resumes in `localStorage`.
2. A backend in `backend` that supports AI imports, resume CRUD, ATS analysis, and LaTeX/PDF generation with optional Supabase-backed auth and persistence.

Any agent changing this codebase needs to understand that these two layers are not fully unified yet. Do not assume there is a single source of truth.

## Monorepo Layout

- `frontend`: Next.js 16 + React 19 frontend.
- `backend`: Hono API running on Node via `tsx`.
- `shared`: shared TypeScript types and Zod schemas used by both apps.
- `backend/supabase/schema.sql`: intended database schema for the backend persistence layer.
- `backend/templates/resume.tex`: LaTeX template used for PDF export.

## Key Runtime Architecture

### Frontend

The web app is centered around:

- `frontend/src/app/dashboard/page.tsx`: local dashboard of resumes.
- `frontend/src/app/editor/[id]/page.tsx`: editor bootstrap.
- `frontend/src/app/editor/[id]/connect/page.tsx`: animated source connection flow.
- `frontend/src/app/editor/[id]/import/page.tsx`: older import wizard flow.
- `frontend/src/components/editor/EditorLayout.tsx`: main editor shell.
- `frontend/src/lib/store/resumeStore.ts`: Zustand store for editor state and save behavior.

Current frontend persistence behavior:

- Dashboard, connect flow, import flow, and editor bootstrapping all read/write `resumeai_resumes` in `localStorage`.
- The editor store also has a `save()` path that issues `PUT /api/resume/:id`, which assumes a server route exists and is reachable.
- This means local-only editing and server-backed saving currently overlap. Treat that as an existing architectural gap, not an implementation detail to casually extend.

### Backend

The API entrypoint is `backend/src/index.ts`.

Main route groups:

- `/api/ai/*`: bullet rewrite, tailoring, and source imports.
- `/api/resume/*`: CRUD over resume records in Supabase.
- `/api/export/latex`: server-side LaTeX to PDF export.
- `/api/export/pdf/*`: legacy/alternate export path.
- `/api/build-resume`: full multi-agent pipeline.

Important backend dependencies:

- Anthropic for AI rewriting / scoring / normalization.
- Supabase admin client for auth and persistence.
- `pdflatex` installed on the host for real PDF export.
- `pdf-parse` and `mammoth` for uploaded resume ingestion.

## Shared Contracts

There are two resume shapes in the repo.

### Editor resume shape

Defined in `shared/src/types/resume.ts`.

This is the shape used by the web editor and local browser state:

- `personalInfo`
- `summary`
- `experience`
- `education`
- `projects`
- `skills`
- `achievements`
- `template`

### Pipeline normalized shape

Defined in `backend/src/agents/pipeline.types.ts`.

This shape is used by the multi-agent pipeline:

- `personal`
- `education`
- `experience`
- `projects`
- `skills`
- `competitive`

Do not conflate these two models. Agent 4 explicitly bridges the pipeline shape into the LaTeX/template shape. If you change either schema, audit every bridge and export path.

## AI and Import Flows

### Source import flow used by the newer connection UX

Primary files:

- `frontend/src/components/connection/ConnectionFlow.tsx`
- `frontend/src/hooks/useConnectionFlow.ts`
- `frontend/src/lib/connectionStages.ts`
- `frontend/src/lib/sourceMeta.ts`
- `frontend/src/lib/store/resumeStore.ts` via `mergeImportedData`

Behavior:

- The UI animates progress while API requests run in parallel.
- Results are merged into the local editor store only after all source calls settle.
- The merged resume is then persisted back to `localStorage`.

### Older import wizard

Primary file:

- `frontend/src/components/editor/ImportWizard.tsx`

This flow performs its own fetches and merge logic instead of using `useConnectionFlow`.
If you modify import behavior, check both paths. They are partially duplicated.

### Bullet rewrite and tailoring

Primary files:

- `backend/src/routes/ai/rewrite.ts`
- `backend/src/routes/ai/tailor.ts`
- `backend/src/lib/prompts.ts`
- `backend/src/lib/resumeHelpers.ts`

These routes currently require auth middleware.
Before changing frontend calls, verify whether the caller is actually attaching a Bearer token. Some current UI code calls relative `/api/...` routes with no token, which may not work unless a separate proxy/auth layer is introduced.

## Full Multi-Agent Pipeline

The end-to-end pipeline lives under `backend/src/agents` and is orchestrated by `backend/src/routes/build-resume.ts`.

Pipeline stages:

1. Agent 1 collects raw data from requested sources in parallel and normalizes it in one Anthropic call.
2. Agent 2 rewrites content for stronger resume bullets and ATS-aware phrasing.
3. Agent 3 scores the result and returns feedback.
4. Agent 4 converts the result into LaTeX and compiles a PDF with `pdflatex`.

Important constraint:

- Agent 4 assumes the host environment has a working `pdflatex` binary.
- If PDF generation changes, preserve temp directory cleanup and log-based error surfacing.

## Auth and Persistence Reality

Current code indicates an intended Supabase-backed product, but the shipped web app still behaves mostly like a local-first app.

What is real today:

- `backend/src/middleware/auth.ts` validates Bearer tokens with Supabase.
- `backend/src/routes/resume/index.ts` performs CRUD against the `resumes` table.
- `frontend/src/app/dashboard/page.tsx` and editor routes ignore Supabase and load from browser storage.
- `frontend/src/lib/api-client.ts` is written for token-based backend access, but much of the UI bypasses it.

Guidance:

- Do not claim a refactor is complete if only the frontend or only the backend was updated.
- When fixing data bugs, decide explicitly whether the affected flow is `localStorage`-driven, Supabase-driven, or both.
- If you introduce new resume fields, update:
  - shared editor types
  - any frontend creation defaults
  - merge/import logic
  - LaTeX generation
  - API validation and persistence if the field should survive round-trips

## Environment Requirements

Expected environment variables are documented in `.env.example`.

Important ones:

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `PORT`
- `WEB_URL`
- `ANTHROPIC_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Operational prerequisites:

- `pnpm` workspace support.
- A configured Supabase project for authenticated backend flows.
- `pdflatex` available on the machine for server-side export.

## Development Commands

Run from repo root:

- `pnpm dev`: run web and API together through Turbo.
- `pnpm dev:web`: run only the Next app.
- `pnpm dev:api`: run only the Hono API.
- `pnpm build`: build all packages/apps.
- `pnpm lint`
- `pnpm type-check`

## Safe Change Rules

### When touching the editor

- Audit `dashboard`, `editor/[id]`, `editor/[id]/connect`, and `editor/[id]/import`.
- Check whether your change needs to update `createDefaultResume()` in `shared`.
- Verify `resumeStore.mergeImportedData()` if imports are involved.

### When touching imports or AI routes

- Check both the animated connection flow and the older import wizard.
- Keep request/response shapes aligned with `shared` schemas where applicable.
- Preserve meaningful error messages because the UI surfaces API failures directly.

### When touching export or template code

- Audit both:
  - `backend/src/routes/export/latex.ts`
  - `frontend/src/lib/pdf/latex.ts`
- The web app supports two PDF paths:
  - real LaTeX compilation through the API
  - quick client-side HTML snapshot export

### When touching persistence

- Inspect `frontend/src/lib/api-client.ts`, `frontend/src/lib/store/resumeStore.ts`, and `backend/src/routes/resume/index.ts` together.
- Be careful with naming mismatches:
  - editor type uses `name`
  - backend row uses `title`
  - backend stores resume content inside `data`

## Known Architectural Gaps

These are current repo realities and should be treated carefully during changes:

- The main README is still the default Next.js scaffold and does not describe the actual product.
- The frontend has no visible Next route handlers under `frontend/src/app/api`, yet some components still call relative `/api/...` endpoints.
- Local browser persistence and Supabase-backed persistence are both present.
- Import logic exists in both `ConnectionFlow` and `ImportWizard`.
- Several files contain encoding artifacts in comments and string literals; avoid spreading them when editing.

## Recommended Workflow For Future Agents

1. Determine whether the task belongs to `frontend`, `backend`, `shared`, or multiple layers.
2. Identify whether the affected flow is local-only, backend-only, or hybrid.
3. Trace the data contract end-to-end before editing.
4. Update duplicated paths when the behavior is intentionally shared.
5. Type-check the affected app(s) after changes.
6. If export or AI flows were changed, validate the exact route and payload assumptions.

## Files Worth Reading First

- `frontend/src/lib/store/resumeStore.ts`
- `frontend/src/components/editor/EditorLayout.tsx`
- `frontend/src/components/connection/ConnectionFlow.tsx`
- `frontend/src/hooks/useConnectionFlow.ts`
- `backend/src/index.ts`
- `backend/src/routes/ai/index.ts`
- `backend/src/routes/resume/index.ts`
- `backend/src/routes/build-resume.ts`
- `backend/src/agents/pipeline.types.ts`
- `shared/src/types/resume.ts`

## Editing Principle

Prefer changes that reduce divergence between duplicated flows and mismatched persistence models.
Avoid adding a third path for the same user action unless the task explicitly requires it.
