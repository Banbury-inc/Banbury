import { Box } from '@mui/material';
import Link from 'next/link';
import DocPageLayout from '../DocPageLayout';
import { Typography } from '../../../../components/ui/typography';
import meetingsImage from '../../../../assets/images/meetings.png';

export default function MeetingAgentFeatureTab() {
  return (
    <DocPageLayout>
      <Box>
      <Typography variant="h2" className="mb-3">
       Meetings 
      </Typography>
      
      
      {/* Overview */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="p" className="pl-2">
          Banbury's Meeting Agent provides intelligent meeting recording and transcription powered by Recall AI integration. It features an automated meeting bot that can join video calls and capture comprehensive meeting data, along with real-time meeting management capabilities such as participant tracking and session monitoring.
        </Typography>
      </Box>

      {/* Meeting Agent Image */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
        <Box
          component="img"
          src={meetingsImage.src}
          alt="Meeting Agent Interface"
          sx={{
            maxWidth: '100%',
            height: 'auto',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        />
      </Box>
      {/* Core Features */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" className="mb-2">
          • <strong>Core Features:</strong>
        </Typography>
        <Box sx={{ pl: 2 }}>
          <Typography variant="p" className="mb-1">
            • <strong>Meeting Join:</strong> Automatically join video calls from multiple platforms (Zoom, Teams, Google Meet, etc.)
          </Typography>
          <Typography variant="p" className="mb-1">
            • <strong>Real-time Recording:</strong> High-quality video and audio recording with live status indicators
          </Typography>
          <Typography variant="p" className="mb-1">
            • <strong>Live Transcription:</strong> Real-time speech-to-text conversion with speaker identification
          </Typography>
          <Typography variant="p" className="mb-1">
            • <strong>Participant Tracking:</strong> Monitor who joins/leaves meetings with detailed participant information
          </Typography>
          <Typography variant="p" className="mb-1">
            • <strong>Session Management:</strong> View, manage, and control multiple meeting sessions simultaneously
          </Typography>
          <Typography variant="p">
            • <strong>Cloud Storage:</strong> Automatic upload to S3 with secure cloud backup and retrieval
          </Typography>
        </Box>
      </Box>

      {/* Bot-Free Recording with Desktop App */}
      <Box sx={{
        p: 3,
        mb: 4,
        background: 'rgba(255,255,255,0.02)',
        borderRadius: '20px',
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        <Typography variant="h4" className="mb-2">
          Bot-Free Recording with Desktop App
        </Typography>
        <Typography variant="p" className="mb-2">
          While Banbury's Meeting Agent can join meetings as a bot participant, you can also record meetings without any bot joining your calls by using the Banbury Desktop App.
        </Typography>
        <Typography variant="p" className="mb-2">
          The desktop app uses Recall AI's Desktop Recording SDK to record meetings directly from your desktop. This approach:
        </Typography>
        <Box sx={{ pl: 2 }}>
          <Typography variant="p" className="mb-1">
            • <strong>Eliminates bot participants:</strong> No bot appears in your meeting participant list
          </Typography>
          <Typography variant="p" className="mb-1">
            • <strong>Automatic detection:</strong> Detects meeting windows automatically (Zoom, Teams, Google Meet, etc.)
          </Typography>
          <Typography variant="p" className="mb-1">
            • <strong>Better recording quality:</strong> Native desktop recording provides superior audio and video quality
          </Typography>
          <Typography variant="p">
            • <strong>Seamless experience:</strong> Record meetings without disrupting participants or meeting flow
          </Typography>
        </Box>
        <Typography variant="p" className="mt-2">
          See the <Link href="/docs/desktop-app" className="underline underline-offset-4">Desktop App documentation</Link> for installation instructions and more details about bot-free meeting recordings.
        </Typography>
      </Box>

      {/* Meeting Management */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" className="mb-2">
          • <strong>Meeting Management - Banbury can:</strong>
        </Typography>
        <Box sx={{ pl: 2 }}>
          <Typography variant="p" className="mb-1">
            • Join meetings automatically using meeting URLs from various platforms
          </Typography>
          <Typography variant="p" className="mb-1">
            • Start and stop recording sessions with one-click controls
          </Typography>
          <Typography variant="p" className="mb-1">
            • Leave meetings gracefully and trigger automatic data processing
          </Typography>
          <Typography variant="p" className="mb-1">
            • Monitor meeting status in real-time (active, recording, completed, failed)
          </Typography>
          <Typography variant="p" className="mb-1">
            • Bulk manage multiple sessions (delete, refresh, upload to cloud)
          </Typography>
          <Typography variant="p">
            • Update session URLs and metadata automatically from bot responses
          </Typography>
        </Box>
      </Box>

      {/* Data Processing */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" className="mb-2">
          • <strong>Data Processing & Storage:</strong>
        </Typography>
        <Box sx={{ pl: 2 }}>
          <Typography variant="p" className="mb-1">
            • <strong>Video Processing:</strong> High-quality video recording with automatic compression and optimization
          </Typography>
          <Typography variant="p" className="mb-1">
            • <strong>Transcription Analysis:</strong> AI-powered speech recognition with speaker identification and confidence scoring
          </Typography>
          <Typography variant="p" className="mb-1">
            • <strong>Cloud Integration:</strong> Automatic S3 upload with secure access controls and URL generation
          </Typography>
          <Typography variant="p" className="mb-1">
            • <strong>Metadata Extraction:</strong> Meeting duration, participant details, platform information, and timestamps
          </Typography>
          <Typography variant="p">
            • <strong>Search & Retrieval:</strong> Full-text search across transcripts with timestamp-based navigation
          </Typography>
        </Box>
      </Box>

      {/* User Interface */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" className="mb-2">
          • <strong>User Interface Features:</strong>
        </Typography>
        <Box sx={{ pl: 2 }}>
          <Typography variant="p" className="mb-1">
            • <strong>Dashboard View:</strong> Comprehensive meeting overview with real-time status updates
          </Typography>
          <Typography variant="p" className="mb-1">
            • <strong>Expandable Rows:</strong> Detailed meeting information with video player and transcript viewer
          </Typography>
          <Typography variant="p" className="mb-1">
            • <strong>Bulk Operations:</strong> Select and manage multiple sessions simultaneously
          </Typography>
          <Typography variant="p" className="mb-1">
            • <strong>Real-time Updates:</strong> Live refresh capabilities with loading states and error handling
          </Typography>
          <Typography variant="p">
            • <strong>Responsive Design:</strong> Mobile-first interface that works across all devices
          </Typography>
        </Box>
      </Box>

      {/* Integration Benefits */}
      <Box sx={{
        p: 3,
        mt: 4,
        background: 'rgba(255,255,255,0.02)',
        borderRadius: '20px',
        border: '1px solid rgba(255,255,255,0.08)',
        position: 'relative',
        overflow: 'hidden',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}>
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
      </Box>
      </Box>
    </DocPageLayout>
  );
}
