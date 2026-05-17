# Project Data Sources

Use the read-only host API only.

Markdown daily reports:

- Detect likely directories: `reports/`, `日报/`, `daily/`, `notes/`, `journal/`, `情报日报/`.
- Parse dates from filenames like `YYYY-MM-DD.md`.
- Extract headings, first useful paragraphs, bullet counts, unchecked tasks, links, tags, and source path.
- Show latest report and date coverage. Include `open_file`.

Paper/research libraries:

- Detect files containing paper dates, titles, authors, abstracts, tags, or source URLs.
- Useful cards: total papers, latest papers, date range, topic/source distribution, untagged/unread count.
- Use ranked lists for topics, sources, or institutions.

JSON/CSV:

- Read small files only; respect host read limits.
- Infer record arrays, date fields, status fields, category fields, and title/name fields.
- Show record count, latest records, status/category distribution, missing critical fields.

SQLite:

- Use `host.querySqlite(path, sql, { maxRows })`.
- Start with metadata queries, then SELECT only the columns needed for summary.
- Never run mutating SQL.
- Useful cards: table count, row counts, latest rows, status buckets, null/missing values.

Code project:

- Useful cards: README/TODO presence, package scripts, recent files, source/test counts, config health.
- Show build/test status only when it can be measured locally.

Fallback:

- If there is not enough structured data, show a source discovery panel: important directories, candidate data files, latest modified files, and a clear next action to customize.
