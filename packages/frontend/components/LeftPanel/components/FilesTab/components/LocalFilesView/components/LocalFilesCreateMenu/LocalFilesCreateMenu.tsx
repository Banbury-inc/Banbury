import {
  Plus,
  FilePlus,
  FolderPlus,
  FileText,
  FileSpreadsheet,
  Network,
  Folder,
  FileBarChart,
  FileCode,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger } from "../../../../../../../common/ui/select"
import { Typography } from "../../../../../../../common/ui/typography"
import { LocalFilesViewRef } from "../../../LocalFilesView/LocalFilesView"

interface LocalFilesCreateMenuProps {
  onFileUpload: () => void
  onFolderUpload: () => void
  localFilesViewRef: React.RefObject<LocalFilesViewRef | null>
  onCreateFolder?: () => void
}

export function LocalFilesCreateMenu({
  onFileUpload,
  onFolderUpload,
  localFilesViewRef,
  onCreateFolder,
}: LocalFilesCreateMenuProps) {
  return (
    <Select
      value=""
      onValueChange={(value) => {
        switch (value) {
          case 'upload-file':
            onFileUpload()
            break
          case 'upload-folder':
            onFolderUpload()
            break
          case 'document':
            localFilesViewRef.current?.triggerCreateDocument()
            break
          case 'spreadsheet':
            localFilesViewRef.current?.triggerCreateSpreadsheet()
            break
          case 'canvas':
            localFilesViewRef.current?.triggerCreateTldraw()
            break
          case 'presentation':
            localFilesViewRef.current?.triggerCreatePowerpoint()
            break
          case 'code-file':
            localFilesViewRef.current?.triggerCreateCodeFile()
            break
          case 'folder':
            onCreateFolder?.()
            break
        }
      }}
    >
      <SelectTrigger size="xs" className="bg-accent hover:bg-accent hover:text-accent-foreground flex-shrink-0">
        <Plus className="h-4 w-4 text-accent-foreground" strokeWidth={1} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="upload-file" className="[&_svg]:!text-gray-400">
          <div className="flex items-center">
            <FilePlus size={16} strokeWidth={1} className="mr-2" />
            <Typography variant="xs" className="font-medium">Upload File</Typography>
          </div>
        </SelectItem>
        <SelectItem value="upload-folder" className="[&_svg]:!text-yellow-400">
          <div className="flex items-center">
            <FolderPlus size={16} strokeWidth={1} className="mr-2" />
            <Typography variant="xs" className="font-medium">Upload Folder</Typography>
          </div>
        </SelectItem>
        <SelectItem value="code-file" className="[&_svg]:!text-sky-400">
          <div className="flex items-center">
            <FileCode size={16} strokeWidth={1} className="mr-2" />
            <Typography variant="xs" className="font-medium">Code File</Typography>
          </div>
        </SelectItem>
        <SelectItem value="document" className="[&_svg]:!text-blue-500">
          <div className="flex items-center">
            <FileText size={16} strokeWidth={1} className="mr-2" />
            <Typography variant="xs" className="font-medium">Document</Typography>
          </div>
        </SelectItem>
        <SelectItem value="spreadsheet" className="[&_svg]:!text-green-500">
          <div className="flex items-center">
            <FileSpreadsheet size={16} strokeWidth={1} className="mr-2" />
            <Typography variant="xs" className="font-medium">Spreadsheet</Typography>
          </div>
        </SelectItem>
        <SelectItem value="canvas" className="[&_svg]:!text-purple-400">
          <div className="flex items-center">
            <Network size={16} strokeWidth={1} className="mr-2" />
            <Typography variant="xs" className="font-medium">Canvas</Typography>
          </div>
        </SelectItem>
        <SelectItem value="presentation" className="[&_svg]:!text-orange-400">
          <div className="flex items-center">
            <FileBarChart size={16} strokeWidth={1} className="mr-2" />
            <Typography variant="xs" className="font-medium">Presentation</Typography>
          </div>
        </SelectItem>
        <SelectItem value="folder" className="[&_svg]:!text-yellow-400">
          <div className="flex items-center">
            <Folder size={16} strokeWidth={1} className="mr-2" />
            <Typography variant="xs" className="font-medium">Folder</Typography>
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  )
}
