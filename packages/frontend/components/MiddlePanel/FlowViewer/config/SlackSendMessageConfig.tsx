'use client'

import { useState, useEffect, useCallback } from 'react'
import { Label } from '../../../common/ui/label'
import { Textarea } from '../../../common/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../common/ui/select'
import { ApiService } from '../../../../../backend/api/apiService'
import { SlackSendMessageNodeData } from '../nodes/SlackSendMessageNode'

interface SlackChannel {
  id: string
  name: string
}

interface Props {
  data: SlackSendMessageNodeData
  onChange: (data: Partial<SlackSendMessageNodeData>) => void
}

export function SlackSendMessageConfig({ data, onChange }: Props) {
  const [channels, setChannels] = useState<SlackChannel[]>([])
  const [loadingChannels, setLoadingChannels] = useState(false)

  const loadChannels = useCallback(async () => {
    setLoadingChannels(true)
    try {
      const result = await ApiService.get<{ success: boolean; channels?: SlackChannel[] }>('/slack/channels/')
      if (result.success && result.channels) setChannels(result.channels)
    } catch {
      // Slack may not be connected — channels stays empty
    } finally {
      setLoadingChannels(false)
    }
  }, [])

  useEffect(() => { loadChannels() }, [loadChannels])

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs">Channel</Label>
        {channels.length > 0 ? (
          <Select
            value={data.channel ?? ''}
            onValueChange={val => onChange({ channel: val })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder={loadingChannels ? 'Loading…' : 'Select channel'} />
            </SelectTrigger>
            <SelectContent>
              {channels.map(c => (
                <SelectItem key={c.id} value={c.name} className="text-xs">#{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <input
            className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder={loadingChannels ? 'Loading channels…' : '#general'}
            value={data.channel ?? ''}
            onChange={e => onChange({ channel: e.target.value })}
          />
        )}
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">
          Message Template
          <span className="text-muted-foreground font-normal ml-1">(use {'{{field}}'} for variables)</span>
        </Label>
        <Textarea
          className="text-xs min-h-[100px] resize-y"
          placeholder={"Hello {{name}}, your report is ready."}
          value={data.messageTemplate ?? ''}
          onChange={e => onChange({ messageTemplate: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Variables reference fields from the connected input node, e.g. {'{{row.email}}'} or {'{{result.name}}'}.
        </p>
      </div>
    </div>
  )
}
