import { appWithTranslation } from 'next-i18next'

import { UserContextProvider } from 'lib/UserContext'
import { supabase } from 'utils/supabaseClient'

import Layout from 'components/Layout'

import 'styles/globals.css'

function MyApp({ Component, pageProps }) {
  if (Component.layoutType == 'empty') {
    return (
      <UserContextProvider supabaseClient={supabase}>
        <Component {...pageProps} />
      </UserContextProvider>
    )
  }

  return (
    <UserContextProvider supabaseClient={supabase}>
      <Layout backgroundColor={Component.backgroundColor ?? 'bg-blue-150'}>
        <Component {...pageProps} />
      </Layout>
    </UserContextProvider>
  )
}

export default appWithTranslation(MyApp)
