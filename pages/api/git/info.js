import axios from 'axios'
import jsyaml from 'js-yaml'

import { tsvToJson } from '@texttree/translation-words-helpers'

/**
 *  @swagger
 *  /api/git/info:
 *    get:
 *      summary: Returns info
 *      description: Returns book introduction & chapter introduction
 *      parameters:
 *       - name: repo
 *         in: query
 *         description: url to TN repository
 *         required: true
 *         schema:
 *           type: string
 *           example: https://git.door43.org/ru_gl/ru_tn
 *       - name: book
 *         in: query
 *         description: book code
 *         required: true
 *         schema:
 *           type: string
 *           example: mat
 *       - name: chapter
 *         in: query
 *         description: number of chapter
 *         required: true
 *         schema:
 *           type: string
 *           example: 1
 *      tags:
 *        - git.door43
 *      responses:
 *        '200':
 *          description: Returns book introduction
 *
 *        '404':
 *          description: Bad request
 */

export default async function infoHandler(req, res) {
  const { repo, book, chapter } = req.query
  const manifestUrl = repo + '/raw/branch/master/manifest.yaml'

  let bookPath

  try {
    const { data } = await axios.get(manifestUrl)
    const manifest = jsyaml.load(data, { json: true })
    bookPath = manifest.projects.find((el) => el.identifier === book)?.path
  } catch (manifestUrlError) {
    res.status(404).json({ manifestUrlError })
    return
  }

  let url = ''
  if (bookPath.slice(0, 2) === './') {
    url = `${repo}/raw/master${bookPath.slice(1)}`
  } else {
    url = `${repo}/raw/master/${bookPath}`
  }
  let _data
  try {
    _data = await axios.get(url)
  } catch (error) {
    res.status(404).json({ error })
    return
  }
  const jsonData = tsvToJson(_data.data)
  const intros = {}

  jsonData?.forEach((el) => {
    const [chapterNote, verseNote] = el.Reference
      ? el.Reference.split(':')
      : [el.Chapter, el.Verse]
    // пропускаем, если это не наша глава и не введение
    if (chapterNote !== chapter && chapterNote !== 'front') {
      return
    }
    if (verseNote !== 'intro') {
      return
    }

    const newNote = {
      id: el.ID,
      text: el?.OccurrenceNote || el?.Note,
      title: chapterNote === 'front' ? 'bookIntro' : 'chapterIntro',
    }
    intros[newNote.title] = newNote.text
  })

  res.status(200).json(intros)
  return
}
