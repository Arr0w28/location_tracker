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
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-black text-white font-mono">
      <div className="w-12 h-12 border-t-2 border-indigo-500 border-solid rounded-full animate-spin mb-4" />
      <p className="text-xs tracking-widest uppercase text-neutral-400">Initializing 3D Travel Globe...</p>
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

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-black text-white font-mono">
        <div className="w-12 h-12 border-t-2 border-indigo-500 border-solid rounded-full animate-spin mb-4" />
        <p className="text-xs tracking-widest uppercase text-neutral-400">Loading your memories...</p>
      </div>
    )
  }

  return (
    <div
      onMouseMove={handleMouseMove}
      className="relative w-screen h-screen overflow-hidden bg-[#030014] select-none"
    >
      {/* 1. Header controls overlay */}
      <div className="absolute top-6 left-6 z-20 flex items-center gap-4">
        <Button
          onClick={() => router.push('/dashboard')}
          variant="outline"
          className="bg-black/40 border-white/10 hover:bg-white/10 text-white font-semibold"
        >
          📂 Upload Data
        </Button>
      </div>

      <div className="absolute top-6 right-6 z-20">
        <Button
          onClick={handleSignOut}
          variant="outline"
          className="bg-black/40 border-white/10 hover:bg-white/10 text-white font-semibold"
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
        <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 text-white bg-black/80">
          <p className="text-lg font-semibold text-neutral-300 mb-4">No location history found.</p>
          <Button
            onClick={() => router.push('/dashboard')}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border-0 py-6"
          >
            Import Snapchat Data to Start 🚀
          </Button>
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

      {/* 5. Polaroid hover state */}
      <AnimatePresence>
        {hoveredLocation && (
          <PolaroidCard
            location={hoveredLocation}
            x={mouseCoords.x}
            y={mouseCoords.y}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
