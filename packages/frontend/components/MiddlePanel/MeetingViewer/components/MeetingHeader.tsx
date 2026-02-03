import { ArrowLeft } from "lucide-react"
import { Button } from "../../../common/ui/button"
import { Typography } from "../../../common/ui/typography"
import { MeetingSession } from "../../../../types/meeting-types"
import { formatDate, getMeetingDate } from "../utils/date-formatters"

interface MeetingHeaderProps {
  meeting: MeetingSession & { createdAt?: string | Date }
  onBack?: () => void
}

export function MeetingHeader({ meeting, onBack }: MeetingHeaderProps) {
  return (
    <div className="flex items-center justify-between px-3 py-3 bg-card border-b border-border">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {onBack && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onBack}
            className="flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <div className="flex-1 min-w-0">
          <Typography variant="h4" className="truncate">
            {meeting.title || formatDate(getMeetingDate(meeting))}
          </Typography>
        </div>
      </div>
    </div>
  )
}
