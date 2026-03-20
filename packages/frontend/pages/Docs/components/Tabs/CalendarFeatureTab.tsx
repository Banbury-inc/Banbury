import Image from 'next/image'
import DocPageLayout from '../DocPageLayout'
import { Card } from '../../../../components/common/ui/card'
import { Typography } from '../../../../components/common/ui/typography'
const calendarDemo = require('../../../../assets/images/calendar_demo.mp4')

export default function CalendarFeatureTab() {
  return (
    <DocPageLayout>
      <div>
        <Typography variant="h2" className="mb-3">
          Calendar
        </Typography>

        <Typography variant="p" className="mb-6">
          Banbury's calendar integration allows you to seamlessly manage your schedule through natural conversation.
          Connect your calendar to enable Banbury to view, create, and modify events on your behalf.
        </Typography>

        <div className="mb-4">
          <Typography variant="h4" className="mb-2">
            <strong>Visibility:</strong>
          </Typography>
          <Typography variant="list">
            <li>Banbury can read and understand your calendar contents, including event details, schedules, and availability.</li>
            <li>Ask questions like "What's on my calendar today?" or "When is my next meeting?" to get instant insights.</li>
            <li>Banbury can help identify conflicts, suggest optimal meeting times, and provide schedule summaries.</li>
          </Typography>
        </div>

        <div className="mb-5">
          <Typography variant="h4" className="mb-2">
            <strong>Actions - Banbury can:</strong>
          </Typography>
          <Typography variant="list">
            <li><strong>Create new events:</strong> Simply tell Banbury when and what you'd like to schedule, and it will create the event with all necessary details including title, time, location, and attendees.</li>
            <li><strong>Search and find events:</strong> Quickly locate specific meetings or events by asking about dates, attendees, or topics.</li>
            <li><strong>Edit existing events:</strong> Modify event details like time, location, or description through simple requests.</li>
            <li><strong>Manage availability:</strong> Check free time slots and coordinate scheduling across multiple calendars.</li>
          </Typography>
        </div>

        <Card className="relative mb-5 overflow-hidden rounded-2xl p-6">
          <Typography variant="h4" className="mb-3">
            Demo: Calendar in Action
          </Typography>
          <div className="relative min-h-[300px] w-full overflow-hidden rounded-xl">
            <video
              src={calendarDemo}
              controls
              muted
              playsInline
              className="h-full w-full rounded-xl object-cover"
            />
          </div>
        </Card>

        <div className="mb-5">
          <Typography variant="h4" className="mb-3">
            Creating Calendar Events with AI
          </Typography>
          <Typography variant="p" className="mb-3">
            Traditionally, you can create a calendar event manually from the left panel.
            With Banbury, you simply have a conversation - tell Banbury what you need, and it creates the event for you:
          </Typography>
          <div className="mb-3 overflow-hidden rounded-xl border border-border">
            <Image
              src="/create-calendar-event.png"
              alt="Traditional calendar event creation form"
              width={1200}
              height={800}
              className="block h-auto w-full"
            />
          </div>
          <Typography variant="p" className="mb-3">
            <strong>Instead of manually filling out forms</strong>, just chat with Banbury and it will create the event for you automatically:
          </Typography>
          <Card className="rounded-2xl p-6">
            <Typography variant="p" className="mb-2 italic">
              💬 "Schedule a team meeting next Tuesday at 2 PM for 1 hour"
            </Typography>
            <Typography variant="p" className="mb-2 italic">
              💬 "Create a lunch appointment with Sarah tomorrow at noon"
            </Typography>
            <Typography variant="p" className="italic">
              💬 "Block my calendar for focus time every morning from 9-11"
            </Typography>
          </Card>
          <Typography variant="p" className="mt-3">
            Banbury understands your request, fills in all the necessary details, and creates the event instantly - no forms, no clicking through menus.
          </Typography>
        </div>

        <div className="mb-4">
          <Typography variant="h4" className="mb-3">
            Editing Calendar Events with AI
          </Typography>
          <Typography variant="p" className="mb-3">
            Normally, you can edit an event manually by clickong on the event and then editing the event details.
            With Banbury, you simply have a conversation - tell Banbury what you need, and it edits the event for you:
          </Typography>
          <div className="mb-3 overflow-hidden rounded-xl border border-border">
            <Image
              src="/edit-calendar-event.png"
              alt="Traditional calendar event editing form"
              width={1200}
              height={800}
              className="block h-auto w-full"
            />
          </div>
          <Typography variant="p" className="mb-3">
            <strong>Instead of manually filling out forms</strong>, just chat with Banbury and it will edit the event for you automatically:
          </Typography>
          <Card className="rounded-2xl p-6">
            <Typography variant="p" className="mb-2 italic">
              💬 "Move my 3 PM meeting to 4 PM tomorrow"
            </Typography>
            <Typography variant="p" className="mb-2 italic">
              💬 "Change the location of tomorrow's standup to the conference room"
            </Typography>
            <Typography variant="p" className="italic">
              💬 "Update the client meeting description to include the project proposal and add Sarah as a co-host"
            </Typography>
          </Card>
          <Typography variant="p" className="mt-3">
            Banbury understands your request, fills in all the necessary details, and edits the event instantly - no forms, no clicking through menus.
          </Typography>
        </div>
      </div>
    </DocPageLayout>
  )
}
