import { supabase } from '../../../../../../utils/supabaseClient'

export default async function userProjectHandler(req, res) {
  if (!req.headers.token) {
    res.status(401).json({ error: 'Access denied!' })
  }
  supabase.auth.setAuth(req.headers.token)

  const {
    query: { code, id },
    method,
  } = req

  switch (method) {
    case 'GET':
      const { data, error } = await supabase
        .from('project_roles')
        .select('role,users!inner(id),projects!inner(code)')
        .eq('users.id', id)
        .eq('projects.code', code)
      if (error) {
        return
      }
      res.status(200).json({ data })
      break
    case 'PUT':
      res.status(200).json({ code: `Project ${code}` })
      break
    default:
      res.setHeader('Allow', ['GET', 'PUT'])
      res.status(405).end(`Method ${method} Not Allowed`)
  }
}
