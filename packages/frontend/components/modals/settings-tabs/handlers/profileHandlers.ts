import { ApiService } from '../../../../../backend/api/apiService'

export interface ProfileUpdateData {
  first_name: string
  last_name: string
  email: string
}

export async function updateUserProfile(data: ProfileUpdateData) {
  try {
    const response = await ApiService.post('/user/update-profile/', data)
    
    // Update localStorage with new values
    if (data.email) {
      localStorage.setItem('userEmail', data.email)
    }
    
    return { success: true, data: response }
  } catch (error) {
    console.error('Error updating profile:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update profile' 
    }
  }
}
