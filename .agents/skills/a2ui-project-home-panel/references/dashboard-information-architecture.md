# Dashboard Information Architecture

Design from the user's next decision, not from available files alone.

Prioritize:

1. Orientation: project name, date range, data freshness, source count.
2. Importance: unresolved work, missing annotations, failed checks, stale data, newest records.
3. Recency: latest daily report, latest papers, recently changed files, latest database rows.
4. Shape: trends over time, status buckets, topic/source distributions, ranked lists.
5. Action: source paths and buttons that let the user open the underlying report, dataset, task, or note.

Good card types:

- Metric card: one count plus label and, when available, date/context.
- Latest source card: title, date, short snippet, open button.
- Ranked list card: top topics, sources, authors, tags, statuses, or directories.
- Timeline card: recent daily reports, releases, commits, imports, or generated artifacts.
- Health/status card: missing files, validation warnings, stale records, empty required fields.
- Data source card: where data came from and when it was last modified.

Avoid:

- A generic "files" panel that repeats the file tree.
- Full README/report dumps.
- More than 5-7 competing top-level cards.
- Metrics that do not help the user decide what to inspect next.

Default layout:

- Top row: 3-4 metric cards.
- Middle: latest/important source card plus latest records or active work.
- Bottom: visual summaries, data sources, and maintenance/status cards.
