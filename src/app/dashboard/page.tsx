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
import Link from 'next/link'

export default function DashboardPage() {
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<'idle' | 'parsing' | 'geocoding' | 'saving' | 'done'>('idle')
  const [progress, setProgress] = useState({ current: 0, total: 0, place: '' })
  const [logs, setLogs] = useState<string[]>([])
  const [stats, setStats] = useState({ parsed: 0, geocoded: 0, saved: 0 })
  const router = useRouter()
  const supabase = createClient()

  const logMessage = (msg: string) => {
    setLogs(prev => [msg, ...prev].slice(0, 100))
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
    <div className="relative min-h-screen bg-[#FAF8F5] text-[#2D2C2A] flex flex-col justify-between overflow-hidden font-sans select-none">
      {/* Background Soft Blobs */}
      <div className="absolute top-[20%] left-[-10%] -z-10 w-[50vw] h-[50vw] rounded-full bg-[#C87A53]/3 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] -z-10 w-[45vw] h-[45vw] rounded-full bg-[#7A8271]/3 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-6 py-4 flex justify-between items-center border-b border-[#ECE7E0]/60 bg-white/20 backdrop-blur-md">
        <Link href="/" className="font-serif text-2xl tracking-wide text-[#2D2C2A] font-semibold">
          集む — Atsumu
        </Link>
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => router.push('/map')}
            variant="outline"
            className="border-[#ECE7E0] hover:bg-[#F3EFE9] text-[#2D2C2A] text-xs font-semibold rounded-full px-5"
          >
            🗺️ View Map
          </Button>
          <Button
            onClick={handleSignOut}
            variant="ghost"
            className="text-[#76736F] hover:text-[#2D2C2A] hover:bg-[#F3EFE9] text-xs font-semibold rounded-full"
          >
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content Dashboard */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 90 }}
          className="w-full max-w-3xl"
        >
          <Card className="border-[#ECE7E0] bg-white shadow-xl shadow-[#ECE7E0]/45 rounded-2xl p-2">
            <CardHeader className="text-center pb-6">
              <CardTitle className="font-serif text-3xl font-medium text-[#2D2C2A]">Import History</CardTitle>
              <CardDescription className="text-xs font-light text-[#76736F] uppercase tracking-widest mt-1">
                Upload your HTML file to map your reflection.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {status === 'idle' && (
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-[#ECE7E0] rounded-xl p-12 hover:border-[#C87A53]/50 transition-all duration-300 bg-[#FAF8F5] relative">
                  <input
                    type="file"
                    accept=".html"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="text-center space-y-3 pointer-events-none">
                    <div className="text-4xl text-[#7A8271]">📂</div>
                    <p className="text-sm font-semibold text-[#2D2C2A]">
                      {file ? file.name : 'Click or drag your snapchat html file here'}
                    </p>
                    <p className="text-[11px] text-[#76736F]">Only Snapchat HTML exports are supported</p>
                  </div>
                </div>
              )}

              {/* Progress Tracker UI */}
              {status !== 'idle' && (
                <div className="space-y-5">
                  <div className="flex justify-between items-center text-xs uppercase tracking-wider font-semibold text-[#76736F]">
                    <span>Status: {status}</span>
                    {status === 'geocoding' && progress.total > 0 && (
                      <span className="text-[#C87A53] font-mono">
                        {progress.current} / {progress.total}
                      </span>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-1.5 bg-[#FAF8F5] rounded-full overflow-hidden border border-[#ECE7E0]">
                    <motion.div
                      className="h-full bg-[#C87A53]"
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
                    <p className="text-xs text-[#7A8271] italic text-center truncate px-4">
                      Resolving: {progress.place}
                    </p>
                  )}

                  {/* Summary/Stats Box */}
                  <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-[#FAF8F5] border border-[#ECE7E0]/60 text-center">
                    <div>
                      <div className="text-[10px] text-[#76736F] uppercase tracking-wider font-semibold">Parsed</div>
                      <div className="text-lg font-serif font-medium text-[#2D2C2A]">{stats.parsed}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#76736F] uppercase tracking-wider font-semibold">Geocoded</div>
                      <div className="text-lg font-serif font-medium text-[#7A8271]">{stats.geocoded}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#76736F] uppercase tracking-wider font-semibold">Saved</div>
                      <div className="text-lg font-serif font-medium text-[#C87A53]">{stats.saved}</div>
                    </div>
                  </div>

                  {/* Logs Section */}
                  <div className="space-y-2">
                    <div className="text-[10px] text-[#76736F] uppercase tracking-wider font-bold">Activity Log</div>
                    <div className="h-32 overflow-y-auto p-3 rounded-xl border border-[#ECE7E0] bg-[#FAF8F5] font-mono text-[10px] text-[#76736F] space-y-1 flex flex-col-reverse">
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

            <CardFooter className="pt-4 pb-2">
              {status === 'idle' && (
                <Button
                  onClick={handleUploadAndProcess}
                  disabled={!file}
                  className="w-full bg-[#2D2C2A] hover:bg-[#C87A53] text-[#FAF8F5] py-6 rounded-full font-semibold tracking-wide transition-all duration-500 ease-out shadow-md"
                >
                  Import and Reflect on Journey
                </Button>
              )}
              {status === 'done' && (
                <Button
                  onClick={() => router.push('/map')}
                  className="w-full bg-[#7A8271] hover:bg-[#6A7161] text-[#FAF8F5] py-6 rounded-full font-semibold tracking-wide transition-all duration-500 ease-out shadow-md"
                >
                  Open 3D Travel Globe Map 🌍
                </Button>
              )}
            </CardFooter>
          </Card>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 text-center text-[10px] text-[#76736F] font-light border-t border-[#ECE7E0]/60 bg-white/20">
        © 2026 Atsumu. Built with OpenStreetMap & Next.js.
      </footer>
    </div>
  )
}
