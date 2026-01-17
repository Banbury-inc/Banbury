import { Box } from '@mui/material';
import DocPageLayout from './DocPageLayout';
import { Typography } from '../../../components/ui/typography';
import {
  MockComposerBasic,
  MockComposerWithFile,
  MockComposerWithToolsOpen,
} from './MockComposerForDocs';

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
    <Box sx={{ mb: 3, maxWidth: '400px' }}>
      <Box sx={{
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '10px',
        overflow: 'hidden',
      }}>
        {/* Header bar */}
        <Box sx={{
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          px: 2,
          py: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <Typography variant="xs" className="text-zinc-400 font-medium uppercase tracking-wider">
            Example Prompt
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.75 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'rgba(255, 99, 99, 0.6)' }} />
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'rgba(255, 199, 99, 0.6)' }} />
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'rgba(99, 255, 99, 0.6)' }} />
          </Box>
        </Box>
        {/* Content */}
        <Box sx={{ p: 2 }}>
          <Typography
            variant="p"
            className="font-mono"
            sx={{
              wordBreak: 'break-word',
              color: 'rgba(255, 255, 255, 0.9)',
              lineHeight: 1.6,
            }}
          >
            {text}
          </Typography>
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
          <Typography variant="p" className="mb-3">
            In the Chat window, type the following prompt and press Enter.
          </Typography>
          
          <PromptBox text="Search the web for latest NFL news." />
          
          <Box sx={{ mb: 3 }}>
            <MockComposerBasic />
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
          <Typography variant="p" className="mb-3">
            Type the following prompt and press Enter.
          </Typography>
          
          <PromptBox text="Create a new document with a summary of your results." />
          
          <Box sx={{ mb: 3 }}>
            <MockComposerBasic />
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
          <Typography variant="p" className="mb-3">
            You can attach files to your prompts by clicking the attachment icon in the composer or simply opening a file in the left panel.
          </Typography>
          
          <Box sx={{ mb: 3 }}>
            <MockComposerWithFile />
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
          <Typography variant="p" className="mb-3">
            Enable or disable specific tools in the composer to customize Banbury's capabilities for your task.
          </Typography>
          
          <Box sx={{ mb: 3 }}>
            <MockComposerWithToolsOpen />
          </Box>
        </Box>
      </Box>
    </DocPageLayout>
  );
}