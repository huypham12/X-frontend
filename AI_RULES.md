# AI Constitution (Core Rules)

## 1. Tech Stack (Mandatory)
- **Framework:** Next.js 16 (App Router)
- **Library:** React 19
- **Language:** TypeScript (Strict Mode)
- **Styling:** TailwindCSS v4 + shadcn/ui + @base-ui/react
- **Icons:** lucide-react
- **State Management:** Zustand (Global), React Query (Server State) *(Note: Needs installation when used)*
- **Forms:** React Hook Form + Zod *(Note: Needs installation when used)*
- **Animation:** Framer Motion (for subtle animations) *(Note: Needs installation when used)*

## 2. Coding Style
- **Functional Components ONLY.** Arrow functions preferred. No class components.
- **Strict TypeScript:** NO `any`. Define interfaces and types for all props and state.
- **Composition over Inheritance:** Build small, reusable components.
- **Early Return:** Prevent nested if-statements (max 2 levels deep).
- **Clean Code:** No dead code, no `console.log` in production, remove TODOs before finalizing.

## 3. Strict Prohibitions (What NOT to do)
- **DO NOT install new packages** without explicit permission and reasoning.
- **DO NOT modify API contracts.** Frontend must adapt to Backend requests/responses. If fields are missing, add a note/comment instead of faking data structures.
- **DO NOT refactor the entire project** when tasked with a specific feature. Stick to the scope.
- **DO NOT use duplicate states.** Avoid `useEffect` chains that cause infinite loops (`fetch` -> `setState` -> `useEffect` -> `fetch`).
- **STRICT FSD ENFORCEMENT:** DO NOT place domain-specific code (UI, API, stores) in global `src/components`, `src/services`, or `src/app`. All domain logic MUST be encapsulated inside `src/features/[domain]/...`. The `src/app` directory is ONLY for routing (Thin wrappers).

## 4. Communication & Output Rules
- **Explain Trade-offs:** If there are multiple ways to implement something, list options, pros/cons, and recommend one.
- **Ask Questions:** If requirements are ambiguous, STOP and ask for clarification before writing code.
- **Execution Steps:**
  1. Analyze requirements.
  2. List components to create.
  3. List files to modify.
  4. Explain architectural choices.
  5. Generate code.
  6. Check TS, Lint, Responsive, and Accessibility rules.
