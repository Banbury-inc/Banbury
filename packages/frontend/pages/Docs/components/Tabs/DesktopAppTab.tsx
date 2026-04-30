import Link from 'next/link'
import DocPageLayout from '../DocPageLayout'
import { Typography } from '../../../../components/common/ui/typography'

const docsLinkClassName =
  'rounded-sm text-primary underline underline-offset-4 transition-colors hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'

export default function DesktopAppTab() {
  return (
    <DocPageLayout>
      <div className="space-y-6">
        <div>
          <Typography variant="h2" className="mb-3">
            Desktop App
          </Typography>
          <Typography variant="p" className="mt-0">
            The Banbury Desktop App provides a native desktop experience with enhanced capabilities
            for meeting recording and system integration. Built with Electron, it offers superior
            performance, offline capabilities, and bot-free meeting recordings powered by Recall
            AI&apos;s Desktop Recording SDK.
          </Typography>
        </div>

        <div className="space-y-3">
          <Typography variant="h3" className="mb-0">
            Bot-Free Meeting Recordings
          </Typography>
          <Typography variant="p" className="mt-0">
            One of the key advantages of the desktop app is its ability to record meetings without
            requiring a bot participant to join your video calls.
          </Typography>
          <div className="rounded-2xl border border-border bg-card/50 p-6">
            <Typography variant="h4" className="mb-2">
              How It Works
            </Typography>
            <Typography variant="p" className="mb-2 mt-0">
              The desktop app uses Recall AI&apos;s Desktop Recording SDK, which records meetings
              directly from your desktop without a bot participant. This technology:
            </Typography>
            <Typography variant="list" className="my-4 mt-2">
              <li>
                <strong>Records directly from your desktop</strong> — No bot appears in participant
                lists
              </li>
              <li>
                <strong>Automatically detects meeting windows</strong> — Works with Zoom, Microsoft
                Teams, Google Meet, and other platforms
              </li>
              <li>
                <strong>Provides superior recording quality</strong> — Native desktop recording
                captures higher quality audio and video
              </li>
              <li>
                <strong>Maintains privacy</strong> — No bot participant means no confusion or
                questions from meeting attendees
              </li>
            </Typography>
          </div>
          <Typography variant="p" className="mt-0">
            This feature is exclusive to the desktop app and is not available in the web version.
            For more information about meeting recording capabilities, see the{' '}
            <Link href="/docs/meeting-agent-feature" className={docsLinkClassName}>
              Meetings documentation
            </Link>
            .
          </Typography>
        </div>

        <div className="space-y-3">
          <Typography variant="h3" className="mb-0">
            Key Benefits
          </Typography>
          <Typography variant="list" className="my-0 mt-0">
            <li>
              <strong>Native performance:</strong> Faster load times and smoother interactions
              compared to the web version
            </li>
            <li>
              <strong>Offline capabilities:</strong> Continue working even when internet
              connectivity is limited
            </li>
            <li>
              <strong>System integration:</strong> Better integration with your operating system and
              native notifications
            </li>
            <li>
              <strong>Desktop recording:</strong> Bot-free meeting recordings with superior quality
            </li>
            <li>
              <strong>Resource efficiency:</strong> Optimized resource usage for extended usage
              sessions
            </li>
          </Typography>
        </div>

        <div className="space-y-4">
          <Typography variant="h3" className="mb-0">
            Installation
          </Typography>
          <Typography variant="p" className="mt-0">
            Download the desktop app for your operating system:
          </Typography>

          <div className="space-y-4">
            <div className="space-y-2 border-l-2 border-border ps-4">
              <Typography variant="h4" className="mb-0">
                Windows
              </Typography>
              <ol className="ml-6 list-decimal space-y-2 font-mono leading-7 text-foreground marker:text-muted-foreground">
                <li>
                  Download the{' '}
                  <Typography variant="inlineCode" asChild>
                    Banbury Setup x.x.x.exe
                  </Typography>{' '}
                  installer
                </li>
                <li>Run the installer and follow the setup wizard</li>
                <li>Launch Banbury from your Start menu or desktop shortcut</li>
              </ol>
            </div>

            <div className="space-y-2 border-l-2 border-border ps-4">
              <Typography variant="h4" className="mb-0">
                macOS
              </Typography>
              <ol className="ml-6 list-decimal space-y-2 font-mono leading-7 text-foreground marker:text-muted-foreground">
                <li>
                  Download the{' '}
                  <Typography variant="inlineCode" asChild>
                    Banbury-x.x.x.dmg
                  </Typography>{' '}
                  file (automatically detects Intel or Apple Silicon)
                </li>
                <li>Open the DMG and drag Banbury into your Applications folder</li>
                <li>
                  If macOS blocks the app, open System Settings → Privacy &amp; Security and use
                  Open Anyway (on older macOS versions: System Preferences → Security &amp; Privacy)
                </li>
                <li>Launch Banbury from your Applications folder</li>
              </ol>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Typography variant="h3" className="mb-0">
            Feature Highlights
          </Typography>
          <Typography variant="p" className="text-muted-foreground mt-0">
            Specific capabilities that complement the benefits above:
          </Typography>
          <Typography variant="list" className="my-0 mt-0">
            <li>
              <strong>Desktop recording:</strong> Record meetings without bot participants using
              Recall AI Desktop SDK
            </li>
            <li>
              <strong>Native notifications:</strong> System-level notifications for important
              updates and alerts
            </li>
            <li>
              <strong>Keyboard shortcuts:</strong> Customizable shortcuts for faster workflows
            </li>
            <li>
              <strong>Auto-updates:</strong> Automatic updates so you always have the latest features
            </li>
            <li>
              <strong>Multi-window support:</strong> Open multiple windows for different workspaces
              or tasks
            </li>
          </Typography>
        </div>

        <div className="rounded-2xl border border-border bg-card/50 p-6">
          <Typography variant="h3" className="mb-2">
            Get Started
          </Typography>
          <Typography variant="p" className="mb-3 mt-0">
            Download the latest version of the Banbury Desktop App from our GitHub releases. The
            download flow can detect your operating system and offer the appropriate installer.
          </Typography>
          <Typography variant="p" className="mt-0">
            Visit our{' '}
            <a
              href="https://github.com/Banbury-inc"
              target="_blank"
              rel="noopener noreferrer"
              className={docsLinkClassName}
              aria-label="Banbury on GitHub (opens in a new tab)"
            >
              GitHub repository
            </a>{' '}
            to download the latest release, or check the home page for a direct download link.
          </Typography>
        </div>
      </div>
    </DocPageLayout>
  )
}
