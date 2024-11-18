'use client'

import React, { useEffect, useState } from 'react'

export function Logo() {
  const [text, setText] = useState('')
  const fullText = 'NEXUS'

  useEffect(() => {
    let currentIndex = 0
    const intervalId = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setText(fullText.slice(0, currentIndex))
        currentIndex++
      } else {
        clearInterval(intervalId)
      }
    }, 200)

    return () => clearInterval(intervalId)
  }, [])

  return (
    <div className="flex items-center gap-1 h-14">
      <div className="h-14 w-14">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 100 100"
          className="w-full h-full"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="hsl(var(--secondary))" />
            </linearGradient>
          </defs>

          {/* Orbital paths - increased strokeWidth from 1 to 2 */}
          <g stroke="hsl(var(--muted-foreground)/20)" fill="none" strokeWidth="2">
            <ellipse cx="50" cy="50" rx="35" ry="20" transform="rotate(-30 50 50)" />
            <ellipse cx="50" cy="50" rx="35" ry="20" transform="rotate(30 50 50)" />
            <ellipse cx="50" cy="50" rx="35" ry="20" transform="rotate(90 50 50)" />
          </g>

          {/* Orbiting points - increased radius from 3 to 4 */}
          <g fill="hsl(var(--primary))">
            {/* First orbit */}
            <circle cx="50" cy="30" r="4">
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 50 50"
                to="360 50 50"
                dur="4s"
                repeatCount="indefinite"
              />
            </circle>
            
            {/* Second orbit */}
            <circle cx="80" cy="50" r="4">
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="120 50 50"
                to="480 50 50"
                dur="4s"
                repeatCount="indefinite"
              />
            </circle>
            
            {/* Third orbit */}
            <circle cx="50" cy="70" r="4">
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="240 50 50"
                to="600 50 50"
                dur="4s"
                repeatCount="indefinite"
              />
            </circle>

            {/* Additional points for symmetry */}
            <circle cx="20" cy="50" r="4">
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="60 50 50"
                to="420 50 50"
                dur="4s"
                repeatCount="indefinite"
              />
            </circle>

            <circle cx="65" cy="30" r="4">
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="180 50 50"
                to="540 50 50"
                dur="4s"
                repeatCount="indefinite"
              />
            </circle>

            <circle cx="35" cy="70" r="4">
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="300 50 50"
                to="660 50 50"
                dur="4s"
                repeatCount="indefinite"
              />
            </circle>
          </g>

          {/* Glowing effect for points - increased radius from 4 to 5 */}
          <g fill="hsl(var(--primary))" fillOpacity="0.3">
            {[0, 60, 120, 180, 240, 300].map((angle) => (
              <circle key={angle} cx="50" cy="30" r="5">
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from={`${angle} 50 50`}
                  to={`${angle + 360} 50 50`}
                  dur="4s"
                  repeatCount="indefinite"
                />
              </circle>
            ))}
          </g>
        </svg>
      </div>
      <div 
        className="text-xl font-bold text-foreground tracking-wider"
        aria-label="NEXUS"
      >
        {text}
      </div>
    </div>
  )
}