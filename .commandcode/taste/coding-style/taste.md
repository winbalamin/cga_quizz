# Coding Style

- Uses mobile-first responsive Tailwind patterns (sm:/lg: breakpoints, `overflow-x-auto` wrappers for data tables, `flex-col sm:flex-row` for stacking headers). Confidence: 0.8
- Considers accessibility: aria-labels on icon-only buttons, safe-area insets for notched devices, and `prefers-reduced-motion` handling. Confidence: 0.75
- Prefers CSS utility classes over wrapper components for motion/animation. Confidence: 0.7
- Prefers static imports over unnecessary dynamic imports. Confidence: 0.7
