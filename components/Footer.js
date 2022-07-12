import { useState } from 'react'
import axios from 'axios'

import Link from 'next/link'

export default function Footer({
  userId,
  session,
  agreement,
  textCheckbox,
  textButton,
  href,
}) {
  const [checked, setChecked] = useState(false)
  const handleSetAgreement = async () => {
    if (!userId) {
      return
    }
    axios.defaults.headers.common['token'] = session?.access_token
    axios
      .put('/api/agreements/user', {
        user_id: userId,
      })
      .then((result) => {
        const { data, status } = result

        //TODO обработать статус и дата если статус - 201, тогда сделать редирект route.push(headers.location)
      })
      .catch((error) => console.log(error, 'from axios'))
  }
  const handleClick = () => {
    if (agreement === 'user-agreement') {
      handleSetAgreement()
    }
  }
  return (
    <div className="max-w-7xl w-full mx-auto flex justify-end items-center px-4 bg-blue-150">
      <div className="relative flex items-center h-16">
        <div className="flex flex-row items-center space-x-6">
          <div className="space-x-1.5 items-center h4">
            <input
              className="cursor-pointer"
              id="cb"
              type="checkbox"
              checked={checked}
              onChange={() => setChecked((prev) => !prev)}
            />
            <label className="cursor-pointer" htmlFor="cb">
              {textCheckbox}
            </label>
          </div>
          <Link href={href}>
            <button onClick={handleClick} className="btn-filled w-28" disabled={!checked}>
              {textButton}
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}
