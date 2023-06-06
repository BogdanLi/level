import { useEffect, useState } from 'react'

import { useRouter } from 'next/router'

import toast from 'react-hot-toast'

import { useTranslation } from 'next-i18next'

import { Switch } from '@headlessui/react'

import axios from 'axios'

import BriefResume from './BriefResume'
import BriefAnswer from './BriefAnswer'

import { useGetBrief, useProject } from 'utils/hooks'
import { useCurrentUser } from 'lib/UserContext'
import { supabase } from 'utils/supabaseClient'

import Spinner from 'public/spinner.svg'

function BriefBlock({ access }) {
  const [briefDataCollection, setBriefDataCollection] = useState([])
  const [hidden, setHidden] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const {
    query: { code },
  } = useRouter()
  const { user } = useCurrentUser()
  const [project] = useProject({ token: user?.access_token, code })

  const { t } = useTranslation(['common', 'project-edit'])

  const [brief, { mutate }] = useGetBrief({
    token: user?.access_token,
    project_id: project?.id,
  })

  useEffect(() => {
    if (briefDataCollection.length == 0 && brief?.data_collection) {
      setBriefDataCollection(brief.data_collection)
    }
  }, [brief, briefDataCollection])

  const saveToDatabase = () => {
    let error = false
    setIsSaving(true)
    axios.defaults.headers.common['token'] = user?.access_token
    axios
      .put(`/api/briefs/${project?.id}`, {
        data_collection: briefDataCollection,
      })
      .then()
      .catch((err) => {
        error = true
        console.log(err)
      })
      .finally(() => setIsSaving(false))
    return { error }
  }

  useEffect(() => {
    const briefUpdates = supabase
      .from('briefs')
      .on('UPDATE', (payload) => {
        setBriefDataCollection(payload.new.data_collection)
      })
      .subscribe()

    return () => {
      briefUpdates.unsubscribe()
    }
  }, [])

  const updateBrief = (text, index) => {
    setBriefDataCollection((prev) => {
      prev[index] = {
        ...prev[index],
        resume: text,
      }
      return prev
    })
  }

  const updateObjQA = (text, briefItem, blockIndex, objQA, index) => {
    setBriefDataCollection((prev) => {
      const updateBriefItemBlock = briefItem.block
      updateBriefItemBlock[blockIndex] = {
        ...objQA,
        answer: text,
      }
      prev[index] = {
        ...prev[index],
        block: updateBriefItemBlock,
      }
      return prev
    })
  }

  const handleSwitch = () => {
    if (brief) {
      axios.defaults.headers.common['token'] = user?.access_token
      axios
        .put(`/api/briefs/switch/${project?.id}`, { is_enable: !brief?.is_enable })
        .then(mutate)
        .catch(console.log)
    }
  }
  return (
    <div className="card">
      <div className="flex flex-col gap-7">
        <div className="flex flex-col sm:flex-row justify-between gap-7">
          <h3 className="text-xl font-bold">{t('project-edit:EditBriefTitle')}</h3>
          <div>
            {access && (
              <div className="flex">
                <span className="mr-3">
                  {t(`project-edit:${brief?.is_enable ? 'DisableBrief' : 'EnableBrief'}`)}
                </span>

                <Switch
                  checked={brief?.is_enable}
                  onChange={handleSwitch}
                  className={`${
                    brief?.is_enable ? 'bg-cyan-600' : 'bg-gray-200'
                  } relative inline-flex h-7 w-12 items-center rounded-full`}
                >
                  <span
                    className={`${
                      brief?.is_enable ? 'translate-x-6' : 'translate-x-1'
                    } inline-block h-5 w-5 transform rounded-full bg-white transition`}
                  />
                </Switch>
              </div>
            )}
          </div>
        </div>
        <div className="flex">
          <span className="mr-3">{t('Detailed')}</span>

          <Switch
            checked={!hidden}
            onChange={() => {
              setHidden((prev) => !prev)
            }}
            className={`${
              !hidden ? 'bg-cyan-600' : 'bg-gray-200'
            } relative inline-flex h-7 w-12 items-center rounded-full`}
          >
            <span
              className={`${
                !hidden ? 'translate-x-6' : 'translate-x-1'
              } inline-block h-5 w-5 transform rounded-full bg-white transition`}
            />
          </Switch>
        </div>
        {briefDataCollection.length > 0 ? (
          <div className="flex flex-col gap-4 w-full mb-4">
            <div className="text-base text-slate-900">
              {briefDataCollection.map((briefItem, index) => {
                const questionTitle = `${briefItem.id}. ${briefItem.title}`
                return (
                  <div key={index}>
                    <p className="text-lg font-bold mb-7">{questionTitle}</p>
                    <div className={hidden ? 'hidden' : ''}>
                      {briefItem.block?.map((questionAndAnswerPair, blockIndex) => {
                        return (
                          <div key={blockIndex} className="mb-7">
                            <div className="mb-2">{questionAndAnswerPair.question}</div>
                            <BriefAnswer
                              access={access}
                              saveToDatabase={saveToDatabase}
                              objQA={questionAndAnswerPair}
                              updateObjQA={updateObjQA}
                              blockIndex={blockIndex}
                              briefItem={briefItem}
                              index={index}
                              t={t}
                            />
                          </div>
                        )
                      })}
                    </div>
                    <div className="mb-7">
                      <p className={hidden ? 'hidden' : 'text-lg font-bold mb-7'}>
                        {t('project-edit:Summary')}
                      </p>
                      <BriefResume
                        access={access}
                        saveToDatabase={saveToDatabase}
                        objResume={briefItem.resume}
                        updateBrief={updateBrief}
                        index={index}
                        t={t}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <>
            <div role="status" className="w-full animate-pulse">
              <div className="flex flex-col">
                <div className="h-7 w-3/12 mt-4 bg-gray-200 rounded-full"></div>
                <div className="h-7 w-7/12 mt-4 bg-gray-200 rounded-full"></div>
                <div className="h-7 w-3/12 mt-4 bg-gray-200 rounded-full"></div>
                <div className="h-7 w-4/12 mt-4 bg-gray-200 rounded-full"></div>
                <div className="h-7 w-9/12 mt-4 bg-gray-200 rounded-full"></div>
                <div className="h-7 w-6/12 mt-4 bg-gray-200 rounded-full"></div>
                <div className="h-7 w-3/12 mt-4 bg-gray-200 rounded-full"></div>
                <div className="h-7 w-10/12 mt-4 bg-gray-200 rounded-full"></div>
                <div className="h-7 w-8/12 mt-4 bg-gray-200 rounded-full"></div>
              </div>
            </div>
          </>
        )}

        {access && (
          <div>
            <button
              className="btn-primary text-xl"
              onClick={() => {
                const { error } = saveToDatabase()
                !error ? toast.success(t('SaveSuccess')) : toast.error(t('SaveFailed'))
              }}
            >
              {isSaving ? (
                <Spinner className="h-5 w-5 text-gray-400 animate-spin" />
              ) : (
                t('Save')
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default BriefBlock
