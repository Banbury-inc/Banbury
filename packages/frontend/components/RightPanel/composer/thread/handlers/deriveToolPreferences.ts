import { getDefaultModelForProvider, getModelById, DEFAULT_VISIBLE_MODELS } from "../../handlers/getModelDisplayName";

export interface ThreadToolPreferences {
  web_search: boolean;
  tiptap_ai: boolean;
  read_file: boolean;
  gmail: boolean;
  langgraph_mode: boolean;
  browser: boolean;
  x_api: boolean;
  slack: boolean;
  // Document editing tools
  sheet_ai: boolean;
  docx_ai: boolean;
  pptx_ai: boolean;
  tldraw_ai: boolean;
  document_ai: boolean;
  // File management tools
  create_file: boolean;
  create_folder: boolean;
  download_from_url: boolean;
  search_files: boolean;
  // Calendar tools
  calendar: boolean;
  msCalendar: boolean;
  // Development tools
  github: boolean;
  // Media tools
  generate_image: boolean;
  generate_video: boolean;
  // System tools
  memory: boolean;
  model_provider: "anthropic" | "openai" | "google";
  model_id: string;
  image_generation_model?: string;
  video_generation_model?: string;
  visibleModels?: string[];
  // Plan mode
  plan_mode: boolean;
  // Ask mode
  ask_mode: boolean;
}

export function deriveToolPreferences(raw?: any): ThreadToolPreferences {
  const data = raw || {};
  const mappedBrowser = typeof data.browser === "boolean"
    ? Boolean(data.browser)
    : typeof data.browserbase === "boolean"
      ? Boolean(data.browserbase)
      : false;

  const provider = data.model_provider === "openai" ? "openai" : data.model_provider === "google" ? "google" : "anthropic";
  const fallbackModelId = getDefaultModelForProvider(provider);
  const rawModelId = typeof data.model_id === "string" ? data.model_id : fallbackModelId;
  const modelId = getModelById(rawModelId)?.id || fallbackModelId;

  return {
    web_search: data.web_search !== false,
    tiptap_ai: data.tiptap_ai !== false,
    read_file: data.read_file !== false,
    gmail: data.gmail !== false,
    langgraph_mode: true,
    browser: mappedBrowser,
    x_api: data.x_api !== false,
    slack: data.slack !== false,
    // Document editing tools
    sheet_ai: data.sheet_ai !== false,
    docx_ai: data.docx_ai !== false,
    pptx_ai: data.pptx_ai !== false,
    tldraw_ai: data.tldraw_ai !== false,
    document_ai: data.document_ai !== false,
    // File management tools
    create_file: data.create_file !== false,
    create_folder: data.create_folder !== false,
    download_from_url: data.download_from_url !== false,
    search_files: data.search_files !== false,
    // Calendar tools
    calendar: data.calendar !== false,
    msCalendar: data.msCalendar !== false,
    // Development tools
    github: data.github !== false,
    // Media tools
    generate_image: data.generate_image !== false,
    generate_video: data.generate_video !== false,
    // System tools
    memory: data.memory !== false,
    model_provider: provider,
    model_id: modelId,
    image_generation_model: typeof data.image_generation_model === "string" ? data.image_generation_model : "dall-e-3",
    video_generation_model: typeof data.video_generation_model === "string" ? data.video_generation_model : "sora-2",
    visibleModels: Array.isArray(data.visibleModels) ? data.visibleModels : DEFAULT_VISIBLE_MODELS,
    // Plan mode
    plan_mode: Boolean(data.plan_mode),
    // Ask mode
    ask_mode: Boolean(data.ask_mode),
  };
}
