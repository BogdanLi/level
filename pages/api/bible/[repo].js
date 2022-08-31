import axios from 'axios'
import usfm from 'usfm-js'

/**
 *  @swagger
 *  /api/bible/{repo}:
 *    get:
 *      summary: Returns specific language
 *      description: Returns specific language
 *      parameters:
 *       - name: repo
 *         in: path
 *         description: code of the language
 *         required: true
 *         schema:
 *           type: string
 *       - name: commit
 *         in: query
 *         description: code of the language
 *         required: true
 *         schema:
 *           type: string
 *       - name: owner
 *         in: query
 *         description: code of the language
 *         required: true
 *         schema:
 *           type: string
 *       - name: bookPath
 *         in: query
 *         description: code of the language
 *         required: true
 *         schema:
 *           type: string
 *       - name: language
 *         in: query
 *         description: code of the language
 *         required: true
 *         schema:
 *           type: string
 *      tags:
 *        - bible
 *      responses:
 *        '200':
 *          description: Returns usfm object
 *
 *        '404':
 *          description: Bad request
 *      security:
 *        - ApiKeyAuth: []
 */

const getText = (verseObject) => {
  return verseObject.text || verseObject.nextChar || ''
}

// +
const getFootnote = (verseObject) => {
  return '/fn ' + verseObject.content + ' fn/'
}

// +
const getMilestone = (verseObject, showUnsupported) => {
  const { tag, children } = verseObject

  switch (tag) {
    case 'k':
      return children.map((child) => getObject(child, showUnsupported)).join(' ')
    case 'zaln':
      if (children.length === 1 && children[0].type === 'milestone') {
        return getObject(children[0], showUnsupported)
      } else {
        return getAlignedWords(children)
      }
    default:
      return ''
  }
}

// +
const getAlignedWords = (verseObjects) => {
  return verseObjects
    .map((verseObject) => {
      return getWord(verseObject)
    })
    .join('')
}

// +
const getSection = (verseObject) => {
  return verseObject.content
}

// +
const getUnsupported = (verseObject) => {
  return (
    '/' +
    verseObject.tag +
    ' ' +
    (verseObject.content || verseObject.text) +
    ' ' +
    verseObject.tag +
    '/'
  )
}

// +
const getWord = (verseObject) => {
  return verseObject.text || verseObject.content
}
const getVerseText = (verseObjects, showUnsupported = false) => {
  return verseObjects
    .map((verseObject) => getObject(verseObject, showUnsupported))
    .join('')
}

const getObject = (verseObject, showUnsupported) => {
  const { type } = verseObject

  switch (type) {
    case 'quote':
    case 'text':
      return getText(verseObject)
    case 'milestone':
      return getMilestone(verseObject, showUnsupported)
    case 'word':
      if (verseObject.strong) {
        return getAlignedWords([verseObject])
      } else {
        return getWord(verseObject)
      }
    case 'section':
      return getSection(verseObject)
    case 'paragraph':
      return '\n'
    case 'footnote':
      return getFootnote(verseObject)
    default:
      if (showUnsupported) {
        return getUnsupported(verseObject)
      } else {
        return ''
      }
  }
}
const verses = [1, 2, 4, 5]
export default async function bibleHandler(req, res) {
  // if (!req.headers.token) {
  //   res.status(401).json({ error: 'Access denied!' })
  // }
  //
  let data = {}
  const {
    query: { repo, owner, commit, bookPath, language, chapter },
  } = req
  console.log(req.query.chapter)

  const url = `https://git.door43.org/${owner}/${language}_${repo}/raw/commit/${commit}${bookPath.slice(
    1
  )}`
  try {
    const _data = await axios.get(url)
    const jsonData = await usfm.toJSON(_data.data)
    // data = jsonData
    // console.log(jsonData.chapters[1][1].verseObjects)
    // if (error) throw error

    const test = await verses.map((el) => {
      return {
        key: el,
        text: getVerseText(jsonData.chapters[chapter][el].verseObjects),
      }
    })

    res.status(200).json(test)
    return
  } catch (error) {
    res.status(404).json({ error })
    return
  }
}
