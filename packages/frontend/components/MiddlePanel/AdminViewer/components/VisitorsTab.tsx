import { Button } from '../../../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../ui/card'
import { 
  getTotalPages, 
  getPageSlice, 
  nextPage as nextVisitorPage, 
  prevPage as prevVisitorPage, 
  canGoNext, 
  canGoPrev, 
  clampPage 
} from '../../../../pages/handlers/adminVisitors'

interface VisitorData {
  _id: string
  ip_address: string
  time: string
  city: string
  region: string
  country: string
  path?: string
  client_timestamp?: string
  page_title?: string
  referrer_source?: string
  campaign_id?: string
  content_type?: string
  user_agent?: string
  device_type?: string
  tracking_version?: string
}

interface VisitorsTabProps {
  visitorData: VisitorData[]
  visitorLoading: boolean
  visitorPage: number
  setVisitorPage: (page: number) => void
  visitorPageSize: number
  convertToEasternTime: (timestamp: string) => string
  visitorIpExclusions: string[]
  visitorIpInput: string
  setVisitorIpInput: (value: string) => void
  visitorLocationExclusions: string[]
  visitorLocationInput: string
  setVisitorLocationInput: (value: string) => void
  visitorLocationFilter: string
  setVisitorLocationFilter: (value: string) => void
  getFilteredVisitors: () => VisitorData[]
  addIpExclusion: () => void
  removeIpExclusion: (ip: string) => void
  addLocationExclusion: () => void
  removeLocationExclusion: (location: string) => void
  clearAllFilters: () => void
}

export function VisitorsTab({
  visitorData,
  visitorLoading,
  visitorPage,
  setVisitorPage,
  visitorPageSize,
  convertToEasternTime,
  visitorIpExclusions,
  visitorIpInput,
  setVisitorIpInput,
  visitorLocationExclusions,
  visitorLocationInput,
  setVisitorLocationInput,
  visitorLocationFilter,
  setVisitorLocationFilter,
  getFilteredVisitors,
  addIpExclusion,
  removeIpExclusion,
  addLocationExclusion,
  removeLocationExclusion,
  clearAllFilters
}: VisitorsTabProps) {

  // Helper functions to parse browser and OS from user agent
  const parseBrowser = (userAgent?: string): string => {
    if (!userAgent || userAgent === 'Unknown') return 'Unknown'
    const ua = userAgent.toLowerCase()
    if (ua.includes('chrome') && !ua.includes('edg')) return 'Chrome'
    if (ua.includes('firefox')) return 'Firefox'
    if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari'
    if (ua.includes('edg') || ua.includes('edge')) return 'Edge'
    if (ua.includes('opera') || ua.includes('opr')) return 'Opera'
    if (ua.includes('msie') || ua.includes('trident')) return 'Internet Explorer'
    if (ua.includes('samsung')) return 'Samsung Internet'
    return 'Other'
  }

  const parseOS = (userAgent?: string): string => {
    if (!userAgent || userAgent === 'Unknown') return 'Unknown'
    const ua = userAgent.toLowerCase()
    if (ua.includes('windows')) {
      if (ua.includes('windows nt 10')) return 'Windows 10/11'
      if (ua.includes('windows nt 6.3')) return 'Windows 8.1'
      if (ua.includes('windows nt 6.2')) return 'Windows 8'
      if (ua.includes('windows nt 6.1')) return 'Windows 7'
      return 'Windows'
    }
    if (ua.includes('mac os x') || ua.includes('macintosh')) return 'macOS'
    if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) return 'iOS'
    if (ua.includes('android')) return 'Android'
    if (ua.includes('linux')) return 'Linux'
    if (ua.includes('ubuntu')) return 'Ubuntu'
    return 'Other'
  }


  return (
    <div className="space-y-6">
      <Card className="bg-card border-zinc-200 dark:border-white/[0.06]">
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-foreground">Recent Visitors</CardTitle>
              <CardDescription className="text-muted-foreground">
                Latest site visitors with location data
                {(visitorIpExclusions.length > 0 || visitorLocationExclusions.length > 0 || visitorLocationFilter) && ' (filtered)'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {(() => {
                const filteredVisitors = getFilteredVisitors()
                const totalPages = getTotalPages({ totalItems: filteredVisitors.length, pageSize: visitorPageSize })
                const currentPage = clampPage({ page: visitorPage, totalPages })
                return (
                  <>
                    <span className="text-muted-foreground text-xs hidden md:inline">
                      Page {currentPage} of {totalPages} • {filteredVisitors.length} total
                      {(visitorIpExclusions.length > 0 || visitorLocationExclusions.length > 0 || visitorLocationFilter) && ` (filtered from ${visitorData.length})`}
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setVisitorPage(prevVisitorPage({ page: currentPage }))}
                      disabled={!canGoPrev({ page: currentPage })}
                      className="border-zinc-200 dark:border-white/[0.06]"
                    >
                      Prev
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setVisitorPage(nextVisitorPage({ page: currentPage, totalPages }))}
                      disabled={!canGoNext({ page: currentPage, totalPages })}
                      className="border-zinc-200 dark:border-white/[0.06]"
                    >
                      Next
                    </Button>
                  </>
                )
              })()}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {visitorLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          ) : visitorData.length > 0 ? (
            <>
              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {(() => {
                  const filteredVisitors = getFilteredVisitors()
                  const totalPages = getTotalPages({ totalItems: filteredVisitors.length, pageSize: visitorPageSize })
                  const currentPage = clampPage({ page: visitorPage, totalPages })
                  const paged = getPageSlice({ items: filteredVisitors, page: currentPage, pageSize: visitorPageSize })
                  return paged
                })().map((visitor) => (
                  <Card key={visitor._id} className="bg-card border-zinc-200 dark:border-white/[0.06]">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="text-foreground font-medium text-sm truncate" title={visitor.page_title || visitor.path || 'Unknown'}>
                            {visitor.page_title || (visitor.path ? visitor.path.split('?')[0] : 'Unknown')}
                          </div>
                          {visitor.path && visitor.path !== visitor.page_title && (
                            <div className="text-muted-foreground text-xs font-mono truncate mt-0.5" title={visitor.path}>
                              {visitor.path}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          {visitor.referrer_source && (
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              visitor.referrer_source === 'twitter' ? 'bg-blue-900/50 text-blue-300' :
                              visitor.referrer_source === 'facebook' ? 'bg-blue-800/50 text-blue-200' :
                              visitor.referrer_source === 'google' ? 'bg-green-900/50 text-green-300' :
                              visitor.referrer_source === 'linkedin' ? 'bg-purple-900/50 text-purple-300' :
                              'bg-muted/50 text-muted-foreground'
                            }`}>
                              {visitor.referrer_source}
                            </span>
                          )}
                          {visitor.content_type && (
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              visitor.content_type === 'landing_page' ? 'bg-green-900/50 text-green-300' :
                              visitor.content_type === 'dashboard' ? 'bg-blue-900/50 text-blue-300' :
                              visitor.content_type === 'auth_page' ? 'bg-yellow-900/50 text-yellow-300' :
                              visitor.content_type === 'features_page' ? 'bg-purple-900/50 text-purple-300' :
                              visitor.content_type.startsWith('documentation -') ? 'bg-cyan-900/50 text-cyan-300' :
                              'bg-muted/50 text-muted-foreground'
                            }`}>
                              {visitor.content_type.replace('_', ' ')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-200 dark:border-white/[0.04]">
                        <div>
                          <div className="text-muted-foreground text-xs">IP Address</div>
                          <div className="text-foreground font-mono text-xs truncate">{visitor.ip_address}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground text-xs">Location</div>
                          <div className="text-foreground text-xs">{visitor.city}</div>
                          <div className="text-muted-foreground text-xs">{visitor.region}, {visitor.country}</div>
                        </div>
                        {visitor.device_type && (
                          <div>
                            <div className="text-muted-foreground text-xs">Device</div>
                            <div className="text-foreground text-xs capitalize">{visitor.device_type}</div>
                          </div>
                        )}
                        <div>
                          <div className="text-muted-foreground text-xs">Browser</div>
                          <div className="text-foreground text-xs">{parseBrowser(visitor.user_agent)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground text-xs">OS</div>
                          <div className="text-foreground text-xs">{parseOS(visitor.user_agent)}</div>
                        </div>
                        {visitor.campaign_id && (
                          <div className="col-span-2">
                            <div className="text-muted-foreground text-xs">Campaign</div>
                            <div className="text-foreground font-mono text-xs truncate" title={visitor.campaign_id}>
                              {visitor.campaign_id.length > 30 ? `${visitor.campaign_id.substring(0, 30)}...` : visitor.campaign_id}
                            </div>
                          </div>
                        )}
                        <div className="col-span-2">
                          <div className="text-muted-foreground text-xs">Time</div>
                          <div className="text-foreground text-xs">{convertToEasternTime(visitor.time)}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto border border-zinc-200 dark:border-white/[0.06] rounded-lg">
                <table className="w-full min-w-full">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-white/[0.06]">
                      <th className="text-left py-2 px-2 text-muted-foreground font-medium text-sm">IP Address</th>
                      <th className="text-left py-2 px-2 text-muted-foreground font-medium text-sm">Page</th>
                      <th className="text-left py-2 px-2 text-muted-foreground font-medium text-xs">Source</th>
                      <th className="text-left py-2 px-1 text-muted-foreground font-medium text-xs">Campaign</th>
                      <th className="text-left py-2 px-1 text-muted-foreground font-medium text-xs">Content Type</th>
                      <th className="text-left py-2 px-1 text-muted-foreground font-medium text-xs">Device</th>
                      <th className="text-left py-2 px-1 text-muted-foreground font-medium text-xs">Browser</th>
                      <th className="text-left py-2 px-1 text-muted-foreground font-medium text-xs">OS</th>
                      <th className="text-left py-2 px-1 text-muted-foreground font-medium text-xs">Location</th>
                      <th className="text-left py-2 px-2 text-muted-foreground font-medium text-xs">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const filteredVisitors = getFilteredVisitors()
                      const totalPages = getTotalPages({ totalItems: filteredVisitors.length, pageSize: visitorPageSize })
                      const currentPage = clampPage({ page: visitorPage, totalPages })
                      const paged = getPageSlice({ items: filteredVisitors, page: currentPage, pageSize: visitorPageSize })
                      return paged
                    })().map((visitor) => (
                      <tr key={visitor._id} className="border-b border-zinc-200 dark:border-white/[0.04] hover:bg-accent/50 dark:hover:bg-accent/50 transition-colors">
                        <td className="py-2 px-2">
                          <span className="text-foreground font-mono text-sm">{visitor.ip_address}</span>
                        </td>
                        <td className="py-2 px-2 max-w-[200px]">
                          <div>
                            <div className="text-foreground text-sm font-medium truncate" title={visitor.page_title || visitor.path || 'Unknown'}>
                              {visitor.page_title || (visitor.path ? visitor.path.split('?')[0] : 'Unknown')}
                            </div>
                            {visitor.path && visitor.path !== visitor.page_title && (
                              <div className="text-muted-foreground text-xs font-mono truncate" title={visitor.path}>
                                {visitor.path}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-2 px-2">
                          {visitor.referrer_source ? (
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              visitor.referrer_source === 'twitter' ? 'bg-blue-900/50 text-blue-300' :
                              visitor.referrer_source === 'facebook' ? 'bg-blue-800/50 text-blue-200' :
                              visitor.referrer_source === 'google' ? 'bg-green-900/50 text-green-300' :
                              visitor.referrer_source === 'linkedin' ? 'bg-purple-900/50 text-purple-300' :
                              'bg-muted/50 text-muted-foreground'
                            }`}>
                              {visitor.referrer_source}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">Direct</span>
                          )}
                        </td>
                        <td className="py-2 px-1 max-w-[120px]">
                          {visitor.campaign_id ? (
                            <span className="text-muted-foreground text-xs font-mono truncate inline-block max-w-full" title={visitor.campaign_id}>
                              {visitor.campaign_id.length > 12 ? `${visitor.campaign_id.substring(0, 12)}...` : visitor.campaign_id}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </td>
                        <td className="py-2 px-1">
                          {visitor.content_type ? (
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              visitor.content_type === 'landing_page' ? 'bg-green-900/50 text-green-300' :
                              visitor.content_type === 'dashboard' ? 'bg-blue-900/50 text-blue-300' :
                              visitor.content_type === 'auth_page' ? 'bg-yellow-900/50 text-yellow-300' :
                              visitor.content_type === 'features_page' ? 'bg-purple-900/50 text-purple-300' :
                              visitor.content_type.startsWith('documentation -') ? 'bg-cyan-900/50 text-cyan-300' :
                              'bg-muted/50 text-muted-foreground'
                            }`}>
                              {visitor.content_type.replace('_', ' ')}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">Unknown</span>
                          )}
                        </td>
                        <td className="py-2 px-1">
                          {visitor.device_type ? (
                            <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                              visitor.device_type === 'mobile' ? 'bg-blue-900/50 text-blue-300' :
                              visitor.device_type === 'tablet' ? 'bg-purple-900/50 text-purple-300' :
                              visitor.device_type === 'desktop' ? 'bg-green-900/50 text-green-300' :
                              'bg-muted/50 text-muted-foreground'
                            }`}>
                              {visitor.device_type}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">Unknown</span>
                          )}
                        </td>
                        <td className="py-2 px-1">
                          <span className="text-foreground text-sm">
                            {parseBrowser(visitor.user_agent)}
                          </span>
                        </td>
                        <td className="py-2 px-1">
                          <span className="text-foreground text-sm">
                            {parseOS(visitor.user_agent)}
                          </span>
                        </td>
                        <td className="py-2 px-1">
                          <div>
                            <div className="text-foreground text-sm">{visitor.city}</div>
                            <div className="text-muted-foreground text-xs">{visitor.region}, {visitor.country}</div>
                          </div>
                        </td>
                        <td className="py-2 px-2 text-muted-foreground text-xs">
                          {convertToEasternTime(visitor.time)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No visitor data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
