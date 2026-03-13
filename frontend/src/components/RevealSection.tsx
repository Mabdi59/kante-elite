'use client'

import { useEffect, useRef, useState } from 'react'

type RevealSectionProps = {
  children: React.ReactNode
  className?: string
}

export default function RevealSection({ children, className }: RevealSectionProps) {
  const [visible, setVisible] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const node = rootRef.current
    if (!node) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true)
            observer.disconnect()
            break
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -10% 0px' }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={rootRef} className={`section-shell reveal-section ${className ?? ''}`} data-visible={visible}>
      {children}
    </div>
  )
}
