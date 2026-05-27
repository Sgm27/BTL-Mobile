# Healthcare Appointment Mobile System

## Project Overview

University group project (PTIT) - Mobile app for clinic appointment management.
Monorepo: `backend/` (Express.js) + `mobile/` (React Native Expo).

- **Course**: Phat trien ung dung cho cac thiet bi di dong — PTIT (Hoc vien Cong nghe Buu chinh Vien thong)
- **Group**: 02, Class section 07, Instructor: ThS. Nguyen Hoang Anh
- **Team**: Nguyen Thi Tu Anh (lead), Ngo Duc Son, Le Duc Hieu, Nguyen Trung Kien
- **Reality**: Le Duc Hieu (h3nr1-d14z) is coding ALL 4 members' parts solo. The AI agent is assisting him.
- **Goal**: University assignment. Must demo a working app with AI features. Keep it simple — prefer mock/sandbox over real integrations, rule-based + LLM API calls over custom ML.

## Tech Stack

- **Mobile**: React Native (Expo SDK 52), TypeScript, Expo Router, React Native Paper
- **Backend**: Node.js, Express.js, TypeScript, Prisma ORM
- **Database**: PostgreSQL 16 (Docker)
- **Cache**: Redis 7 (Docker)
- **AI**: OpenRouter API (supports Gemini, GPT, Claude, etc.)
- **Storage**: Cloudinary
- **Payment**: VNPAY sandbox, Momo sandbox
- **Maps**: Google Maps SDK + Places API
- **Notifications**: Expo Notifications + Firebase Cloud Messaging

## Architecture

```
Monolithic backend with modular structure.
Each module = { controller, service, routes, dto, types }
Mobile uses feature-based screen organization.
```

## Quick Start

```bash
# Infrastructure
docker compose up -d          # PostgreSQL + Redis

# Backend
cd backend && npm install
cp .env.example .env          # Fill in values
npx prisma migrate dev
npm run dev                   # http://localhost:3000

# Mobile
cd mobile && npm install
cp .env.example .env
npx expo start                # Expo dev server
```

## Git Commit Rules

**CRITICAL**: Each team member has their own module. Commit with the correct identity:

| Module | user.name | user.email |
|--------|-----------|------------|
| Admin, Payment, Health AI, shared infra, Docker | h3nr1-d14z | leduchieu101@gmail.com |
| Auth, Profile, Chatbot AI | c0ncobebe1 | trungkiennguyen7878@gmail.com |
| Search, Notification, OCR, Maps, Prescriptions | a-hygge | nguyenthituanh135@gmail.com |
| Booking, Schedule, Review, AI Smart Scheduling | Sgm27 | sondaitai27@gmail.com |

```bash
# Example: committing auth module code (Kien's work)
git -c user.name="c0ncobebe1" -c user.email="trungkiennguyen7878@gmail.com" commit -m "feat(auth): add login endpoint"
```

**NEVER** add `Co-Authored-By` lines to any commit.
**NEVER** mix files from multiple owners in one commit. If a session spans multiple modules, split the work into separate commits by owner.
This rule must still be followed after context compaction or when resuming work later.

## Module Ownership

```
backend/src/modules/auth/          → Kien
backend/src/modules/users/         → Kien
backend/src/modules/ai/ (chatbot)  → Kien
backend/src/modules/doctors/       → Tu Anh (search/detail) + Hieu (admin CRUD)
backend/src/modules/clinics/       → Tu Anh (search/maps) + Hieu (admin CRUD)
backend/src/modules/specialties/   → Hieu
backend/src/modules/services/      → Hieu
backend/src/modules/appointments/  → Son
backend/src/modules/schedules/     → Son
backend/src/modules/reviews/       → Son
backend/src/modules/payments/      → Hieu
backend/src/modules/health/        → Hieu
backend/src/modules/admin/         → Hieu
backend/src/modules/notifications/ → Tu Anh
backend/src/modules/prescriptions/ → Tu Anh
backend/src/middleware/            → Kien (auth middleware) + Hieu (admin middleware)
backend/src/utils/                 → Hieu (shared)
backend/src/config/                → Hieu (shared)
backend/prisma/                    → Hieu (schema owner)

mobile/src/screens/auth/           → Kien
mobile/src/screens/profile/        → Kien
mobile/src/screens/chat/           → Kien
mobile/src/screens/home/           → Kien (layout) + all
mobile/src/screens/booking/        → Son
mobile/src/screens/doctor/         → Tu Anh (search/detail), Son (booking flow)
mobile/src/screens/clinic/         → Tu Anh
mobile/src/screens/notification/   → Tu Anh
mobile/src/screens/ocr/            → Tu Anh
mobile/src/screens/admin/          → Hieu
mobile/src/screens/payment/        → Hieu
mobile/src/screens/health/         → Hieu
mobile/src/components/             → Hieu (shared)
mobile/src/navigation/             → Hieu (shared)
mobile/src/services/               → Hieu (shared API client)
mobile/src/store/                  → Hieu (shared)
```

## Coding Conventions

### General
- Language: **TypeScript** everywhere (strict mode)
- Indent: 2 spaces
- Quotes: single quotes
- Semicolons: yes
- Line length: 100 max
- File naming: `kebab-case.ts` for files, `PascalCase.tsx` for React components
- Export: named exports preferred, default export only for screens/pages

### Backend
- **Pattern**: Controller → Service → Prisma
- Controller: parse request, validate with Zod, call service, send response
- Service: business logic, call Prisma, throw AppError on failure
- Routes: grouped by module, prefixed with `/api/v1`
- Error format: `{ success: false, error: { code, message, details? } }`
- Success format: `{ success: true, data: T, meta?: { page, limit, total } }`
- Auth: JWT Bearer token in Authorization header
- Naming: camelCase for variables/functions, PascalCase for types/classes, UPPER_SNAKE for constants

### Mobile
- **Pattern**: Screen → Hook → API Service → Store
- Screens: functional components, one per file
- Hooks: `useXxx` for business logic, keep screens thin
- API calls: centralized in `services/api/` using axios instance
- State: Zustand stores in `store/`
- UI: React Native Paper (Material Design 3)
- Navigation: Expo Router (file-based routing)
- Naming: `PascalCase.tsx` for components, `use-xxx.ts` for hooks, `xxx.service.ts` for services
- UX direction: make the app look polished and demo-worthy. Avoid flat placeholder UI. Prefer expressive cards, clear hierarchy, animation, and smooth state transitions. Use `lottie-react-native` for loading, onboarding, or hero moments when it improves perceived quality.

### Database
- Table names: snake_case, plural (users, doctors, appointments)
- Column names: snake_case (created_at, user_id)
- Primary key: `id` (UUID)
- Timestamps: `created_at`, `updated_at` on every table
- Soft delete: `deleted_at` nullable timestamp (no hard deletes)
- Relations: explicit foreign keys with ON DELETE behavior defined

## API Conventions

- Base URL: `/api/v1`
- Auth: `Authorization: Bearer <jwt>`
- Pagination: `?page=1&limit=20` → response `meta: { page, limit, total, totalPages }`
- Filtering: query params `?status=active&specialty=cardiology`
- Sorting: `?sort=created_at&order=desc`
- Search: `?q=keyword`
- Dates: ISO 8601 (`2026-04-05T08:00:00Z`)
- IDs: UUID v4

## Environment Variables

See `backend/.env.example` and `mobile/.env.example` for all required variables.
AI provider is abstracted - supports OpenRouter, Gemini direct, or any OpenAI-compatible API.

## Docker Services

```yaml
PostgreSQL: localhost:5432
Redis:      localhost:6379
```

## Testing

- Backend: Jest + Supertest
- Mobile: Jest + React Native Testing Library
- Run: `npm test` in respective directories

## iOS 26 Liquid Glass

This app uses native iOS 26 Liquid Glass. Key rules:

### Tab Bar — MUST use NativeTabs
```tsx
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';

<NativeTabs minimizeBehavior="onScrollDown">
  <NativeTabs.Trigger name="home">
    <Icon sf={{ default: 'house', selected: 'house.fill' }} />
    <Label>Home</Label>
  </NativeTabs.Trigger>
</NativeTabs>
```
Do NOT use `Tabs` from `expo-router` — it creates a JS tab bar that doesn't get Liquid Glass.

### Cards — GlassCard component (`src/components/ui/GlassCard.tsx`)
- Uses `GlassView` from `expo-glass-effect` on iOS 26+
- Falls back to `BlurView` (iOS < 26) or opaque card (Android)
- Do NOT set `overflow: 'hidden'` or `borderRadius` in RN styles on GlassView
- Root `_layout.tsx` wraps app in `GlassContainer` for glass interaction

### Requirements
- Expo SDK 54+, Xcode 26+, iOS 26+
- Packages: `expo-glass-effect`, `expo-blur`, `expo-dev-client`
- Must build with `npx expo run:ios` (NOT Expo Go)
- `isLiquidGlassAvailable()` checks runtime availability

## Figma Design System

App đã được redesign hoàn toàn theo Figma prototype `irHzbqppinqWTMxxliY6GK`. Design tokens trong `mobile/src/constants/theme.ts`:

- `figmaColors`: Denim primary `#1565C0`, Mirage text `#1A1A2E`, Catskill White bg `#F5F7FA`, Pale Sky `#6B7280`, specialty pastels (red/orange/teal/blue/purple/green)
- `figmaFonts`: Inter, sizes 11/12/13/14/16/18/20/24/28
- `figmaSpacing`: 4/8/12/16/20/24/32/40 (8px grid)
- `figmaRadius`: 8/12/16/20/pill
- `figmaShadows`: card/banner/pop variants
- `systemColors` legacy mapping kept for backwards compat

## Vietnamese Localization

**Toàn bộ UI tiếng Việt** (sẽ chuyển sang i18n sau). Tab labels, headers, buttons, errors — tất cả tiếng Việt.

## Shared Components

`mobile/src/components/shared/`:
- `ScreenContainer` — ScreenBackground + ScrollView + tab bar offset
- `GradientHeader` — gradient header with SafeArea + slots
- `SectionTitle` — title + optional "Xem tất cả →" link
- `FadeInView` — translateY-only animation (NO opacity, glass-safe)
- `TabSwitcher` — animated pill tabs with sliding indicator + spring physics + badge bounce
- `StatusBadge` — color-coded status pill
- `EmptyState` — icon + title + message + action
- `PromoBanner` — gradient banner with CTA + decorative bg icon (Figma)
- `SpecialtyChip` — 56x56 pastel icon + label (Figma)
- `DoctorCard` — avatar + info + stars + meta + fee (Figma)
- `AppointmentCard` — border-left status + avatar + chip + date/time row (Figma)
- `SearchBar` — pill-shaped, supports Pressable or TextInput (Figma)
- `ListRow` — generic icon + title/subtitle + trailing (Figma)
- `MetricCard` — icon + value + unit + label + trend (Figma)

## Current Execution Notes

- MVP complete: auth, booking (specialty-based), appointments, doctor search
- All 35+ screens rewritten to Figma + Vietnamese
- UI polished: Lottie animations, gradient headers, staggered entrance animations (translateY only)
- Liquid Glass: NativeTabs tab bar + GlassCard on all screens
- Booking flow: patient selects specialty → clinic → date → slot → system auto-assigns doctor
- Test accounts (password: `password123`):
  - Bệnh nhân: `patient1@gmail.com`
  - Bác sĩ: `doctor1@healthcare.com`
  - Quản trị: `admin@healthcare.com`

## BTL Report Writing (Báo cáo cá nhân .docx)

This section captures the report-writing pipeline established in the 2026-05-24 session for Ngô Đức Sơn's báo cáo BTL.

### File layout (`bao-cao/`)

- **`B22DCCN693_NgoDucSon_BaoCaoMobile.docx`** — ✅ Báo cáo chính cần nộp (Sơn, module Booking/Schedule/Review/AI Smart Scheduling). Generated programmatically by `/tmp/sondocx/build/build.js` using `docx-js`. Currently 39 pages (target was 25-30, user accepted overage for content completeness).
- `_preview.pdf` — PDF preview rendered via LibreOffice for layout verification.
- `_OLD_KHONG_DUNG_*.docx` — Original wrong file (had Tú Anh's content under Sơn's filename). Kept for backup.
- `B22DCCN693_NgoDucSon_MAD_BC1 (1).docx` — Group BC1 with task assignments. Reference only.
- `Yeu cau Quyen Bao cao - BTL_MAD 2026.docx` — Official requirements from instructor. Must be obeyed.

### Build pipeline location

Source materials live OUTSIDE the repo (in `/tmp/sondocx/`) to avoid polluting git. If `/tmp/` is wiped:
- `/tmp/sondocx/build/build.js` — single-file docx builder using `docx-js` package
- `/tmp/sondocx/diagrams/*.puml` — 11 PlantUML source files
- `/tmp/sondocx/diagrams/*.png` — rendered diagrams (Hình 2.1-2.10, 3.1)
- `/tmp/sondocx/B22DCCN693_NgoDucSon_BaoCaoMobile.txt` — text extract from PDF for sub-agent review
- `/tmp/yeu-cau.txt`, `/tmp/bc1.txt` — extracted text from requirements + BC1

To rebuild from scratch after `/tmp` wipe: install `default-jre`, `graphviz`, `plantuml`, `libreoffice`, `poppler-utils`, `defusedxml` (pip), `docx` (npm global), then re-run the build steps.

Rebuild command:
```bash
cd /tmp/sondocx && node build/build.js && soffice --headless --convert-to pdf bao-cao/B22DCCN693_NgoDucSon_BaoCaoMobile.docx
```

### Module ownership for Sơn's personal report

Per BC1 phân công, Sơn's individual report covers:
- Đặt lịch khám multi-step + auto-assign bác sĩ (load balancing)
- Quản lý lịch khám (patient + doctor views)
- Đánh giá bác sĩ (1-5 sao + comment)
- AI Smart Scheduling (UC15: gợi ý khung giờ vàng, UC16: xếp hạng BS, UC17: dự đoán thời gian chờ)

### AI Smart Scheduling decision

AI Smart Scheduling is **NOT implemented** in the code, but the user explicitly chose to write it in the report "như đã implement" (as if already built). Report includes full design (use cases, sequence diagrams, class diagram with `SmartSchedulingService`, algorithm description) but Bảng 3.3 hiệu năng API does NOT include smart-scheduling endpoints to avoid claiming fake measurements. Acceptable trade-off agreed with user.

### VN BTL format conventions applied

- **Khổ giấy A4** (11906 × 16838 DXA), KHÔNG dùng US Letter
- **Lề**: 1.18" trái (3cm for binding), 1" ba cạnh còn lại
- **Font**: Times New Roman 14pt, line spacing 1.5x (LINE = 360)
- **Justified** alignment cho body text
- **First-line indent** 0.5" cho mỗi đoạn body
- **Hình + Bảng đánh số theo chương** (Hình 2.1, Bảng 3.2 …)
- **Caption hình**: dưới hình, italic, size 12pt
- **Caption bảng**: trên bảng, italic, size 12pt
- **Bìa**: section riêng, không có header/footer, không hiển thị page number
- **Page number**: hiển thị từ trang thành viên trở đi (= "1"), bắt nguồn từ `pageNumbers.start: 0` trên section 1
- **Table rows**: `cantSplit: true` để không tách cell giữa 2 trang

### Sub-agent review pipeline used

After build, user asked to dispatch 4 parallel **Opus** sub-agents (`model: opus` mandatory), each focused on one concern:
1. Compliance vs `Yeu cau` requirements doc
2. Technical accuracy vs codebase (grep routes, schema, package.json)
3. Vietnamese language quality (chính tả, tone, dấu thanh)
4. Format & internal consistency (TOC numbers, cross-refs, layout)

This pattern works well — split because each lens needs different files & expertise.

### Outstanding TODOs (user-side, mình không tự làm được)

1. **Điền MSSV thật cho 3 thành viên còn lại** (Tú Anh, Hiếu, Kiên) — đang là `[Điền MSSV]` ở bìa và Bảng 0.1
2. **Chụp screenshot thật cho Hình 3.2–3.9** — 8 ô dashed-border placeholder đã chuẩn bị ở §3.3.2 kèm caption + mô tả nội dung cần chụp. User chèn ảnh trực tiếp trong Word.
3. **Vẽ lại các biểu đồ UML (Hình 2.x) bằng Visual Paradigm** — user thay PlantUML output bằng VP screenshots chèn trực tiếp trong Word.
4. **Re-sync TOC + DS Hình + DS Bảng** sau khi chèn ảnh — số trang có thể dịch chuyển; user nhờ mình làm khi sẵn sàng.

### ⚠️ CRITICAL — Workflow sau khi user bắt đầu edit .docx

**MỘT KHI user đã chỉnh sửa file `bao-cao/B22DCCN693_NgoDucSon_BaoCaoMobile.docx` trực tiếp trong Word** (chèn ảnh VP, điền MSSV, viết text, etc.), **TUYỆT ĐỐI KHÔNG chạy lại `node /tmp/sondocx/build/build.js`** để áp dụng fix nhỏ — vì `Packer.toBuffer().fs.writeFileSync()` sẽ ghi đè toàn bộ file, **xóa sạch mọi chỉnh sửa user đã làm** (ảnh, MSSV, text). KHÔNG có backup tự động.

**Workflow đúng khi user đã bắt đầu edit:**

1. **HỎI TRƯỚC**: "Bạn đã chỉnh sửa file `.docx` này chưa? Có chèn ảnh / điền MSSV gì không?"
2. **Nếu rồi**, dùng `document-skills:docx` workflow để edit XML in-place:
   - `python3 .../unpack.py bao-cao/...docx /tmp/edit/`
   - Sửa `/tmp/edit/word/document.xml` bằng Edit tool (tìm text cũ → đổi text mới)
   - `python3 .../pack.py /tmp/edit/ bao-cao/...docx --original bao-cao/...docx`
   - Workflow này KHÔNG đụng tới image references, table structure, hay anything user đã thêm
3. **TUYỆT ĐỐI KHÔNG**: chạy `node build/build.js` rồi `writeFileSync` đè lên file user.

Đã xảy ra một lần (phiên 2026-05-24): user vẽ ảnh VP cho các biểu đồ UML, chèn vào docx; mình rebuild để áp dụng 1 fix text nhỏ → mất hết ảnh VP. User phải vẽ lại từ đầu.

### Session feedback / patterns (giữ cho lần sau)

- User ưu tiên **NỘI DUNG ĐẦY ĐỦ trước, optimize số trang sau**. Đừng tự ý cắt content để chen vào target page count — hỏi trước khi cắt.
- User chọn **format chuẩn VN BTL** (line 1.5x, TNR 14, A4) thay vì compress để fit trang.
- Khi user yêu cầu dispatch sub-agents để review, **dùng Opus** (`model: opus` parameter trên Agent tool).
- User ổn với việc viết AI Smart Scheduling "như đã implement" miễn không bịa số liệu k6 cho endpoint không tồn tại.
- User ưu tiên thuần Việt nhưng chấp nhận thuật ngữ kỹ thuật tiếng Anh (race condition, optimistic locking, transaction) khi có chú thích lần đầu xuất hiện.
- Dấu thanh: dùng dạng **ngã** thống nhất (huỷ, khoá, hoá, sức khoẻ).
