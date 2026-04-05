## 2025-05-22 - [Accessible Data Visualization]
**Learning:** Standard visualizations like treemaps often lack basic accessibility (ARIA roles and labels) and rely on color alone (red/green), which can be inaccessible to color-blind users. Adding 'role="img"' and 'aria-label' to SVG elements allows screen readers to interpret the data, while using a color-blind safe palette (e.g., #009e73 and #d55e00) ensures the same information is available to more users.
**Action:** Always include ARIA labels for data-driven SVG elements and use color-blind safe palettes for status-based visualizations.

## 2025-05-23 - [In-place Treemap Labels]
**Learning:** While tooltips (via `<title>` or `aria-label`) are great for detailed information, they require user interaction (hover/focus). Adding visible text labels directly onto the treemap cells significantly improves the "at-a-glance" utility of the visualization. However, labels must be conditionally rendered based on cell size to prevent clutter and overlap.
**Action:** Use conditional logic (e.g., `width > 60 && height > 40`) to show labels only when they fit, and ensure they are non-interactive (`pointer-events: none`) to keep the focus on the underlying data elements.

## 2025-05-24 - [Visual Summaries and Theme Consistency]
**Learning:** Detailed visualizations like treemaps benefit from high-level summary badges (e.g., "Overall Coverage") to provide immediate context without user exploration. Additionally, standalone SVG exports need explicit background elements (e.g., a white `<rect>`) to ensure text legibility across varying system themes (light/dark mode).
**Action:** Include summary metrics in all visualization export formats and always provide a theme-independent background for standalone image outputs.

## 2025-05-25 - [Interactive Data Elements and Feedback]
**Learning:** Adding interactivity to data visualizations—such as the ability to copy file paths by clicking on treemap cells—transforms a static report into a functional developer tool. However, interactivity without feedback is confusing; using the Clipboard API must be paired with clear visual confirmation (e.g., a transient toast notification) to reassure the user that their action was successful.
**Action:** When implementing non-visual actions (like copy-to-clipboard) on UI elements, always provide immediate and accessible visual feedback to confirm the state change.

## 2025-05-26 - [Dynamic Interaction and Screen Reader Hints]
**Learning:** For interactive data visualizations, standard 'img' roles are insufficient if elements are clickable or focusable. Using 'role="button"' and providing explicit action hints in 'aria-label' and tooltips (e.g., "Click to copy path") makes the available interactions discoverable for all users, including those using screen readers. Additionally, including the target item's name in feedback (e.g., "Copied path for [filename]!") provides much stronger confirmation than a generic success message.
**Action:** Always use appropriate interactive roles for focusable data elements and include explicit interaction hints and item-specific feedback for non-visual actions.

## 2025-05-27 - [Accessible Filtering in SVG]
**Learning:** When filtering elements in an interactive SVG visualization, using 'opacity' and 'pointer-events: none' is insufficient for accessibility if the elements are focusable (e.g., have 'tabindex="0"'). Hidden elements remain in the keyboard tab order, creating a confusing experience for screen reader users. Using 'display: none' on SVG group elements successfully removes them from both the visual layout and the accessibility tree/tab order.
**Action:** Always use 'display: none' (or 'visibility: hidden') to hide focusable data elements during filtering to maintain a clean keyboard navigation path.

## 2025-05-28 - [Search Feedback and Empty States]
**Learning:** When implementing search/filtering in a data-rich visualization, users need immediate feedback on the result set's status. Simply hiding non-matching elements is insufficient; providing a results counter (e.g., "Showing X of Y files") and a dedicated "No results" empty state ensures users understand the current filter state. Furthermore, standard keyboard shortcuts like 'Escape' to clear search inputs are essential for a polished and efficient user experience.
**Action:** Always pair search functionality with a results counter and a clear empty state message. Implement 'Escape' key clearing for search inputs to allow for quick resets.
