import { useEffect, useState } from 'react'
import { CheckCircle, User, Edit2, Save, X } from 'lucide-react'
import { Typography } from '../../common/ui/typography'
import { Separator } from '../../common/ui/separator'
import { Input } from '../../common/ui/input'
import { Button } from '../../common/ui/button'
import { useToast } from '../../common/ui/use-toast'

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

  useEffect(() => {
    if (!userInfo || isEditing) return

    setFormData({
      first_name: userInfo.first_name || '',
      last_name: userInfo.last_name || '',
      email: userInfo.email || ''
    })
  }, [isEditing, userInfo])

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
    } catch {
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
        <div className="rounded-lg border border-primary/30 bg-primary/10 p-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-primary mr-2" />
            <Typography variant="p" className="text-foreground">
              Google integration features activated successfully!
            </Typography>
          </div>
        </div>
      )}

      {userInfo && (
        <>
          <div className="flex items-center justify-between mb-4">
            <h3 className="flex items-center font-semibold text-foreground">
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
              <Typography variant="small" className="text-muted-foreground">Username</Typography>
              <Typography variant="p" className="text-foreground">{userInfo.username}</Typography>
            </div>
            
            <Separator />
            
            <div>
              <Typography variant="small" className="text-muted-foreground">Email</Typography>
              {isEditing ? (
                <Input
                  aria-label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1"
                  placeholder="Enter your email"
                />
              ) : (
                <Typography variant="p" className="text-foreground">{userInfo.email || 'Not provided'}</Typography>
              )}
            </div>
            
            <Separator />
            
            <div>
              <Typography variant="small" className="text-muted-foreground">First Name</Typography>
              {isEditing ? (
                <Input
                  aria-label="First name"
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="mt-1"
                  placeholder="Enter your first name"
                />
              ) : (
                <Typography variant="p" className="text-foreground">{userInfo.first_name || 'Not provided'}</Typography>
              )}
            </div>
            
            <Separator />
            
            <div>
              <Typography variant="small" className="text-muted-foreground">Last Name</Typography>
              {isEditing ? (
                <Input
                  aria-label="Last name"
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="mt-1"
                  placeholder="Enter your last name"
                />
              ) : (
                <Typography variant="p" className="text-foreground">{userInfo.last_name || 'Not provided'}</Typography>
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