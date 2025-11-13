import type { GetServerSidePropsContext, GetServerSidePropsResult } from 'next'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

function Sitemap() {
  return null
}

export async function getServerSideProps(
  context: GetServerSidePropsContext
): Promise<GetServerSidePropsResult<Record<string, never>>> {
  const sitemapPath = join(process.cwd(), 'content', 'sitemap.xml')

  if (!existsSync(sitemapPath)) {
    context.res.statusCode = 404
    context.res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    context.res.end('Sitemap not found')

    return {
      props: {},
    }
  }

  const sitemapContent = readFileSync(sitemapPath, 'utf-8')

  context.res.setHeader('Content-Type', 'application/xml; charset=utf-8')
  context.res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600')
  context.res.write(sitemapContent)
  context.res.end()

  return {
    props: {},
  }
}

export default Sitemap

