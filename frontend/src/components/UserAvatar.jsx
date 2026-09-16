import { useState } from 'react'
import { User, Crown, Shield } from 'lucide-react'

const SIZES = {
    xs:  'w-6 h-6 text-[10px]',
    sm:  'w-8 h-8 text-xs',
    md:  'w-10 h-10 text-sm',
    lg:  'w-12 h-12 text-base',
    xl:  'w-16 h-16 text-lg',
    '2xl': 'w-24 h-24 text-2xl',
}

export default function UserAvatar({
    user,
    size = 'md',
    className = '',
    showBadge = false,
    onClick,
}) {
    const [imgError, setImgError] = useState(false)
    const sizeClasses = SIZES[size] || SIZES.md
    const photoUrl = user?.profile_photo_url

    const name = user?.name || ''
    const initial = name ? name.charAt(0).toUpperCase() : 'U'

    return (
        <div
            onClick={onClick}
            className={`relative inline-flex shrink-0 items-center justify-center rounded-2xl overflow-hidden shadow-sm transition-transform duration-200 select-none ${sizeClasses} ${className}`}
        >
            {photoUrl && !imgError ? (
                <img
                    src={photoUrl}
                    alt={name || 'User Avatar'}
                    onError={() => setImgError(true)}
                    className="w-full h-full object-cover rounded-2xl"
                    loading="lazy"
                />
            ) : (
                <div className="w-full h-full rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white flex items-center justify-center font-bold font-outfit shadow-inner">
                    {name ? initial : <User className="w-1/2 h-1/2" />}
                </div>
            )}

            {showBadge && (
                <div className="absolute -bottom-0.5 -right-0.5">
                    {user?.role === 'admin' ? (
                        <span className="p-0.5 rounded-full bg-emerald-700 text-white shadow-sm ring-1 ring-white dark:ring-emerald-950 flex items-center justify-center">
                            <Shield className="w-2.5 h-2.5" />
                        </span>
                    ) : user?.plan_type === 'premium' ? (
                        <span className="p-0.5 rounded-full bg-amber-500 text-white shadow-sm ring-1 ring-white dark:ring-amber-950 flex items-center justify-center">
                            <Crown className="w-2.5 h-2.5" />
                        </span>
                    ) : null}
                </div>
            )}
        </div>
    )
}
