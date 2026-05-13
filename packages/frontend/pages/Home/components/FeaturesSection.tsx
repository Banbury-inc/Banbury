import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh'
import CloudSyncIcon from '@mui/icons-material/CloudSync'
import HubIcon from '@mui/icons-material/Hub'
import { motion } from 'framer-motion'
import { Typography } from '../../../components/common/ui/typography'

const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 }
}

const features = [
  {
    icon: <HubIcon className="text-foreground text-[34px] md:text-[42px]" />,
    title: 'Context in one place',
    description: 'Files, messages, calendar events, and notes sit together so every action starts with the full picture.',
    highlight: 'No more tab archaeology'
  },
  {
    icon: <AutoFixHighIcon className="text-foreground text-[34px] md:text-[42px]" />,
    title: 'AI that can operate',
    description: 'Ask Banbury to draft, organize, summarize, schedule, and route work across the apps your team already uses.',
    highlight: 'From prompt to progress'
  },
  {
    icon: <CloudSyncIcon className="text-foreground text-[34px] md:text-[42px]" />,
    title: 'Desktop and cloud synced',
    description: 'Keep local files, cloud tools, and AI workflows moving together without giving up the speed of your desktop.',
    highlight: 'Work follows you'
  }
]

function FeaturesSection() {
  return (
    <section className="relative bg-background py-20 md:py-28">
      <div className="container mx-auto max-w-7xl px-6 md:px-4">
        <div className="mx-auto mb-12 max-w-3xl text-center md:mb-16">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeInUp}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <Typography variant="h2" className="mb-4 text-3xl tracking-[-0.05em] sm:text-4xl md:text-5xl">
              Built for the messy middle of real work.
            </Typography>
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeInUp}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
          >
            <Typography variant="p" className="mx-auto max-w-2xl text-base leading-8 text-muted-foreground md:text-lg">
              Banbury is designed around the point where documents, conversations, meetings, and decisions all collide.
            </Typography>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.article
              key={feature.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={fadeInUp}
              transition={{ duration: 0.5, ease: 'easeOut', delay: index * 0.08 }}
              className="group relative h-full overflow-hidden rounded-3xl border border-border bg-card p-8 shadow-lg shadow-background/20 transition-all duration-300 hover:-translate-y-2 hover:border-foreground/20 md:p-10"
            >
              <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-background/70 shadow-xl">
                {feature.icon}
              </div>

              <Typography variant="h3" className="mb-4 text-2xl tracking-[-0.04em]">
                {feature.title}
              </Typography>

              <Typography variant="p" className="mb-8 text-sm leading-7 text-muted-foreground md:text-base">
                {feature.description}
              </Typography>

              <div className="inline-flex items-center rounded-full border border-border bg-background/70 px-4 py-2 text-sm font-medium text-foreground opacity-80 transition-all duration-300 group-hover:translate-y-[-2px] group-hover:opacity-100">
                <Typography variant="xs" className="text-foreground">
                  {feature.highlight}
                </Typography>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default FeaturesSection
