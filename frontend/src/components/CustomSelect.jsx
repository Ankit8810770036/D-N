import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check, Search } from 'lucide-react'

/**
 * CustomSelect - A modern, accessible dropdown selector component.
 * 
 * Props:
 * - value: currently selected value
 * - onChange: callback(newValue)
 * - options: Array of { value, label, icon?, badge?, description? } or strings
 * - placeholder: string
 * - label?: string (optional label above select)
 * - size?: 'sm' | 'md' | 'lg' (default: 'md')
 * - searchable?: boolean
 * - disabled?: boolean
 * - className?: string (extra wrapper class)
 */
export default function CustomSelect({
    value,
    onChange,
    options = [],
    placeholder = 'Select an option...',
    label,
    size = 'md',
    searchable = false,
    disabled = false,
    className = '',
}) {
    const [isOpen, setIsOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const dropdownRef = useRef(null)
    const searchInputRef = useRef(null)

    // Normalize options format
    const normalizedOptions = options.map((opt) => {
        if (typeof opt === 'object' && opt !== null) {
            return opt
        }
        return { value: opt, label: String(opt) }
    })

    const selectedOption = normalizedOptions.find((opt) => String(opt.value) === String(value))

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Focus search on open
    useEffect(() => {
        if (isOpen && searchable && searchInputRef.current) {
            setTimeout(() => searchInputRef.current?.focus(), 50)
        }
        if (!isOpen) {
            setSearchTerm('')
        }
    }, [isOpen, searchable])

    // Keyboard navigation (Esc to close)
    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            setIsOpen(false)
        }
    }

    const filteredOptions = normalizedOptions.filter((opt) => {
        if (!searchTerm) return true
        const text = `${opt.label} ${opt.description || ''}`.toLowerCase()
        return text.includes(searchTerm.toLowerCase())
    })

    // Size variants
    const sizeClasses = {
        sm: 'py-2 px-3 text-xs rounded-xl min-h-[36px]',
        md: 'py-3 px-4 text-sm rounded-2xl min-h-[46px]',
        lg: 'py-3.5 px-5 text-base rounded-2xl min-h-[52px]',
    }

    return (
        <div className={`relative ${className}`} ref={dropdownRef} onKeyDown={handleKeyDown}>
            {label && <label className="input-label mb-1.5 block">{label}</label>}

            {/* Trigger Button */}
            <button
                type="button"
                disabled={disabled}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between gap-3 text-left transition-all duration-200 border
                    ${sizeClasses[size] || sizeClasses.md}
                    ${isOpen
                        ? 'border-emerald-500 ring-4 ring-emerald-500/10 bg-white dark:bg-[#0c241a] dark:border-emerald-400 dark:shadow-[0_0_20px_rgba(16,185,129,0.25)]'
                        : 'border-slate-200 hover:border-slate-300 bg-white dark:bg-black/40 dark:border-white/20 dark:hover:border-white/30'
                    }
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    shadow-sm
                `}
            >
                <div className="flex items-center gap-2.5 truncate flex-1 min-w-0">
                    {selectedOption?.icon && (
                        <span className="shrink-0 text-base">{selectedOption.icon}</span>
                    )}
                    {selectedOption ? (
                        <span className="font-semibold text-slate-800 dark:text-white truncate">
                            {selectedOption.label}
                        </span>
                    ) : (
                        <span className="text-slate-400 dark:text-white/40 font-normal truncate">
                            {placeholder}
                        </span>
                    )}
                    {selectedOption?.badge && (
                        <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40">
                            {selectedOption.badge}
                        </span>
                    )}
                </div>

                <ChevronDown
                    className={`w-4 h-4 shrink-0 text-slate-400 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-emerald-600 dark:text-emerald-400' : ''
                    }`}
                />
            </button>

            {/* Dropdown Menu Popup */}
            {isOpen && (
                <div className="absolute z-50 left-0 right-0 mt-2 bg-white dark:bg-[#0b2118] border border-slate-200 dark:border-white/15 rounded-2xl shadow-2xl shadow-slate-900/20 py-2 max-h-64 overflow-y-auto backdrop-blur-xl animate-fade-in font-outfit">
                    {/* Optional Search */}
                    {searchable && (
                        <div className="px-3 pb-2 mb-1 border-b border-slate-100 dark:border-white/10">
                            <div className="relative">
                                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search..."
                                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        </div>
                    )}

                    {/* Options List */}
                    <div className="p-1 space-y-0.5">
                        {filteredOptions.length === 0 ? (
                            <div className="px-4 py-3 text-xs text-center text-slate-400 dark:text-white/40">
                                No options found
                            </div>
                        ) : (
                            filteredOptions.map((opt) => {
                                const isSelected = String(opt.value) === String(value)
                                return (
                                    <button
                                        key={String(opt.value)}
                                        type="button"
                                        onClick={() => {
                                            onChange(opt.value)
                                            setIsOpen(false)
                                        }}
                                        className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left transition-all text-sm group ${
                                            isSelected
                                                ? 'bg-emerald-500 text-white font-bold shadow-md shadow-emerald-600/25'
                                                : 'text-slate-700 dark:text-slate-200 hover:bg-emerald-50/80 hover:text-emerald-900 dark:hover:bg-white/10 dark:hover:text-white font-medium'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5 truncate flex-1 min-w-0">
                                            {opt.icon && (
                                                <span className="shrink-0 text-base">{opt.icon}</span>
                                            )}
                                            <div className="truncate">
                                                <div className="truncate">{opt.label}</div>
                                                {opt.description && (
                                                    <p
                                                        className={`text-[11px] truncate ${
                                                            isSelected
                                                                ? 'text-white/80'
                                                                : 'text-slate-400 dark:text-white/40'
                                                        }`}
                                                    >
                                                        {opt.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            {opt.badge && !isSelected && (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                                                    {opt.badge}
                                                </span>
                                            )}
                                            {isSelected && (
                                                <Check className="w-4 h-4 text-white shrink-0" />
                                            )}
                                        </div>
                                    </button>
                                )
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
