---
description: Generative UI workflow for creating "Vibe-Coded" features.
---

# Vibe Coding Workflow

This workflow enables the "Prompt-to-Feature" cycle using Generative UI.

## Process

1.  **Prompt**: User requests a new UI feature (e.g., "Cyberpunk Dashboard").
2.  **Generate Visual**:
    - Use `generate_image` (Nano Banana Pro) to visualize the request.
    - Prompt should emphasize "High Contrast", "Neon", "Cyberpunk" aesthetics per "Drunk Thumb" rules.
3.  **High-Fidelity Code Extraction**:
    - **Multi-Stage Vision Reasoning**:
      - Pass 1: **Layout Audit** (Identify Flex/Grid structural boundaries).
      - Pass 2: **Color/Token Audit** (Map visual colors to OlyBars Tailwind tokens).
      - Pass 3: **Interaction Audit** (Define hover/active states).
    - Implement the `.tsx` component matching the visual style.
    - Use `tailwind` classes to replicate the "Vibe".
4.  **Thematic Consistency Check**:
    - Use **Schmidt** specialized skills to verify the new component aligns with the "Nightlife OS" identity.
5.  **Refine**:
    - Agent presents the result to the user.
    - Iterative refinement based on feedback.

## Example Triggers

- "Make this look more 'Nighttown'"
- "Add a sponsorship ticker that glows"
- "Create a new 'Vibe Meter' component"
