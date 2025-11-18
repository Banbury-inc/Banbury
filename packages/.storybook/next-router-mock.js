// Mock Next.js router for Storybook
export const useRouter = () => ({
  push: () => Promise.resolve(true),
  replace: () => Promise.resolve(true),
  reload: () => {},
  back: () => {},
  forward: () => {},
  prefetch: () => Promise.resolve(),
  beforePopState: () => {},
  pathname: "/",
  route: "/",
  query: {},
  asPath: "/",
  basePath: "",
  locale: undefined,
  locales: undefined,
  defaultLocale: undefined,
  isReady: true,
  isPreview: false,
  isLocaleDomain: false,
  isFallback: false,
  events: {
    on: () => {},
    off: () => {},
    emit: () => {},
  },
})

export default {
  useRouter,
}

