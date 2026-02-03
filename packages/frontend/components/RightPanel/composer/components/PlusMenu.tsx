import { Plus, Paperclip, Image, Video, Upload, Wrench, Check } from "lucide-react"
import { Button } from "../../../common/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "../../../common/ui/dropdown-menu"
import { Typography } from "@/components/common/ui/typography"
import { FileAttachmentPicker } from "./file-attachment-picker"
import { handleLocalFileUpload } from "../../../handlers/handle-local-file-upload"
import { toolConfigs } from "../handlers/toolConfig"
import {
  toggleToolPreference,
  setImageGenerationModel,
  setVideoGenerationModel,
  IMAGE_GENERATION_MODELS,
  VIDEO_GENERATION_MODELS
} from "../handlers/composer-plus-menu-handlers"
import type { ComposerToolPreferences } from "../Composer"
import type { FileSystemItem } from "../../../../utils/fileTreeUtils"
import type { FC } from "react"

interface PlusMenuProps {
  isMeasuring: boolean
  isVisible: boolean
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  userInfo: {
    username: string
    email?: string
  } | null
  toolPreferences: ComposerToolPreferences
  onUpdateToolPreferences: (prefs: ComposerToolPreferences) => void
  onFileAttach: (file: FileSystemItem) => void
  onAttachmentPayload: (fileId: string, payload: { fileData: string; mimeType: string }) => void
}

export const PlusMenu: FC<PlusMenuProps> = ({
  isMeasuring,
  isVisible,
  isOpen,
  onOpenChange,
  userInfo,
  toolPreferences,
  onUpdateToolPreferences,
  onFileAttach,
  onAttachmentPayload,
}) => {
  if (!isMeasuring && !isVisible) {
    return null
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="primary"
          size="xs"
          className="h-7 w-7 flex-shrink-0"
          title="More actions"
          aria-label="More actions"
        >
          <Plus height={16} width={16} strokeWidth={1} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        side="top" 
        align="start"
        className="w-48"
      >
        {/* Attach File Submenu */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Paperclip className="mr-2 h-4 w-4" />
            <Typography variant="xs">Attach file</Typography>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="p-0">
            <FileAttachmentPicker
              onFileAttach={(file) => {
                onFileAttach(file)
                onOpenChange(false)
              }}
              userInfo={userInfo}
              isOpen={isOpen}
            />
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {/* Upload Local File */}
        <DropdownMenuItem
          onClick={() => {
            handleLocalFileUpload({
              userInfo,
              onFileAttach,
              onAttachmentPayload,
              onError: (error) => console.error('Upload error:', error),
              onSuccess: () => {}
            })
            onOpenChange(false)
          }}
        >
          <Upload className="mr-2 h-4 w-4" />
          <Typography variant="xs">Upload file</Typography>
        </DropdownMenuItem>

        {/* Image Model Submenu */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Image className="mr-2 h-4 w-4" aria-label="Image generation model icon" />
            <Typography variant="xs">Image model</Typography>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-56 p-1">
            {IMAGE_GENERATION_MODELS.map((model) => {
              const isSelected = (toolPreferences.image_generation_model || 'dall-e-3') === model.id
              return (
                <div
                  key={model.id}
                  className="relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground"
                  onClick={() => {
                    onUpdateToolPreferences(setImageGenerationModel(toolPreferences, model.id))
                  }}
                >
                  <span className="absolute right-2 flex size-3.5 items-center justify-center">
                    {isSelected && <Check className="size-4" />}
                  </span>
                  <div className="flex flex-col">
                    <Typography variant="xs" className="font-medium">{model.name}</Typography>
                    <Typography variant="xs" className="text-xs text-muted-foreground">{model.description}</Typography>
                  </div>
                </div>
              )
            })}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {/* Video Model Submenu */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Video className="mr-2 h-4 w-4" />
            <Typography variant="xs">Video model</Typography>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-56 p-1">
            {VIDEO_GENERATION_MODELS.map((model) => {
              const isSelected = (toolPreferences.video_generation_model || 'sora-2') === model.id
              return (
                <div
                  key={model.id}
                  className="relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground"
                  onClick={() => {
                    onUpdateToolPreferences(setVideoGenerationModel(toolPreferences, model.id))
                  }}
                >
                  <span className="absolute right-2 flex size-3.5 items-center justify-center">
                    {isSelected && <Check className="size-4" />}
                  </span>
                  <div className="flex flex-col">
                    <Typography variant="xs" className="font-medium">{model.name}</Typography>
                    <Typography variant="xs" className="text-xs text-muted-foreground">{model.description}</Typography>
                  </div>
                </div>
              )
            })}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        {/* Tools Submenu */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Wrench className="mr-2 h-4 w-4" />
            <Typography variant="xs">Tools</Typography>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-72 p-1 max-h-96 overflow-y-auto">
            {toolConfigs.map((tool) => {
              const Icon = tool.icon
              const isEnabled = (toolPreferences[tool.key] as boolean) ?? tool.defaultEnabled
              
              return (
                <div
                  key={tool.key}
                  className="relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground"
                  onClick={() => {
                    const toolKey = tool.key as keyof ComposerToolPreferences
                    if (typeof toolPreferences[toolKey] === 'boolean') {
                      onUpdateToolPreferences(
                        toggleToolPreference(toolPreferences, toolKey, isEnabled)
                      )
                    }
                  }}
                >
                  <span className="absolute right-2 flex size-3.5 items-center justify-center">
                    {isEnabled && <Check className="size-4" />}
                  </span>
                  <div className="flex items-center">
                    <Icon size={16} strokeWidth={1} className={`mr-2 ${tool.iconColor}`} />
                    <Typography variant="xs" className="text-xs font-medium">
                      {tool.label}
                    </Typography>
                  </div>
                </div>
              )
            })}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
