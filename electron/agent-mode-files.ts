import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import type {
  AgentModeFileChange,
  AgentModeFilesResult,
  AgentModeFileStatus,
  AgentModeStatusResult,
} from '../src/desktop-types'

const REQUIRED_CONTEXT_FILES = ['SOUL.md', 'IDENTITY.md', 'USER.md', 'MEMORY.md'] as const
const AGENT_MODE_MARKER_START = '<!-- AgentOS Agent Mode: start -->'
const AGENT_MODE_MARKER_END = '<!-- AgentOS Agent Mode: end -->'

export async function getAgentModeStatus(rootPath: string): Promise<AgentModeStatusResult> {
  const root = resolveWorkspacePath(rootPath)
  try {
    const stat = await fs.stat(root)
    if (!stat.isDirectory()) {
      return { ok: false, rootPath: root, message: '当前项目路径不是文件夹' }
    }

    const instructionFile = await resolveInstructionFile(root)
    const missingFiles: string[] = []
    if (!(await exists(path.join(root, instructionFile)))) missingFiles.push(instructionFile)
    for (const fileName of REQUIRED_CONTEXT_FILES) {
      if (!(await exists(path.join(root, fileName)))) missingFiles.push(fileName)
    }
    if (!(await exists(path.join(root, 'memory')))) missingFiles.push('memory/')

    return {
      ok: true,
      rootPath: root,
      enabled: missingFiles.length === 0,
      instructionFile,
      missingFiles,
    }
  } catch (error) {
    return {
      ok: false,
      rootPath: root,
      message: error instanceof Error ? error.message : '无法读取 Agent 模式状态',
    }
  }
}

export async function ensureAgentModeFiles(rootPath: string): Promise<AgentModeFilesResult> {
  const root = resolveWorkspacePath(rootPath)
  try {
    const stat = await fs.stat(root)
    if (!stat.isDirectory()) {
      return { ok: false, rootPath: root, message: '当前项目路径不是文件夹' }
    }

    const files: AgentModeFileChange[] = []
    const instructionFile = await resolveInstructionFile(root)
    const instructionPath = path.join(root, instructionFile)
    const instructionStatus = await ensureInstructionFile(instructionPath, instructionFile)
    files.push(fileChange(root, instructionPath, instructionStatus))

    for (const fileName of REQUIRED_CONTEXT_FILES) {
      const filePath = path.join(root, fileName)
      const status = await writeFileIfMissing(filePath, contextFileTemplate(fileName))
      files.push(fileChange(root, filePath, status))
    }

    const memoryDirectory = path.join(root, 'memory')
    files.push(fileChange(root, memoryDirectory, await ensureDirectory(memoryDirectory)))

    const todayPath = path.join(memoryDirectory, `${formatLocalDate(new Date())}.md`)
    files.push(fileChange(root, todayPath, await writeFileIfMissing(todayPath, dailyMemoryTemplate())))

    return {
      ok: true,
      rootPath: root,
      instructionFile,
      files,
      message: 'Agent 模式已开启，身份和记忆文件已准备好。',
    }
  } catch (error) {
    return {
      ok: false,
      rootPath: root,
      message: error instanceof Error ? error.message : '开启 Agent 模式失败',
    }
  }
}

async function resolveInstructionFile(root: string): Promise<string> {
  if (await exists(path.join(root, 'AGENTS.md'))) return 'AGENTS.md'
  if (await exists(path.join(root, 'AGENT.md'))) return 'AGENT.md'
  return 'AGENTS.md'
}

async function ensureInstructionFile(filePath: string, fileName: string): Promise<AgentModeFileStatus> {
  if (!(await exists(filePath))) {
    await fs.writeFile(filePath, defaultAgentsTemplate(fileName), 'utf8')
    return 'created'
  }

  const content = await fs.readFile(filePath, 'utf8')
  if (content.includes(AGENT_MODE_MARKER_START)) return 'exists'
  const next = `${content.trimEnd()}\n\n${agentModeInstructionSection()}\n`
  await fs.writeFile(filePath, next, 'utf8')
  return 'updated'
}

async function writeFileIfMissing(filePath: string, content: string): Promise<AgentModeFileStatus> {
  try {
    await fs.writeFile(filePath, content, { encoding: 'utf8', flag: 'wx' })
    return 'created'
  } catch (error) {
    if (isNodeError(error) && error.code === 'EEXIST') return 'exists'
    throw error
  }
}

async function ensureDirectory(directoryPath: string): Promise<AgentModeFileStatus> {
  if (await exists(directoryPath)) return 'exists'
  await fs.mkdir(directoryPath, { recursive: true })
  return 'created'
}

function defaultAgentsTemplate(fileName: string): string {
  return `# ${fileName} - AgentOS Workspace

This folder is the assistant workspace. Treat Markdown files here as durable project context.

${agentModeInstructionSection()}
`
}

function agentModeInstructionSection(): string {
  return `${AGENT_MODE_MARKER_START}
## AgentOS Agent Mode

### Session Startup

- Read \`SOUL.md\`, \`IDENTITY.md\`, \`USER.md\`, and \`MEMORY.md\` before responding.
- Read today and yesterday in \`memory/\` when those daily notes exist.
- Treat these files as persistent context. Explicit user instructions for the current turn still take priority.

### Memory Discipline

- Daily notes live in \`memory/YYYY-MM-DD.md\`.
- Long-term memory lives in \`MEMORY.md\`.
- After every completed operation, update today's daily memory file with what changed, decisions made, files touched, and open loops.
- Promote durable preferences, project facts, and decisions into \`MEMORY.md\` when they will matter in future sessions.
- Do not store secrets unless the user explicitly asks you to remember them.

### Identity Stack

- \`SOUL.md\` defines internal values, tone, and boundaries.
- \`IDENTITY.md\` defines public name and presentation.
- \`USER.md\` stores user context and preferences.
- \`MEMORY.md\` stores curated long-term memory.

### Safety

- Do not exfiltrate private data.
- Do not run destructive commands unless explicitly asked.
- Ask before external actions such as sending messages, publishing, or changing remote services.
${AGENT_MODE_MARKER_END}`
}

function contextFileTemplate(fileName: (typeof REQUIRED_CONTEXT_FILES)[number]): string {
  if (fileName === 'SOUL.md') return soulTemplate()
  if (fileName === 'IDENTITY.md') return identityTemplate()
  if (fileName === 'USER.md') return userTemplate()
  return memoryTemplate()
}

function soulTemplate(): string {
  return `# SOUL.md - Who You Are

You are a capable coding companion with continuity. You are direct, careful, curious, and willing to take ownership.

## Core Truths

- Be genuinely helpful, not performatively helpful.
- Be resourceful before asking. Read the files, inspect the context, and try the obvious checks first.
- Earn trust through competence. Internal exploration is encouraged; external actions need care.
- Have judgment. You may disagree when the evidence calls for it.

## Boundaries

- Private things stay private.
- Ask before acting outside the local workspace.
- If you change this file, tell the user.

## Vibe

Concise when the task is simple, thorough when the stakes are high. Warm, calm, and practical.

## Continuity

Each session starts fresh. These files are your continuity. Read them, update them, and keep them useful.
`
}

function identityTemplate(): string {
  return `# IDENTITY.md - Agent Identity

- Name: AgentOS
- Role: Local coding agent and project companion
- Presentation: Precise, warm, and work-focused
- Default introduction: I can read the project, make scoped changes, and keep useful memory as I work.

Update this file when the agent's public presentation should change.
`
}

function userTemplate(): string {
  return `# USER.md - About The Human

Use this file for stable user context and working preferences.

- Name:
- What to call them:
- Timezone:
- Communication preferences:
- Current projects:

## Notes

- Learn about the person you are helping, but do not turn this into a dossier.
- Keep only context that improves future collaboration.
`
}

function memoryTemplate(): string {
  return `# MEMORY.md - Long-Term Memory

Use this file for durable facts, preferences, decisions, and project context that should survive across sessions.

## Stable Preferences

- None recorded yet.

## Project Facts

- None recorded yet.

## Decisions

- None recorded yet.

## Open Loops

- None recorded yet.
`
}

function dailyMemoryTemplate(): string {
  const date = formatLocalDate(new Date())
  return `# ${date}

## Session Notes

- Agent Mode initialized for this workspace.
`
}

function fileChange(root: string, filePath: string, status: AgentModeFileStatus): AgentModeFileChange {
  return {
    relativePath: normalizeRelativePath(path.relative(root, filePath)),
    path: filePath,
    status,
  }
}

function formatLocalDate(date: Date): string {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function resolveWorkspacePath(rawPath: string): string {
  const trimmed = rawPath.trim()
  if (trimmed.startsWith('~/')) return path.resolve(path.join(os.homedir(), trimmed.slice(2)))
  return path.resolve(trimmed)
}

function normalizeRelativePath(value: string): string {
  return value.split(path.sep).join('/')
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.stat(filePath)
    return true
  } catch (error) {
    if (isNodeError(error) && error.code === 'ENOENT') return false
    throw error
  }
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === 'object' && error !== null && 'code' in error
}
