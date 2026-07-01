'use client'

import { motion } from 'framer-motion'
import { LocationRecord } from '@/hooks/useLocations'

interface PolaroidCardProps {
  location: LocationRecord
  x?: number
  y?: number
}

export default function PolaroidCard({ location, x, y }: PolaroidCardProps) {
  // Format Date cleanly
  const formattedDate = new Date(location.timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  // Get image URL or fallback placeholder
  const hasImage = location.image_urls && location.image_urls.length > 0
  const imageUrl = hasImage ? location.image_urls![0] : null
  const isFloating = x !== undefined && y !== undefined

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, rotate: -3 }}
      animate={{ opacity: 1, scale: 1, rotate: 2 }}
      exit={{ opacity: 0, scale: 0.9, rotate: -2 }}
      transition={{ type: 'spring', damping: 15, stiffness: 200 }}
      style={
        isFloating
          ? {
              position: 'fixed',
              left: x + 15, // Offset slightly to the right of cursor
              top: y - 290, // Position above the cursor
              pointerEvents: 'none',
            }
          : {
              position: 'fixed',
              right: '24px',
              top: '96px',
              pointerEvents: 'none',
            }
      }
      className="z-50 w-60 bg-white p-3.5 pb-7 rounded-xl shadow-2xl border border-[#ECE7E0] flex flex-col items-center select-none"
    >
      {/* Photo Frame */}
      <div className="w-full aspect-square bg-neutral-100 border border-neutral-200 overflow-hidden relative flex items-center justify-center">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={location.place_name}
            className="object-cover w-full h-full"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-neutral-400 space-y-1">
            <span className="text-3xl">📸</span>
            <span className="text-[10px] uppercase tracking-wider font-semibold">No Photo Uploaded</span>
          </div>
        )}
      </div>

      {/* Polaroid Caption */}
      <div className="mt-4 text-center w-full space-y-1">
        <h3 
          className="text-neutral-800 text-lg font-bold truncate tracking-wide"
          style={{ fontFamily: 'var(--font-caveat), "Comic Sans MS", cursive' }}
        >
          {location.place_name}
        </h3>
        <p className="text-neutral-500 text-[10px] uppercase font-bold tracking-widest">
          {location.place_location || 'Coordinates Explored'}
        </p>
        <div className="h-[1px] bg-neutral-200/60 w-3/4 mx-auto my-1" />
        <p className="text-neutral-400 text-[9px] font-mono tracking-tighter">
          {formattedDate}
        </p>
      </div>
    </motion.div>
  )
}
