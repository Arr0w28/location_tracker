'use client'

import { useEffect, useState } from 'react'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { LocationRecord } from '@/hooks/useLocations'

interface TimeScrubberProps {
  locations: LocationRecord[]
  progress: number
  onChange: (val: number) => void
  currentLocation: LocationRecord | null
}

export default function TimeScrubber({
  locations,
  progress,
  onChange,
  currentLocation,
}: TimeScrubberProps) {
  const [isPlaying, setIsPlaying] = useState(false)

  // Autoplay handler
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isPlaying) {
      const totalPins = locations.length
      
      // Reset timeline to start if clicked when already at the end
      let currentProgress = progress
      if (progress >= 100) {
        onChange(0)
        currentProgress = 0
      }

      interval = setInterval(() => {
        if (totalPins < 2) {
          setIsPlaying(false)
          return
        }

        const currentIndex = Math.round((currentProgress / 100) * (totalPins - 1))
        const nextIndex = currentIndex + 1

        if (nextIndex < totalPins) {
          const nextProgress = (nextIndex / (totalPins - 1)) * 100
          onChange(nextProgress)
          currentProgress = nextProgress
        } else {
          setIsPlaying(false)
        }
      }, 3000) // Pause for 3 seconds per pin (cinematic zoom + detail display)
    }
    return () => clearInterval(interval)
  }, [isPlaying, progress, onChange, locations.length])

  const formattedDate = currentLocation
    ? new Date(currentLocation.timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'No Location Selected'

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 w-[92%] max-w-2xl px-6 py-3.5 rounded-full border border-[#ECE7E0] bg-white/90 backdrop-blur-xl shadow-xl shadow-[#2D2C2A]/5 flex items-center gap-5 text-[#2D2C2A] select-none">
      {/* Play/Pause Button */}
      <Button
        onClick={() => setIsPlaying(!isPlaying)}
        variant="ghost"
        className="w-10 h-10 rounded-full border border-[#ECE7E0] flex items-center justify-center text-xs hover:bg-[#FAF8F5] p-0 text-[#2D2C2A] shrink-0"
        disabled={locations.length < 2}
      >
        {isPlaying ? '⏸' : '▶'}
      </Button>

      {/* Slider & Label Container */}
      <div className="flex-1 space-y-1.5 min-w-0">
        <div className="flex justify-between items-center text-[11px]">
          <div className="font-semibold text-[#C87A53] truncate max-w-[200px]">
            {currentLocation ? currentLocation.place_name : 'Chronological Timeline'}
          </div>
          <div className="text-[#76736F] font-mono">
            {formattedDate}
          </div>
        </div>

        {/* Timeline Slider */}
        <Slider
          value={[progress]}
          onValueChange={(val) => {
            setIsPlaying(false) // stop playing on manual scrub
            onChange(val[0])
          }}
          max={100}
          step={0.5}
          disabled={locations.length === 0}
          className="cursor-pointer"
        />
      </div>
    </div>
  )
}
