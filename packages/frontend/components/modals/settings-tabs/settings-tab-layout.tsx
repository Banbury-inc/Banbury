import type { ReactNode } from 'react'
import { Typography } from '../../common/ui/typography'
import { Label } from '../../common/ui/label'
import { Input } from '../../common/ui/input'
import { cn } from '../../../utils'

interface SettingsTabLayoutProps {
  children: ReactNode
  className?: string
}

export function SettingsTabLayout({ children, className }: SettingsTabLayoutProps) {
  return <div className={cn('space-y-6', className)}>{children}</div>
}

interface SettingsTabHeaderProps {
  title: string
  action?: ReactNode
}

export function SettingsTabHeader({ title, action }: SettingsTabHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <Typography variant="h3" className="text-foreground">
        {title}
      </Typography>
      {action}
    </div>
  )
}

interface SettingsTabSectionProps {
  title: string
  action?: ReactNode
  children: ReactNode
  className?: string
}

export function SettingsTabSection({ title, action, children, className }: SettingsTabSectionProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <SettingsTabHeader title={title} action={action} />
      {children}
    </div>
  )
}

interface SettingsTabCardProps {
  children: ReactNode
  className?: string
}

export function SettingsTabCard({ children, className }: SettingsTabCardProps) {
  return (
    <div className={cn('overflow-hidden rounded-lg border border-border bg-card', className)}>
      {children}
    </div>
  )
}

interface SettingsTabCardBodyProps {
  children: ReactNode
  className?: string
}

export function SettingsTabCardBody({ children, className }: SettingsTabCardBodyProps) {
  return <div className={cn('divide-y divide-border', className)}>{children}</div>
}

interface SettingsTabCardFooterProps {
  children: ReactNode
  className?: string
}

export function SettingsTabCardFooter({ children, className }: SettingsTabCardFooterProps) {
  return (
    <div className={cn('flex gap-3 border-t border-border bg-muted/20 px-4 py-3', className)}>
      {children}
    </div>
  )
}

interface SettingsTabGroupLabelProps {
  children: ReactNode
}

export function SettingsTabGroupLabel({ children }: SettingsTabGroupLabelProps) {
  return (
    <div className="bg-muted/20 px-4 py-2">
      <Typography variant="small" className="font-semibold text-foreground">
        {children}
      </Typography>
    </div>
  )
}

interface SettingsTabRowProps {
  label: string
  description?: string
  htmlFor?: string
  align?: 'center' | 'start'
  children: ReactNode
}

export function SettingsTabRow({
  label,
  description,
  htmlFor,
  align = 'center',
  children,
}: SettingsTabRowProps) {
  const labelContent = htmlFor ? (
    <Label htmlFor={htmlFor} className="block cursor-pointer">
      <Typography variant="small" className="font-medium text-foreground">
        {label}
      </Typography>
      {description && (
        <Typography variant="xs" className="mt-1 text-muted-foreground">
          {description}
        </Typography>
      )}
    </Label>
  ) : (
    <>
      <Typography variant="small" className="font-medium text-foreground">
        {label}
      </Typography>
      {description && (
        <Typography variant="xs" className="mt-1 text-muted-foreground">
          {description}
        </Typography>
      )}
    </>
  )

  return (
    <div
      className={cn(
        'flex gap-4 px-4 py-3.5 sm:gap-6',
        align === 'start' ? 'items-start' : 'items-center'
      )}
    >
      <div className="min-w-0 flex-1">{labelContent}</div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

interface SettingsTabValueRowProps {
  label: string
  value: string
  isEditing?: boolean
  readOnly?: boolean
  inputType?: 'text' | 'email'
  placeholder?: string
  onChange?: (value: string) => void
}

export function SettingsTabValueRow({
  label,
  value,
  isEditing = false,
  readOnly = false,
  inputType = 'text',
  placeholder,
  onChange,
}: SettingsTabValueRowProps) {
  const displayValue = value || 'Not provided'
  const isEmpty = !value

  return (
    <div className="flex items-center gap-4 px-4 py-3.5 sm:gap-6">
      <Typography variant="small" className="w-24 shrink-0 text-muted-foreground sm:w-28">
        {label}
      </Typography>
      <div className="min-w-0 flex-1">
        {isEditing && !readOnly ? (
          <Input
            aria-label={label}
            type={inputType}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            className="h-9 bg-background"
            placeholder={placeholder}
          />
        ) : (
          <Typography
            variant="small"
            className={cn(
              'truncate font-medium text-foreground',
              isEmpty && 'font-normal italic text-muted-foreground'
            )}
          >
            {displayValue}
          </Typography>
        )}
      </div>
    </div>
  )
}

interface SettingsTabBlockProps {
  label: string
  description?: string
  children: ReactNode
}

export function SettingsTabBlock({ label, description, children }: SettingsTabBlockProps) {
  return (
    <div className="space-y-3 px-4 py-3.5">
      <div>
        <Typography variant="small" className="font-medium text-foreground">
          {label}
        </Typography>
        {description && (
          <Typography variant="xs" className="mt-1 text-muted-foreground">
            {description}
          </Typography>
        )}
      </div>
      {children}
    </div>
  )
}

interface SettingsTabNoteProps {
  children: ReactNode
  variant?: 'default' | 'primary' | 'destructive'
}

export function SettingsTabNote({ children, variant = 'default' }: SettingsTabNoteProps) {
  return (
    <div
      className={cn(
        'rounded-lg border p-4',
        variant === 'default' && 'border-border bg-muted/30',
        variant === 'primary' && 'border-primary/30 bg-primary/10',
        variant === 'destructive' && 'border-destructive/50 bg-destructive/5'
      )}
    >
      <Typography
        variant="small"
        className={cn(
          variant === 'primary' ? 'text-foreground' : 'text-muted-foreground'
        )}
      >
        {children}
      </Typography>
    </div>
  )
}
