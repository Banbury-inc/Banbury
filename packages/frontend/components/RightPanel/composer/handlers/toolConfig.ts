import {
  Search,
  FileText,
  Mail,
  Chrome,
  MessageSquare,
  Brain,
  FileSpreadsheet,
  File,
  Presentation,
  PenTool,
  FileEdit,
  FolderPlus,
  Download,
  FolderSearch,
  Calendar,
  CalendarDays,
  Map,
  Video,
  Github,
  NotebookText,
  Image,
  Users,
  Cloud,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface ToolConfig {
  key: keyof ComposerToolPreferences;
  label: string;
  icon: LucideIcon;
  iconColor: string;
  defaultEnabled: boolean;
}

export interface ComposerToolPreferences {
  web_search: boolean;
  tiptap_ai: boolean;
  read_file: boolean;
  gmail: boolean;
  langgraph_mode: boolean;
  browser: boolean;
  x_api: boolean;
  slack: boolean;
  teams: boolean;
  onedrive: boolean;
  sheet_ai: boolean;
  docx_ai: boolean;
  pptx_ai: boolean;
  tldraw_ai: boolean;
  document_ai: boolean;
  create_file: boolean;
  create_folder: boolean;
  download_from_url: boolean;
  search_files: boolean;
  calendar: boolean;
  msCalendar: boolean;
  meeting_analysis: boolean;
  map_tools: boolean;
  notion: boolean;
  github: boolean;
  generate_image: boolean;
  generate_video: boolean;
  memory: boolean;
  plan_mode: boolean;
  ask_mode: boolean;
  model_provider: "anthropic" | "openai" | "google";
  model_id?: string;
  image_generation_model?: string;
  video_generation_model?: string;
  visibleModels?: string[];
}

export const toolConfigs: ToolConfig[] = [
  // System tools
  {
    key: "web_search",
    label: "Web Search",
    icon: Search,
    iconColor: "text-gray-400",
    defaultEnabled: true,
  },
  {
    key: "read_file",
    label: "Read File",
    icon: FileText,
    iconColor: "text-blue-500",
    defaultEnabled: true,
  },
  {
    key: "browser",
    label: "Browser",
    icon: Chrome,
    iconColor: "text-green-500",
    defaultEnabled: true,
  },
  {
    key: "memory",
    label: "Memory",
    icon: Brain,
    iconColor: "text-yellow-400",
    defaultEnabled: true,
  },
  // Document editing tools
  {
    key: "tiptap_ai",
    label: "Text Editor",
    icon: FileEdit,
    iconColor: "text-blue-500",
    defaultEnabled: true,
  },
  {
    key: "sheet_ai",
    label: "Spreadsheet",
    icon: FileSpreadsheet,
    iconColor: "text-green-600",
    defaultEnabled: true,
  },
  {
    key: "docx_ai",
    label: "Document",
    icon: File,
    iconColor: "text-blue-600",
    defaultEnabled: true,
  },
  {
    key: "pptx_ai",
    label: "Presentation",
    icon: Presentation,
    iconColor: "text-orange-500",
    defaultEnabled: true,
  },
  {
    key: "tldraw_ai",
    label: "Canvas",
    icon: PenTool,
    iconColor: "text-purple-500",
    defaultEnabled: true,
  },
  {
    key: "document_ai",
    label: "Document Editor",
    icon: FileEdit,
    iconColor: "text-indigo-500",
    defaultEnabled: true,
  },
  // File management tools
  {
    key: "create_file",
    label: "Create File",
    icon: File,
    iconColor: "text-blue-500",
    defaultEnabled: true,
  },
  {
    key: "create_folder",
    label: "Create Folder",
    icon: FolderPlus,
    iconColor: "text-blue-500",
    defaultEnabled: true,
  },
  {
    key: "download_from_url",
    label: "Download from URL",
    icon: Download,
    iconColor: "text-green-500",
    defaultEnabled: true,
  },
  {
    key: "search_files",
    label: "Search Files",
    icon: FolderSearch,
    iconColor: "text-blue-500",
    defaultEnabled: true,
  },
  // Communication tools
  {
    key: "gmail",
    label: "Gmail",
    icon: Mail,
    iconColor: "text-red-500",
    defaultEnabled: true,
  },
  {
    key: "slack",
    label: "Slack",
    icon: MessageSquare,
    iconColor: "text-purple-500",
    defaultEnabled: true,
  },
  {
    key: "teams",
    label: "Microsoft Teams",
    icon: Users,
    iconColor: "text-blue-600",
    defaultEnabled: false,
  },
  {
    key: "onedrive",
    label: "OneDrive",
    icon: Cloud,
    iconColor: "text-blue-500",
    defaultEnabled: false,
  },
  {
    key: "x_api",
    label: "X (Twitter)",
    icon: MessageSquare,
    iconColor: "text-blue-400",
    defaultEnabled: true,
  },
  // Calendar tools
  {
    key: "calendar",
    label: "Google Calendar",
    icon: Calendar,
    iconColor: "text-blue-500",
    defaultEnabled: true,
  },
  {
    key: "msCalendar",
    label: "Microsoft Calendar",
    icon: CalendarDays,
    iconColor: "text-blue-600",
    defaultEnabled: true,
  },
  {
    key: "meeting_analysis",
    label: "Meetings",
    icon: Video,
    iconColor: "text-muted-foreground",
    defaultEnabled: true,
  },
  {
    key: "map_tools",
    label: "Maps",
    icon: Map,
    iconColor: "text-primary",
    defaultEnabled: true,
  },
  // Development tools
  {
    key: "notion",
    label: "Notion",
    icon: NotebookText,
    iconColor: "text-foreground",
    defaultEnabled: true,
  },
  {
    key: "github",
    label: "GitHub",
    icon: Github,
    iconColor: "text-gray-700 dark:text-gray-300",
    defaultEnabled: true,
  },
  // Media tools
  {
    key: "generate_image",
    label: "Generate Image",
    icon: Image,
    iconColor: "text-pink-500",
    defaultEnabled: true,
  },
  {
    key: "generate_video",
    label: "Generate Video",
    icon: Video,
    iconColor: "text-purple-500",
    defaultEnabled: true,
  },
];

