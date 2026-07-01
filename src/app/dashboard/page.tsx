'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { parseSnapchatHtml } from '@/lib/parsers/snapchat-html-parser'
import { geocodeLocations } from '@/lib/geocoding/nominatim-geocoder'

export default function DashboardPage() {
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<'idle' | 'parsing' | 'geocoding' | 'saving' | 'done'>('idle')
  const [progress, setProgress] = useState({ current: 0, total: 0, place: '' })
  const [logs, setLogs] = useState<string[]>([])
  const [stats, setStats] = useState({ parsed: 0, geocoded: 0, saved: 0 })
  const router = useRouter()
  const supabase = createClient()

  const logMessage = (msg: string) => {
    setLogs(prev => [msg, ...prev].slice(0, 100)) // Keep last 100 logs
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
      toast.info(`Selected file: ${e.target.files[0].name}`)
    }
  }

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Signed out')
      router.push('/login')
    }
  }

  const handleUploadAndProcess = async () => {
    if (!file) {
      toast.error('Please select a Snapchat HTML history file first.')
      return
    }

    try {
      // 1. Parsing
      setStatus('parsing')
      logMessage('Starting parsing of Snapchat HTML file...')
      const htmlText = await file.text()
      const parsedData = parseSnapchatHtml(htmlText)
      
      setStats(prev => ({ ...prev, parsed: parsedData.length }))
      logMessage(`Successfully parsed ${parsedData.length} location records.`)
      
      if (parsedData.length === 0) {
        throw new Error('No valid location records found in the file.')
      }

      // 2. Geocoding
      setStatus('geocoding')
      logMessage('Starting geocoding process (respecting OSM rate limit, caching duplicates)...')
      
      const geocodedData = await geocodeLocations(parsedData, (current, total, place) => {
        setProgress({ current, total, place })
        logMessage(`[${current}/${total}] Resolving: ${place}`)
      })

      setStats(prev => ({ ...prev, geocoded: geocodedData.length }))
      logMessage(`Geocoding complete! Successfully resolved ${geocodedData.length} out of ${parsedData.length} records.`)

      if (geocodedData.length === 0) {
        throw new Error('Could not resolve coordinates for any of the locations.')
      }

      // 3. Saving to Database
      setStatus('saving')
      logMessage('Sending records to backend database...')
      
      const response = await fetch('/api/locations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ locations: geocodedData }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save to database')
      }

      setStats(prev => ({ ...prev, saved: result.count }))
      logMessage(`Successfully saved ${result.count} new locations to the database!`)
      setStatus('done')
      toast.success(`Success! Added ${result.count} new spots to your journal.`)

    } catch (err) {
      console.error(err)
      const errMsg = err instanceof Error ? err.message : 'An error occurred during processing.'
      toast.error(errMsg)
      setStatus('idle')
    }
  }

  return (
    <div className="relative min-h-screen bg-black text-white flex flex-col justify-between overflow-hidden font-sans">
      {/* Premium Gradient Backgrounds */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/40 via-neutral-900 to-black opacity-90 z-0" />
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[140px] animate-pulse" />
      <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[140px] animate-pulse delay-1000" />

      {/* Header */}
      <header className="relative z-10 w-full px-6 py-4 flex justify-between items-center border-b border-white/5 bg-black/30 backdrop-blur-md">
        <h1 className="text-xl font-bold tracking-wider bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
          3D Travel Diary
        </h1>
        <Button onClick={handleSignOut} variant="ghost" className="text-neutral-400 hover:text-white hover:bg-white/5 border border-white/5">
          Sign Out
        </Button>
      </header>

      {/* Main Content Dashboard */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-3xl"
        >
          <Card className="border-white/10 bg-neutral-900/40 backdrop-blur-lg shadow-2xl text-white">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">Import Location History</CardTitle>
              <CardDescription className="text-neutral-400">
                Upload your Snapchat Map places history HTML file to map your journey.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {status === 'idle' && (
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-lg p-10 hover:border-purple-500/50 transition-all duration-300 bg-white/5 relative">
                  <input
                    type="file"
                    accept=".html"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="text-center space-y-2 pointer-events-none">
                    <div className="text-4xl">📂</div>
                    <p className="text-sm font-semibold">
                      {file ? file.name : 'Click or drag snap_map_places_history.html here'}
                    </p>
                    <p className="text-xs text-neutral-500">Only Snapchat HTML export files are accepted</p>
                  </div>
                </div>
              )}

              {/* Progress Tracker UI */}
              {status !== 'idle' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm font-medium">
                    <span className="capitalize">{status}...</span>
                    {status === 'geocoding' && progress.total > 0 && (
                      <span className="text-purple-400">
                        {progress.current} / {progress.total}
                      </span>
                    )}
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-purple-500 to-indigo-500"
                      initial={{ width: 0 }}
                      animate={{
                        width: 
                          status === 'parsing' ? '20%' :
                          status === 'geocoding' ? `${20 + (progress.current / progress.total) * 60}%` :
                          status === 'saving' ? '90%' :
                          status === 'done' ? '100%' : '0%'
                      }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>

                  {status === 'geocoding' && progress.place && (
                    <p className="text-xs text-neutral-400 italic text-center truncate">
                      Resolving coordinate: {progress.place}
                    </p>
                  )}

                  {/* Summary/Stats Box */}
                  <div className="grid grid-cols-3 gap-4 p-4 rounded-lg bg-white/5 text-center text-sm">
                    <div>
                      <div className="text-xs text-neutral-400">Parsed Records</div>
                      <div className="text-lg font-bold text-indigo-400">{stats.parsed}</div>
                    </div>
                    <div>
                      <div className="text-xs text-neutral-400">Geocoded Coordinates</div>
                      <div className="text-lg font-bold text-purple-400">{stats.geocoded}</div>
                    </div>
                    <div>
                      <div className="text-xs text-neutral-400">Saved to DB</div>
                      <div className="text-lg font-bold text-green-400">{stats.saved}</div>
                    </div>
                  </div>

                  {/* Logs Section */}
                  <div className="space-y-2">
                    <div className="text-xs text-neutral-400 uppercase tracking-wider font-bold">Activity Log</div>
                    <div className="h-40 overflow-y-auto p-3 rounded bg-black/60 font-mono text-xs text-neutral-300 space-y-1 flex flex-col-reverse">
                      {logs.map((log, index) => (
                        <div key={index} className="truncate">
                          {log}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            
            <CardFooter className="flex justify-between">
              {status === 'idle' && (
                <Button
                  onClick={handleUploadAndProcess}
                  disabled={!file}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white"
                >
                  Parse & Geocode Location Data
                </Button>
              )}
              {status === 'done' && (
                <Button
                  onClick={() => router.push('/map')}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white animate-bounce"
                >
                  Open 3D Travel Globe Map 🌍
                </Button>
              )}
            </CardFooter>
          </Card>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full text-center py-4 text-xs text-neutral-500 border-t border-white/5 bg-black/20">
        3D Travel Diary &copy; 2026. Made with OpenStreetMap Nominatim and Next.js.
      </footer>
    </div>
  )
}
