import { useState } from 'react'
import { CheckCircle, User, Edit2, Save, X } from 'lucide-react'
import { Typography } from '../../ui/typography'
import { Separator } from '../../ui/separator'
import { Input } from '../../ui/input'
import { Button } from '../../ui/button'
import { useToast } from '../../ui/use-toast'

interface ProfileTabProps {
  scopeActivated: boolean
  userInfo: {
    username: string
    email: string
    first_name: string
    last_name: string
  } | null
  onUpdateProfile: (data: { first_name: string; last_name: string; email: string }) => Promise<{ success: boolean; error?: string }>
}

export function ProfileTab({ scopeActivated, userInfo, onUpdateProfile }: ProfileTabProps) {
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    first_name: userInfo?.first_name || '',
    last_name: userInfo?.last_name || '',
    email: userInfo?.email || ''
  })

  async function handleSave() {
    setLoading(true)
    try {
      const result = await onUpdateProfile(formData)
      
      if (result.success) {
        toast({
          title: "Profile Updated",
          description: "Your profile information has been updated successfully.",
        })
        setIsEditing(false)
      } else {
        toast({
          title: "Update Failed",
          description: result.error || "Failed to update profile",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  function handleCancel() {
    setFormData({
      first_name: userInfo?.first_name || '',
      last_name: userInfo?.last_name || '',
      email: userInfo?.email || ''
    })
    setIsEditing(false)
  }

  return (
    <div className="space-y-6">
      {scopeActivated && (
        <div className="p-4 bg-green-900/20 border border-green-700 rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
            <Typography variant="p" className="text-green-400">
              Google integration features activated successfully!
            </Typography>
          </div>
        </div>
      )}

      {userInfo && (
        <>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center text-zinc-900 dark:text-white">
              <User className="h-5 w-5 mr-2" />
              <Typography variant="h3">
                Profile
              </Typography>
            </h3>
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2"
              >
                <Edit2 className="h-4 w-4" />
                Edit
              </Button>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-zinc-600 dark:text-gray-400">Username</label>
              <p className="text-zinc-900 dark:text-white">{userInfo.username}</p>
            </div>
            
            <Separator />
            
            <div>
              <label className="text-sm text-zinc-600 dark:text-gray-400">Email</label>
              {isEditing ? (
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1"
                  placeholder="Enter your email"
                />
              ) : (
                <p className="text-zinc-900 dark:text-white">{userInfo.email || 'Not provided'}</p>
              )}
            </div>
            
            <Separator />
            
            <div>
              <label className="text-sm text-zinc-600 dark:text-gray-400">First Name</label>
              {isEditing ? (
                <Input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="mt-1"
                  placeholder="Enter your first name"
                />
              ) : (
                <p className="text-zinc-900 dark:text-white">{userInfo.first_name || 'Not provided'}</p>
              )}
            </div>
            
            <Separator />
            
            <div>
              <label className="text-sm text-zinc-600 dark:text-gray-400">Last Name</label>
              {isEditing ? (
                <Input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="mt-1"
                  placeholder="Enter your last name"
                />
              ) : (
                <p className="text-zinc-900 dark:text-white">{userInfo.last_name || 'Not provided'}</p>
              )}
            </div>

            {isEditing && (
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}