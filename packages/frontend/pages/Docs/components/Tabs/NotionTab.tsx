import { Card } from '../../../../components/common/ui/card'
import DocPageLayout from '../DocPageLayout'
import { Typography } from '../../../../components/common/ui/typography'

export default function NotionTab() {
  return (
    <DocPageLayout>
      <div>
        <Typography variant="h2" className="mb-3">Notion</Typography>

        <Typography variant="p" className="mb-4">
          Connect Notion to let Banbury search workspace knowledge, read pages, query data sources, and create pages from your assistant workflows.
        </Typography>

        <Card className="mb-4 rounded-xl p-6">
          <Typography variant="h3" className="mb-2">Capabilities</Typography>
          <div className="ps-4">
            <Typography variant="p" className="mb-1">• Search connected pages and data sources</Typography>
            <Typography variant="p" className="mb-1">• Read page metadata, properties, and block content</Typography>
            <Typography variant="p" className="mb-1">• Query data sources with filters and sorts</Typography>
            <Typography variant="p">• Create pages directly or from data source templates</Typography>
          </div>
        </Card>

        <Card className="mb-4 rounded-xl p-6">
          <Typography variant="h3" className="mb-2">AI tools</Typography>
          <div className="ps-4">
            <Typography variant="p" className="mb-1">• notion_search: search connected Notion pages and data sources</Typography>
            <Typography variant="p" className="mb-1">• notion_get_page: get metadata and properties for a page</Typography>
            <Typography variant="p" className="mb-1">• notion_get_page_blocks: read block children for a page</Typography>
            <Typography variant="p" className="mb-1">• notion_query_data_source: query pages from a data source</Typography>
            <Typography variant="p" className="mb-1">• notion_list_templates: list templates for a data source</Typography>
            <Typography variant="p" className="mb-1">• notion_create_page: create a page under a parent page or data source</Typography>
            <Typography variant="p">• notion_create_page_from_template: create a page from a data source template</Typography>
          </div>
        </Card>

        <Card className="rounded-xl p-6">
          <Typography variant="h3" className="mb-2">Connect Notion</Typography>
          <div className="ps-4">
            <Typography variant="p" className="mb-1">1. Go to Settings → Integrations</Typography>
            <Typography variant="p" className="mb-1">2. Select Notion and authorize workspace access</Typography>
            <Typography variant="p">3. Use tool preferences to enable or disable assistant access to Notion</Typography>
          </div>
        </Card>
      </div>
    </DocPageLayout>
  )
}
