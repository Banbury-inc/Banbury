import type { GetServerSidePropsContext, GetServerSidePropsResult } from 'next'
import { readFileSync } from 'fs'
import { join } from 'path'

function Sitemap() {
  return null
}

export async function getServerSideProps(
  context: GetServerSidePropsContext
): Promise<GetServerSidePropsResult<Record<string, never>>> {
  const sitemapPath = join(process.cwd(), 'public', 'sitemap.xml')
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

