import { Cable, GitBranch, Repeat, type LucideIcon } from 'lucide-react'
import Image from 'next/image'
import { Card } from '../../../../components/common/ui/card'
import { Typography } from '../../../../components/common/ui/typography'
import DocPageLayout from '../DocPageLayout'
import { handleWorkspacesImageError } from './handlers/handle-workspaces-image-error'

interface WhyChooseItem {
  icon: LucideIcon
  title: string
  body: string
}

const whyChooseItems: WhyChooseItem[] = [
  {
    icon: Cable,
    title: 'Data Integration',
    body:
      'Banbury is a great way to get started with AI in your organization. Banbury seamlessly integrates with popular enterprise data sources such as Snowflake/Salesforce, Outlook/Gmail, etc. allowing for a unified data experience across platforms and enhancing productivity.',
  },
  {
    icon: Repeat,
    title: 'Repeatability',
    body:
      'Banbury excels in automating manual processes and repeating workflows across multiple scenarios, saving time and reducing errors. This capability allows enterprises to scale operations efficiently by standardizing routine tasks.',
  },
  {
    icon: GitBranch,
    title: 'Tailored Workflows',
    body:
      "Banbury offers bespoke workflows tailored to your industry needs, providing customizable solutions that align with your enterprise's unique processes and objectives.",
  },
]

export default function WhatIsBanburyTab() {
  return (
    <DocPageLayout>
      <div>
        <Typography variant="h2" className="mb-3">
          What Is Banbury?
        </Typography>
        <Typography variant="p" className="mb-4">
          Banbury is an Enterprise AI Analyst that works as a remote artificial employee within
          organizations. It is an entry-level, autonomous AI colleague capable of editing documents
          and spreadsheets, handling complex tasks, and collaborating seamlessly with people across
          various platforms.
        </Typography>

        <Card className="mb-4 overflow-hidden rounded-xl p-0">
          <Image
            src="/Workspaces.png"
            alt="Banbury workspaces overview"
            width={800}
            height={400}
            className="h-auto w-full"
            onError={handleWorkspacesImageError}
          />
        </Card>

        <Typography variant="p" className="mb-12">
          Banbury transforms workflows, offering a powerful tool to enhance productivity, streamline
          operations, and drive innovation.
        </Typography>

        <Typography variant="h2" className="mb-4">
          Why choose Banbury?
        </Typography>
        <div className="mb-12 space-y-4">
          {whyChooseItems.map(({ icon: Icon, title, body }) => (
            <Card key={title} className="rounded-xl p-6">
              <div className="mb-3 flex items-center gap-3">
                <Icon aria-hidden className="h-6 w-6 shrink-0 text-muted-foreground" />
                <Typography variant="h3">{title}</Typography>
              </div>
              <Typography variant="p" className="mt-0">
                {body}
              </Typography>
            </Card>
          ))}
        </div>

        <Typography variant="h2" className="mb-3">
          Who is Banbury made for?
        </Typography>
        <Typography variant="p">
          Banbury is made for organizations looking to harness the power of advanced AI to enhance
          productivity, drive innovation, and gain a competitive edge in today&apos;s fast-paced
          environment. Whether you&apos;re a student in college, a Fortune 500 executive, or
          anywhere in between, Banbury is your next hire to help you achieve your goals more
          efficiently and effectively.
        </Typography>
      </div>
    </DocPageLayout>
  )
}
