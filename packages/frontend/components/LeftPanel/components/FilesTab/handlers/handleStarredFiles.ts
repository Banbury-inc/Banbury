import { ApiService } from "../../../../../../backend/api/apiService"

export async function fetchStarredFileIds(): Promise<string[]> {
  try {
    const result = await ApiService.Files.getStarredS3Files()
    if (result.success) {
      return result.file_ids
    }
    return []
  } catch (error) {
    console.error('Failed to fetch starred files:', error)
    return []
  }
}

export async function starFile(fileId: string): Promise<boolean> {
  try {
    const result = await ApiService.Files.starS3File(fileId)
    return result.success
  } catch (error) {
    console.error('Failed to star file:', error)
    return false
  }
}

export async function unstarFile(fileId: string): Promise<boolean> {
  try {
    const result = await ApiService.Files.unstarS3File(fileId)
    return result.success
  } catch (error) {
    console.error('Failed to unstar file:', error)
    return false
  }
}

