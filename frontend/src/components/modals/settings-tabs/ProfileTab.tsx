import { CheckCircle, User } from 'lucide-react'
import { Typography } from '../../ui/typography'
import { Separator } from '../../ui/separator'

interface ProfileTabProps {
  scopeActivated: boolean
  userInfo: {
    username: string
    email: string
    first_name: string
    last_name: string
  } | null
}

export function ProfileTab({ scopeActivated, userInfo }: ProfileTabProps) {
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
          <h3 className="font-semibold mb-4 flex items-center text-zinc-900 dark:text-white">
            <User className="h-5 w-5 mr-2" />
            <Typography variant="h3">
                Profile
            </Typography>
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-zinc-600 dark:text-gray-400">Username</label>
              <p className="text-zinc-900 dark:text-white">{userInfo.username}</p>
            </div>
            <Separator />
            <div>
              <label className="text-sm text-zinc-600 dark:text-gray-400">Email</label>
              <p className="text-zinc-900 dark:text-white">{userInfo.email || 'Not provided'}</p>
            </div>
            <Separator />
            <div>
              <label className="text-sm text-zinc-600 dark:text-gray-400">First Name</label>
              <p className="text-zinc-900 dark:text-white">{userInfo.first_name || 'Not provided'}</p>
            </div>
            <Separator />
            <div>
              <label className="text-sm text-zinc-600 dark:text-gray-400">Last Name</label>
              <p className="text-zinc-900 dark:text-white">{userInfo.last_name || 'Not provided'}</p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

