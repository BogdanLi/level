import { useEffect, useState } from 'react'

import { useRouter } from 'next/router'

import axios from 'axios'

import AutoSizeTextArea from '../UI/AutoSizeTextArea'

import { supabase } from 'utils/supabaseClient'
import { useCurrentUser } from 'lib/UserContext'

// moderatorOnly
//              - TRUE видно все стихи, только модератор может вносить исправления
//              - FALSE видно все стихи, исправлять можно только свои
function CommandEditor({ config }) {
  const { user } = useCurrentUser()
  const [level, setLevel] = useState('user')
  const [chapterId, setChapterId] = useState(false)
  const {
    query: { project, chapter },
  } = useRouter()
  const [verseObjects, setVerseObjects] = useState([])

  useEffect(() => {
    const getLevel = async (user_id, project_id) => {
      const level = await supabase.rpc('authorize', {
        user_id,
        project_id,
      })
      setLevel(level.data)
    }
    if (user.id) {
      supabase
        .from('verses')
        .select(
          'verse_id:id,verse:text,num,project_id,chapters!inner(num,id),projects!inner(code)'
        )
        .match({ 'projects.code': project, 'chapters.num': chapter })
        .order('num', 'ascending')
        .then((res) => {
          const verses = config?.reference?.verses?.map((v) => v.verse_id)
          const result = res.data.map((el) => ({
            verse_id: el.verse_id,
            verse: el.verse,
            num: el.num,
            editable: verses.includes(el.verse_id),
          }))
          setVerseObjects(result)
          setChapterId(res.data[0].chapters.id)
          getLevel(user.id, res.data[0].project_id)
        })
    }
  }, [chapter, config?.reference?.verses, project, user.id])

  const updateVerseObject = (id, text) => {
    setVerseObjects((prev) => {
      const newVerseObject = prev.map((el) => {
        if (el.verse_id === id) {
          el.verse = text
        }
        return el
      })
      return newVerseObject
    })
  }

  useEffect(() => {
    let mySubscription = null
    if (chapterId) {
      mySubscription = supabase
        .from('verses:chapter_id=eq.' + chapterId)
        .on('UPDATE', (payload) => {
          const { id, text } = payload.new
          updateVerseObject(id, text)
        })
        .subscribe()
    }
    return () => {
      if (mySubscription) {
        supabase.removeSubscription(mySubscription)
      }
    }
  }, [chapterId])

  const updateVerse = (id, text) => {
    setVerseObjects((prev) => {
      if (
        !(config?.config?.moderatorOnly
          ? !['user', 'translator'].includes(level)
          : prev[id].editable)
      ) {
        return prev
      }
      prev[id].verse = text
      axios.defaults.headers.common['token'] = user?.access_token
      axios
        .put(`/api/save_verse`, { id: prev[id].verse_id, text })
        .then((res) => {
          console.log('save_verse', res)
        })
        .catch((error) => console.log(error))
      return [...prev]
    })
  }

  return (
    <div>
      {verseObjects.map((el, index) => (
        <div key={el.verse_id} className="flex my-3">
          <div
            className={
              (
                config?.config?.moderatorOnly
                  ? ['user', 'translator'].includes(level)
                  : !el.editable
              )
                ? ''
                : 'font-bold'
            }
          >
            {el.num}
          </div>
          <AutoSizeTextArea
            disabled={
              config?.config?.moderatorOnly
                ? ['user', 'translator'].includes(level)
                : !el.editable
            }
            verseObject={el}
            index={index}
            updateVerse={updateVerse}
          />
        </div>
      ))}
    </div>
  )
}

export default CommandEditor
