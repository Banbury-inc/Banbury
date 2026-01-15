import { ApiService } from "../../../../../backend/api/apiService"
import { MeetingSession, MeetingSummary, ActionItem } from "../../../../types/meeting-types"
import { v4 as uuidv4 } from 'uuid'

/**
 * Generates a meeting summary using the AI assistant via langgraph-stream endpoint
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

  // Use the langgraph-stream endpoint
  const response = await fetch('/api/assistant/langgraph-stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    body: JSON.stringify({
      messages: [{
        role: 'user',
        content: [{ type: 'text', text: summaryPrompt }]
      }],
      recursionLimit: 100
    })
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`AI request failed: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ''}`);
  }

  if (!response.body) {
    throw new Error('No response body available');
  }

  // Read the streaming response
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';
  let buffer = '';

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      // SSE events are separated by double newlines
      const events = buffer.split('\n\n');
      buffer = events.pop() || '';

      for (const evt of events) {
        const line = evt.trim();
        if (!line.startsWith('data:')) continue;
        
        const jsonStr = line.slice(5).trim();
        if (!jsonStr) continue;
        
        try {
          const event = JSON.parse(jsonStr);
          
          // Handle text-delta events (incremental text updates)
          if (event?.type === 'text-delta' && typeof event.text === 'string') {
            fullText += event.text;
          }
          // Handle content events with text
          else if (event?.type === 'content' && event.content) {
            if (typeof event.content === 'string') {
              fullText += event.content;
            } else if (Array.isArray(event.content)) {
              for (const part of event.content) {
                if (part.type === 'text' && part.text) {
                  fullText += part.text;
                }
              }
            }
          }
          // Handle direct text field
          else if (event?.text && typeof event.text === 'string') {
            fullText += event.text;
          }
          // Handle message content
          else if (event?.content && typeof event.content === 'string') {
            fullText += event.content;
          }
        } catch (e) {
          // Ignore malformed events
          continue;
        }
      }
    }

    // Process any remaining buffer
    if (buffer.trim()) {
      const line = buffer.trim();
      if (line.startsWith('data:')) {
        const jsonStr = line.slice(5).trim();
        if (jsonStr) {
          try {
            const event = JSON.parse(jsonStr);
            if (event?.type === 'text-delta' && typeof event.text === 'string') {
              fullText += event.text;
            } else if (event?.text && typeof event.text === 'string') {
              fullText += event.text;
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  if (!fullText.trim()) {
    throw new Error('No response received from AI');
  }

  // Parse AI response as JSON
  let summaryData: any;
  try {
    // Try to extract JSON from markdown code blocks if present
    const jsonMatch = fullText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) ||
                     fullText.match(/(\{[\s\S]*\})/);

    if (jsonMatch) {
      summaryData = JSON.parse(jsonMatch[1]);
    } else {
      summaryData = JSON.parse(fullText);
    }
  } catch (error) {
    console.error('Failed to parse AI response as JSON:', fullText);
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
