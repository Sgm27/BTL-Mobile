# Healthcare Appointment Mobile System

> Full project context is in `CLAUDE.md`. Read that file first — it is the single source of truth for architecture, conventions, module ownership, and git commit rules.

## Project Context

- **Course**: Phat trien ung dung cho cac thiet bi di dong (Mobile App Development) — PTIT (Hoc vien Cong nghe Buu chinh Vien thong)
- **Group**: 02, Class section 07, Instructor: ThS. Nguyen Hoang Anh
- **Team**: Nguyen Thi Tu Anh (lead), Ngo Duc Son, Le Duc Hieu, Nguyen Trung Kien
- **Reality**: Le Duc Hieu (h3nr1-d14z) is coding ALL 4 members' parts solo. The AI agent is assisting him.
- **Goal**: University assignment. Must demo a working app with AI features. Keep it simple enough for a student project — prefer mock/sandbox over real integrations, rule-based logic + LLM API calls over custom ML models.

## Quick Reference

- **Monorepo**: `backend/` (Express + Prisma + TypeScript) + `mobile/` (React Native Expo + TypeScript)
- **DB**: PostgreSQL 16 (Docker) + Redis 7 (Docker)
- **AI**: OpenRouter API (multi-provider: Gemini, GPT, Claude, etc.)
- **Run**: `docker compose up -d` → `cd backend && npm run dev` / `cd mobile && npx expo start`

## Critical Rules

1. **Git identity**: Each module has an owner. Commit with their identity (see table in `CLAUDE.md`). Use `git -c user.name="X" -c user.email="Y" commit`.
   - If one coding session touches multiple owners' modules, **split into multiple commits** by ownership. Do not mix `auth`, `search`, `booking`, and shared infra in one commit.
   - Preserve this rule even if conversation context is compacted later.
2. **Never** add `Co-Authored-By` lines to any commit.
3. **Backend pattern**: Controller → Service → Prisma. Validate with Zod.
4. **Mobile pattern**: Screen → Hook → API Service → Zustand Store.
5. **API format**: `{ success: true, data }` or `{ success: false, error: { code, message } }`
6. **TypeScript strict** everywhere. Named exports. kebab-case files. PascalCase components.
7. **Mobile UI direction**: The app should look polished and attractive, not like a plain CRUD student demo. Prefer intentional visual hierarchy, smooth transitions, richer cards, and animation. Use libraries such as `lottie-react-native` when appropriate for loading, onboarding, or hero moments.
8. **iOS 26 Liquid Glass**: Tab bar MUST use `NativeTabs` from `expo-router/unstable-native-tabs` (NOT `Tabs` from `expo-router`). Cards use `GlassCard` component (`src/components/ui/GlassCard.tsx`). Do NOT set `overflow: 'hidden'` or `borderRadius` in RN styles on GlassView. Root layout wraps in `GlassContainer`. Must build with `npx expo run:ios`, not Expo Go.

## Key Files

- `CLAUDE.md` — Full conventions, module ownership map, all details
- `docs/api-overview.md` — 60+ API endpoints reference
- `docs/mvp-status.md` — Current MVP progress, what's already working, and what is still missing
- `backend/prisma/schema.prisma` — Database schema (20 models)
- `backend/src/utils/ai-client.ts` — AI provider abstraction
- `mobile/src/types/index.ts` — Shared TypeScript types
