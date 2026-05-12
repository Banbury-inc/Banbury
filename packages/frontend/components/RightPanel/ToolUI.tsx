import React from 'react';
import { ToolCallCard } from './composer/components/ToolCallCard';
import { SheetAITool } from './composer/components/SheetAITool';
import { DocxAITool } from './composer/components/DocxAITool';
import { PptxAITool } from './composer/components/PptxAITool';
import { WebSearchTool } from './composer/components/web-search-result';
import { TavilyExtractTool } from './composer/components/tavily-extract-result';
import { TavilyCrawlTool } from './composer/components/tavily-crawl-result';
import { TavilyMapTool } from './composer/components/tavily-map-result';
import { TavilyResearchTool } from './composer/components/tavily-research-result';
import { TavilyUsageTool } from './composer/components/tavily-usage-result';
import { TiptapAITool } from './composer/components/TiptapAITool';
import { DocumentAITool } from './composer/components/DocumentAITool';
import { BrowserTool } from './composer/components/BrowserTool';
import { ToolFallback } from './composer/components/tool-fallback';
import { TldrawAITool } from './composer/components/TldrawAITool';
import { SubagentTool } from './composer/components/SubagentTool';
import { CreateFileTool } from './composer/components/CreateFileTool';
import { DownloadFileTool } from './composer/components/DownloadFileTool';
import { CodeEditTool } from './composer/components/CodeEditTool';
import { getOneDriveToolLabel, OneDriveTool, oneDriveToolNames } from './composer/components/OneDriveTool';

interface ToolUIProps {
  toolName: string;
  toolCallId?: string;
  args?: any;
  argsText?: string;
  result?: any;
}

export const ToolUI: React.FC<ToolUIProps> = ({ toolName, toolCallId, args: argsProp, argsText, result }) => {
  // Parse argsText to args if args is not provided (assistant-ui passes argsText)
  const args = React.useMemo(() => {
    if (argsProp) return argsProp;
    if (!argsText) return {};
    try {
      return JSON.parse(argsText);
    } catch {
      return {};
    }
  }, [argsProp, argsText]);

  // Map tool names to their respective UI components
  switch (toolName) {
    case 'sheet_ai':
      return <SheetAITool args={args} />;
    
    case 'docx_ai':
      return <DocxAITool args={args} />;
    
    case 'tldraw_ai':
      return <TldrawAITool args={args} />;
    
    case 'pptx_ai':
      return <PptxAITool args={args} />;
    
    case 'web_search':
      return <WebSearchTool toolName={toolName} toolCallId={toolCallId} args={args} argsText={argsText || JSON.stringify(args)} result={result} />;

    case 'web_extract':
      return <TavilyExtractTool toolName={toolName} toolCallId={toolCallId} args={args} argsText={argsText || JSON.stringify(args)} result={result} />;

    case 'web_crawl':
      return <TavilyCrawlTool toolName={toolName} toolCallId={toolCallId} args={args} argsText={argsText || JSON.stringify(args)} result={result} />;

    case 'web_map':
      return <TavilyMapTool toolName={toolName} toolCallId={toolCallId} args={args} argsText={argsText || JSON.stringify(args)} result={result} />;

    case 'web_research':
    case 'web_get_research':
      return <TavilyResearchTool toolName={toolName} toolCallId={toolCallId} args={args} argsText={argsText || JSON.stringify(args)} result={result} />;

    case 'web_usage':
      return <TavilyUsageTool toolName={toolName} toolCallId={toolCallId} args={args} argsText={argsText || JSON.stringify(args)} result={result} />;

    case 'tiptap_ai':
      return <TiptapAITool args={args} />;
    
    case 'document_ai':
      return <DocumentAITool args={args} />;
    
    case 'stagehand_create_session':
    case 'stagehand_goto':
    case 'stagehand_observe':
    case 'stagehand_act':
    case 'stagehand_extract':
    case 'stagehand_close':
      return <BrowserTool toolName={toolName} args={args} result={result} />;
    
    // Gmail tools
    case 'gmail_get_recent':
    case 'gmail_search':
    case 'gmail_get_message':
    case 'gmail_send_message':
    case 'gmail_label_email':
      return (
        <ToolCallCard
          toolName={toolName}
          argsText={JSON.stringify(args)}
          result={result}
          label={getToolLabel(toolName)}
        />
      );
    
    // Calendar tools
    case 'calendar_list_events':
    case 'calendar_get_event':
    case 'calendar_create_event':
    case 'calendar_update_event':
    case 'calendar_delete_event':
      return (
        <ToolCallCard
          toolName={toolName}
          argsText={JSON.stringify(args)}
          result={result}
          label={getToolLabel(toolName)}
        />
      );
    
    // X (Twitter) API tools
    case 'x_api_get_user_info':
    case 'x_api_get_user_tweets':
    case 'x_api_search_tweets':
    case 'x_api_get_trending_topics':
    case 'x_api_post_tweet':
      return (
        <ToolCallCard
          toolName={toolName}
          argsText={JSON.stringify(args)}
          result={result}
          label={getToolLabel(toolName)}
        />
      );
    
    // Slack tools
    case 'slack_list_channels':
    case 'slack_send_message':
    case 'slack_get_channel_history':
    case 'slack_get_thread_replies':
    case 'slack_search_messages':
    case 'slack_get_user_info':
    case 'slack_set_channel_topic':
    case 'slack_add_reaction':
      return (
        <ToolCallCard
          toolName={toolName}
          argsText={JSON.stringify(args)}
          result={result}
          label={getToolLabel(toolName)}
        />
      );

    // Microsoft Teams tools
    case 'ms_teams_list_teams':
    case 'ms_teams_list_channels':
    case 'ms_teams_list_channel_messages':
    case 'ms_teams_get_channel_message':
    case 'ms_teams_send_channel_message':
    case 'ms_teams_list_message_replies':
    case 'ms_teams_reply_to_message':
    case 'ms_teams_list_members':
    case 'ms_teams_list_chats':
      return (
        <ToolCallCard
          toolName={toolName}
          argsText={JSON.stringify(args)}
          result={result}
          label={getToolLabel(toolName)}
        />
      );

    // OneDrive tools
    case 'onedrive_status':
    case 'onedrive_list_root':
    case 'onedrive_list_folder':
    case 'onedrive_search':
    case 'onedrive_get_item':
    case 'onedrive_download_file':
    case 'onedrive_upload_text_file':
    case 'onedrive_update_text_file':
    case 'onedrive_create_folder':
    case 'onedrive_rename_move':
    case 'onedrive_delete_item':
    case 'onedrive_create_share_link':
    case 'onedrive_invite':
    case 'onedrive_get_permissions':
      return <OneDriveTool toolName={toolName} args={args} argsText={argsText} result={result} />;
    
    // Memory tools
    case 'store_memory':
    case 'search_memory':
      return (
        <ToolCallCard
          toolName={toolName}
          argsText={JSON.stringify(args)}
          result={result}
          label={getToolLabel(toolName)}
        />
      );
    
    // File tools
    case 'create_file':
      return <CreateFileTool args={args} result={result} />;
    
    case 'download_from_url':
      return <DownloadFileTool args={args} result={result} />;

    case 'code_edit_open_file':
      return <CodeEditTool args={args} result={result} />;
    
    case 'search_files':
      return (
        <ToolCallCard
          toolName={toolName}
          argsText={JSON.stringify(args)}
          result={result}
          label={getToolLabel(toolName)}
        />
      );
    
    // Image generation
    case 'generate_image':
      return (
        <ToolCallCard
          toolName={toolName}
          argsText={JSON.stringify(args)}
          result={result}
          label={getToolLabel(toolName)}
        />
      );
    
    // DateTime tool
    case 'get_current_datetime':
      return (
        <ToolCallCard
          toolName={toolName}
          argsText={JSON.stringify(args)}
          result={result}
          label={getToolLabel(toolName)}
        />
      );
    
    // Multi-agent tool
    case 'spawn_subagents':
      return <SubagentTool args={args} result={result} />;
    
    default:
      return <ToolFallback toolName={toolName} args={args} result={result} />;
  }
};

function getToolLabel(toolName: string): string {
  const labels: Record<string, string> = {
    'sheet_ai': 'AI Spreadsheet',
    'docx_ai': 'AI Document',
    'pptx_ai': 'AI Presentation',
    'tldraw_ai': 'AI Canvas',
    'web_search': 'Web Search',
    'tiptap_ai': 'AI Text Editor',
    'document_ai': 'AI Document',
    'gmail_get_recent': 'Gmail - Get Recent',
    'gmail_search': 'Gmail - Search',
    'gmail_get_message': 'Gmail - Get Message',
    'gmail_send_message': 'Gmail - Send',
    'gmail_label_email': 'Gmail - Label Email',
    'calendar_list_events': 'Calendar - List Events',
    'calendar_get_event': 'Calendar - Get Event',
    'calendar_create_event': 'Calendar - Create Event',
    'calendar_update_event': 'Calendar - Update Event',
    'calendar_delete_event': 'Calendar - Delete Event',
    'x_api_get_user_info': 'X - Get User Info',
    'x_api_get_user_tweets': 'X - Get Tweets',
    'x_api_search_tweets': 'X - Search Tweets',
    'x_api_get_trending_topics': 'X - Trending Topics',
    'x_api_post_tweet': 'X - Post Tweet',
    'slack_list_channels': 'Slack - List Channels',
    'slack_send_message': 'Slack - Send Message',
    'slack_get_channel_history': 'Slack - Get History',
    'slack_get_thread_replies': 'Slack - Get Thread',
    'slack_search_messages': 'Slack - Search',
    'slack_get_user_info': 'Slack - Get User Info',
    'slack_set_channel_topic': 'Slack - Set Topic',
    'slack_add_reaction': 'Slack - Add Reaction',
    'ms_teams_list_teams': 'Teams - List Teams',
    'ms_teams_list_channels': 'Teams - List Channels',
    'ms_teams_list_channel_messages': 'Teams - List Messages',
    'ms_teams_get_channel_message': 'Teams - Get Message',
    'ms_teams_send_channel_message': 'Teams - Send Message',
    'ms_teams_list_message_replies': 'Teams - List Replies',
    'ms_teams_reply_to_message': 'Teams - Reply',
    'ms_teams_list_members': 'Teams - List Members',
    'ms_teams_list_chats': 'Teams - List Chats',
    'store_memory': 'Store Memory',
    'search_memory': 'Search Memory',
    'create_file': 'Create File',
    'download_from_url': 'Download File',
    'code_edit_open_file': 'Code Edit Proposal',
    'search_files': 'Search Files',
    'generate_image': 'Generate Image',
    'get_current_datetime': 'Get Date/Time',
    'stagehand_create_session': 'Browser - Create Session',
    'stagehand_goto': 'Browser - Navigate',
    'stagehand_observe': 'Browser - Observe',
    'stagehand_act': 'Browser - Act',
    'stagehand_extract': 'Browser - Extract',
    'stagehand_close': 'Browser - Close',
    'spawn_subagents': 'Multi-Agent Execution',
  };

  if (oneDriveToolNames.includes(toolName)) return getOneDriveToolLabel(toolName);

  return labels[toolName] || toolName;
}

export default ToolUI;
