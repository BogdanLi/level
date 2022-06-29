import Head from 'next/head'
import Link from 'next/link'

import { useProjects } from '../utils/hooks'
import { useUser } from '../lib/UserContext'

export default function Projects() {
  const { session } = useUser()

  const [projects] = useProjects(session?.access_token)

  return (
    <>
      <div className="container">
        <Head>
          <title>V-CANA Sign up</title>
          <meta name="description" content="VCANA" />
          <link rel="icon" href="/favicon.ico" />
        </Head>
      </div>
      <div>Проекты:</div>
      {projects &&
        projects.data.map((project) => {
          return (
            <Link key={project.id} href={`projects/${project.code}`}>
              <a className="block text-blue-600">{`${project.id} ${project.title} ${project.code}`}</a>
            </Link>
          )
        })}
      <Link href={'/projects/create'}>
        <a className="btn-filled btn">Add New</a>
      </Link>
    </>
  )
}
