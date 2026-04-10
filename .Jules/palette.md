## 2025-05-22 - [Accessible Data Visualization]
**Learning:** Standard visualizations like treemaps often lack basic accessibility (ARIA roles and labels) and rely on color alone (red/green), which can be inaccessible to color-blind users. Adding 'role="img"' and 'aria-label' to SVG elements allows screen readers to interpret the data, while using a color-blind safe palette (e.g., #009e73 and #d55e00) ensures the same information is available to more users.
**Action:** Always include ARIA labels for data-driven SVG elements and use color-blind safe palettes for status-based visualizations.

## 2025-05-23 - [In-place Treemap Labels]
**Learning:** While tooltips (via `<title>` or `aria-label`) are great for detailed information, they require user interaction (hover/focus). Adding visible text labels directly onto the treemap cells significantly improves the "at-a-glance" utility of the visualization. However, labels must be conditionally rendered based on cell size to prevent clutter and overlap.
**Action:** Use conditional logic (e.g., `width > 60 && height > 40`) to show labels only when they fit, and ensure they are non-interactive (`pointer-events: none`) to keep the focus on the underlying data elements.

## 2025-05-24 - [Visual Summaries and Theme Consistency]
**Learning:** Detailed visualizations like treemaps benefit from high-level summary badges (e.g., "Overall Coverage") to provide immediate context without user exploration. Additionally, standalone SVG exports need explicit background elements (e.g., a white `<rect>`) to ensure text legibility across varying system themes (light/dark mode).
**Action:** Include summary metrics in all visualization export formats and always provide a theme-independent background for standalone image outputs.

## 2025-05-24 - [Graceful Empty States]
**Learning:** Visualizations like treemaps should have a clear, accessible empty state to provide feedback when no data is available, rather than crashing or showing a blank screen. This improves the developer experience and makes the tool more robust.
**Action:** Implement graceful empty state handling with helpful instructions and CLI warnings whenever a visualization might receive an empty dataset.

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
**Learning:** Real-time filtering without quantitative feedback can leave users uncertain about the scope of the results, especially in large datasets. Providing a simple "Showing X of Y" message and a dedicated "No results found" empty state makes the search interaction feel much more robust and responsive.
**Action:** Always pair real-time filtering with a results count and a clear empty state to guide the user when no matches are found.

## 2025-05-29 - [Visual Progress and Discoverability]
**Learning:** High-level metrics like "Overall Coverage" are more impactful when paired with a visual progress bar that provides instant, pre-attentive feedback. Furthermore, advanced features like keyboard shortcuts (e.g., '/') significantly improve power-user efficiency but are often undiscoverable without explicit visual hints like `<kbd>` tags.
**Action:** Always pair summary percentages with visual progress indicators and use explicit keyboard hint elements to make shortcuts discoverable.

## 2025-04-09 - [Unified Real-time Filtering and Summary Updates]
**Learning:** In data-driven interfaces, filtering interactions are most effective when they provide immediate quantitative feedback. By unifying text search and status-based filtering (e.g., coverage thresholds) into a single logical pass and dynamically recalculating overall statistics (percentages and counts), the interface provides a much more responsive and trustworthy experience. Furthermore, using CSS sibling selectors and transitions for search hint discovery/hiding reduces visual noise without sacrificing learnability.
**Action:** Always pair status filtering with real-time recalculation of summary metrics and use non-disruptive, animated hints for keyboard shortcuts.

## 2025-06-01 - [Keyboard Navigation for Tablists]
**Learning:** Implementing 'role="tablist"' requires more than just ARIA roles; it necessitates manual management of the "roving tabindex" pattern. Using arrow keys to move focus and select tabs, while keeping only the active tab in the tab order (tabindex="0" vs tabindex="-1"), creates a standard and expected experience for screen reader and keyboard-only users.
**Action:** When using 'role="tablist"', always implement the roving tabindex pattern with arrow key support to ensure accessibility compliance.
