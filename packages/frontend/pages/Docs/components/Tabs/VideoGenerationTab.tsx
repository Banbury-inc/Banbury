import { Box } from '@mui/material'
import DocPageLayout from '../DocPageLayout'
import { Typography } from '../../../../components/ui/typography'

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
            <Typography variant="p" className="mb-1 pl-4">• Latest text-to-video model from OpenAI</Typography>
            <Typography variant="p" className="mb-3 pl-4">• Duration and resolution are determined automatically based on the prompt</Typography>
            
            <Typography variant="p" className="mb-2"><strong>Google Veo 3.1</strong></Typography>
            <Typography variant="p" className="mb-1 pl-4">• Google's latest video generation model</Typography>
            <Typography variant="p" className="mb-1 pl-4">• Supports 4-8 second durations</Typography>
            <Typography variant="p" className="mb-3 pl-4">• Available in 720p and 1080p resolutions</Typography>
            
            <Typography variant="p" className="mb-2"><strong>Google Veo 3.1 Fast</strong></Typography>
            <Typography variant="p" className="mb-3 pl-4">• Faster generation with similar quality</Typography>
            
            <Typography variant="p" className="mb-2"><strong>Runway Gen-3</strong></Typography>
            <Typography variant="p" className="mb-1 pl-4">• Available in Alpha and Turbo variants</Typography>
            <Typography variant="p" className="mb-3 pl-4">• High-quality video generation</Typography>
            
            <Typography variant="p" className="mb-2"><strong>Luma Dream Machine</strong></Typography>
            <Typography variant="p" className="pl-4">• Creative video generation with unique artistic styles</Typography>
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
          <Box sx={{ pl: 2, mt: 1 }}>
            <Typography variant="p" className="mb-1">• "Create a 5-second video of a sunset over the ocean with gentle waves"</Typography>
            <Typography variant="p" className="mb-1">• "Generate a video showing a cat playing with a ball of yarn"</Typography>
            <Typography variant="p">• "Make a promotional video with abstract colorful particles flowing"</Typography>
          </Box>
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
          <Box sx={{ pl: 2 }}>
            <Typography variant="p" className="mb-1">• Saved to your cloud storage in MP4 format</Typography>
            <Typography variant="p" className="mb-1">• Named with a timestamp (e.g., "Generated Video 2025-01-09T10-30-00.mp4")</Typography>
            <Typography variant="p" className="mb-1">• Placed in the specified folder (default: 'videos')</Typography>
            <Typography variant="p">• Viewable directly in the Banbury file viewer</Typography>
          </Box>
        </Box>

        <Box sx={{ mb: 6 }}>
          <Typography variant="h3" className="mb-2">Generation Time</Typography>
          <Typography variant="p" className="mb-3">
            Video generation typically takes longer than image generation:
          </Typography>
          <Box sx={{ pl: 2 }}>
            <Typography variant="p" className="mb-1">• Most videos complete within 1-5 minutes</Typography>
            <Typography variant="p" className="mb-1">• Longer or more complex videos may take up to 10 minutes</Typography>
            <Typography variant="p">• The agent will wait for completion and notify you when ready</Typography>
          </Box>
        </Box>

        <Box>
          <Typography variant="h3" className="mb-2">Tips for Better Results</Typography>
          <Box sx={{ pl: 2 }}>
            <Typography variant="p" className="mb-1">• <strong>Be specific:</strong> Include details about motion, lighting, camera angles</Typography>
            <Typography variant="p" className="mb-1">• <strong>Describe the style:</strong> Mention if you want realistic, animated, cinematic, etc.</Typography>
            <Typography variant="p" className="mb-1">• <strong>Keep it focused:</strong> Simpler scenes often produce better results</Typography>
            <Typography variant="p" className="mb-1">• <strong>Specify timing:</strong> Describe what happens at different points in the video</Typography>
            <Typography variant="p">• <strong>Iterate:</strong> Generate variations and refine your prompts based on results</Typography>
          </Box>
        </Box>
      </Box>
    </DocPageLayout>
  )
}
