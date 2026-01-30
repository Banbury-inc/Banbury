import { ApiService } from "../../../../backend/api/apiService"

export async function loadUserInfo(): Promise<void> {
  // Check if user info already exists in localStorage
  if (typeof window !== 'undefined') {
    const storedFirstName = localStorage.getItem('userFirstName')
    const storedLastName = localStorage.getItem('userLastName')
    const storedEmail = localStorage.getItem('userEmail')
    
    // Only call API if any of the values are missing
    if (storedFirstName && storedLastName && storedEmail) {
      return
    }

    // Get username from localStorage
    const username = localStorage.getItem('username')
    if (!username) {
      return
    }

    try {
      // Make API request to get user info
      const response = await ApiService.get('/users/get_small_user_info/') as {
        first_name?: string
        last_name?: string
        email?: string
        phone_number?: string
      }

      // Store values in localStorage if they exist
      if (response.first_name) {
        localStorage.setItem('userFirstName', response.first_name)
      }
      if (response.last_name) {
        localStorage.setItem('userLastName', response.last_name)
      }
      if (response.email) {
        localStorage.setItem('userEmail', response.email)
      }
    } catch (error) {
      console.error('Error loading user info from API:', error)
      // Silently fail - component will work without this info
    }
  }
}
