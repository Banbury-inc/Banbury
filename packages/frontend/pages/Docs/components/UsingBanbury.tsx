import { Box } from '@mui/material';
import Image from 'next/image';
import DocPageLayout from './DocPageLayout';
import { Typography } from '../../../components/ui/typography';

interface StepIndicatorProps {
  stepNumber: number;
}

function StepIndicator({ stepNumber }: StepIndicatorProps) {
  return (
    <Box sx={{
      width: '28px',
      height: '28px',
      minWidth: '28px',
      borderRadius: '50%',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      border: '2px solid rgba(255, 255, 255, 0.2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      mr: 2,
    }}>
      <Typography variant="small" className="font-semibold">
        {stepNumber}
      </Typography>
    </Box>
  );
}

interface PromptBoxProps {
  text: string;
}

function PromptBox({ text }: PromptBoxProps) {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="small" className="mb-1 font-medium">
        Prompt
      </Typography>
      <Box sx={{
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
        p: 2,
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'flex-start', sm: 'center' },
        justifyContent: 'space-between',
        gap: { xs: 1, sm: 0 },
      }}>
        <Typography variant="small" sx={{ wordBreak: 'break-word' }}>
          {text}
        </Typography>
        <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 1, flexShrink: 0 }}>
          <Box sx={{
            width: '16px',
            height: '16px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Box sx={{
              width: '8px',
              height: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.6)',
              borderRadius: '1px'
            }} />
          </Box>
          <Box sx={{
            width: '16px',
            height: '16px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Box sx={{
              width: '8px',
              height: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.6)',
              borderRadius: '50%'
            }} />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default function UsingBanburyTab() {
  return (
    <DocPageLayout>
      <Typography variant="h2" className="mb-3">
        Using Banbury
      </Typography>
      <Typography variant="p" className="mb-4">
        This guide will walk you through Banbury—covering everything from basic functionalities to unlocking its full potential. 
        With step-by-step instructions and practical tips, learn how to leverage Banbury to simplify tasks and enhance productivity.
      </Typography>

      <Typography variant="h3" id="using-chat" className="mb-4">
        Using Chat
      </Typography>

      {/* Step 1 */}
      <Box sx={{ 
        mb: 4,
        pl: { xs: 0, md: 2 },
        borderLeft: { xs: 'none', md: '2px solid rgba(255, 255, 255, 0.1)' },
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <StepIndicator stepNumber={1} />
          <Typography variant="h4" id="web-research">
            Web Research
          </Typography>
        </Box>
        
        <Box sx={{ pl: { xs: 0, md: '44px' } }}>
          <Typography variant="muted" className="mb-3">
            In the Chat window, type the following prompt and press Enter.
          </Typography>
          
          <PromptBox text="Search the web for latest NFL news." />
          
          <Box sx={{ mb: 3 }}>
            <Image 
              src="/Chatbox.png" 
              alt="Chat Input Field - Step 1" 
              width={400}
              height={200}
              style={{ 
                width: '100%', 
                height: 'auto', 
                borderRadius: '10px',
                maxWidth: '400px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
              }} 
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </Box>
        </Box>
      </Box>

      {/* Step 2 */}
      <Box sx={{ 
        mb: 4,
        pl: { xs: 0, md: 2 },
        borderLeft: { xs: 'none', md: '2px solid rgba(255, 255, 255, 0.1)' },
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <StepIndicator stepNumber={2} />
          <Typography variant="h4" id="draft-report">
            Draft a report
          </Typography>
        </Box>
        
        <Box sx={{ pl: { xs: 0, md: '44px' } }}>
          <Typography variant="muted" className="mb-3">
            Type the following prompt and press Enter.
          </Typography>
          
          <PromptBox text="Create a new document with a summary of your results." />
          
          <Box sx={{ mb: 3 }}>
            <Image 
              src="/Chatbox2.png" 
              alt="Chat Input Field - Step 2" 
              width={400}
              height={200}
              style={{ 
                width: '100%', 
                height: 'auto', 
                borderRadius: '10px',
                maxWidth: '400px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
              }} 
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </Box>
        </Box>
      </Box>

      {/* Step 3 */}
      <Box sx={{ 
        mb: 4,
        pl: { xs: 0, md: 2 },
        borderLeft: { xs: 'none', md: '2px solid rgba(255, 255, 255, 0.1)' },
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <StepIndicator stepNumber={3} />
          <Typography variant="h4" id="attach-files">
            Attach Files
          </Typography>
        </Box>
        
        <Box sx={{ pl: { xs: 0, md: '44px' } }}>
          <Typography variant="muted" className="mb-3">
            You can attach files to your prompts by clicking the attachment icon in the composer or simply opening a file in the left panel.
          </Typography>
          
          <Box sx={{ mb: 3 }}>
            <Image 
              src="/composer-with-attached-file.png" 
              alt="Composer with attached file" 
              width={400}
              height={200}
              style={{ 
                width: '100%', 
                height: 'auto', 
                borderRadius: '10px',
                maxWidth: '400px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
              }} 
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </Box>
        </Box>
      </Box>

      {/* Step 4 */}
      <Box sx={{ 
        mb: 4,
        pl: { xs: 0, md: 2 },
        borderLeft: { xs: 'none', md: '2px solid rgba(255, 255, 255, 0.1)' },
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <StepIndicator stepNumber={4} />
          <Typography variant="h4" id="toggle-tools">
            Toggle Tools
          </Typography>
        </Box>
        
        <Box sx={{ pl: { xs: 0, md: '44px' } }}>
          <Typography variant="muted" className="mb-3">
            Enable or disable specific tools in the composer to customize Banbury's capabilities for your task.
          </Typography>
          
          <Box sx={{ mb: 3 }}>
            <Image 
              src="/composer-tool-toggling.png" 
              alt="Composer tool toggling interface" 
              width={400}
              height={200}
              style={{ 
                width: '100%', 
                height: 'auto', 
                borderRadius: '10px',
                maxWidth: '400px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
              }} 
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </Box>
        </Box>
      </Box>
    </DocPageLayout>
  );
}