import { Box, Paper } from '@mui/material';
import { IntegrationInstructions, Repeat, AccountTree } from '@mui/icons-material';
import Image from 'next/image';
import DocPageLayout from '../DocPageLayout';
import { Typography } from '../../../../components/ui/typography';

export default function WhatIsBanburyTab() {
  return (
    <DocPageLayout>
              <Box>
                <Typography variant="h2" className="mb-3">
                  What Is Banbury?
                </Typography>
                <Typography variant="p" className="mb-4">
                  Banbury is an Enterprise AI Analyst that works as a remote artificial employee within organizations.
                  It is an entry-level, autonomous AI colleague capable of editing documents and spreadsheets, handling complex tasks,
                   and collaborating seamlessly with people across various platforms.
                </Typography>
              <Box sx={{
                borderRadius: '12px',
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.08)',
              }}>
                <Image 
                  src="/Workspaces.png" 
                  alt="Chat Input Field - Step 1" 
                  width={800}
                  height={400}
                  style={{ 
                    width: '100%', 
                    height: 'auto', 
                    borderRadius: '10px',
                    maxWidth: '100%',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                  }} 
                  onError={(e) => {
                    console.error('Failed to load Chatbox image:', e);
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </Box>
              <Typography variant="p" className="mt-2 mb-4">
                Banbury transforms workflows, offering a powerful tool to enhance productivity, streamline operations, and drive innovation.
              </Typography>

                <Typography variant="h2" className="mt-2 mb-3">
                  Why choose Banbury?
                </Typography>
                <Paper
                  sx={{
                    p: 2,
                    mb: 2,
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '16px',
                    backdropFilter: 'blur(10px)',
                  }}
                >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <IntegrationInstructions 
                    sx={{ 
                      color: '#a1a1aa', 
                      mr: 1.5, 
                      fontSize: '1.5rem' 
                    }} 
                  />
                  <Typography variant="h3">
                      Data Integration
                  </Typography>
                </Box>
                <Typography variant="p" className="mb-2">
                  Banbury is a great way to get started with AI in your organization.
                  Athena seamlessly integrates with popular enterprise data sources such as Snowflake/Salesforce,
                   Outlook/Gmail, etc. allowing for a unified data experience across platforms and enhancing productivity.
                </Typography>
                </Paper>

                <Paper
                  sx={{
                    p: 2,
                    mb: 2,
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '16px',
                    backdropFilter: 'blur(10px)',
                  }}
                >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Repeat 
                    sx={{ 
                      color: '#a1a1aa', 
                      mr: 1.5, 
                      fontSize: '1.5rem' 
                    }} 
                  />
                  <Typography variant="h3">
                      Repeatability
                  </Typography>
                </Box>
                <Typography variant="p" className="mb-2">
                   Banbury excels in automating manual processes and repeating workflows across multiple scenarios, saving time and reducing errors. This capability allows enterprises to scale operations efficiently by standardizing routine tasks.
                </Typography>
                </Paper>
                <Paper
                  sx={{
                    p: 2,
                    mb: 4,
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '16px',
                    backdropFilter: 'blur(10px)',
                  }}
                >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <AccountTree 
                    sx={{ 
                      color: '#a1a1aa', 
                      mr: 1.5, 
                      fontSize: '1.5rem' 
                    }} 
                  />
                  <Typography variant="h3">
                      Tailored Workflows
                  </Typography>
                </Box>
                <Typography variant="p" className="mb-2">
                   Banbury offers bespoke workflows tailored to your industry needs, providing customizable solutions that align with your enterprise's unique processes and objectives.
                </Typography>
                </Paper>
                <Typography variant="h2" className="mb-3">
                  Who is Banbury made for?
                </Typography>
                <Typography variant="p" className="mb-2">
                  Banbury is made for organizations looking to harness the power of advanced AI to enhance productivity,
                   drive innovation, and gain a competitive edge in today's fast-paced environment. Whether you're
                    a student in college, a Fortune 500 executive, or anywhere in between, Banbury is your next hire to help
                     you achieve your goals more efficiently and effectively.
                </Typography>
              </Box>
    </DocPageLayout>
  );
}
