import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { normalizeChatWorkspaceState } from '../src/chat-workspace-persistence'
import type { ChatWorkspaceState } from '../src/components/types'

const WORKSPACE_FILE_NAME = 'chat-workspace.json'

export class ChatWorkspaceStore {
  private readonly filePath: string

  constructor(userDataPath: string) {
    this.filePath = path.join(userDataPath, WORKSPACE_FILE_NAME)
  }

  read(): ChatWorkspaceState | null {
    if (!existsSync(this.filePath)) return null
    try {
      const raw = JSON.parse(readFileSync(this.filePath, 'utf8')) as unknown
      return normalizeChatWorkspaceState(raw)
    } catch {
      return null
    }
  }

  save(state: unknown): ChatWorkspaceState {
    const normalized = normalizeChatWorkspaceState(state)
    mkdirSync(path.dirname(this.filePath), { recursive: true })
    writeFileSync(this.filePath, `${JSON.stringify(normalized, null, 2)}\n`, 'utf8')
    return normalized
  }
}
