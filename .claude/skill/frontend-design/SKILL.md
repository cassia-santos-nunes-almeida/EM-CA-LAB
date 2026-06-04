# Frontend Design Skill (Adapted for Educational Apps)

Create distinctive, polished frontend interfaces with high design quality — adapted for an educational circuit analysis platform where **clarity and learning come first**.

## When to Use

User asks to build or redesign web components, pages, or UI elements. Triggered when CLAUDE.md directs here or when working on visual/UX improvements.

## Design Thinking

Before coding, understand the context and commit to a clear aesthetic direction:

- **Purpose**: This is a learning tool. Every design choice should reduce cognitive load and direct attention to the physics and math content.
- **Tone**: Refined and purposeful. Think "well-designed textbook meets modern web app" — clean, professional, but not sterile. Subtle warmth and polish that makes students *want* to explore.
- **Constraints**: React 19 + TypeScript + Tailwind CSS. Must work in both light and dark mode. Must be responsive (mobile to desktop). KaTeX math rendering and Recharts visualizations must remain legible.
- **Differentiation**: What makes this memorable is how *effortless* learning feels — smooth transitions, satisfying interactions, clear visual hierarchy that guides the eye.

**CRITICAL**: Intentionality over intensity. Every animation, color choice, and layout decision should serve the learning experience.

## Design System Constraints

Respect the existing design system:
- **Color palette**: `engineering-blue` as primary brand color (defined in `@theme` in `index.css`). Use existing Tailwind color scales.
- **Typography**: System font stack via Tailwind defaults. KaTeX for math. Do not add custom font imports.
- **Component patterns**: Tailwind utility classes via `cn()` helper. Lucide React for icons. Consistent card/section patterns across modules.
- **Dark mode**: Class-based (`.dark` on `<html>`). All new UI must include `dark:` variants.

## Where to Be Bold

Channel creative energy into areas that **enhance learning**:

- **Micro-interactions**: Satisfying feedback on slider adjustments, button clicks, tab switches. Subtle scale/opacity transitions that make the UI feel alive.
- **Visual hierarchy**: Use size, weight, color, and spacing to guide students through content in the right order. Important formulas and results should draw the eye.
- **State transitions**: Smooth, purposeful animations when switching circuit types, changing parameters, or navigating between modules. Help students understand *what changed*.
- **Data visualization**: Charts and diagrams should be beautiful and readable. Consider thoughtful color choices for voltage/current traces, clear axis labels, informative tooltips.
- **Empty/loading states**: Make waiting and onboarding moments feel polished, not placeholder-ish.

## What to Avoid

- Decorative elements that compete with equations and circuit diagrams for attention
- Unusual layouts that make content harder to scan (students need predictability)
- Heavy animations that slow perceived performance or distract from content changes
- Custom fonts that increase bundle size or cause layout shift
- Design choices that look impressive but make the app harder to use on a tablet in a lecture hall

## Implementation

- Use Tailwind CSS utilities — no inline styles unless absolutely necessary
- CSS transitions/animations preferred over JS animation libraries
- Test in both light and dark mode
- Ensure touch targets are at least 44x44px for mobile/tablet use
- Maintain existing component API contracts when enhancing visuals

## Changelog

- v1.0 (2026-03-01): Initial version — adapted from Anthropic's frontend-design plugin for educational context
