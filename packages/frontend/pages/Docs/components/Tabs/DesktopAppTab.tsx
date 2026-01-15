import { Box } from '@mui/material'
import Link from 'next/link'
import DocPageLayout from '../DocPageLayout'
import { Typography } from '../../../../components/ui/typography'

export default function DesktopAppTab() {
  return (
    <DocPageLayout>
      <Box>
        <Typography variant="h2" className="mb-3">
          Desktop App
        </Typography>

        {/* Overview */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="p" className="pl-2">
            The Banbury Desktop App provides a native desktop experience with enhanced capabilities for meeting recording and system integration. Built with Electron, it offers superior performance, offline capabilities, and bot-free meeting recordings powered by Recall AI's Desktop Recording SDK.
          </Typography>
        </Box>

        {/* Bot-Free Meeting Recordings */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" className="mb-2">
            Bot-Free Meeting Recordings
          </Typography>
          <Typography variant="p" className="mb-3">
            One of the key advantages of the desktop app is its ability to record meetings without requiring a bot participant to join your video calls.
          </Typography>
          <Box sx={{
            p: 3,
            mb: 3,
            background: 'rgba(255,255,255,0.02)',
            borderRadius: '20px',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <Typography variant="h4" className="mb-2">
              How It Works
            </Typography>
            <Typography variant="p" className="mb-2">
              The desktop app uses Recall AI's Desktop Recording SDK, which records meetings directly from your desktop without a bot participant. This technology:
            </Typography>
            <Box sx={{ pl: 2 }}>
              <Typography variant="p" className="mb-1">
                • <strong>Records directly from your desktop</strong> — No bot appears in participant lists
              </Typography>
              <Typography variant="p" className="mb-1">
                • <strong>Automatically detects meeting windows</strong> — Works with Zoom, Microsoft Teams, Google Meet, and other platforms
              </Typography>
              <Typography variant="p" className="mb-1">
                • <strong>Provides superior recording quality</strong> — Native desktop recording captures higher quality audio and video
              </Typography>
              <Typography variant="p">
                • <strong>Maintains privacy</strong> — No bot participant means no confusion or questions from meeting attendees
              </Typography>
            </Box>
          </Box>
          <Typography variant="p" className="mb-2">
            This feature is exclusive to the desktop app and is not available in the web version. For more information about meeting recording capabilities, see the <Link href="/docs/meeting-agent-feature" className="underline underline-offset-4">Meetings documentation</Link>.
          </Typography>
        </Box>

        {/* Key Benefits */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" className="mb-2">
            Key Benefits
          </Typography>
          <Box sx={{ pl: 2 }}>
            <Typography variant="p" className="mb-1">
              • <strong>Native Performance:</strong> Faster load times and smoother interactions compared to web version
            </Typography>
            <Typography variant="p" className="mb-1">
              • <strong>Offline Capabilities:</strong> Continue working even when internet connectivity is limited
            </Typography>
            <Typography variant="p" className="mb-1">
              • <strong>System Integration:</strong> Better integration with your operating system and native notifications
            </Typography>
            <Typography variant="p" className="mb-1">
              • <strong>Desktop Recording:</strong> Bot-free meeting recordings with superior quality
            </Typography>
            <Typography variant="p">
              • <strong>Resource Efficiency:</strong> Optimized resource usage for extended usage sessions
            </Typography>
          </Box>
        </Box>

        {/* Installation Instructions */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" className="mb-2">
            Installation
          </Typography>
          <Typography variant="p" className="mb-3">
            Download the desktop app for your operating system:
          </Typography>

          {/* Windows */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h4" className="mb-2">
              Windows
            </Typography>
            <Box sx={{ pl: 2 }}>
              <Typography variant="p" className="mb-1">
                1. Download the <Typography variant="inlineCode" asChild>Banbury Setup x.x.x.exe</Typography> installer
              </Typography>
              <Typography variant="p" className="mb-1">
                2. Run the installer and follow the setup wizard
              </Typography>
              <Typography variant="p">
                3. Launch Banbury from your Start menu or desktop shortcut
              </Typography>
            </Box>
          </Box>

          {/* macOS */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h4" className="mb-2">
              macOS
            </Typography>
            <Box sx={{ pl: 2 }}>
              <Typography variant="p" className="mb-1">
                1. Download the <Typography variant="inlineCode" asChild>Banbury-x.x.x.dmg</Typography> file (automatically detects Intel or Apple Silicon)
              </Typography>
              <Typography variant="p" className="mb-1">
                2. Open the DMG file and drag Banbury to your Applications folder
              </Typography>
              <Typography variant="p" className="mb-1">
                3. If you see a security warning, go to System Preferences → Security & Privacy → Open Anyway
              </Typography>
              <Typography variant="p">
                4. Launch Banbury from your Applications folder
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Feature Highlights */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" className="mb-2">
            Feature Highlights
          </Typography>
          <Box sx={{ pl: 2 }}>
            <Typography variant="p" className="mb-1">
              • <strong>Desktop Recording:</strong> Record meetings without bot participants using Recall AI Desktop SDK
            </Typography>
            <Typography variant="p" className="mb-1">
              • <strong>Native Notifications:</strong> System-level notifications for important updates and alerts
            </Typography>
            <Typography variant="p" className="mb-1">
              • <strong>Keyboard Shortcuts:</strong> Customizable keyboard shortcuts for faster workflows
            </Typography>
            <Typography variant="p" className="mb-1">
              • <strong>Auto-Updates:</strong> Automatic updates to ensure you always have the latest features
            </Typography>
            <Typography variant="p">
              • <strong>Multi-Window Support:</strong> Open multiple windows for different workspaces or tasks
            </Typography>
          </Box>
        </Box>

        {/* Download Section */}
        <Box sx={{
          p: 3,
          mt: 4,
          background: 'rgba(255,255,255,0.02)',
          borderRadius: '20px',
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          <Typography variant="h3" className="mb-2">
            Get Started
          </Typography>
          <Typography variant="p" className="mb-3">
            Download the latest version of the Banbury Desktop App from our GitHub releases. The download button will automatically detect your operating system and provide the appropriate installer.
          </Typography>
          <Typography variant="p">
            Visit our <a href="https://github.com/Banbury-inc" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">GitHub repository</a> to download the latest release, or check the home page for a direct download link.
          </Typography>
        </Box>
      </Box>
    </DocPageLayout>
  )
}
