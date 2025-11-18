import React from 'react'
import slackLogo from '../../assets/images/slack.png'

interface SlackIconProps {
  size?: number | string
  className?: string
}

export function SlackIcon({ className, size = 48 }: SlackIconProps) {
  return (
    <img
      src={slackLogo.src}
      alt="Slack"
      width={size}
      height={size}
      className={className}
      style={{ display: 'block', objectFit: 'contain' }}
    />
  )
}
