# Bead: B005 - Premium Auth Flow

> **Status**: Done
> **Priority**: High
> **Type**: Component Polish
> **Dependencies**: B004 (Needs Glass Utilities)

## The Vision: "The Velvet Rope"
The Login/Signup screen is the first "Gate" of the application. It shouldn't feel like filling out a tax form. It should feel like showing ID at an exclusive club: slick, dark, and purposeful.

## Context & Problem
`LoginModal.tsx` is currently a functional "Time Capsule" from the pre-redesign era.
- **Styles**: Uses legacy `bg-surface` and `bg-slate-100` inputs.
- **Layout**: Cluttered vertical stack.
- **Vibe**: Feels "Enterprise SaaS" rather than "Nightlife".

## Implementation Objectives

### 1. Structural Renovation
- **Container**: Swap `bg-surface` -> `.glass-panel` (from B004).
- **Headers**: Ensure Typography uses `font-league` (Agency FB equivalent) for "PLAYER LOGIN" headers.
- **Close Button**: Ensure it's not just a floating 'X' but a tactile icon (e.g., `bg-white/5 p-2 rounded-full hover:bg-white/10`).

### 2. Component Integration
- **Inputs**: Apply `.glass-input` classes to all form fields. Use `.glass-input-error` when validation fails.
- **Social Buttons**: Apply "Ghost Glass" styles.
    - **Optimization**: "Awaken" brand colors on hover. `hover:bg-white` for Google, `hover:bg-[#1877F2]` for Facebook. This balances sleekness with conversion optimization.
- **Primary Action**: Ensure the "LOGIN" / "CREATE ACCOUNT" button uses the `bg-primary text-black font-black uppercase` standard, but ADDS the "Primary Glow" (`shadow-[0_0_20px_-5px_rgba(251,191,36,0.4)]`).

### 3. Micro-Interaction Tuning
- **Input Focus**: Focusing Email/Password should casually illuminate the field border.
- **Submission**: The Login button must have `active:scale-95` to feel mechanical.

## Considerations
- **MFA Flow**: The 6-digit code input requires special attention.
    - **Style**: Use "Pincode" layout (centered text, tracking-widest, larger font).
    - **Classes**: `.glass-input text-center text-2xl tracking-[0.5em] font-mono`.
    - **Avoid**: Small left-aligned text for a security code.
