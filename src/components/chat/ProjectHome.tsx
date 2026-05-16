import { IconInline } from '../../icon-inline'
import { useI18n } from '../../i18n/i18n'
import type { SelectedProjectSkill, WorkspaceProject } from '../types'

type ProjectHomeProps = {
  project: WorkspaceProject
  selectedSkill: SelectedProjectSkill | null
  onRunSelectedSkill: () => void
}

export function ProjectHome({ project, selectedSkill, onRunSelectedSkill }: ProjectHomeProps) {
  const { t } = useI18n()
  const skillDetail = selectedSkill?.description.trim() || selectedSkill?.relativePath

  return (
    <div className="chat-project-home" id="chat-project-home">
      <div className="chat-project-home__eyebrow" title={project.path}>
        <IconInline name="folder" />
        <span>{project.name}</span>
      </div>
      <h1>{selectedSkill ? t('chat.skillReadyHeading') : t('chat.emptyHeading')}</h1>
      {selectedSkill ? (
        <div className="chat-selected-skill" aria-label={t('chat.selectedSkillAria')}>
          <div className="chat-selected-skill__icon" aria-hidden="true">
            <IconInline name="chip" />
          </div>
          <div className="chat-selected-skill__copy">
            <span className="chat-selected-skill__title">
              {selectedSkill.title}
              {selectedSkill.argumentHint ? ` ${selectedSkill.argumentHint}` : ''}
            </span>
            {skillDetail ? <span className="chat-selected-skill__detail">{skillDetail}</span> : null}
          </div>
          <button type="button" className="chat-selected-skill__run" onClick={onRunSelectedSkill}>
            <IconInline name="play" />
            <span>{t('chat.runSkill')}</span>
          </button>
        </div>
      ) : null}
    </div>
  )
}
