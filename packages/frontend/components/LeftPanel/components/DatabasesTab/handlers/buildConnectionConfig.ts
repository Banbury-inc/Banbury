import { DatabaseConnectionConfig } from '../../../../../../pages/Workspaces/types'
import { DatabaseConnectionFormState } from '../types'

export function buildConnectionConfig(formState: DatabaseConnectionFormState): DatabaseConnectionConfig {
  const parsedPort = Number.parseInt(formState.port, 10)

  return {
    provider: formState.provider,
    host: formState.host.trim(),
    port: Number.isNaN(parsedPort) ? 0 : parsedPort,
    username: formState.username.trim(),
    password: formState.password,
    database: formState.database.trim() || undefined,
  }
}
