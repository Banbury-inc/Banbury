interface UrlConstructorWithParse extends URLConstructor {
  parse?: (url: string | URL, base?: string | URL) => URL | null
}

export function ensureUrlParse(): void {
  if (typeof URL === 'undefined') return

  const urlConstructor = URL as UrlConstructorWithParse
  if (typeof urlConstructor.parse === 'function') return

  Object.defineProperty(urlConstructor, 'parse', {
    configurable: true,
    writable: true,
    value: (url: string | URL, base?: string | URL) => {
      try {
        if (base === undefined) return new URL(String(url))

        return new URL(String(url), String(base))
      } catch {
        return null
      }
    },
  })
}

ensureUrlParse()
