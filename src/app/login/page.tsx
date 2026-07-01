'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        toast.error(error.message)
      } else {
        toast.success('Logged in successfully!')
        router.push('/dashboard')
      }
    } catch {
      toast.error('An unexpected error occurred.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-between bg-[#FAF8F5] text-[#2D2C2A] p-6 select-none overflow-hidden">
      {/* Background Soft Blobs */}
      <div className="absolute top-[20%] left-[-10%] -z-10 w-[50vw] h-[50vw] rounded-full bg-[#C87A53]/3 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] -z-10 w-[45vw] h-[45vw] rounded-full bg-[#7A8271]/3 blur-[120px] pointer-events-none" />

      {/* Header / Logo */}
      <header className="w-full max-w-6xl mx-auto py-4 flex justify-between items-center z-10">
        <Link href="/" className="font-serif text-2xl tracking-wide text-[#2D2C2A] font-semibold">
          集む — Atsumu
        </Link>
        <Link href="/" className="text-xs font-semibold uppercase tracking-wider text-[#7A8271] hover:text-[#C87A53] transition-colors duration-300">
          ← Back to sanctuary
        </Link>
      </header>

      {/* Main Login Card Container */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 90 }}
        className="w-full max-w-md my-auto z-10"
      >
        <Card className="border-[#ECE7E0] bg-white shadow-xl shadow-[#ECE7E0]/40 rounded-2xl p-2">
          <CardHeader className="space-y-2 text-center pb-6">
            <div className="mx-auto w-10 h-10 rounded-full bg-[#FAF8F5] flex items-center justify-center border border-[#ECE7E0] text-lg">
              🔑
            </div>
            <CardTitle className="font-serif text-3xl font-medium tracking-tight text-[#2D2C2A]">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-xs font-light text-[#76736F] uppercase tracking-widest">
              Sign in to your private diary
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-semibold text-[#76736F] uppercase tracking-wide">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-[#FAF8F5] border-[#ECE7E0] focus:border-[#C87A53] text-[#2D2C2A] placeholder:text-[#9E9A95] rounded-xl h-11 transition-all duration-300"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-semibold text-[#76736F] uppercase tracking-wide">
                    Password
                  </Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-[#FAF8F5] border-[#ECE7E0] focus:border-[#C87A53] text-[#2D2C2A] rounded-xl h-11 transition-all duration-300"
                />
              </div>
            </CardContent>
            <CardFooter className="pt-4 pb-2">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#2D2C2A] hover:bg-[#C87A53] text-[#FAF8F5] py-6 rounded-full font-semibold tracking-wide transition-all duration-500 ease-out shadow-md"
              >
                {isLoading ? 'Entering...' : 'Enter Sanctuary'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </motion.div>

      {/* Footer */}
      <footer className="w-full py-4 text-center text-[10px] text-[#76736F] font-light z-10">
        © 2026 Atsumu. Your journeys are encrypted and hosted privately.
      </footer>
    </div>
  )
}
