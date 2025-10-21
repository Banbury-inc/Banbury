import { updateUserProfile, ProfileUpdateData } from '../settings-tabs/handlers/profileHandlers'

export async function handleUpdateProfile(
  data: ProfileUpdateData,
  onSuccess?: (updatedData: any) => void
) {
  const result = await updateUserProfile(data)
  
  if (result.success && onSuccess) {
    onSuccess(result.data)
  }
  
  return result
}
