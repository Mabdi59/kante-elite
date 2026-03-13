'use client'

import { useEffect, useState } from 'react'

export default function ScrollProgressBar() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const updateProgress = () => {
      const scrollTop = window.scrollY
      const scrollable = document.documentElement.scrollHeight - window.innerHeight
      if (scrollable <= 0) {
        setProgress(0)
        return
      }
      setProgress(Math.min(100, Math.max(0, (scrollTop / scrollable) * 100)))
    }

    updateProgress()
    window.addEventListener('scroll', updateProgress, { passive: true })
    window.addEventListener('resize', updateProgress)
    return () => {
      window.removeEventListener('scroll', updateProgress)
      window.removeEventListener('resize', updateProgress)
    }
  }, [])

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] h-1 bg-transparent pointer-events-none">
      <div
        className="h-full bg-gradient-to-r from-green-500 via-yellow-400 to-green-600 transition-[width] duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
