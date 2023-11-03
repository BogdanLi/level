import Link from 'next/link'

import { useTranslation } from 'next-i18next'

import Translators from './Translators'
import Placeholder from './Placeholder'

import { useBriefState, useAccess } from 'utils/hooks'

function ProjectCard({ project, user }) {
  const { t } = useTranslation(['projects', 'common'])
  const [{ isCoordinatorAccess }] = useAccess({
    user_id: user?.id,
    code: project?.code,
  })
  const { briefResume, isLoading } = useBriefState({
    project_id: project?.id,
  })

  return (
    <>
      {!project?.code || isLoading || !user?.id ? (
        <Placeholder />
      ) : (
        <Link href={`/projects/${project.code}`} legacyBehavior>
          <div className="card bg-th-background-secondary sm:bg-th-background-tertiary flex justify-between items-start cursor-pointer h-full">
            <div className="flex flex-col gap-9">
              <div className="text-xl font-bold">{project.title}</div>{' '}
              {briefResume === '' && (
                <Link
                  href={`/projects/${project?.code}/edit?setting=brief`}
                  className="btn-primary w-fit"
                >
                  {t(`common:${isCoordinatorAccess ? 'EditBrief' : 'OpenBrief'}`)}
                </Link>
              )}
              <div className="flex flex-col gap-5">
                <div className="flex gap-3">
                  <p>{t('Language')}:</p>
                  <p className="text-th-text-disabled">{project.languages.orig_name}</p>
                </div>
                <div className="flex gap-3">
                  <p>{t('common:Translator_other')}:</p>
                  <Translators
                    projectCode={project.code}
                    size="25px"
                    className="-mx-0.5"
                  />
                </div>
              </div>
            </div>
          </div>
        </Link>
      )}
    </>
  )
}

export default ProjectCard
