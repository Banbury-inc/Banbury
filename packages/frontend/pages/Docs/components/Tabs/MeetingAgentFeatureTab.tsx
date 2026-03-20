import Image from 'next/image'
import Link from 'next/link'
import DocPageLayout from '../DocPageLayout'
import { Typography } from '../../../../components/common/ui/typography'
import meetingsImage from '../../../../assets/images/meetings.png'

export default function MeetingAgentFeatureTab() {
  return (
    <DocPageLayout>
      <div>
        <Typography variant="h2" className="mb-3">
          Meetings
        </Typography>

        <div className="mb-6">
          <Typography variant="p">
            Banbury's Meeting Agent provides intelligent meeting recording and transcription powered by Recall AI integration. It features an automated meeting bot that can join video calls and capture comprehensive meeting data, along with real-time meeting management capabilities such as participant tracking and session monitoring.
          </Typography>
        </div>

        <div className="mb-6 flex justify-center">
          <Image
            src={meetingsImage}
            alt="Meeting Agent Interface"
            className="h-auto max-w-full rounded-xl border border-border shadow-lg"
          />
        </div>

        <div className="mb-6">
          <Typography variant="h4" className="mb-2">
            <strong>Core Features:</strong>
          </Typography>
          <Typography variant="list">
            <li><strong>Meeting Join:</strong> Automatically join video calls from multiple platforms (Zoom, Teams, Google Meet, etc.)</li>
            <li><strong>Real-time Recording:</strong> High-quality video and audio recording with live status indicators</li>
            <li><strong>Live Transcription:</strong> Real-time speech-to-text conversion with speaker identification</li>
            <li><strong>Participant Tracking:</strong> Monitor who joins/leaves meetings with detailed participant information</li>
            <li><strong>Session Management:</strong> View, manage, and control multiple meeting sessions simultaneously</li>
            <li><strong>Cloud Storage:</strong> Automatic upload to S3 with secure cloud backup and retrieval</li>
          </Typography>
        </div>

        <div className="mb-6 rounded-2xl border border-border bg-card/50 p-6">
          <Typography variant="h4" className="mb-2">
            Bot-Free Recording with Desktop App
          </Typography>
          <Typography variant="p" className="mb-2">
            While Banbury's Meeting Agent can join meetings as a bot participant, you can also record meetings without any bot joining your calls by using the Banbury Desktop App.
          </Typography>
          <Typography variant="p" className="mb-2">
            The desktop app uses Recall AI's Desktop Recording SDK to record meetings directly from your desktop. This approach:
          </Typography>
          <Typography variant="list">
            <li><strong>Eliminates bot participants:</strong> No bot appears in your meeting participant list</li>
            <li><strong>Automatic detection:</strong> Detects meeting windows automatically (Zoom, Teams, Google Meet, etc.)</li>
            <li><strong>Better recording quality:</strong> Native desktop recording provides superior audio and video quality</li>
            <li><strong>Seamless experience:</strong> Record meetings without disrupting participants or meeting flow</li>
          </Typography>
          <Typography variant="p" className="mt-2">
            See the <Link href="/docs/desktop-app" className="underline underline-offset-4">Desktop App documentation</Link> for installation instructions and more details about bot-free meeting recordings.
          </Typography>
        </div>

        <div className="mb-6">
          <Typography variant="h4" className="mb-2">
            <strong>Meeting Management - Banbury can:</strong>
          </Typography>
          <Typography variant="list">
            <li>Join meetings automatically using meeting URLs from various platforms</li>
            <li>Start and stop recording sessions with one-click controls</li>
            <li>Leave meetings gracefully and trigger automatic data processing</li>
            <li>Monitor meeting status in real-time (active, recording, completed, failed)</li>
            <li>Bulk manage multiple sessions (delete, refresh, upload to cloud)</li>
            <li>Update session URLs and metadata automatically from bot responses</li>
          </Typography>
        </div>

        <div className="mb-6">
          <Typography variant="h4" className="mb-2">
            <strong>Data Processing & Storage:</strong>
          </Typography>
          <Typography variant="list">
            <li><strong>Video Processing:</strong> High-quality video recording with automatic compression and optimization</li>
            <li><strong>Transcription Analysis:</strong> AI-powered speech recognition with speaker identification and confidence scoring</li>
            <li><strong>Cloud Integration:</strong> Automatic S3 upload with secure access controls and URL generation</li>
            <li><strong>Metadata Extraction:</strong> Meeting duration, participant details, platform information, and timestamps</li>
            <li><strong>Search & Retrieval:</strong> Full-text search across transcripts with timestamp-based navigation</li>
          </Typography>
        </div>

        <div className="mb-6">
          <Typography variant="h4" className="mb-2">
            <strong>User Interface Features:</strong>
          </Typography>
          <Typography variant="list">
            <li><strong>Dashboard View:</strong> Comprehensive meeting overview with real-time status updates</li>
            <li><strong>Expandable Rows:</strong> Detailed meeting information with video player and transcript viewer</li>
            <li><strong>Bulk Operations:</strong> Select and manage multiple sessions simultaneously</li>
            <li><strong>Real-time Updates:</strong> Live refresh capabilities with loading states and error handling</li>
            <li><strong>Responsive Design:</strong> Mobile-first interface that works across all devices</li>
          </Typography>
        </div>

        <div className="relative mt-8 flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card/50 p-6">
          <Typography variant="h4" className="mb-2">
            Meeting Agent Integration
          </Typography>
          <Typography variant="p" className="mb-2">
            Banbury's Meeting Agent transforms how you capture and analyze meeting content. With seamless integration across all major video conferencing platforms, intelligent transcription, and automated cloud storage, you'll never miss important meeting details again.
          </Typography>
          <Typography variant="p" className="mb-2">
            The system automatically handles the entire meeting lifecycle - from joining calls and recording content to processing transcripts and storing everything securely in the cloud. This enables powerful search, analysis, and knowledge extraction from your meeting data.
          </Typography>
          <Typography variant="p">
            Start recording your meetings with intelligent automation and never lose track of important discussions, decisions, or action items again.
          </Typography>
        </div>
      </div>
    </DocPageLayout>
  )
}
