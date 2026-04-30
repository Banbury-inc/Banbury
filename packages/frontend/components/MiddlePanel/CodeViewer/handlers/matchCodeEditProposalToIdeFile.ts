export function matchCodeEditProposalToIdeFile(proposalFilePath: string, ideFilePath: string): boolean {
  if (!proposalFilePath || !ideFilePath) return false
  if (proposalFilePath === ideFilePath) return true
  const proposalBase = proposalFilePath.split("/").pop() || proposalFilePath
  const ideBase = ideFilePath.split("/").pop() || ideFilePath
  return Boolean(proposalBase && ideBase && proposalBase === ideBase)
}
