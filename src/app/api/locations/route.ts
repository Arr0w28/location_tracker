import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('user_id', user.id)
    .order('timestamp', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

interface LocationPayload {
  timestamp: string
  latitude: number
  longitude: number
  placeName?: string
  placeLocation?: string
}

export async function POST(request: Request) {
  const supabase = createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { locations } = body

    if (!Array.isArray(locations) || locations.length === 0) {
      return NextResponse.json({ error: 'Invalid locations data' }, { status: 400 })
    }

    // Map to db format
    const rows = (locations as LocationPayload[]).map((loc) => {
      // Parse dates properly. Snapchat dates are in UTC, e.g. "2026-06-14 13:23:24 UTC"
      // We convert it to ISO string for timestamptz compatibility.
      const timestamp = new Date(loc.timestamp).toISOString();
      
      return {
        user_id: user.id,
        latitude: loc.latitude,
        longitude: loc.longitude,
        timestamp,
        place_name: loc.placeName || 'Unknown Place',
        place_location: loc.placeLocation || '',
        title: loc.placeName || 'New Location',
        blog_content: '',
        image_urls: []
      }
    })

    // Upsert to database, ignoring duplicate user_id + timestamp combos
    const { data, error } = await supabase
      .from('locations')
      .upsert(rows, { 
        onConflict: 'user_id,timestamp',
        ignoreDuplicates: true 
      })
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      count: data?.length || 0,
      message: `Successfully inserted/processed ${data?.length || 0} locations.` 
    })

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Internal Server Error'
    return NextResponse.json({ error: errMsg }, { status: 500 })
  }
}
