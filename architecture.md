# Project Knowledge Base & Architecture

## 1. Folder Structure
Maintain a highly organized folder structure following Feature-Sliced Design (FSD) inside `src/`:
```
src/
  app/              # Next.js App Router (Routing only! Thin wrappers, NO logic, NO complex UI here)
  features/         # Domain-specific modules (The core of FSD)
    [domain]/       # e.g., auth/, users/, tweets/
      api/          # API services for this feature (e.g., auth.service.ts)
      components/   # UI components specific to this feature (e.g., login-form.tsx)
      stores/       # Zustand stores for this feature
      hooks/        # Custom hooks for this feature
      types/        # TypeScript types for this feature
  components/       # Shared, global React components
    layout/         # Generic layouts (sidebar, header)
    ui/             # Generic UI components (shadcn: buttons, inputs)
  providers/        # Global context providers (e.g., AuthInitializer, QueryProvider)
  lib/              # Utility libraries, configurations (Tailwind cn, etc.)
  types/            # Shared global TypeScript interfaces and types
  utils/            # Shared pure helper functions
```

## 2. Naming Conventions
- **Components:** `PascalCase` (e.g., `TweetCard.tsx`)
- **Hooks:** `camelCase` starting with `use` (e.g., `useAuth.ts`)
- **Stores:** `xxx.store.ts` (e.g., `user.store.ts`)
- **API Services:** `xxx.service.ts` (e.g., `auth.service.ts`)
- **Types:** `xxx.type.ts` (e.g., `tweet.type.ts`)
- **Constants:** `UPPER_SNAKE_CASE` (e.g., `MAX_TWEET_LENGTH`)
- **Folders & Other Files:** `kebab-case` (e.g., `tweet-list/`)

## 3. Component Rules
- **Single Responsibility:** If a component has too many responsibilities or exceeds ~250 lines, split it.
- **Business Logic:** Do not place complex business logic directly in UI components. Extract to hooks or services.
- **Presentation vs. Container:** Separate complex logic from presentation if necessary.

## 4. API Integration
- **Direct Fetching:** DO NOT fetch APIs directly inside components.
- **Services:** All API calls must be defined in `services/`.
- **Server State:** Use React Query (when installed) for fetching, caching, and syncing server state.
- **Error Handling:** Centralized error handling. Ensure all responses are fully typed.
- **API Contract:** Refer to the backend `api.md` or `endpoint.md` for exact endpoints and payload structures.

## 5. Performance & Accessibility
- **Performance:** Use `useMemo` / `useCallback` when necessary. Use Skeleton loaders instead of spinners for loading >300ms. Optimize images (`next/image`).
- **Accessibility:** Ensure ARIA labels, keyboard navigation, semantic HTML, and proper focus states are implemented.

## 6. Group Administration Invariant

- A non-empty group has exactly one member with role `admin`; the product does not support multiple admins.
- Group creation assigns `admin` only to the creator. Added members always receive role `member`.
- A sole admin cannot use the normal leave endpoint while other members remain.
- To leave, the admin selects one current `member`. The backend atomically changes that member to `admin` and removes the previous admin through `POST /conversations/:conversation_id/transfer-admin-and-leave`.
- The transfer mutation must guard the current admin, successor membership and single-admin invariant again at write time. The frontend must not emulate transfer with two separate requests.
- Successful transfer emits `@conversation:group-updated` with `change_type: admin_transferred`; clients invalidate conversation/member queries, while every tab belonging to the previous admin removes group caches and exits the conversation route.
