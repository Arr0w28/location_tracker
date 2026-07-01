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
      interval = setInterval(() => {
        onChange(Math.min(100, progress + 1.2)) // control auto-advance speed
        if (progress >= 100) {
          setIsPlaying(false)
        }
      }, 350) // advance time every 350ms
    }
    return () => clearInterval(interval)
  }, [isPlaying, progress, onChange])

  const formattedDate = currentLocation
    ? new Date(currentLocation.timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'No Location Selected'

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 w-[90%] max-w-2xl px-6 py-4 rounded-xl border border-white/10 bg-black/45 backdrop-blur-md shadow-2xl flex flex-col md:flex-row items-center gap-4 text-white">
      {/* Play/Pause Button */}
      <Button
        onClick={() => setIsPlaying(!isPlaying)}
        variant="ghost"
        className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-lg hover:bg-white/10 p-0 hover:text-white"
        disabled={locations.length < 2}
      >
        {isPlaying ? '⏸️' : '▶️'}
      </Button>

      {/* Slider & Label Container */}
      <div className="flex-1 w-full space-y-2">
        <div className="flex justify-between items-center text-xs">
          <div className="font-semibold text-purple-300 truncate max-w-[250px]">
            {currentLocation ? currentLocation.place_name : 'Chronological Timeline'}
          </div>
          <div className="text-neutral-400 font-mono">
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
