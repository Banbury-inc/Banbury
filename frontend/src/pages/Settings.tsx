import { useState, useEffect } from 'react'
import { NavSidebar } from '../components/nav-sidebar'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Label } from '../components/ui/label'
import { Input } from '../components/ui/input'
import { ApiService } from '../services/apiService'

interface UserInfo {
  username: string
  email?: string
  first_name?: string
  last_name?: string
}

export default function Settings() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    // Get user info from localStorage
    if (typeof window !== 'undefined') {
      const username = localStorage.getItem('username')
      const email = localStorage.getItem('userEmail')
      setUserInfo({ 
        username: username || '', 
        email: email || undefined 
      })
      setFormData(prev => ({
        ...prev,
        email: email || ''
      }))
    }
  }, [])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    // Validate passwords match if password is being changed
    if (formData.password && formData.password !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' })
      setIsLoading(false)
      return
    }

    try {
      const updateData = {
        username: userInfo?.username,
        password: formData.password || undefined,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email
      }

      const response = await ApiService.post('/users/update_profile/', updateData)

      if (response.result === 'success') {
        setMessage({ type: 'success', text: 'Profile updated successfully!' })
        
        // Update localStorage with new email if changed
        if (formData.email && formData.email !== userInfo?.email) {
          localStorage.setItem('userEmail', formData.email)
          setUserInfo(prev => prev ? { ...prev, email: formData.email } : null)
        }

        // Clear password fields
        setFormData(prev => ({
          ...prev,
          password: '',
          confirmPassword: ''
        }))
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to update profile' })
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      setMessage({ type: 'error', text: 'An error occurred while updating your profile' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex">
      <NavSidebar />
      <div className="flex-1 ml-16 p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Account Settings</h1>
          
          <Card>
            <CardHeader>
              <CardTitle>Update Profile Information</CardTitle>
              <CardDescription>
                Update your account information. Leave password fields empty if you don't want to change your password.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      type="text"
                      value={formData.first_name}
                      onChange={(e) => handleInputChange('first_name', e.target.value)}
                      placeholder="Enter your first name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => handleInputChange('last_name', e.target.value)}
                      placeholder="Enter your last name"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="password">New Password (optional)</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Enter new password"
                  />
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    placeholder="Confirm new password"
                  />
                </div>

                {message && (
                  <div className={`p-3 rounded-md ${
                    message.type === 'success' 
                      ? 'bg-green-100 text-green-700 border border-green-200' 
                      : 'bg-red-100 text-red-700 border border-red-200'
                  }`}>
                    {message.text}
                  </div>
                )}

                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? 'Updating...' : 'Update Profile'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
