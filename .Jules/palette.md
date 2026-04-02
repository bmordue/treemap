## 2025-05-22 - [Accessible Data Visualization]
**Learning:** Standard visualizations like treemaps often lack basic accessibility (ARIA roles and labels) and rely on color alone (red/green), which can be inaccessible to color-blind users. Adding 'role="img"' and 'aria-label' to SVG elements allows screen readers to interpret the data, while using a color-blind safe palette (e.g., #009e73 and #d55e00) ensures the same information is available to more users.
**Action:** Always include ARIA labels for data-driven SVG elements and use color-blind safe palettes for status-based visualizations.

## 2025-05-23 - [In-place Treemap Labels]
**Learning:** While tooltips (via `<title>` or `aria-label`) are great for detailed information, they require user interaction (hover/focus). Adding visible text labels directly onto the treemap cells significantly improves the "at-a-glance" utility of the visualization. However, labels must be conditionally rendered based on cell size to prevent clutter and overlap.
**Action:** Use conditional logic (e.g., `width > 60 && height > 40`) to show labels only when they fit, and ensure they are non-interactive (`pointer-events: none`) to keep the focus on the underlying data elements.

## 2025-05-24 - [Visual Summaries and Theme Consistency]
**Learning:** Detailed visualizations like treemaps benefit from high-level summary badges (e.g., "Overall Coverage") to provide immediate context without user exploration. Additionally, standalone SVG exports need explicit background elements (e.g., a white `<rect>`) to ensure text legibility across varying system themes (light/dark mode).
**Action:** Include summary metrics in all visualization export formats and always provide a theme-independent background for standalone image outputs.
