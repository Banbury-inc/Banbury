import { motion } from 'framer-motion'

const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 }
}

const stats = [
  { value: '10M+', label: 'Tasks automated' },
  { value: '99.99%', label: 'Workflow uptime' },
  { value: 'Unlimited', label: 'Connected files' },
  { value: '24/7', label: 'AI support layer' }
]

function StatsSection() {
  return (
    <section className="relative overflow-hidden border-y border-border bg-card py-8 md:py-10">
      <div className="container mx-auto max-w-6xl px-6 md:px-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={fadeInUp}
              transition={{ duration: 0.5, ease: 'easeOut', delay: index * 0.08 }}
              className="rounded-2xl border border-border bg-background p-5 text-center shadow-lg shadow-background/20 md:p-6"
            >
              <div className="mb-2 text-2xl font-semibold tracking-[-0.04em] text-foreground sm:text-3xl md:text-4xl">
                {stat.value}
              </div>
              <div className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground sm:text-sm">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default StatsSection
