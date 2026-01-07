interface ToolPreferences {
  web_search: boolean;
  tiptap_ai: boolean;
  read_file: boolean;
  gmail: boolean;
  gmailSend: boolean;
  langgraph_mode: boolean;
  browserbase: boolean;
  x_api: boolean;
  slack: boolean;
  use_skills: boolean;
}

export function getToolPreferences(): ToolPreferences {
  const defaultPreferences: ToolPreferences = {
    web_search: true,
    tiptap_ai: true,
    read_file: true,
    gmail: true,
    gmailSend: true,
    langgraph_mode: true, // Always use LangGraph mode
    browserbase: true, // Enable Browserbase tool by default
    x_api: false, // Disable X API by default for security
    slack: false, // Disable Slack by default for security
    use_skills: false, // Disabled by default until API access confirmed
  };

  try {
    const saved = localStorage.getItem('toolPreferences');
    if (saved) {
      const parsed = JSON.parse(saved);
      return { 
        ...defaultPreferences, 
        ...parsed, 
        langgraph_mode: true,
        browserbase: (parsed && typeof parsed.browserbase === 'boolean') ? parsed.browserbase : true,
        x_api: (parsed && typeof parsed.x_api === 'boolean') ? parsed.x_api : false,
        gmailSend: (parsed && typeof parsed.gmailSend === 'boolean') ? parsed.gmailSend : true,
        slack: (parsed && typeof parsed.slack === 'boolean') ? parsed.slack : false,
        // Auto-enable skills for Anthropic provider
        use_skills: (parsed?.model_provider === 'anthropic'),
      }; // Force LangGraph + ensure browserbase present + ensure x_api present + ensure gmailSend present + ensure slack present + ensure use_skills present
    }
  } catch {}

  return defaultPreferences;
}

