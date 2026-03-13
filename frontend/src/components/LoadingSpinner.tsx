interface LoadingSpinnerProps {
  /** Full-screen centered layout with a text label underneath */
  fullScreen?: boolean
  label?: string
}

export default function LoadingSpinner({ fullScreen, label = 'Loading...' }: LoadingSpinnerProps) {
  const spinner = (
    <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
  )

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          {spinner}
          {label && <p className="text-gray-600 mt-4">{label}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center py-8">
      {spinner}
    </div>
  )
}
