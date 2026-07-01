'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { useLocations, LocationRecord } from '@/hooks/useLocations'
import PolaroidCard from '@/components/ui/PolaroidCard'
import DetailsPanel from '@/components/panels/DetailsPanel'
import TimeScrubber from '@/components/ui/TimeScrubber'
import { AnimatePresence } from 'framer-motion'

// Dynamically import the Globe to prevent window-undefined issues during Next.js build
const GlobeView = dynamic(() => import('@/components/globe/GlobeView'), {
  ssr: false,
  loading: () => (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#FAF8F5] text-[#2D2C2A] select-none">
      <div className="w-12 h-12 border-2 border-[#C87A53] border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-xs tracking-widest uppercase text-[#76736F] font-semibold">Initializing 3D Travel Globe...</p>
    </div>
  ),
})

export default function MapPage() {
  const router = useRouter()
  const supabase = createClient()
  
  // Custom hook fetching locations
  const { locations: dbLocations, isLoading } = useLocations()
  const [locations, setLocations] = useState<LocationRecord[]>([])

  // UI state
  const [timeProgress, setTimeProgress] = useState(100)
  const [selectedLocation, setSelectedLocation] = useState<LocationRecord | null>(null)
  const [hoveredLocation, setHoveredLocation] = useState<LocationRecord | null>(null)
  const [mouseCoords, setMouseCoords] = useState({ x: 0, y: 0 })

  // Synchronize dynamic updates
  useEffect(() => {
    if (dbLocations) {
      setLocations(dbLocations)
    }
  }, [dbLocations])

  // Track mouse coordinates for hovering Polaroid placement
  const handleMouseMove = (e: React.MouseEvent) => {
    setMouseCoords({ x: e.clientX, y: e.clientY })
  }

  // Handle location update in local array to refresh components immediately
  const handleLocationUpdate = (updatedLoc: LocationRecord) => {
    setLocations((prev) =>
      prev.map((loc) => (loc.id === updatedLoc.id ? updatedLoc : loc))
    )
    if (selectedLocation && selectedLocation.id === updatedLoc.id) {
      setSelectedLocation(updatedLoc)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Get currently active location based on scrubber position
  const sorted = [...locations].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )
  const visibleCount = Math.max(1, Math.round((timeProgress / 100) * sorted.length))
  const currentLocation = sorted[visibleCount - 1] || null

  // Timeline preview card state to show Polaroid for a second on location activation
  const [timelineActiveLocation, setTimelineActiveLocation] = useState<LocationRecord | null>(null)

  useEffect(() => {
    if (!currentLocation) {
      setTimelineActiveLocation(null)
      return
    }

    setTimelineActiveLocation(currentLocation)

    const timer = setTimeout(() => {
      setTimelineActiveLocation(null)
    }, 1500) // Show for 1.5 seconds

    return () => clearTimeout(timer)
  }, [currentLocation])

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#FAF8F5] text-[#2D2C2A] select-none">
        <div className="w-12 h-12 border-2 border-[#C87A53] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs tracking-widest uppercase text-[#76736F] font-semibold">Loading your memories...</p>
      </div>
    )
  }

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoveredLocation(null)}
      className="relative w-screen h-screen overflow-hidden bg-[#030202] select-none"
    >
      {/* 1. Header controls overlay */}
      <div className="absolute top-6 left-6 z-20 flex items-center gap-4">
        <Button
          onClick={() => router.push('/dashboard')}
          variant="outline"
          className="bg-white/80 border-[#ECE7E0] hover:bg-[#FAF8F5] text-[#2D2C2A] font-semibold rounded-full shadow-sm backdrop-blur-md h-10 px-5 transition-all duration-300"
        >
          📂 Upload Data
        </Button>
      </div>

      <div className="absolute top-6 right-6 z-20">
        <Button
          onClick={handleSignOut}
          variant="outline"
          className="bg-white/80 border-[#ECE7E0] hover:bg-[#FAF8F5] text-[#2D2C2A] font-semibold rounded-full shadow-sm backdrop-blur-md h-10 px-5 transition-all duration-300"
        >
          Logout
        </Button>
      </div>

      {/* 2. 3D Globe Component */}
      {locations.length > 0 ? (
        <GlobeView
          locations={locations}
          selectedLocation={selectedLocation}
          hoveredLocation={hoveredLocation}
          onSelectLocation={setSelectedLocation}
          onHoverLocation={setHoveredLocation}
          timeProgress={timeProgress}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 text-[#2D2C2A] bg-[#FAF8F5]">
          <div className="max-w-md space-y-6">
            <div className="text-5xl">🧭</div>
            <h2 className="font-serif text-3xl font-medium tracking-tight">No location history found</h2>
            <p className="text-sm font-light text-[#76736F] leading-relaxed">
              Import your travel history to generate a beautiful, private 3D reflection journal.
            </p>
            <Button
              onClick={() => router.push('/dashboard')}
              className="bg-[#2D2C2A] hover:bg-[#C87A53] text-[#FAF8F5] py-6 px-8 rounded-full font-semibold tracking-wide transition-all duration-500 ease-out shadow-md"
            >
              Import Snapchat Data to Start 🚀
            </Button>
          </div>
        </div>
      )}

      {/* 3. Time Scrubber timeline control */}
      {locations.length > 1 && (
        <TimeScrubber
          locations={locations}
          progress={timeProgress}
          onChange={setTimeProgress}
          currentLocation={currentLocation}
        />
      )}

      {/* 4. Side editing panel Sheet */}
      <DetailsPanel
        location={selectedLocation}
        isOpen={!!selectedLocation}
        onClose={() => setSelectedLocation(null)}
        onUpdate={handleLocationUpdate}
      />

      {/* 5. Polaroid hover or timeline active state */}
      <AnimatePresence>
        {hoveredLocation ? (
          <PolaroidCard
            key={`hover-${hoveredLocation.id}`}
            location={hoveredLocation}
            x={mouseCoords.x}
            y={mouseCoords.y}
          />
        ) : timelineActiveLocation ? (
          <PolaroidCard
            key="timeline-polaroid-preview"
            location={timelineActiveLocation}
          />
        ) : null}
      </AnimatePresence>
    </div>
  )
}
