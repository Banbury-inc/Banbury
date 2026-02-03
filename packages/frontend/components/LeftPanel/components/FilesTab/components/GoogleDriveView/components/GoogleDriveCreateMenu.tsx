import {
  Plus,
  FileText,
  FileSpreadsheet,
  FileBarChart,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger } from "../../../../../../common/ui/select"
import { Typography } from "../../../../../../common/ui/typography"

interface GoogleDriveCreateMenuProps {
  onCreateDocument: () => void
  onCreateSpreadsheet: () => void
  onCreatePowerpoint: () => void
}

export function GoogleDriveCreateMenu({
  onCreateDocument,
  onCreateSpreadsheet,
  onCreatePowerpoint,
}: GoogleDriveCreateMenuProps) {
  return (
    <Select
      value=""
      onValueChange={(value) => {
        switch (value) {
          case 'document':
            onCreateDocument()
            break
          case 'spreadsheet':
            onCreateSpreadsheet()
            break
          case 'presentation':
            onCreatePowerpoint()
            break
        }
      }}
    >
      <SelectTrigger size="xs" className="bg-accent hover:bg-accent hover:text-accent-foreground flex-shrink-0">
        <Plus className="h-4 w-4 text-accent-foreground" strokeWidth={1} />
      </SelectTrigger>
      <SelectContent>
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
        <SelectItem value="presentation" className="[&_svg]:!text-orange-400">
          <div className="flex items-center">
            <FileBarChart size={16} strokeWidth={1} className="mr-2" />
            <Typography variant="xs" className="font-medium">Presentation</Typography>
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  )
}
