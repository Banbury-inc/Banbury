import { ApiService } from "../../../../../backend/api/apiService"
import { MeetingSession, MeetingSummary, ActionItem } from "../../../../types/meeting-types"
import { v4 as uuidv4 } from 'uuid'

/**
 * Generates a meeting summary using the AI assistant
 * @param transcriptionText The full meeting transcription text
 * @returns A structured MeetingSummary object
 */
async function generateSummaryWithAI(transcriptionText: string, sessionId: string): Promise<MeetingSummary> {
  const token = localStorage.getItem('authToken');

  // Create structured prompt for AI to generate meeting summary
  const summaryPrompt = `You are analyzing a meeting transcription. Generate a comprehensive summary following this exact JSON structure:

{
  "summary": "A 2-3 paragraph overview of the meeting",
  "keyPoints": ["Key point 1", "Key point 2", "..."],
  "decisions": ["Decision 1", "Decision 2", "..."],
  "nextSteps": ["Next step 1", "Next step 2", "..."],
  "actionItems": [
    {
      "description": "Action item description",
      "assignee": "Person's name (or null if not mentioned)",
      "priority": "low" | "medium" | "high",
      "status": "pending"
    }
  ]
}

Guidelines:
- Summary: Provide 2-3 paragraphs summarizing the meeting's purpose and main outcomes
- Key Points: Extract 5-10 main discussion points
- Decisions: List any explicit decisions made during the meeting
- Next Steps: Identify follow-up actions or next steps mentioned
- Action Items: Extract specific tasks with assignees when mentioned (use "medium" priority as default)
- Respond ONLY with valid JSON, no additional text

Meeting Transcription:
${transcriptionText}

Respond with the JSON summary:`;

  // Use the simpler /api/assistant endpoint which returns JSON directly
  const response = await fetch('/api/assistant', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    body: JSON.stringify({
      messages: [{
        role: 'user',
        content: [{ type: 'text', text: summaryPrompt }]
      }]
    })
  });

  if (!response.ok) {
    throw new Error(`AI request failed: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();

  // Extract text from response - the endpoint returns { content: [{ type: 'text', text: '...' }] }
  const textPart = result.content?.find((p: any) => p.type === 'text');
  const aiResponseText = textPart?.text || '';

  if (!aiResponseText.trim()) {
    throw new Error('No response received from AI');
  }

  // Parse AI response as JSON
  let summaryData: any;
  try {
    // Try to extract JSON from markdown code blocks if present
    const jsonMatch = aiResponseText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) ||
                     aiResponseText.match(/(\{[\s\S]*\})/);

    if (jsonMatch) {
      summaryData = JSON.parse(jsonMatch[1]);
    } else {
      summaryData = JSON.parse(aiResponseText);
    }
  } catch (error) {
    console.error('Failed to parse AI response as JSON:', aiResponseText);
    throw new Error('AI did not return valid JSON. Please try again.');
  }

  // Validate required fields
  if (!summaryData.summary || !summaryData.keyPoints || !summaryData.decisions || !summaryData.nextSteps) {
    throw new Error('AI response missing required fields');
  }

  // Transform AI response into MeetingSummary format
  const actionItems: ActionItem[] = (summaryData.actionItems || []).map((item: any) => ({
    id: uuidv4(),
    description: item.description || '',
    assignee: item.assignee || undefined,
    dueDate: undefined,
    priority: item.priority || 'medium',
    status: 'pending'
  }));

  const meetingSummary: MeetingSummary = {
    id: uuidv4(),
    meetingId: sessionId,
    summary: summaryData.summary,
    keyPoints: Array.isArray(summaryData.keyPoints) ? summaryData.keyPoints : [],
    decisions: Array.isArray(summaryData.decisions) ? summaryData.decisions : [],
    nextSteps: Array.isArray(summaryData.nextSteps) ? summaryData.nextSteps : [],
    actionItems,
    generatedAt: new Date()
  };

  return meetingSummary;
}

/**
 * Saves the generated summary to the backend database
 * @param sessionId The meeting session ID
 * @param summary The MeetingSummary object to save
 */
async function saveSummaryToBackend(sessionId: string, summary: MeetingSummary): Promise<void> {
  const result = await ApiService.post<{ success: boolean; message: string }>(
    `/meeting-agent/sessions/${sessionId}/summary/`,
    summary
  )

  if (!result.success) {
    throw new Error(result.message || 'Failed to save summary')
  }
}

/**
 * Main handler for generating and saving meeting summaries
 * @param sessionId The meeting session ID
 * @param onSuccess Callback when summary is successfully generated and saved
 * @param onError Callback when an error occurs
 * @param providedTranscriptionText Optional transcription text to use instead of fetching from backend
 */
export async function handleGenerateSummary(
  sessionId: string,
  onSuccess?: (meeting: MeetingSession) => void,
  onError?: (error: string) => void,
  providedTranscriptionText?: string
): Promise<void> {
  try {
    let transcriptionText = providedTranscriptionText;

    // If no transcription text provided, try to fetch from backend
    if (!transcriptionText || transcriptionText.trim().length === 0) {
      const meetingSession = await ApiService.MeetingAgent.getMeetingSession(sessionId);
      transcriptionText = meetingSession.transcriptionText;
    }

    if (!transcriptionText || transcriptionText.trim().length === 0) {
      throw new Error('No transcription available for summary generation')
    }

    // Generate summary using AI
    const summary = await generateSummaryWithAI(transcriptionText, sessionId)

    // Save summary to backend database
    await saveSummaryToBackend(sessionId, summary)

    // Fetch updated meeting data with the new summary
    const updatedMeeting = await ApiService.MeetingAgent.getMeetingSession(sessionId)
    onSuccess?.(updatedMeeting)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate summary'
    console.error('Summary generation error:', error)
    onError?.(errorMessage)
    throw error
  }
}
