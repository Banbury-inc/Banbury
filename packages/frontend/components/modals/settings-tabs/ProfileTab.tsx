import { useEffect, useState } from 'react'
import { CheckCircle, Edit2, Save, X } from 'lucide-react'
import { Typography } from '../../common/ui/typography'
import { Button } from '../../common/ui/button'
import { useToast } from '../../common/ui/use-toast'
import {
  SettingsTabCard,
  SettingsTabCardBody,
  SettingsTabCardFooter,
  SettingsTabHeader,
  SettingsTabLayout,
  SettingsTabNote,
  SettingsTabValueRow,
} from './settings-tab-layout'

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
    <SettingsTabLayout>
      {scopeActivated && (
        <SettingsTabNote variant="primary">
          <span className="flex items-center">
            <CheckCircle className="mr-2 h-5 w-5 shrink-0 text-primary" />
            Google integration features activated successfully!
          </span>
        </SettingsTabNote>
      )}

      {userInfo && (
        <>
          <SettingsTabHeader
            title="Profile"
            action={
              !isEditing ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2"
                >
                  <Edit2 className="h-4 w-4" />
                  Edit
                </Button>
              ) : undefined
            }
          />

          <SettingsTabCard>
            <SettingsTabCardBody>
              <SettingsTabValueRow
                label="Username"
                value={userInfo.username}
                readOnly
              />
              <SettingsTabValueRow
                label="Email"
                value={formData.email}
                isEditing={isEditing}
                inputType="email"
                placeholder="Enter your email"
                onChange={(email) => setFormData({ ...formData, email })}
              />
              <SettingsTabValueRow
                label="First Name"
                value={formData.first_name}
                isEditing={isEditing}
                placeholder="Enter your first name"
                onChange={(first_name) => setFormData({ ...formData, first_name })}
              />
              <SettingsTabValueRow
                label="Last Name"
                value={formData.last_name}
                isEditing={isEditing}
                placeholder="Enter your last name"
                onChange={(last_name) => setFormData({ ...formData, last_name })}
              />
            </SettingsTabCardBody>

            {isEditing && (
              <SettingsTabCardFooter>
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
              </SettingsTabCardFooter>
            )}
          </SettingsTabCard>
        </>
      )}
    </SettingsTabLayout>
  )
}
