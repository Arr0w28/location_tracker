'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import Globe from 'react-globe.gl'
import * as THREE from 'three'
import { LocationRecord } from '@/hooks/useLocations'

interface GlobeViewProps {
  locations: LocationRecord[]
  selectedLocation: LocationRecord | null
  hoveredLocation: LocationRecord | null
  onSelectLocation: (loc: LocationRecord | null) => void
  onHoverLocation: (loc: LocationRecord | null) => void
  timeProgress: number // slider progress (0 to 100)
}

interface FlightArc {
  startLat: number
  startLng: number
  endLat: number
  endLng: number
  color: string[]
}

interface AirplanePathPoint {
  lat: number
  lng: number
}

interface AirplaneData {
  path: AirplanePathPoint[]
  progress: number
  currentArc: number
}

export default function GlobeView({
  locations,
  selectedLocation,
  onSelectLocation,
  onHoverLocation,
  timeProgress,
}: GlobeViewProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globeRef = useRef<any>(null)
  const [flightArcs, setFlightArcs] = useState<FlightArc[]>([])
  const [airplaneData, setAirplaneData] = useState<AirplaneData[]>([])

  // Sort locations chronologically
  const sortedLocations = useMemo(() => {
    return [...locations].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )
  }, [locations])

  // Filter locations visible at the current time scrubber position
  const visibleLocations = useMemo(() => {
    const visibleCount = Math.max(
      1,
      Math.round((timeProgress / 100) * sortedLocations.length)
    )
    return sortedLocations.slice(0, visibleCount)
  }, [sortedLocations, timeProgress])

  // 1. Generate Flight Arcs between consecutive visible locations
  useEffect(() => {
    if (visibleLocations.length < 2) {
      setFlightArcs([])
      return
    }

    const arcs: FlightArc[] = []
    for (let i = 0; i < visibleLocations.length - 1; i++) {
      const start = visibleLocations[i]
      const end = visibleLocations[i + 1]
      arcs.push({
        startLat: start.latitude,
        startLng: start.longitude,
        endLat: end.latitude,
        endLng: end.longitude,
        // Gradient color: indigo to gold
        color: ['rgba(99, 102, 241, 0.4)', 'rgba(234, 179, 8, 0.6)'],
      })
    }
    setFlightArcs(arcs)
  }, [visibleLocations])

  // 2. Set up Airplane animation state
  useEffect(() => {
    if (visibleLocations.length < 2) {
      setAirplaneData([])
      return
    }
    // We pass the path coordinates so the update loop can access them
    setAirplaneData([
      {
        path: visibleLocations.map((l) => ({
          lat: l.latitude,
          lng: l.longitude,
        })),
        progress: 0,
        currentArc: 0,
      },
    ])
  }, [visibleLocations])

  // Adjust camera to focus on selected location
  useEffect(() => {
    if (selectedLocation && globeRef.current) {
      globeRef.current.pointOfView(
        {
          lat: selectedLocation.latitude,
          lng: selectedLocation.longitude,
          altitude: 1.4,
        },
        1800
      )
    }
  }, [selectedLocation])

  // 3. Custom Three.js Airplane Mesh Generator
  const createAirplaneObject = () => {
    const group = new THREE.Group()

    // Fuselage (Cone)
    const bodyGeo = new THREE.ConeGeometry(0.35, 1.8, 8)
    bodyGeo.rotateX(Math.PI / 2) // Orient forward
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xe5e7eb, // Light gray body
      metalness: 0.8,
      roughness: 0.1,
    })
    const body = new THREE.Mesh(bodyGeo, bodyMat)
    group.add(body)

    // Wings (Box)
    const wingGeo = new THREE.BoxGeometry(3.0, 0.05, 0.5)
    const wingMat = new THREE.MeshStandardMaterial({
      color: 0xa855f7, // Vibrant purple wings
      metalness: 0.6,
      roughness: 0.3,
    })
    const wings = new THREE.Mesh(wingGeo, wingMat)
    wings.position.set(0, 0, -0.1)
    group.add(wings)

    // Tail (Box)
    const tailGeo = new THREE.BoxGeometry(0.04, 0.8, 0.4)
    const tailMat = new THREE.MeshStandardMaterial({
      color: 0x6366f1, // Indigo tail
      metalness: 0.6,
      roughness: 0.3,
    })
    const tail = new THREE.Mesh(tailGeo, tailMat)
    tail.position.set(0, 0.35, -0.7)
    group.add(tail)

    group.scale.set(0.12, 0.12, 0.12) // Scale down for globe surface
    return group
  }

  // 4. Update Airplane Position and Orientation along flight paths
  const updateAirplanePosition = (obj: THREE.Object3D, airplane: AirplaneData) => {
    const { path } = airplane
    if (!path || path.length < 2) return

    // Increment progress
    airplane.progress += 0.005 // Control flight speed
    if (airplane.progress >= 1) {
      airplane.progress = 0
      airplane.currentArc = (airplane.currentArc + 1) % (path.length - 1)
    }

    const currentArcIdx = airplane.currentArc
    const start = path[currentArcIdx]
    const end = path[currentArcIdx + 1]

    if (!start || !end) return

    // Interpolate lat / lng / alt
    const p = airplane.progress
    const lat = start.lat + (end.lat - start.lat) * p
    const lng = start.lng + (end.lng - start.lng) * p
    // Smooth flight arc altitude rise
    const altitude = 0.05 + Math.sin(p * Math.PI) * 0.15

    // Get 3D Cartesian coordinates from Globe
    if (globeRef.current) {
      const coords = globeRef.current.getCoords(lat, lng, altitude)
      obj.position.set(coords.x, coords.y, coords.z)

      // Calculate lookAt target (slightly ahead)
      const nextP = Math.min(1, p + 0.02)
      const nextLat = start.lat + (end.lat - start.lat) * nextP
      const nextLng = start.lng + (end.lng - start.lng) * nextP
      const nextAlt = 0.05 + Math.sin(nextP * Math.PI) * 0.15
      const nextCoords = globeRef.current.getCoords(nextLat, nextLng, nextAlt)
      
      obj.lookAt(new THREE.Vector3(nextCoords.x, nextCoords.y, nextCoords.z))
    }
  }

  // 5. Custom HTML Marker Creator
  const createMarkerElement = (location: LocationRecord) => {
    const el = document.createElement('div')
    el.className = 'cursor-pointer group relative'

    const isSelected = selectedLocation?.id === location.id
    
    // Pulse ring + inner circle styling using Tailwind styles mapped to DOM elements
    el.innerHTML = `
      <div class="relative flex items-center justify-center">
        <!-- Pulse ring -->
        <span class="absolute inline-flex h-6 w-6 rounded-full ${
          isSelected 
            ? 'bg-yellow-400/40 animate-ping' 
            : 'bg-indigo-500/20 group-hover:bg-indigo-500/40 transition-all duration-300'
        }"></span>
        <!-- Inner dot -->
        <span class="relative inline-flex rounded-full h-3.5 w-3.5 border border-white shadow-md ${
          isSelected ? 'bg-yellow-400' : 'bg-indigo-500 group-hover:bg-indigo-400'
        }"></span>
      </div>
    `

    // Click handler to select and flyTo
    el.addEventListener('click', (e) => {
      e.stopPropagation()
      onSelectLocation(location)
    })

    // Hover handlers for Polaroid hover state
    el.addEventListener('mouseenter', () => onHoverLocation(location))
    el.addEventListener('mouseleave', () => onHoverLocation(null))

    return el
  }

  return (
    <div className="relative w-full h-full">
      <Globe
        ref={globeRef}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        
        // Markers
        htmlElementsData={visibleLocations}
        htmlLat="latitude"
        htmlLng="longitude"
        htmlElement={createMarkerElement as (d: object) => HTMLElement}
        
        // Arcs
        arcsData={flightArcs}
        arcStartLat="startLat"
        arcStartLng="startLng"
        arcEndLat="endLat"
        arcEndLng="endLng"
        arcColor="color"
        arcDashLength={0.4}
        arcDashGap={0.25}
        arcDashAnimateTime={1200}
        arcStroke={0.55}

        // Custom Layer for 3D Airplane
        customLayerData={airplaneData}
        customThreeObject={createAirplaneObject}
        customThreeObjectUpdate={updateAirplanePosition as (obj: THREE.Object3D, d: object) => void}

        // Aesthetics
        atmosphereColor="#312e81"
        atmosphereAltitude={0.22}
      />
    </div>
  )
}
