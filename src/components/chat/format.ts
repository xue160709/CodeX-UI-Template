/**
 * 附件大小、耗时等人可读格式化。
 * Human-readable formatting for attachments and elapsed durations.
 */

/** 将字节格式化为 B/KB/MB / Format bytes to compact label */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return ''
  if (bytes < 1024) return `${Math.round(bytes)} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10 * 1024 ? 1 : 0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(bytes < 10 * 1024 * 1024 ? 1 : 0)} MB`
}

/** 格式化回复耗时，如 18m 14s / Format assistant response duration. */
export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return ''
  const totalSeconds = Math.max(1, Math.round(ms / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`
  if (minutes > 0) return `${minutes}m ${seconds}s`
  return `${seconds}s`
}
