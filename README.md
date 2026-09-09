# King of Barbecue — Restaurant Ordering & Operations Platform

Enterprise-ready, phased restaurant commerce and operations foundation for **King of Barbecue**.

Phase 1 implements a complete vertical slice:

- Polished customer storefront built with Next.js App Router, TypeScript, Tailwind CSS and shadcn-style UI primitives.
- Public menu, product details, Redis-backed guest cart, guest checkout and order confirmation.
- PostgreSQL order persistence with item snapshots, payment record and append-only status history.
- Secure staff login and role-based operations portal.
- Real-time customer order tracking with Server-Sent Events.
- Real-time operations order feed with optional audio alerts.
- Manual payment verification, controlled order transitions, rejection/failure/cancellation reasons.
- Store pause/resume control enforced by the backend and reflected on the storefront in real time.
- BullMQ worker foundation for guest-order linking, notifications, email and analytics jobs.

> The UI follows the supplied Figma direction as a warm, premium, food-first design language: ember/orange accents, charcoal contrast, rounded cards, generous spacing, strong hero imagery and tablet-friendly operations surfaces. Operations-only screens are intentionally designed to feel consistent with the storefront rather than like a generic admin template.

---

## Proposed Architecture

### Services

```text
apps/
  web/      Next.js customer storefront + operations UI
  api/      Express REST API + SSE endpoints
  worker/   BullMQ background workers

packages/
  shared-types/  Shared enums, DTOs, validation schemas, state machines
  config/        Shared environment parsing
```

### Backend layering

```text
Routes -> Controllers -> Services -> PostgreSQL / Redis / BullMQ / Realtime
```

- **Routes** define URL structure and middleware.
- **Controllers** are thin HTTP adapters.
- **Services** own both business logic and direct data access. There is intentionally no repository layer.
- **Infrastructure** modules encapsulate PostgreSQL pools, Redis connections, queues, logging and realtime publishing.
- **Workers** run outside the API request path.

### Scaling posture

- API instances can scale horizontally behind a load balancer.
- Redis is shared for guest carts, BullMQ and realtime event fan-out.
- SSE subscriber state exists per API instance, but order/store/operations events are published through Redis so other API instances can receive them.
- Workers scale independently by running additional `apps/worker` processes.
- PostgreSQL schema changes are migration-based and additive by default.

---

## Project Folder Structure

```text
.
├── apps
│   ├── api
│   │   ├── migrations
│   │   │   └── 001_initial_phase1.sql
│   │   └── src
│   │       ├── app.ts
│   │       ├── server.ts
│   │       ├── controllers
│   │       ├── db
│   │       ├── errors
│   │       ├── infra
│   │       ├── middleware
│   │       ├── realtime
│   │       ├── routes
│   │       ├── services
│   │       ├── types
│   │       └── webhooks
│   ├── web
│   │   └── src
│   │       ├── app
│   │       ├── components
│   │       │   ├── operations
│   │       │   ├── store
│   │       │   └── ui
│   │       └── lib
│   └── worker
│       └── src
├── packages
│   ├── config
│   └── shared-types
├── .env.example
├── package.json
└── tsconfig.base.json
```

---

## Phase 1 Database Schema Proposal

Implemented in `apps/api/migrations/001_initial_phase1.sql`.

### Core tables

| Table | Purpose |
| --- | --- |
| `users` | Authenticated users with `user_role[]` roles. Supports customers and staff in one auth model. |
| `product_categories` | Menu grouping such as Grills, Rice, Fish, Chicken, Sides, Drinks. |
| `products` | Menu products with category, image, price, availability and featured flag. |
| `store_settings` | Single-store Phase 1 availability state. Can evolve into branch-aware settings later. |
| `orders` | Permanent order record with UUID primary key, public order code, nullable `user_id`, guest contact snapshots, status and payment status. |
| `order_items` | Item snapshots at order time, preserving historical prices/names even if products change. |
| `payments` | Payment state and manual verification data; intentionally provider-agnostic for future gateways/webhooks. |
| `order_status_history` | Append-only audit timeline for status and payment transitions. |
| `webhook_events` | Idempotent future payment-provider webhook event records. |
| `schema_migrations` | Migration runner bookkeeping. |

### Entity relationship explanation

```text
User 1 --- * Order (nullable for guest checkout)
ProductCategory 1 --- * Product
Order 1 --- * OrderItem
Order 1 --- * Payment
Order 1 --- * OrderStatusHistory
User 1 --- * OrderStatusHistory as actor (nullable for guest/system events)
User 1 --- * StoreSettings.updated_by (nullable)
```

Important schema choices:

- `orders.id` is a UUID internal identifier.
- `orders.public_code` is human-friendly and safe to show, e.g. `ORD-AB12CD34`.
- Guest orders support `user_id = NULL` while retaining name/email/phone/address snapshots.
- `tracking_token_hash` protects guest order tracking sessions; public code alone is not enough.
- Status and payment status are separate PostgreSQL enums.
- Historical order item details are snapshotted in `order_items.product_snapshot`.
- Future branch/inventory/supplier/logistics tables should be introduced through migrations when those modules are implemented, rather than speculatively adding tables now.

---

## Order State Machine

Implemented in `packages/shared-types/src/index.ts`.

```text
PENDING
  -> APPROVED
  -> REJECTED
  -> CANCELLED
  -> FAILED

APPROVED
  -> IN_PREPARATION
  -> READY
  -> CANCELLED
  -> FAILED

IN_PREPARATION
  -> READY
  -> CANCELLED
  -> FAILED

READY
  -> OUT_FOR_DELIVERY
  -> COMPLETED
  -> CANCELLED
  -> FAILED

OUT_FOR_DELIVERY
  -> COMPLETED
  -> FAILED
  -> CANCELLED

COMPLETED / REJECTED / FAILED / CANCELLED are terminal.
```

Rejected, failed and cancelled paths require reasons through operational APIs and are recorded in `order_status_history`.

---

## Payment State Machine

```text
UNPAID -> PENDING | PAID | FAILED | CASH_ON_DELIVERY
PENDING -> PAID | FAILED | REFUNDED | CASH_ON_DELIVERY
CASH_ON_DELIVERY -> PAID | FAILED | REFUNDED
PAID -> REFUNDED
FAILED -> UNPAID | PENDING
REFUNDED -> terminal
```

Phase 1 supports manual staff verification (`UNPAID -> PAID`) without coupling the system to a provider. Future payment webhooks should update payments through service-level business logic after signature verification and idempotency checks.

---

## Role and Authorization Matrix

| Capability | CUSTOMER | CASHIER | OPERATIONS_STAFF | MANAGER | OWNER | ADMIN | Future roles |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Browse menu | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Guest checkout | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View own linked orders | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Scoped later |
| Operations dashboard | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | Role-specific later |
| Approve/reject/update order | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | Kitchen/logistics can be scoped later |
| Update payment status | ❌ | ✅ | ❌ | ✅ | ✅ | ✅ | Payment permissions can be narrowed later |
| Pause/resume store | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | Branch-scoped later |
| Supplier data | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | SUPPLIER only own records later |

Protected routes use:

- `requireAuth()`
- `requireRole([...])`

The frontend never acts as the enforcement layer.

---

## Redis Usage Plan

Implemented:

1. **Guest carts**
   - Key: `cart:{cart_id}`
   - Identifier stored in HTTP-only `kob_cart_id` cookie.
   - Cart data is JSON with product IDs, quantities and special instructions.
   - PostgreSQL is not written on every temporary cart mutation.

2. **BullMQ queue infrastructure**
   - Redis-backed queues for guest linking, email, notifications and analytics.

3. **Realtime event fan-out**
   - Channel: `kob:realtime-events`
   - API instances publish order/store events through Redis Pub/Sub.

4. **Idempotency helper**
   - Temporary checkout idempotency cache for returning the same order/tracking token on immediate retries.

Future Redis use:

- Rate limiting at distributed scale.
- Caching high-traffic menu/category reads.
- Short-lived operational locks if needed.

---

## BullMQ Queue Plan

Implemented queue names live in `@kob/shared-types`:

| Queue | Phase 1 behavior | Future use |
| --- | --- | --- |
| `guest-account-linking` | Links verified guest orders to newly created customer accounts in the background. | Safer identity matching, email verification-assisted linking. |
| `email` | Logs placeholder confirmation/update work. | Order confirmations, cancellation emails, supplier notices. |
| `notifications` | Logs operational/customer notifications. | SMS, WhatsApp, push notifications. |
| `analytics` | Placeholder order event aggregation. | Historical reporting, AI/statistical insights. |

The API creates durable jobs for non-critical work and returns promptly when the job is not required to block the customer.

---

## SSE Real-Time Architecture

```text
Order Updated / Store Updated
        ↓
Domain Service
        ↓
Realtime Publisher
        ↓
Redis Pub/Sub channel
        ↓
Each API instance's local SSE subscriber registry
        ↓
Browser EventSource clients
```

Endpoints:

- Customer tracking: `GET /api/orders/:publicCode/stream`
- Operations feed: `GET /api/operations/stream`
- Store availability: `GET /api/store/stream`

Security:

- Guest order streams require the correct per-order HTTP-only tracking cookie.
- Logged-in customers may access linked orders.
- Operational staff may access operational streams.
- Public order code alone does not authorize order access.

---

## API Specification

Base URL: `http://localhost:4000/api`

### Auth

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/auth/login` | Public | Login and set HTTP-only session cookie. |
| `POST` | `/auth/logout` | Public | Clear session cookie. |
| `GET` | `/auth/me` | Optional | Return current user or null. |
| `POST` | `/auth/guest-account` | Tracking session | Create customer account from a verified guest order. |

### Catalog

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/categories` | Public | Active product categories. |
| `GET` | `/products` | Public | Product list; supports `category` and `featured`. |
| `GET` | `/products/:idOrSlug` | Public | Product details. |

### Redis-backed cart

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/cart` | Guest cookie | Read cart summary with live product prices. |
| `POST` | `/cart/items` | Guest cookie | Add product to Redis cart. |
| `PATCH` | `/cart/items/:productId` | Guest cookie | Update quantity/special instructions. |
| `DELETE` | `/cart/items/:productId` | Guest cookie | Remove item. |
| `DELETE` | `/cart` | Guest cookie | Clear cart. |

### Orders

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/orders` | Guest cookie | Checkout. Backend validates cart, availability and totals. |
| `GET` | `/orders/me` | Auth | Customer order dashboard data. |
| `GET` | `/orders/:publicCode` | Auth or tracking cookie | Customer order details. |
| `GET` | `/orders/:publicCode/stream` | Auth or tracking cookie | Customer SSE stream. |

### Operations

| Method | Endpoint | Roles | Description |
| --- | --- | --- | --- |
| `GET` | `/operations/orders` | Ops roles | Search/filter/paginate orders. |
| `GET` | `/operations/orders/:id` | Ops roles | Full order detail. |
| `PATCH` | `/operations/orders/:id/approve` | Ops roles | `PENDING -> APPROVED`. |
| `PATCH` | `/operations/orders/:id/reject` | Ops roles | Reject with structured reason. |
| `PATCH` | `/operations/orders/:id/fail` | Ops roles | Mark failed with reason. |
| `PATCH` | `/operations/orders/:id/cancel` | Ops roles | Cancel with reason. |
| `PATCH` | `/operations/orders/:id/status` | Ops roles | Controlled status transition. |
| `PATCH` | `/operations/orders/:id/payment` | CASHIER/MANAGER/OWNER/ADMIN | Controlled payment transition. |
| `GET` | `/operations/stream` | Ops roles | Realtime operations SSE feed. |
| `POST` | `/operations/store/pause` | Store-control roles | Pause new orders. |
| `POST` | `/operations/store/resume` | Store-control roles | Resume new orders. |

### Store availability

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/store/settings` | Public | Store pause state. |
| `GET` | `/store/stream` | Public | Store pause/resume SSE stream. |

### Future webhooks

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/webhooks/payment-provider` | Provider signature in future | Idempotently records placeholder payment provider events. |

---

## Frontend Page and Component Plan

### Customer storefront

| Route | Purpose |
| --- | --- |
| `/` | Landing page with navigation, hero, featured menu, gallery, about and contact/location sections. |
| `/menu` | Category-grouped menu with live backend data and add-to-cart actions. |
| `/menu/[slug]` | Product details with large image, quantity selector and special instructions. |
| `/cart` | Redis-backed cart summary, empty state and quantity controls. |
| `/checkout` | Guest checkout with pickup/delivery, contact details and manual/COD payment options. |
| `/orders/[code]` | Confirmation + real-time order tracking + guest-to-account creation. |
| `/dashboard/orders` | Basic authenticated customer order dashboard. |

### Operations portal

| Route | Purpose |
| --- | --- |
| `/operations/login` | Secure staff login. |
| `/operations` | Live order board, filters, search, audio alerts and store pause control. |
| `/operations/orders/[id]` | Full operational order detail, customer context, packing list and controlled actions. |
| `/operations/orders/[id]/print` | Compact browser-printable docket/receipt view. |

### Component approach

- Server Components where pages can load catalog data without interactivity.
- Client Components for cart mutations, checkout forms, SSE tracking, operations board and audio alerts.
- shadcn-style local UI primitives in `apps/web/src/components/ui`.
- No global client state library; cart and order state are authoritative in backend/Redis/PostgreSQL.

---

## Database Migration Strategy

- SQL migrations live in `apps/api/migrations`.
- Migration runner records applied versions in `schema_migrations`.
- Prefer safe additive changes:
  - add table
  - add nullable column
  - add index for real query pattern
  - backfill in controlled step
  - gradually enforce constraints
- Do not drop production data casually.
- Future modules such as branches, inventory, suppliers, logistics and analytics aggregates should be added through new migrations when implemented.

---

## Local Development Setup (No Docker)

### Prerequisites

- Node.js v18+
- npm v9+
- PostgreSQL 14+
- Redis 6+

### Install PostgreSQL and Redis

#### macOS (Homebrew)

```bash
brew install postgresql@16 redis
brew services start postgresql@16
brew services start redis
createdb king_of_barbecue
```

#### Ubuntu / Debian Linux

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib redis-server
sudo systemctl enable --now postgresql redis-server
sudo -u postgres createdb king_of_barbecue
```

If your local Postgres user/password differs, update `DATABASE_URL` in `.env`.

#### Windows

Recommended native installers:

- PostgreSQL: https://www.postgresql.org/download/windows/
- Redis-compatible server: Memurai Community Edition or Redis via WSL2.

Create a database named `king_of_barbecue`, then update `.env` accordingly.

### Start the platform

```bash
# 1. Install dependencies
npm install

# 2. Create environment file
cp .env.example .env
# Edit DATABASE_URL, REDIS_URL and JWT_SECRET for your machine.

# 3. Build shared packages
npm run build:packages

# 4. Run migrations
npm run db:migrate

# 5. Seed staff user, demo customer and menu data
npm run db:seed

# 6. Run all services concurrently
npm run dev
```

Or run services separately:

```bash
npm run dev:api      # Express API on 0.0.0.0:4000
npm run dev:worker   # BullMQ workers
npm run dev:web      # Next.js web app on 0.0.0.0:3000
```

Seeded staff account:

```text
Email:    admin@kingbbq.local
Password: password123
```

---

## Testing

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

Current tests cover:

- Order state transitions.
- Payment state transitions.
- Authorization role helpers.
- Integer-cent pricing calculations.
- An optional HTTP integration flow for guest checkout → staff payment verification → approval → customer tracking.

Run the integration flow against a migrated and seeded test database/Redis instance:

```bash
RUN_INTEGRATION_TESTS=true \
TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5432/king_of_barbecue_test \
TEST_REDIS_URL=redis://localhost:6379 \
npm test
```

---

## MVP Demonstration Flow

1. Customer opens `http://localhost:3000`.
2. Customer browses `/menu` and opens a product detail page.
3. Customer adds products to cart.
4. API stores guest cart under `cart:{cart_id}` in Redis and uses an HTTP-only cart cookie.
5. Customer checks out at `/checkout`.
6. API validates cart, product availability and totals; creates order, items, payment and history in PostgreSQL.
7. API clears Redis cart and sets an HTTP-only per-order tracking token cookie.
8. Customer lands on `/orders/:publicCode` and listens to SSE.
9. Staff logs in at `/operations/login`.
10. New order appears on `/operations` via SSE; optional audio alert plays once per event ID.
11. Staff marks payment as paid and approves the order.
12. Customer tracking page updates instantly without polling or refresh.

---

## Deployment Architecture

Recommended split:

```text
Next.js frontend (Vercel or similar)
        ↓ HTTPS
Express API (Railway / Render / Fly.io / VPS)
        ↓
PostgreSQL managed database
        ↓
Redis managed instance
        ↓
BullMQ worker service(s)
```

Guidance:

- Deploy `apps/web` independently from `apps/api` and `apps/worker`.
- Set `API_INTERNAL_URL` for frontend server-side rewrites.
- Set `NEXT_PUBLIC_API_PROXY_BASE=/api/backend` so browser code uses relative URLs through the Next.js proxy.
- Configure API `CORS_ORIGINS` for frontend domains if direct API access is needed.
- Use long, random `JWT_SECRET` in production.
- Enable `COOKIE_SECURE=true` behind HTTPS.
- Run migrations before new API versions become active.
- Scale workers independently based on queue depth.

---

## Future Phases

The current architecture intentionally leaves space for:

- Branch and organization hierarchy.
- Branch-aware staff permissions and store settings.
- Ingredient-level inventory, stock movements and low-stock alerts.
- Supplier registration, catalogs and purchase orders.
- Logistics dispatch records, drivers and delivery partners.
- Payment provider webhooks and refunds.
- Historical analytics and AI/statistical insight jobs.

Those should be introduced incrementally through migrations and focused services without rewriting the Phase 1 ordering core.
