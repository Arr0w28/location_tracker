'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { LocationRecord } from '@/hooks/useLocations'

interface DetailsPanelProps {
  location: LocationRecord | null
  isOpen: boolean
  onClose: () => void
  onUpdate: (updatedLoc: LocationRecord) => void
}

export default function DetailsPanel({
  location,
  isOpen,
  onClose,
  onUpdate,
}: DetailsPanelProps) {
  const supabase = createClient()
  const [title, setTitle] = useState('')
  const [blogContent, setBlogContent] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // Keep track of previous location ID to prevent saving old data
  const prevLocIdRef = useRef<string | null>(null)

  // Initialize inputs when location changes
  useEffect(() => {
    if (location) {
      setTitle(location.title || location.place_name || '')
      setBlogContent(location.blog_content || '')
      prevLocIdRef.current = location.id
    }
  }, [location])

  // Debounced auto-save effect
  useEffect(() => {
    if (!location) return

    // Don't auto-save immediately on switching location
    if (location.id !== prevLocIdRef.current) return

    const hasChanges = 
      title !== (location.title || location.place_name || '') ||
      blogContent !== (location.blog_content || '')

    if (!hasChanges) return

    setIsSaving(true)

    const timer = setTimeout(async () => {
      try {
        const { error } = await supabase
          .from('locations')
          .update({
            title: title || location.place_name,
            blog_content: blogContent,
          })
          .eq('id', location.id)

        if (error) throw error

        // Notify parent of updated values
        onUpdate({
          ...location,
          title: title || location.place_name,
          blog_content: blogContent,
        })
      } catch (err) {
        toast.error('Failed to auto-save edits.')
        console.error(err)
      } finally {
        setIsSaving(false)
      }
    }, 1200) // 1.2 second debounce delay

    return () => clearTimeout(timer)
  }, [title, blogContent, location, supabase, onUpdate])

  if (!location) return null

  const formattedDate = new Date(location.timestamp).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  // Handle Photo Upload to Supabase Storage
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    const file = e.target.files[0]
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds the 5MB limit.')
      return
    }

    setIsUploading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      // Upload to travel-photos bucket
      const { error: uploadError } = await supabase.storage
        .from('travel-photos')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Retrieve public URL
      const { data: { publicUrl } } = supabase.storage
        .from('travel-photos')
        .getPublicUrl(filePath)

      // Save to database
      const updatedUrls = [...(location.image_urls || []), publicUrl]
      const { error: updateError } = await supabase
        .from('locations')
        .update({ image_urls: updatedUrls })
        .eq('id', location.id)

      if (updateError) throw updateError

      onUpdate({ ...location, image_urls: updatedUrls })
      toast.success('Photo added to journal!')
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Failed to upload photo'
      toast.error(errMsg)
      console.error(err)
    } finally {
      setIsUploading(false)
    }
  }

  // Delete Photo
  const handleImageDelete = async (urlToDelete: string) => {
    try {
      const parts = urlToDelete.split('/travel-photos/')
      if (parts.length < 2) return
      const filePath = parts[1]

      // Delete from Storage
      const { error: storageError } = await supabase.storage
        .from('travel-photos')
        .remove([filePath])

      if (storageError) throw storageError

      // Update DB
      const updatedUrls = (location.image_urls || []).filter(url => url !== urlToDelete)
      const { error: dbError } = await supabase
        .from('locations')
        .update({ image_urls: updatedUrls })
        .eq('id', location.id)

      if (dbError) throw dbError

      onUpdate({ ...location, image_urls: updatedUrls })
      toast.success('Photo removed.')
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Failed to delete photo'
      toast.error(errMsg)
      console.error(err)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md bg-white/95 border-l border-[#ECE7E0] text-[#2D2C2A] overflow-y-auto backdrop-blur-xl select-none p-6">
        <SheetHeader className="space-y-2 mb-6 text-left">
          <div className="flex justify-between items-center">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#C87A53]">
              Explored Location
            </span>
            {isSaving && (
              <span className="text-[10px] text-[#7A8271] font-mono animate-pulse">Auto-saving...</span>
            )}
          </div>
          <SheetTitle className="font-serif text-3xl font-medium tracking-tight text-[#2D2C2A]">
            {location.place_name}
          </SheetTitle>
          <SheetDescription className="text-[#76736F] text-xs font-light">
            {location.place_location || 'Coordinates Explored'}
          </SheetDescription>
          <p className="text-[9px] text-[#9E9A95] font-mono mt-1">{formattedDate}</p>
        </SheetHeader>

        <div className="space-y-6">
          {/* Custom Journal Entry Title */}
          <div className="space-y-2">
            <Label htmlFor="custom-title" className="text-xs font-semibold text-[#76736F] uppercase tracking-wider">
              Journal Title
            </Label>
            <Input
              id="custom-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give this place a custom memory title..."
              className="bg-[#FAF8F5] border-[#ECE7E0] focus:border-[#C87A53] text-[#2D2C2A] placeholder:text-[#9E9A95] rounded-xl h-11 transition-all duration-300"
            />
          </div>

          {/* Travel Diary Notes */}
          <div className="space-y-2">
            <Label htmlFor="blog-content" className="text-xs font-semibold text-[#76736F] uppercase tracking-wider">
              Memories & Diary Entry
            </Label>
            <Textarea
              id="blog-content"
              rows={8}
              value={blogContent}
              onChange={(e) => setBlogContent(e.target.value)}
              placeholder="Write down what you did here, who you were with, and how you felt..."
              className="bg-[#FAF8F5] border-[#ECE7E0] focus:border-[#C87A53] text-[#2D2C2A] placeholder:text-[#9E9A95] rounded-xl resize-none transition-all duration-300"
            />
          </div>

          {/* Photo Gallery & Uploads */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="text-xs font-semibold text-[#76736F] uppercase tracking-wider">
                Diary Photos
              </Label>
              <Button
                variant="outline"
                size="sm"
                className="relative border-[#ECE7E0] hover:bg-[#F3EFE9] text-[#2D2C2A] rounded-full text-xs font-medium"
                disabled={isUploading}
              >
                {isUploading ? 'Uploading...' : 'Add Photo'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={isUploading}
                />
              </Button>
            </div>

            {/* Photos Grid */}
            {location.image_urls && location.image_urls.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {location.image_urls.map((url, index) => (
                  <div
                    key={index}
                    className="relative aspect-square rounded-xl overflow-hidden border border-[#ECE7E0] bg-[#FAF8F5] group"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`Upload ${index + 1}`}
                      className="object-cover w-full h-full"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleImageDelete(url)}
                        className="py-1 px-3 h-auto text-xs bg-[#A34E36] hover:bg-[#8F3F28] rounded-full"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-dashed border-[#ECE7E0] rounded-xl p-8 text-center text-xs text-[#76736F] bg-[#FAF8F5] leading-relaxed">
                💡 Capture the memory! Upload photos from this spot to see them inside the Polaroid hover cards.
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
