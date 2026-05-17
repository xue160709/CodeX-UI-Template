# Data Visualization Patterns

Data visualization is mandatory when the project has repeated records, dates, statuses, tags, categories, or comparable numeric values.

With the current Basic Catalog, use lightweight visual encodings:

- Text bar list: `Label  ███████░░  42`
- Date bucket timeline: `2026-05-10  8 items`
- Status chips/list: `Done 18 · Open 7 · Blocked 2`
- Ranked top-N list: topic/source/author/tag counts.
- Freshness indicator: latest date, oldest date, stale count.
- Delta text: `+12 since last report` when a previous value is available.

Choose patterns:

- Counts by category -> ranked bar list.
- Records over dates -> timeline or date buckets.
- Work state -> status summary and top blockers.
- Files by directory/type -> distribution list.
- Numeric quality indicators -> metric row plus warnings.
- Latest records -> list with date, title, summary, source action.

Implementation hints:

- Keep generated bars stable and text-only: use at most 10 blocks.
- Do not use viewport-scaled font sizes.
- Limit top-N lists to 5-8 rows.
- Include an "Other" bucket only when the tail matters.
- Store visualization rows in `updateDataModel`, bind visible text through Text components.

When a future custom catalog is available, prefer dedicated components such as `MetricCard`, `BarList`, `Sparkline`, `Timeline`, `CalendarHeatmap`, and `FileLinkCard`. Until then, use Basic Catalog layouts.
