import ToolCallCard from "./ToolCallCard"

interface OneDriveToolProps {
  toolName: string
  argsText?: string
  args?: unknown
  result?: unknown
}

const oneDriveToolLabels: Record<string, string> = {
  onedrive_status: "OneDrive - Status",
  onedrive_list_root: "OneDrive - List Root",
  onedrive_list_folder: "OneDrive - List Folder",
  onedrive_search: "OneDrive - Search",
  onedrive_get_item: "OneDrive - Get Item",
  onedrive_download_file: "OneDrive - Download File",
  onedrive_upload_text_file: "OneDrive - Upload Text File",
  onedrive_update_text_file: "OneDrive - Update Text File",
  onedrive_create_folder: "OneDrive - Create Folder",
  onedrive_rename_move: "OneDrive - Rename or Move",
  onedrive_delete_item: "OneDrive - Delete Item",
  onedrive_create_share_link: "OneDrive - Create Share Link",
  onedrive_invite: "OneDrive - Invite",
  onedrive_get_permissions: "OneDrive - Get Permissions",
}

export const oneDriveToolNames = Object.keys(oneDriveToolLabels)

function getArgsText(argsText?: string, args?: unknown) {
  if (argsText) return argsText

  try {
    return JSON.stringify(args ?? {})
  } catch {
    return "{}"
  }
}

export function getOneDriveToolLabel(toolName: string) {
  return oneDriveToolLabels[toolName] || toolName
}

export function OneDriveTool({ toolName, argsText, args, result }: OneDriveToolProps) {
  return (
    <ToolCallCard
      toolName={toolName}
      argsText={getArgsText(argsText, args)}
      result={result}
      label={getOneDriveToolLabel(toolName)}
    />
  )
}

export default OneDriveTool
