import { Stagehand } from '@browserbasehq/stagehand';

type StagehandSession = {
  id: string;
  instance: Stagehand;
};

const sessions = new Map<string, StagehandSession>();

export async function createStagehandSession(options?: {
  modelName?: string;
  startUrl?: string;
}): Promise<{ id: string; viewerUrl?: string; title?: string } & { startUrl?: string }> {
  const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const instance = new Stagehand({
    env: 'BROWSERBASE',
    apiKey: 'bb_live_LleFhuIha5NZcpoovoJQOwvv6aA',
    projectId: '963ab71c-1f30-4969-8902-674593aaf89d',
    modelName: (options?.modelName as any) || "claude-3-5-sonnet-latest",
    modelClientOptions: {
      apiKey: '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',
    },
  });

  await instance.init();
  // Ensure we navigate to a real https URL so the UI has a valid viewer target
  try {
    const startUrl = options?.startUrl && options.startUrl.trim().length > 0
      ? options.startUrl
      : 'https://www.example.com';
    await instance.page.goto(startUrl);
  } catch {}

  sessions.set(id, { id, instance });
  
  // Prefer Browserbase Live View (authenticated embed) if available
  let viewerUrl: string | undefined = undefined;
  let title: string | undefined = undefined;
  try {
    const sessionId = (instance as any).browserbaseSessionID;
    if (sessionId) {
      const resp = await fetch(`https://api.browserbase.com/v1/sessions/${sessionId}/debug`, {
        headers: {
          'X-BB-API-Key': 'bb_live_LleFhuIha5NZcpoovoJQOwvv6aA',
        },
      });
      if (resp.ok) {
        const data: any = await resp.json();
        const liveLink = data?.debuggerFullscreenUrl
          || data?.debuggerUrl
          || data?.pages?.[0]?.debuggerFullscreenUrl
          || data?.pages?.[0]?.debuggerUrl;
        if (typeof liveLink === 'string' && liveLink.startsWith('https://')) {
          // Optional UI tweaks per docs: allow hiding navbar via query
          viewerUrl = `${liveLink}${liveLink.includes('?') ? '&' : '?'}navbar=true`;
        }
      }
    }
  } catch {}

  // Fallback to embedding the actual page URL the agent is on (no auth prompt)
  if (!viewerUrl) {
    try {
      title = await instance.page.title();
      const currentUrl = instance.page.url();
      // Avoid non-https and about:blank which BrowserViewer rejects
      if (currentUrl && currentUrl.startsWith('https://') && currentUrl !== 'about:blank') {
        viewerUrl = currentUrl;
      }
    } catch {}
  }

  // Absolute fallback to a safe https URL if we still don't have one
  if (!viewerUrl) {
    viewerUrl = 'https://www.example.com';
    title = title || 'Browser Session';
  }

  // Optionally expose the Browserbase viewer URL (requires login); keep as fallback if needed
  // const bbViewerUrl = instance.browserbaseSessionID
  //   ? `https://www.browserbase.com/sessions/${instance.browserbaseSessionID}/view?embed=1`
  //   : undefined;
    
  return { id, viewerUrl, title, startUrl: options?.startUrl };
}

export function getStagehandSession(id: string): Stagehand | null {
  const sess = sessions.get(id);
  console.log('getStagehandSession', sess);
  return sess ? sess.instance : null;
}

export async function closeStagehandSession(id: string): Promise<boolean> {
  const sess = sessions.get(id);
  if (!sess) return false;
  try {
    await sess.instance.close();
  } finally {
    sessions.delete(id);
  }
  return true;
}


