# OlyBars Skill Protocol: Logic Separation

This rule governs the development of the "Nightlife Operating System" skills, enforcing modularity and preventing hook bloat.

## 1. Core hook (useSchmidtOps)
- **Role**: Pure State Management & Routing.
- **Limit**: The `processAction` switch should ideally only contain single-line delegations to skill handlers.
- **Constraint**: No business logic (API calls, data transformations) should live inside the hook.

## 2. Skill Handlers (src/features/Schmidt/*)
- **Role**: Domain-specific Logic & Context.
- **Constraint**: No single handler function shall exceed **50 lines**. 
- **Pattern**: Extract sub-functions (e.g., `calculateTiming`, `formatCopy`) if a flow becomes complex.
- **State Transitions**: Handlers must return or set `opsState` explicitly. 

## 3. The context Rule
- All handlers must accept `SkillContext` or `EventSkillContext` to interact with the core hook's state.
- Handlers should NOT have their own internal state; they must operate on the provided `draftData`.
