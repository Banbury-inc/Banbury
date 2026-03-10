import { DatabaseConnectionConfig } from '../../../../../../pages/Workspaces/types'
import { DatabaseConnectionFormState } from '../types'

export function buildConnectionConfig(formState: DatabaseConnectionFormState): DatabaseConnectionConfig {
  const parsedPort = Number.parseInt(formState.port, 10)
  const parsedSshPort = Number.parseInt(formState.sshPort, 10)
  const uri = formState.uri.trim()
  const sshHost = formState.sshHost.trim()
  const sshUsername = formState.sshUsername.trim()
  const sshPrivateKey = formState.sshPrivateKey.trim()
  const sshPassphrase = formState.sshPassphrase.trim()

  return {
    provider: formState.provider,
    uri: uri || undefined,
    host: formState.host.trim(),
    port: Number.isNaN(parsedPort) ? 0 : parsedPort,
    username: formState.username.trim(),
    password: formState.password,
    database: formState.database.trim() || undefined,
    ssh: formState.sshEnabled
      ? {
          enabled: true,
          host: sshHost,
          port: Number.isNaN(parsedSshPort) ? 0 : parsedSshPort,
          username: sshUsername,
          authMethod: formState.sshAuthMethod,
          password: formState.sshAuthMethod === 'password' ? formState.sshPassword : undefined,
          privateKey: formState.sshAuthMethod === 'publicKey' ? sshPrivateKey : undefined,
          passphrase: formState.sshAuthMethod === 'publicKey' && sshPassphrase ? sshPassphrase : undefined,
        }
      : undefined,
  }
}
