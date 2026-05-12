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
  teams: boolean;
  onedrive: boolean;
  notion: boolean;
  use_skills: boolean;
  plan_mode: boolean;
  ask_mode: boolean;
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
    teams: false, // Disable Teams by default for workspace messaging safety
    onedrive: false, // Disable OneDrive by default for storage safety
    notion: false, // Disable Notion by default for security
    use_skills: false, // Disabled by default until API access confirmed
    plan_mode: false, // Disabled by default - use Agent mode
    ask_mode: false, // Disabled by default - use Agent mode
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
        teams: (parsed && typeof parsed.teams === 'boolean') ? parsed.teams : false,
        onedrive: (parsed && typeof parsed.onedrive === 'boolean') ? parsed.onedrive : false,
        notion: (parsed && typeof parsed.notion === 'boolean') ? parsed.notion : false,
        // Auto-enable skills for Anthropic provider
        use_skills: (parsed?.model_provider === 'anthropic'),
        // Plan mode preference
        plan_mode: (parsed && typeof parsed.plan_mode === 'boolean') ? parsed.plan_mode : false,
        // Ask mode preference
        ask_mode: (parsed && typeof parsed.ask_mode === 'boolean') ? parsed.ask_mode : false,
      };
    }
  } catch {}

  return defaultPreferences;
}

