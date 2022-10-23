import { useTranslation } from 'next-i18next'

import {
  Notes,
  Dictionary,
  OwnNotes,
  Audio,
  Editor,
  Bible,
  TNTWL,
  TQ,
  BlindEditor,
} from './'

function Tool({ config }) {
  const { t } = useTranslation('common')
  const {
    resource: {
      manifest: { dublin_core: resource },
    },
  } = config

  let CurrentTool
  let url
  let title = config?.resource?.manifest?.dublin_core?.title

  if (!resource) {
    return (
      <div>
        <h1>{t('No_content')}</h1>
      </div>
    )
  }

  config.verses = config.wholeChapter
    ? []
    : config.reference.verses.map((v) => (v?.num ? v.num : v))

  switch (resource?.subject) {
    case 'TSV OBS Translation Words Links':
      CurrentTool = TNTWL

      config.resource.bookPath = config.resource.manifest.projects[0]?.path

      url = '/api/git/obs-twl'
      break

    case 'OBS Translation Questions':
    case 'TSV OBS Translation Questions':
      CurrentTool = TQ

      config.resource.bookPath = config.resource.manifest.projects[0]?.path

      url = '/api/git/obs-tq'
      break

    case 'OBS Translation Notes':
    case 'TSV OBS Translation Notes':
      CurrentTool = TNTWL

      config.resource.bookPath = config.resource.manifest.projects[0]?.path

      url = '/api/git/obs-tn'
      break

    case 'TSV Translation Words Links':
      CurrentTool = TNTWL

      config.resource.bookPath = config.resource.manifest.projects.find(
        (el) => el.identifier === config.reference.book
      )?.path

      url = '/api/git/twl'
      break

    case 'TSV Translation Notes':
      CurrentTool = TNTWL

      config.resource.bookPath = config.resource.manifest.projects.find(
        (el) => el.identifier === config.reference.book
      )?.path

      url = '/api/git/tn'
      break

    case 'TSV Translation Questions':
    case 'Translation Questions':
      CurrentTool = TQ

      config.resource.bookPath = config.resource.manifest.projects.find(
        (el) => el.identifier === config.reference.book
      )?.path

      url = '/api/git/tq'
      break

    case 'Open Bible Stories':
      CurrentTool = Bible

      config.resource.bookPath = config.resource.manifest.projects[0]?.path

      url = '/api/git/obs'
      break

    case 'Bible':
    case 'Aligned Bible':
    case 'Hebrew Old Testament':
    case 'Greek New Testament':
      CurrentTool = Bible

      config.resource.bookPath = config.resource.manifest.projects.find(
        (el) => el.identifier === config.reference.book
      )?.path

      url = '/api/git/bible'
      title = `${t('Chapter')} ${config?.reference?.chapter}`
      break

    case 'translate':
      CurrentTool = Editor
      title = t('Editor')
      break

    case 'draftTranslate':
      CurrentTool = BlindEditor
      title = t('BlindEditor')
      break

    case 'ownNotes':
      CurrentTool = OwnNotes
      title = t('OwnNotes')
      break

    case 'teamNotes':
      CurrentTool = Notes
      title = t('TeamNotes')
      break

    case 'audio':
      CurrentTool = Audio
      title = t('Audio')
      break

    case 'dictionary':
      CurrentTool = Dictionary
      title = t('Dictionary')
      break

    default:
      return <div>{t('Wrong_resource')}</div>
  }
  return (
    <>
      <div className="h5 pt-2.5 px-4 h-10 font-bold bg-blue-350 rounded-t-lg">
        {title}
      </div>
      <div style={{ height: 'calc(100vh - 250px)' }} className="h5">
        <div className="h-full p-4 overflow-x-hidden overflow-y-scroll">
          <CurrentTool config={config} url={url} />
        </div>
      </div>
    </>
  )
}

export default Tool