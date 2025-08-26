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
    apiKey: process.env.BROWSERBASE_API_KEY,
    projectId: process.env.BROWSERBASE_PROJECT_ID!,
    modelName: (options?.modelName as any) || "claude-3-5-sonnet-latest",
    modelClientOptions: {
      apiKey: process.env.ANTHROPIC_API_KEY,
    },
  });

  await instance.init();
  if (options?.startUrl) {
    await instance.page.goto(options.startUrl);
  }

  sessions.set(id, { id, instance });
  
  // Prefer Browserbase Live View (authenticated embed) if available
  let viewerUrl: string | undefined = undefined;
  let title: string | undefined = undefined;
  try {
    const sessionId = (instance as any).browserbaseSessionID;
    if (sessionId && process.env.BROWSERBASE_API_KEY) {
      const resp = await fetch(`https://api.browserbase.com/v1/sessions/${sessionId}/debug`, {
        headers: {
          'X-BB-API-Key': process.env.BROWSERBASE_API_KEY as string,
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
      viewerUrl = instance.page.url();
    } catch {}
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


