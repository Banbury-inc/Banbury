import axios from 'axios'
import { ApiService } from "../../../../backend/api/apiService"

export async function loadUserPicture(): Promise<string | null> {
  // Check if userPicture already exists in localStorage
  if (typeof window !== 'undefined') {
    const storedPicture = localStorage.getItem('userPicture')
    if (storedPicture) {
      return storedPicture
    }

    // Get username from localStorage
    const username = localStorage.getItem('username')
    if (!username) {
      return null
    }

    try {
      // Ensure auth token is loaded
      ApiService.loadAuthToken()
      
      // Make API request to get profile picture (returns binary image data)
      const response = await axios.get(`${ApiService.baseURL}/users/get_profile_picture/`, {
        responseType: 'blob',
        headers: {
          'Authorization': axios.defaults.headers.common['Authorization'] as string
        }
      })

      // Check if we got a valid image response
      if (response.data && response.data.size > 0) {
        // Convert blob to base64 data URL
        const reader = new FileReader()
        const pictureUrl = await new Promise<string>((resolve, reject) => {
          reader.onloadend = () => {
            if (typeof reader.result === 'string') {
              resolve(reader.result)
            } else {
              reject(new Error('Failed to convert blob to data URL'))
            }
          }
          reader.onerror = reject
          reader.readAsDataURL(response.data)
        })

        // Store in localStorage if we got a valid picture
        if (pictureUrl) {
          localStorage.setItem('userPicture', pictureUrl)
          return pictureUrl
        }
      }
    } catch (error) {
      // Check if it's a 200 response with no content (no picture available)
      if (axios.isAxiosError(error) && error.response?.status === 200) {
        // No picture available - this is fine, just return null
        return null
      }
      console.error('Error loading user picture from API:', error)
      // Return null on error - component will use initials as fallback
    }
  }

  return null
}
