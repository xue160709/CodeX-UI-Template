import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { IconInline } from '../icon-inline'
import type { FileTreeNode, FileTreeResult, WorkspaceProject } from './types'

type AppFilePanelProps = {
  open: boolean
  project: WorkspaceProject
  onClose: () => void
}

export function AppFilePanel({ open, project, onClose }: AppFilePanelProps) {
  const [result, setResult] = useState<FileTreeResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(() => new Set())
  const loadRequestRef = useRef(0)

  const loadProjectFiles = useCallback(async () => {
    const requestId = loadRequestRef.current + 1
    loadRequestRef.current = requestId
    setLoading(true)

    const listProjectFiles = window.desktop?.listProjectFiles
    if (!listProjectFiles) {
      setResult({
        ok: false,
        rootPath: project.path,
        message: '当前运行环境不支持读取文件树',
      })
      setLoading(false)
      return
    }

    try {
      const nextResult = await listProjectFiles(project.path)
      if (loadRequestRef.current !== requestId) return
      setResult(nextResult)
      setExpandedPaths(new Set())
    } catch (error) {
      if (loadRequestRef.current !== requestId) return
      setResult({
        ok: false,
        rootPath: project.path,
        message: error instanceof Error ? error.message : '无法读取文件树',
      })
    } finally {
      if (loadRequestRef.current === requestId) setLoading(false)
    }
  }, [project.path])

  useEffect(() => {
    if (!open) return
    void loadProjectFiles()
  }, [loadProjectFiles, open])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose, open])

  const summary = useMemo(() => (result?.ok ? countTreeNodes(result.nodes) : null), [result])

  const toggleExpanded = useCallback((path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }, [])

  return (
    <aside
      className={`app-file-panel${open ? ' is-open' : ''}`}
      id="app-file-panel"
      aria-label="当前项目文件树"
      aria-hidden={!open}
      inert={open ? undefined : true}
    >
      <div className="app-file-panel-header">
        <div className="app-file-panel-heading">
          <IconInline name="files" />
          <span>文件</span>
        </div>
        <div className="app-file-panel-actions">
          <button
            type="button"
            className="btn btn-toolbar"
            title="刷新文件树"
            aria-label="刷新文件树"
            disabled={loading}
            onClick={() => void loadProjectFiles()}
          >
            <IconInline name="refresh" />
          </button>
          <button type="button" className="btn btn-toolbar" title="关闭文件树" aria-label="关闭文件树" onClick={onClose}>
            <IconInline name="x" />
          </button>
        </div>
      </div>

      <div className="app-file-panel-project">
        <span className="app-file-panel-project-name" title={result?.rootPath ?? project.path}>
          {result?.ok ? result.rootName : project.name}
        </span>
        {summary ? <span className="app-file-panel-count">{summary.directories} 目录 / {summary.files} 文件</span> : null}
      </div>

      <div className="app-file-panel-body">
        {loading && !result ? <div className="app-file-panel-state">正在读取文件树...</div> : null}
        {result && !result.ok ? (
          <div className="app-file-panel-state" role="status">
            {result.message}
          </div>
        ) : null}
        {result?.ok && result.nodes.length === 0 ? <div className="app-file-panel-state">没有可显示的文件</div> : null}
        {result?.ok && result.nodes.length > 0 ? (
          <>
            <div className="app-file-tree" role="tree" aria-label={`${result.rootName} 文件树`}>
              <FileTreeRows nodes={result.nodes} expandedPaths={expandedPaths} onToggle={toggleExpanded} />
            </div>
            {result.truncated ? <div className="app-file-panel-state is-subtle">文件较多，已显示前 1200 项</div> : null}
          </>
        ) : null}
      </div>
    </aside>
  )
}

type FileTreeRowsProps = {
  nodes: FileTreeNode[]
  expandedPaths: Set<string>
  onToggle: (path: string) => void
  depth?: number
}

function FileTreeRows({ nodes, expandedPaths, onToggle, depth = 0 }: FileTreeRowsProps) {
  return (
    <>
      {nodes.map((node) => {
        const isDirectory = node.type === 'directory'
        const isExpanded = isDirectory && expandedPaths.has(node.path)
        const style = { '--file-depth': depth } as CSSProperties

        return (
          <div key={node.path} className="app-file-tree-item" role="treeitem" aria-expanded={isDirectory ? isExpanded : undefined}>
            {isDirectory ? (
              <button
                type="button"
                className={`app-file-tree-row is-directory${isExpanded ? ' is-expanded' : ''}`}
                style={style}
                title={node.relativePath}
                onClick={() => onToggle(node.path)}
              >
                <span className="app-file-tree-chevron">
                  <IconInline name="chevron" />
                </span>
                <IconInline name="folder" />
                <span className="app-file-tree-name">{node.name}</span>
              </button>
            ) : (
              <div className="app-file-tree-row is-file" style={style} title={node.relativePath}>
                <span className="app-file-tree-spacer" />
                <IconInline name="file" />
                <span className="app-file-tree-name">{node.name}</span>
              </div>
            )}
            {isDirectory && isExpanded && node.children && node.children.length > 0 ? (
              <div role="group">
                <FileTreeRows nodes={node.children} expandedPaths={expandedPaths} onToggle={onToggle} depth={depth + 1} />
              </div>
            ) : null}
          </div>
        )
      })}
    </>
  )
}

function countTreeNodes(nodes: FileTreeNode[]) {
  let directories = 0
  let files = 0

  const walk = (items: FileTreeNode[]) => {
    for (const item of items) {
      if (item.type === 'directory') {
        directories += 1
        if (item.children) walk(item.children)
      } else {
        files += 1
      }
    }
  }

  walk(nodes)
  return { directories, files }
}
