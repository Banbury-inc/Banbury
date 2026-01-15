interface OperatingSystem {
  platform: 'windows' | 'macos' | 'linux' | 'unknown'
  architecture: 'x64' | 'arm64' | 'unknown'
}

interface GitHubReleaseAsset {
  name: string
  browser_download_url: string
  size: number
}

interface GitHubRelease {
  tag_name: string
  assets: GitHubReleaseAsset[]
  html_url: string
}

const GITHUB_REPO_OWNER = 'Banbury-inc'
const GITHUB_REPO_NAME = 'Banbury'
const GITHUB_API_BASE = 'https://api.github.com'
const RELEASE_CACHE_KEY = 'banbury-desktop-release-cache'
const CACHE_DURATION_MS = 5 * 60 * 1000 // 5 minutes

/**
 * Detects the user's operating system and architecture
 */
export function detectOperatingSystem(): OperatingSystem {
  if (typeof window === 'undefined') {
    return { platform: 'unknown', architecture: 'unknown' }
  }

  const platform = window.navigator.platform.toLowerCase()
  const userAgent = window.navigator.userAgent.toLowerCase()

  let osPlatform: OperatingSystem['platform'] = 'unknown'
  let architecture: OperatingSystem['architecture'] = 'unknown'

  // Detect platform
  if (platform.includes('win') || userAgent.includes('windows')) {
    osPlatform = 'windows'
    architecture = 'x64' // Windows builds are x64 only based on electron-builder.json
  } else if (platform.includes('mac') || userAgent.includes('macintosh')) {
    osPlatform = 'macos'
    // Prefer arm64 for macOS if available, fallback to x64
    if (userAgent.includes('arm64') || platform.includes('arm')) {
      architecture = 'arm64'
    } else {
      architecture = 'x64'
    }
  } else if (platform.includes('linux') || userAgent.includes('linux')) {
    osPlatform = 'linux'
    architecture = 'x64' // Linux builds are x64 only based on electron-builder.json
  }

  return { platform: osPlatform, architecture }
}

/**
 * Constructs the expected asset filename based on OS and architecture
 */
function getExpectedAssetName(os: OperatingSystem, version: string): string {
  if (os.platform === 'windows') {
    return `Banbury Setup ${version}.exe`
  }

  if (os.platform === 'macos') {
    const arch = os.architecture === 'arm64' ? 'arm64' : 'x64'
    return `Banbury-${version}-${arch}.dmg`
  }

  if (os.platform === 'linux') {
    // Prefer AppImage, fallback to deb
    return `Banbury-${version}.AppImage`
  }

  return ''
}

/**
 * Gets cached release data if available and not expired
 */
function getCachedRelease(): GitHubRelease | null {
  if (typeof window === 'undefined') return null

  try {
    const cached = localStorage.getItem(RELEASE_CACHE_KEY)
    if (!cached) return null

    const { release, timestamp } = JSON.parse(cached)
    const now = Date.now()

    if (now - timestamp > CACHE_DURATION_MS) {
      localStorage.removeItem(RELEASE_CACHE_KEY)
      return null
    }

    return release
  } catch {
    return null
  }
}

/**
 * Caches release data with timestamp
 */
function setCachedRelease(release: GitHubRelease): void {
  if (typeof window === 'undefined') return

  try {
    const cache = {
      release,
      timestamp: Date.now()
    }
    localStorage.setItem(RELEASE_CACHE_KEY, JSON.stringify(cache))
  } catch {
    // Silently fail if localStorage is unavailable
  }
}

/**
 * Fetches the latest GitHub release information
 */
export async function fetchLatestRelease(): Promise<GitHubRelease | null> {
  // Check cache first
  const cached = getCachedRelease()
  if (cached) {
    return cached
  }

  try {
    const response = await fetch(
      `${GITHUB_API_BASE}/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/releases/latest`
    )

    if (!response.ok) {
      if (response.status === 404) {
        // No releases found
        return null
      }
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`)
    }

    const release: GitHubRelease = await response.json()
    
    // Cache the release
    setCachedRelease(release)

    return release
  } catch (error) {
    console.error('Failed to fetch GitHub release:', error)
    return null
  }
}

/**
 * Finds the appropriate asset from release assets based on OS
 */
function findMatchingAsset(
  assets: GitHubReleaseAsset[],
  os: OperatingSystem,
  version: string
): GitHubReleaseAsset | null {
  const expectedName = getExpectedAssetName(os, version)

  // Try exact match first
  if (expectedName) {
    const exactMatch = assets.find(asset => asset.name === expectedName)
    if (exactMatch) return exactMatch
  }

  // Fallback: match by platform and extension
  if (os.platform === 'windows') {
    return assets.find(asset => 
      asset.name.endsWith('.exe') && 
      asset.name.toLowerCase().includes('banbury')
    ) || null
  }

  if (os.platform === 'macos') {
    // Prefer arm64, fallback to x64
    if (os.architecture === 'arm64') {
      const arm64Asset = assets.find(asset => 
        asset.name.endsWith('.dmg') && 
        asset.name.includes('arm64')
      )
      if (arm64Asset) return arm64Asset
    }

    const dmgAsset = assets.find(asset => 
      asset.name.endsWith('.dmg') && 
      asset.name.toLowerCase().includes('banbury')
    )
    if (dmgAsset) return dmgAsset
  }

  if (os.platform === 'linux') {
    // Prefer AppImage, fallback to deb
    const appImageAsset = assets.find(asset => 
      asset.name.endsWith('.AppImage') && 
      asset.name.toLowerCase().includes('banbury')
    )
    if (appImageAsset) return appImageAsset

    const debAsset = assets.find(asset => 
      asset.name.endsWith('.deb') && 
      asset.name.toLowerCase().includes('banbury')
    )
    if (debAsset) return debAsset
  }

  return null
}

/**
 * Gets the download URL for the desktop app based on detected OS
 * Falls back to GitHub releases page if no matching asset is found
 */
export async function getDesktopDownloadUrl(): Promise<string> {
  const os = detectOperatingSystem()

  if (os.platform === 'unknown') {
    // Return releases page for unknown platforms
    return `https://github.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/releases/latest`
  }

  const release = await fetchLatestRelease()

  if (!release || !release.assets || release.assets.length === 0) {
    // Fallback to releases page
    return `https://github.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/releases/latest`
  }

  const matchingAsset = findMatchingAsset(release.assets, os, release.tag_name)

  if (!matchingAsset) {
    // Fallback to releases page if no matching asset found
    return release.html_url || `https://github.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/releases/latest`
  }

  return matchingAsset.browser_download_url
}

/**
 * Gets the direct download URL pattern (without API call)
 * Useful for constructing URLs when release info is already known
 */
export function getDirectDownloadUrlPattern(
  version: string,
  os: OperatingSystem
): string {
  const assetName = getExpectedAssetName(os, version)
  if (!assetName) {
    return `https://github.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/releases/latest`
  }

  return `https://github.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/releases/latest/download/${assetName}`
}
