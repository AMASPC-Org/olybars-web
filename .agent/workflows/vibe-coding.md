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
3.  **Code Generation**:
    - Agent inspects the generated image.
    - Agent implements the `.tsx` component matching the visual style.
    - Agent uses `tailwind` classes to replicate the "Vibe".
4.  **Refine**:
    - Agent presents the result to the user.
    - Iterative refinement based on feedback.

## Example Triggers
- "Make this look more 'Nighttown'"
- "Add a sponsorship ticker that glows"
- "Create a new 'Vibe Meter' component"
