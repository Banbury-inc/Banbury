import { ApiService } from "../../../../backend/api/apiService";

interface RateLimitResult {
  exceeded: boolean;
  errorMessage?: string;
}

export async function checkRateLimit(): Promise<RateLimitResult> {
  try {
    const aiResponse = await ApiService.post('/users/ai_message_sent/', {} as any) as any;
    
    // Check if the user has exceeded the AI message limit
    if (aiResponse?.result === 'exceeded_ai_message_limit') {
      return {
        exceeded: true,
        errorMessage: "❌ You have exceeded 100 AI requests this month. Please subscribe to the Pro plan for unlimited requests."
      };
    }
    
    return { exceeded: false };
  } catch (error: any) {
    // Check if it's a rate limit error (429 status)
    if (error?.status === 429 || error?.response?.status === 429) {
      return {
        exceeded: true,
        errorMessage: "❌ You have exceeded 100 AI requests this month. Please subscribe to the Pro plan for unlimited requests."
      };
    }
    // ignore other tracking errors
    return { exceeded: false };
  }
}

