import { useEffect, useMemo, useState } from 'react'
import { Database } from 'lucide-react'

import { Button } from '../../../common/ui/button'
import { Input } from '../../../common/ui/input'
import { Label } from '../../../common/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../../common/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../common/ui/select'
import { Typography } from '../../../common/ui/typography'
import { DatabaseConnectionConfig, DatabaseProvider } from '../../../../../pages/Workspaces/types'
import { handleConnectDatabase } from './handlers/handleConnectDatabase'
import { DatabaseConnectionFormState, DatabaseTreeNode, SavedDatabaseConnection } from './types'

const providerPorts: Record<DatabaseProvider, string> = {
  postgres: '5432',
  mysql: '3306',
  mongodb: '27017',
}

const providerLabels: Record<DatabaseProvider, string> = {
  postgres: 'Postgres',
  mysql: 'MySQL',
  mongodb: 'MongoDB',
}

const defaultFormState: DatabaseConnectionFormState = {
  provider: 'postgres',
  uri: '',
  host: '',
  port: providerPorts.postgres,
  username: '',
  password: '',
  database: '',
  sshEnabled: false,
  sshHost: '',
  sshPort: '22',
  sshUsername: '',
  sshAuthMethod: 'password',
  sshPassword: '',
  sshPrivateKey: '',
  sshPassphrase: '',
}

function configToFormState(config: DatabaseConnectionConfig): DatabaseConnectionFormState {
  return {
    provider: config.provider,
    uri: config.uri ?? '',
    host: config.host,
    port: String(config.port),
    username: config.username,
    password: config.password,
    database: config.database ?? '',
    sshEnabled: config.ssh?.enabled ?? false,
    sshHost: config.ssh?.host ?? '',
    sshPort: String(config.ssh?.port ?? 22),
    sshUsername: config.ssh?.username ?? '',
    sshAuthMethod: config.ssh?.authMethod ?? 'password',
    sshPassword: config.ssh?.password ?? '',
    sshPrivateKey: config.ssh?.privateKey ?? '',
    sshPassphrase: config.ssh?.passphrase ?? '',
  }
}

interface AddDatabasePopoverProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConnected: (connection: DatabaseConnectionConfig, tree: DatabaseTreeNode[]) => void
  toast: (props: { title: string; description: string; variant: 'default' | 'destructive' | 'success' | 'error' }) => void
  trigger: React.ReactNode
  editingConnection?: SavedDatabaseConnection | null
}

export function AddDatabasePopover({
  open,
  onOpenChange,
  onConnected,
  toast,
  trigger,
  editingConnection,
}: AddDatabasePopoverProps) {
  const [formState, setFormState] = useState<DatabaseConnectionFormState>(defaultFormState)
  const [isConnecting, setIsConnecting] = useState(false)
  const isEditing = !!editingConnection

  useEffect(() => {
    if (open && editingConnection) {
      setFormState(configToFormState(editingConnection.config))
    } else if (!open) {
      setFormState(defaultFormState)
    }
  }, [open, editingConnection])

  const canConnect = useMemo(() => {
    if (formState.provider === 'mongodb' && formState.uri.trim()) return true
    if (!formState.host.trim()) return false
    if (!formState.port.trim()) return false
    if (!formState.username.trim()) return false
    if (!formState.password.trim()) return false
    if (formState.sshEnabled && formState.provider !== 'mongodb') {
      if (!formState.sshHost.trim()) return false
      if (!formState.sshPort.trim()) return false
      if (!formState.sshUsername.trim()) return false
      if (formState.sshAuthMethod === 'password' && !formState.sshPassword.trim()) return false
      if (formState.sshAuthMethod === 'publicKey' && !formState.sshPrivateKey.trim()) return false
    }
    return true
  }, [formState])

  function handleSuccess(connection: DatabaseConnectionConfig, tree: DatabaseTreeNode[]) {
    onConnected(connection, tree)
    onOpenChange(false)
    setFormState(defaultFormState)
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        {trigger}
      </PopoverTrigger>
      <PopoverContent
        className="min-w-[380px] max-w-md max-h-[85vh] overflow-y-auto p-4"
        align="end"
        side="bottom"
      >
        <h3 className="text-sm font-medium text-foreground mb-3">
          {isEditing ? 'Edit Connection' : 'Add Database Connection'}
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1">
            <Label className="text-xs">Provider</Label>
            <Select
              value={formState.provider}
              onValueChange={(value) => {
                const provider = value as DatabaseProvider
                setFormState(prev => ({
                  ...prev,
                  provider,
                  port: providerPorts[provider],
                  uri: provider === 'mongodb' ? prev.uri : '',
                  sshEnabled: provider === 'mongodb' ? false : prev.sshEnabled,
                }))
              }}
            >
              <SelectTrigger size="xs" className="w-full">
                <SelectValue>
                  <div className="flex items-center gap-2 min-w-0">
                    <Database className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={1.5} />
                    <Typography variant="xs" className="font-medium truncate">
                      {providerLabels[formState.provider]}
                    </Typography>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="postgres">
                  <div className="flex items-center gap-2">
                    <Database className="h-3.5 w-3.5" strokeWidth={1.5} />
                    <Typography variant="xs" className="font-medium">Postgres</Typography>
                  </div>
                </SelectItem>
                <SelectItem value="mysql">
                  <div className="flex items-center gap-2">
                    <Database className="h-3.5 w-3.5" strokeWidth={1.5} />
                    <Typography variant="xs" className="font-medium">MySQL</Typography>
                  </div>
                </SelectItem>
                <SelectItem value="mongodb">
                  <div className="flex items-center gap-2">
                    <Database className="h-3.5 w-3.5" strokeWidth={1.5} />
                    <Typography variant="xs" className="font-medium">MongoDB</Typography>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formState.provider === 'mongodb' ? (
            <div className="space-y-1 col-span-2">
              <Label htmlFor="popover-db-uri" className="text-xs">MongoDB URI</Label>
              <Input
                id="popover-db-uri"
                value={formState.uri}
                onChange={event => setFormState(prev => ({ ...prev, uri: event.target.value }))}
                placeholder="mongodb+srv://user:password@cluster.mongodb.net/app_db"
                className="h-8 text-xs"
              />
            </div>
          ) : null}

          <div className="space-y-1 col-span-2">
            <Label htmlFor="popover-db-host" className="text-xs">
              {formState.provider === 'mongodb' ? 'Host (optional when URI is set)' : 'Host'}
            </Label>
            <Input
              id="popover-db-host"
              value={formState.host}
              onChange={event => setFormState(prev => ({ ...prev, host: event.target.value }))}
              placeholder="db.example.com"
              className="h-8 text-xs"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="popover-db-port" className="text-xs">
              {formState.provider === 'mongodb' ? 'Port (optional when URI is set)' : 'Port'}
            </Label>
            <Input
              id="popover-db-port"
              value={formState.port}
              onChange={event => setFormState(prev => ({ ...prev, port: event.target.value }))}
              placeholder="5432"
              className="h-8 text-xs"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="popover-db-database" className="text-xs">Database (optional)</Label>
            <Input
              id="popover-db-database"
              value={formState.database}
              onChange={event => setFormState(prev => ({ ...prev, database: event.target.value }))}
              placeholder="app_db"
              className="h-8 text-xs"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="popover-db-username" className="text-xs">
              {formState.provider === 'mongodb' ? 'Username (optional when URI is set)' : 'Username'}
            </Label>
            <Input
              id="popover-db-username"
              value={formState.username}
              onChange={event => setFormState(prev => ({ ...prev, username: event.target.value }))}
              placeholder="readonly_user"
              className="h-8 text-xs"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="popover-db-password" className="text-xs">
              {formState.provider === 'mongodb' ? 'Password (optional when URI is set)' : 'Password'}
            </Label>
            <Input
              id="popover-db-password"
              type="password"
              value={formState.password}
              onChange={event => setFormState(prev => ({ ...prev, password: event.target.value }))}
              placeholder="••••••••"
              className="h-8 text-xs"
            />
          </div>

          {formState.provider !== 'mongodb' ? (
            <div className="col-span-2 pt-1">
              <label className="flex items-center gap-2 text-xs text-foreground">
                <input
                  type="checkbox"
                  checked={formState.sshEnabled}
                  onChange={event => setFormState(prev => ({ ...prev, sshEnabled: event.target.checked }))}
                  className="h-3.5 w-3.5 rounded border-input bg-background"
                />
                Use SSH tunnel
              </label>
            </div>
          ) : null}

          {formState.provider !== 'mongodb' && formState.sshEnabled ? (
            <div className="col-span-2 border border-border rounded-md bg-background p-2 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="col-span-2 space-y-1">
                  <Label htmlFor="popover-db-ssh-host" className="text-xs">SSH Host</Label>
                  <Input
                    id="popover-db-ssh-host"
                    value={formState.sshHost}
                    onChange={event => setFormState(prev => ({ ...prev, sshHost: event.target.value }))}
                    placeholder="bastion.example.com"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="popover-db-ssh-port" className="text-xs">SSH Port</Label>
                  <Input
                    id="popover-db-ssh-port"
                    value={formState.sshPort}
                    onChange={event => setFormState(prev => ({ ...prev, sshPort: event.target.value }))}
                    placeholder="22"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="popover-db-ssh-username" className="text-xs">SSH Username</Label>
                  <Input
                    id="popover-db-ssh-username"
                    value={formState.sshUsername}
                    onChange={event => setFormState(prev => ({ ...prev, sshUsername: event.target.value }))}
                    placeholder="ubuntu"
                    className="h-8 text-xs"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="popover-db-ssh-auth-method" className="text-xs">SSH Authentication</Label>
                <select
                  id="popover-db-ssh-auth-method"
                  className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs text-foreground"
                  value={formState.sshAuthMethod}
                  onChange={(event) => {
                    const sshAuthMethod = event.target.value as 'password' | 'publicKey'
                    setFormState(prev => ({ ...prev, sshAuthMethod }))
                  }}
                >
                  <option value="password">Password</option>
                  <option value="publicKey">Public Key</option>
                </select>
              </div>
              {formState.sshAuthMethod === 'password' ? (
                <div className="space-y-1">
                  <Label htmlFor="popover-db-ssh-password" className="text-xs">SSH Password</Label>
                  <Input
                    id="popover-db-ssh-password"
                    type="password"
                    value={formState.sshPassword}
                    onChange={event => setFormState(prev => ({ ...prev, sshPassword: event.target.value }))}
                    placeholder="••••••••"
                    className="h-8 text-xs"
                  />
                </div>
              ) : (
                <>
                  <div className="space-y-1">
                    <Label htmlFor="popover-db-ssh-private-key" className="text-xs">SSH Private Key</Label>
                    <textarea
                      id="popover-db-ssh-private-key"
                      value={formState.sshPrivateKey}
                      onChange={event => setFormState(prev => ({ ...prev, sshPrivateKey: event.target.value }))}
                      placeholder="-----BEGIN OPENSSH PRIVATE KEY-----"
                      className="min-h-24 w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs text-foreground"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="popover-db-ssh-passphrase" className="text-xs">Key Passphrase (optional)</Label>
                    <Input
                      id="popover-db-ssh-passphrase"
                      type="password"
                      value={formState.sshPassphrase}
                      onChange={event => setFormState(prev => ({ ...prev, sshPassphrase: event.target.value }))}
                      placeholder="Optional"
                      className="h-8 text-xs"
                    />
                  </div>
                </>
              )}
            </div>
          ) : null}

          <div className="col-span-2 pt-1">
            <Button
              type="button"
              className="h-8 w-full text-xs"
              onClick={() =>
                handleConnectDatabase({
                  formState,
                  setIsConnecting,
                  toast,
                  onSuccess: handleSuccess,
                })
              }
              disabled={!canConnect || isConnecting}
            >
              {isConnecting ? 'Connecting...' : isEditing ? 'Update & Connect' : 'Connect'}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
