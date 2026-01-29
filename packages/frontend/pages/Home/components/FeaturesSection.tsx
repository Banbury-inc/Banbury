import CloudIcon from '@mui/icons-material/Cloud'
import DevicesIcon from '@mui/icons-material/Devices'
import FlashOnIcon from '@mui/icons-material/FlashOn'
import { motion } from 'framer-motion'
import { Typography } from '../../../components/ui/typography'

const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 }
}

const features = [
  {
    icon: <CloudIcon className="text-muted-foreground text-[40px] md:text-[48px]" />,
    title: 'AI-Powered Automation',
    description: 'Intelligent workflows that adapt and optimize themselves, reducing manual work by up to 80%.',
    highlight: 'Save 20+ hours/week'
  },
  {
    icon: <DevicesIcon className="text-muted-foreground text-[40px] md:text-[48px]" />,
    title: 'Lightning Fast Processing',
    description: 'Process thousands of operations per second with our optimized cloud infrastructure.',
    highlight: '< 100ms response time'
  },
  {
    icon: <FlashOnIcon className="text-muted-foreground text-[40px] md:text-[48px]" />,
    title: 'Customer-Driven Development',
    description: 'We listen to your feedback and rapidly build the features you need. Your requests shape our roadmap.',
    highlight: 'Feature requests delivered fast'
  }
]

function FeaturesSection() {
  return (
    <div className="py-16 md:py-24 bg-background">
      <div className="container mx-auto max-w-7xl px-6 md:px-4">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeInUp}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <Typography variant="h2" className="mb-4 md:mb-6">
              Why Choose Banbury?
            </Typography>
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeInUp}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
          >
            <Typography variant="p">
              Experience the power of AI-driven automation with features designed for modern businesses
            </Typography>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-8 md:p-12 h-full bg-card rounded-md border border-border/50 relative overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:border-border hover:bg-accent/5 before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-border/50 before:to-transparent"
            >
              {/* Icon */}
              <div className="mb-6">
                {feature.icon}
              </div>

              {/* Title */}
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={fadeInUp}
                transition={{ duration: 0.5, ease: 'easeOut', delay: 0.05 }}
              >
                <Typography variant="h3" className="mb-4">
                  {feature.title}
                </Typography>
              </motion.div>

              {/* Description */}
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={fadeInUp}
                transition={{ duration: 0.5, ease: 'easeOut', delay: 0.12 }}
              >
                <Typography variant="p" className="mb-6">
                  {feature.description}
                </Typography>
              </motion.div>

              {/* Highlight Badge */}
              <div className="feature-highlight inline-flex items-center px-4 md:px-6 py-2 rounded-full bg-primary/10 border-none opacity-70 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                <Typography variant="p" className="text-primary text-sm font-medium">
                  {feature.highlight}
                </Typography>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default FeaturesSection
