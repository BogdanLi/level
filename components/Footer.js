import { useEffect, useState } from 'react'

import { useRouter } from 'next/router'
import Link from 'next/link'

import Fulfilled from '../public/fulfilled.svg'

export default function Footer({ textCheckbox, textButton, href }) {
  const [checked, setChecked] = useState(false)
  const [isStepPage, setIsStepPage] = useState(false)
  const router = useRouter()
  const { step } = router?.query

  useEffect(() => {
    setChecked(false)
  }, [step])

  useEffect(() => {
    setIsStepPage(router.pathname === '/steps/[step]')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.pathname])

  return (
    <div className="layout-footer">
      <div className="relative flex items-center h-12 md:h-16">
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
            <button className="btn-cyan w-28" disabled={!checked}>
              {textButton}
            </button>
          </Link>
        </div>
      </div>
      {isStepPage && (
        <>
          <div className="pb-3 md:pb-0">stepper</div>
          <div className="flex gap-2.5 h5 items-center pb-3 md:pb-0">
            <div>Выполнили:</div>
            <Fulfilled />
          </div>
        </>
      )}
    </div>
  )
}
