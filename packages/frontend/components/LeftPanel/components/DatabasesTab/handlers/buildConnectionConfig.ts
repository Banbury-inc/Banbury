import { DatabaseConnectionConfig } from '../../../../../../pages/Workspaces/types'
import { DatabaseConnectionFormState } from '../types'

export function buildConnectionConfig(formState: DatabaseConnectionFormState): DatabaseConnectionConfig {
  const parsedPort = Number.parseInt(formState.port, 10)
  const uri = formState.uri.trim()

  return {
    provider: formState.provider,
    uri: uri || undefined,
    host: formState.host.trim(),
    port: Number.isNaN(parsedPort) ? 0 : parsedPort,
    username: formState.username.trim(),
    password: formState.password,
    database: formState.database.trim() || undefined,
  }
}
