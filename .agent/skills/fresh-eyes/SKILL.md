---
name: fresh-eyes
description: A rigorous first-principles audit tool for code and logic. Use this to self-correct before user review.
---

# Fresh Eyes Protocol

## Purpose
To break the "writer's blindness" that occurs when an agent validates its own code. This skill forces a context switch to a critical "Auditor" persona.

## Procedure

### 1. The Pause (Context Switch)
*   **Stop** all coding.
*   **Clear** your short-term bias. Assume the code you just wrote is broken.

### 2. The Trace (Logic Audit)
*   **Entry Point**: Find the exported function/component.
*   **Data Flow**: Trace arguments -> logic -> return value.
*   **Imports**: Check every import. Are they used? Are they heavy?
*   **Exports**: Are you exporting unnecessary internals?

### 3. The Entropy Check (Smell Test)
*   **Complexity**: Can this `if/else` nest be a guard clause?
*   **Duplication**: Does this typically exist in `src/utils`?
*   **Naming**: Are variables named `data`, `item`, or `temp`? (Reject them).
*   **Types**: Are you typing `any` or `as`? (Reject them).

### 4. The Simulation (Mental Run)
*   **Happy Path**: Walk through the code with valid data.
*   **Edge Path**: Walk through with `null`, `undefined`, or empty arrays.
*   **Race Conditions**: What if the API is slow?

### 5. The UX Audit (If UI)
*   **Aesthetics**: Is it beautiful?
*   **Feedback**: Does the user know it's loading?
*   **Error**: Does the user know it failed?

## Output
*   Produce a list of **Specific Fixes**.
*   Apply them immediately.
