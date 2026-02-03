import { Box } from '@mui/material';
import Image from 'next/image';
import DocPageLayout from '../DocPageLayout';
import { Typography } from '../../../../components/common/ui/typography';
import gmailImage from '../../../../assets/images/gmail.png';

export default function GmailFeatureTab() {
  return (
    <DocPageLayout>
      <Box>
      <Typography variant="h2" className="mb-3">
        Gmail
      </Typography>
      
      {/* Visibility */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" className="mb-2">
          <strong>Visibility:</strong>
        </Typography>
        <Typography variant="list">
          <li>Banbury can view and understand the contents of your Gmail messages, including email threads, attachments, and metadata.</li>
          <li>Access to email content, sender information, timestamps, and conversation threads.</li>
          <li>Read and analyze email attachments and embedded content.</li>
        </Typography>
      </Box>

      {/* Actions */}
      <Box>
        <Typography variant="h4" className="mb-2">
          <strong>Actions - Banbury can:</strong>
        </Typography>
        <Typography variant="list">
          <li>Compose and send new emails.</li>
          <li>Reply to and forward existing emails.</li>
          <li>Organize emails by creating and managing labels.</li>
          <li>Search and filter emails based on content, sender, or date.</li>
          <li>Schedule emails to be sent at specific times.</li>
          <li>Manage email drafts and templates.</li>
          <li>Set up automated email responses and filters.</li>
        </Typography>
      </Box>

      <Box sx={{ mb: 4, mt: 4 }}>
        <Image
          src={gmailImage}
          alt="Gmail Image"
          style={{
            width: '100%',
            height: 'auto',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            backgroundColor: '#0f0f0f'
          }}
          priority
        />
      </Box>
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
          Gmail Integration
        </Typography>
        <Typography variant="p" className="mb-2">
          Banbury's Gmail integration allows for seamless email management and automation. Whether you need to analyze email patterns, respond to customer inquiries, or organize your inbox, Banbury can handle it all with intelligent automation.
        </Typography>
        <Typography variant="p">
          Connect your Gmail account to get started with intelligent email management powered by AI.
        </Typography>
      </Box>
      </Box>
    </DocPageLayout>
  );
}
