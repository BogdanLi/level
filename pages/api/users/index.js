import { supabase } from '@/utils/supabaseClient'

export default async function usersHandler(req, res) {
  if (!req.headers.token) {
    res.status(401).json({ error: 'Access denied!' })
  }
  supabase.auth.setAuth(req.headers.token)
  const { data, error } = await supabase.from('users').select('*')
  if (error) {
    res.status(404).json({ error })
    return
  }
  res.status(200).json({ ...data })
}
