import { getDesktopDownloadUrl } from '../../../utils/getDesktopDownloadUrl'

const GITHUB_REPO_OWNER = 'Banbury-inc'
const GITHUB_REPO_NAME = 'Banbury'

export async function handleDownloadDesktopApp() {
  try {
    const url = await getDesktopDownloadUrl()
    window.open(url, '_blank')
  } catch (error) {
    console.error('Failed to get download URL:', error)
    // Fallback to GitHub releases page
    window.open(`https://github.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/releases/latest`, '_blank')
  }
}
