import { useEffect, useState } from 'react'
import Link from 'next/link'
import ReactTextareaAutosize from 'react-textarea-autosize'

function Property({ t, property, content, type, updateProperty }) {
  const [propertyContent, setPropertyContent] = useState()
  useEffect(() => {
    setPropertyContent(content)
  }, [content])
  const additionalLinks = {
    intro: 'https://git.door43.org/ru_gl/ru_obs/raw/branch/master/content/front/intro.md',
    back: 'https://git.door43.org/ru_gl/ru_obs/raw/branch/master/content/back/intro.md',
  }
  return (
    <>
      <div className="flex gap-2">
        <div className="font-bold">
          {t(`book-properties:${property}${type === 'obs' ? '_obs' : ''}`)}
        </div>
        {additionalLinks[property] && (
          <Link href={additionalLinks[property]}>
            <a
              title={additionalLinks[property]}
              target="_blank"
              className="text-teal-500"
            >
              ?
            </a>
          </Link>
        )}
      </div>

      <ReactTextareaAutosize
        maxRows="7"
        className="input-primary"
        placeholder={t(
          `book-properties:${property}_placeholder${type === 'obs' ? '_obs' : ''}`
        )}
        value={propertyContent}
        onChange={(e) => setPropertyContent(e.target.value)}
        onBlur={() => updateProperty(propertyContent, property)}
      />
    </>
  )
}

export default Property
