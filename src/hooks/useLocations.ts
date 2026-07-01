import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export interface LocationRecord {
  id: string
  user_id: string
  latitude: number
  longitude: number
  timestamp: string
  place_name: string
  place_location: string
  title: string
  blog_content: string | null
  image_urls: string[] | null
  created_at: string
}

export function useLocations() {
  const [locations, setLocations] = useState<LocationRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLocations = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/locations')
      if (!response.ok) {
        throw new Error('Failed to load locations')
      }
      const data = await response.json()
      setLocations(data)
      setError(null)
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'An error occurred'
      setError(errMsg)
      toast.error(errMsg)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLocations()
  }, [])

  return {
    locations,
    isLoading,
    error,
    refetch: fetchLocations,
  }
}
