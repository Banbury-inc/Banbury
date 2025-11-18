import { Box } from '@mui/material';
import Image from 'next/image';
import DocPageLayout from './DocPageLayout';
import { Typography } from '../../../components/ui/typography';

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

      {/* Visual Step Component with Content */}
      <Box sx={{ mb: 6 }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'row',
          gap: 4,
          alignItems: 'flex-start'
        }}>
          {/* Left Side - Visual Steps */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            position: 'relative',
            minWidth: '120px'
          }}>
            {/* Step 1 Circle */}
            <Box sx={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2,
              zIndex: 2
            }}>
              <Typography variant="small" className="font-semibold">
                1
              </Typography>
            </Box>
            
            {/* Connecting Line */}
            <Box sx={{
              width: '2px',
              height: '280px',
              backgroundColor: 'rgba(255, 255, 255, 0.3)',
              mb: 2
            }} />
            
            {/* Step 2 Circle */}
            <Box sx={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2,
              zIndex: 2
            }}>
              <Typography variant="small" className="font-semibold">
                2
              </Typography>
            </Box>

            {/* Connecting Line */}
            <Box sx={{
              width: '2px',
              height: '280px',
              backgroundColor: 'rgba(255, 255, 255, 0.3)',
              mb: 2
            }} />
            
            {/* Step 3 Circle */}
            <Box sx={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2,
              zIndex: 2
            }}>
              <Typography variant="small" className="font-semibold">
                3
              </Typography>
            </Box>

            {/* Connecting Line */}
            <Box sx={{
              width: '2px',
              height: '280px',
              backgroundColor: 'rgba(255, 255, 255, 0.3)',
              mb: 2
            }} />
            
            {/* Step 4 Circle */}
            <Box sx={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2
            }}>
              <Typography variant="small" className="font-semibold">
                4
              </Typography>
            </Box>
          </Box>

          {/* Right Side - Step Content */}
          <Box sx={{ flex: 1 }}>
            {/* Step 1 Content */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h4" id="web-research" className="mb-2">
                Web Research
              </Typography>
              
              <Typography variant="muted" className="mb-3">
                In the Chat window, type the following prompt and press Enter.
              </Typography>
              
              {/* Prompt Section */}
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
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <Typography variant="small">
                    Search the web for latest NFL news.
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
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
              
              {/* Chat Input Field */}
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
                  onLoad={() => console.log('Chatbox image loaded successfully')}
                  onError={(e) => {
                    console.error('Failed to load Chatbox image:', e);
                    console.log('Trying to load from:', e.currentTarget.src);
                    e.currentTarget.style.display = 'none';
                  }}
                />
                {/* Fallback text if image fails */}
                <Box sx={{ 
                  display: 'none',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  p: 2,
                  mt: 2
                }}>
                  <Typography variant="small">
                    [Chat Interface Image - Step 1]
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Step 2 Content */}
            <Box>
              <Typography variant="h4" id="draft-report" className="mb-2">
                Draft a report
              </Typography>
              
              <Typography variant="muted" className="mb-3">
                Type the following prompt and press Enter.
              </Typography>
              
              {/* Prompt Section */}
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
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <Typography variant="small">
                    Create a new document with a summary of your results.
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
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
                  onLoad={() => console.log('Chatbox2 image loaded successfully')}
                  onError={(e) => {
                    console.error('Failed to load Chatbox2 image:', e);
                    console.log('Trying to load from:', e.currentTarget.src);
                    e.currentTarget.style.display = 'none';
                  }}
                />
                {/* Fallback text if image fails */}
                <Box sx={{ 
                  display: 'none',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  p: 2,
                  mt: 2
                }}>
                  <Typography variant="small">
                    [Chat Interface Image - Step 2]
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Step 3 Content */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h4" id="attach-files" className="mb-2">
                Attach Files
              </Typography>
              
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
                  onLoad={() => console.log('Composer with attached file image loaded successfully')}
                  onError={(e) => {
                    console.error('Failed to load composer-with-attached-file image:', e);
                    console.log('Trying to load from:', e.currentTarget.src);
                    e.currentTarget.style.display = 'none';
                  }}
                />
                {/* Fallback text if image fails */}
                <Box sx={{ 
                  display: 'none',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  p: 2,
                  mt: 2
                }}>
                  <Typography variant="small">
                    [Composer with Attached File Image - Step 3]
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Step 4 Content */}
            <Box>
              <Typography variant="h4" id="toggle-tools" className="mb-2">
                Toggle Tools
              </Typography>
              
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
                  onLoad={() => console.log('Composer tool toggling image loaded successfully')}
                  onError={(e) => {
                    console.error('Failed to load composer-tool-toggling image:', e);
                    console.log('Trying to load from:', e.currentTarget.src);
                    e.currentTarget.style.display = 'none';
                  }}
                />
                {/* Fallback text if image fails */}
                <Box sx={{ 
                  display: 'none',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  p: 2,
                  mt: 2
                }}>
                  <Typography variant="small">
                    [Composer Tool Toggling Image - Step 4]
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </DocPageLayout>
  );
};