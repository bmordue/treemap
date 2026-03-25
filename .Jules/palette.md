## 2025-05-22 - [Accessible Data Visualization]
**Learning:** Standard visualizations like treemaps often lack basic accessibility (ARIA roles and labels) and rely on color alone (red/green), which can be inaccessible to color-blind users. Adding 'role="img"' and 'aria-label' to SVG elements allows screen readers to interpret the data, while using a color-blind safe palette (e.g., #009e73 and #d55e00) ensures the same information is available to more users.
**Action:** Always include ARIA labels for data-driven SVG elements and use color-blind safe palettes for status-based visualizations.
