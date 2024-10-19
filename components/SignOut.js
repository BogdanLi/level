import { useState } from 'react'

import { useRouter } from 'next/router'

import { useTranslation } from 'next-i18next'

import useSupabaseClient from 'utils/supabaseClient'

import LogOut from 'public/logout.svg'

export default function SignOut({ collapsed }) {
  const supabaseClient = useSupabaseClient()
  const [loading, setLoading] = useState(false)
  const { t } = useTranslation('users')
  const router = useRouter()

  const handleLogout = async () => {
    try {
      setLoading(true)
      const { error } = await supabaseClient.auth.signOut()
      if (error) throw error
    } catch (error) {
      alert(error.error_description || error.message)
    } finally {
      setLoading(false)
      router.push('/')
    }
  }

  return (
    <button
      disabled={loading}
      onClick={handleLogout}
      className={`py-3 px-4 flex w-full items-center gap-2 cursor-pointer ${
        loading ? 'opacity-70' : ''
      }`}
    >
      <div className="stroke-th-text-primary">
        <LogOut
          className={`w-5 h-4 stroke-th-text-primary ${collapsed && 'opacity-70'}`}
        />
      </div>
      <p className={collapsed && 'lg:hidden'}>{t('users:SignOut')}</p>
    </button>
  )
}
