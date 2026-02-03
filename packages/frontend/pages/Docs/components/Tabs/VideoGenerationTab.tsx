import { Box } from '@mui/material'
import DocPageLayout from '../DocPageLayout'
import { Typography } from '../../../../components/common/ui/typography'

export default function VideoGenerationTab() {
  return (
    <DocPageLayout>
      <Box>
        <Typography variant="h2" className="mb-3">
          Video Generation
        </Typography>

        <Typography variant="p" className="mb-4">
          Banbury can generate videos from text descriptions using state-of-the-art AI video generation models. Simply describe the video you want, and Banbury will create it and save it to your cloud storage.
        </Typography>

        <Box sx={{ mb: 6 }}>
          <Typography variant="h3" className="mb-2">Supported Models</Typography>
          <Typography variant="p" className="mb-3">
            Banbury integrates with multiple leading video generation providers:
          </Typography>
          <Box sx={{ pl: 2 }}>
            <Typography variant="p" className="mb-2"><strong>OpenAI Sora 2</strong></Typography>
            <Typography variant="list" className="mb-3">
              <li>Latest text-to-video model from OpenAI</li>
              <li>Duration and resolution are determined automatically based on the prompt</li>
            </Typography>
            
            <Typography variant="p" className="mb-2"><strong>Google Veo 3.1</strong></Typography>
            <Typography variant="list" className="mb-3">
              <li>Google's latest video generation model</li>
              <li>Supports 4-8 second durations</li>
              <li>Available in 720p and 1080p resolutions</li>
            </Typography>
            
            <Typography variant="p" className="mb-2"><strong>Google Veo 3.1 Fast</strong></Typography>
            <Typography variant="list" className="mb-3">
              <li>Faster generation with similar quality</li>
            </Typography>
            
            <Typography variant="p" className="mb-2"><strong>Runway Gen-3</strong></Typography>
            <Typography variant="list" className="mb-3">
              <li>Available in Alpha and Turbo variants</li>
              <li>High-quality video generation</li>
            </Typography>
            
            <Typography variant="p" className="mb-2"><strong>Luma Dream Machine</strong></Typography>
            <Typography variant="list">
              <li>Creative video generation with unique artistic styles</li>
            </Typography>
          </Box>
        </Box>

        <Box sx={{ mb: 6 }}>
          <Typography variant="h3" className="mb-2">How to Generate Videos</Typography>
          <Typography variant="p" className="mb-3">
            To generate a video, simply describe what you want in natural language:
          </Typography>
          <Box sx={{ pl: 2 }}>
            <Typography variant="p" className="mb-1">1. Enable the "Generate Video" tool in your composer settings (enabled by default)</Typography>
            <Typography variant="p" className="mb-1">2. Describe the video you want to create</Typography>
            <Typography variant="p" className="mb-1">3. Optionally specify duration, resolution, or target folder</Typography>
            <Typography variant="p">4. The generated video is automatically saved to your cloud storage</Typography>
          </Box>
          <Typography variant="p" className="mt-3">
            <strong>Example prompts:</strong>
          </Typography>
          <Typography variant="list" className="mt-1">
            <li>"Create a 5-second video of a sunset over the ocean with gentle waves"</li>
            <li>"Generate a video showing a cat playing with a ball of yarn"</li>
            <li>"Make a promotional video with abstract colorful particles flowing"</li>
          </Typography>
        </Box>

        <Box sx={{ mb: 6 }}>
          <Typography variant="h3" className="mb-2">Video Parameters</Typography>
          <Typography variant="p" className="mb-3">
            The video generation tool supports several optional parameters:
          </Typography>
          <Box sx={{ pl: 2 }}>
            <Typography variant="p" className="mb-1"><strong>prompt</strong> (required) — Detailed description of the video content</Typography>
            <Typography variant="p" className="mb-1"><strong>duration</strong> (optional) — Video length in seconds (default: 5s, support varies by model)</Typography>
            <Typography variant="p" className="mb-1"><strong>resolution</strong> (optional) — Either '720p' or '1080p' (default: 1080p, support varies by model)</Typography>
            <Typography variant="p" className="mb-1"><strong>folder</strong> (optional) — Target folder for saving (default: 'videos')</Typography>
            <Typography variant="p"><strong>fileBaseName</strong> (optional) — Base filename for the video (default: 'Generated Video')</Typography>
          </Box>
          <Typography variant="p" className="mt-3">
            <strong>Note:</strong> Not all parameters are supported by all models. OpenAI Sora determines duration and resolution automatically. Google Veo supports 4-8 second durations.
          </Typography>
        </Box>

        <Box sx={{ mb: 6 }}>
          <Typography variant="h3" className="mb-2">Choosing a Model</Typography>
          <Typography variant="p" className="mb-3">
            You can select your preferred video generation model in the composer settings:
          </Typography>
          <Box sx={{ pl: 2 }}>
            <Typography variant="p" className="mb-1">1. Click on the tools/settings menu in the composer</Typography>
            <Typography variant="p" className="mb-1">2. Look for the video generation model selector</Typography>
            <Typography variant="p">3. Choose from available models (Sora, Veo, Runway, Luma)</Typography>
          </Box>
        </Box>

        <Box sx={{ mb: 6 }}>
          <Typography variant="h3" className="mb-2">Generated Video Storage</Typography>
          <Typography variant="p" className="mb-3">
            All generated videos are automatically:
          </Typography>
          <Typography variant="list">
            <li>Saved to your cloud storage in MP4 format</li>
            <li>Named with a timestamp (e.g., "Generated Video 2025-01-09T10-30-00.mp4")</li>
            <li>Placed in the specified folder (default: 'videos')</li>
            <li>Viewable directly in the Banbury file viewer</li>
          </Typography>
        </Box>

        <Box sx={{ mb: 6 }}>
          <Typography variant="h3" className="mb-2">Generation Time</Typography>
          <Typography variant="p" className="mb-3">
            Video generation typically takes longer than image generation:
          </Typography>
          <Typography variant="list">
            <li>Most videos complete within 1-5 minutes</li>
            <li>Longer or more complex videos may take up to 10 minutes</li>
            <li>The agent will wait for completion and notify you when ready</li>
          </Typography>
        </Box>

        <Box>
          <Typography variant="h3" className="mb-2">Tips for Better Results</Typography>
          <Typography variant="list">
            <li><strong>Be specific:</strong> Include details about motion, lighting, camera angles</li>
            <li><strong>Describe the style:</strong> Mention if you want realistic, animated, cinematic, etc.</li>
            <li><strong>Keep it focused:</strong> Simpler scenes often produce better results</li>
            <li><strong>Specify timing:</strong> Describe what happens at different points in the video</li>
            <li><strong>Iterate:</strong> Generate variations and refine your prompts based on results</li>
          </Typography>
        </Box>
      </Box>
    </DocPageLayout>
  )
}
