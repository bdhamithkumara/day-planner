"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import type { Event } from "@/lib/db"
import { addEvent, editEvent, removeEvent, getAllEvents } from "@/app/actions"
import { X, Plus, Edit, Trash } from "lucide-react"

type TimeSlotModalProps = {
  isOpen: boolean
  onClose: () => void
  date: Date
  userId: string
}

export function TimeSlotModal({ isOpen, onClose, date, userId }: TimeSlotModalProps) {
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [fetchedEvents, setFetchedEvents] = useState<Event[]>([])

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":")
    const hour = Number.parseInt(hours, 10)
    const ampm = hour >= 12 ? "PM" : "AM"
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }

  const handleSlotClick = (time: string) => {
    setSelectedSlot(time)
    setSelectedEvent(null)
    setIsEditing(false)
  }

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event)
    setSelectedSlot(null)
    setIsEditing(true)
  }

  const handleAddEvent = async (formData: FormData) => {
    if (!selectedSlot) return
  
    const endTimeHour = Number.parseInt(selectedSlot.split(":")[0], 10)
    const endTimeMinute = Number.parseInt(selectedSlot.split(":")[1], 10)
  
    let endHour = endTimeHour
    let endMinute = endTimeMinute + 15
  
    if (endMinute >= 60) {
      endHour = (endHour + 1) % 24
      endMinute = endMinute - 60
    }
  
    const endTime = `${endHour.toString().padStart(2, "0")}:${endMinute.toString().padStart(2, "0")}`
  
    const localDate = `${date.getFullYear()}-${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`
  
    formData.append("date", localDate)
    formData.append("startTime", selectedSlot)
    formData.append("endTime", endTime)
  
    await addEvent(formData)
    setSelectedSlot(null)
    await fetchEvents()
    onClose()
  }
  

  const handleUpdateEvent = async (formData: FormData) => {
    if (!selectedEvent) return

    formData.append("id", selectedEvent.id.toString())
    formData.append("date", selectedEvent.date)
    formData.append("startTime", selectedEvent.start_time)
    formData.append("endTime", selectedEvent.end_time)

    await editEvent(formData)
    setSelectedEvent(null)
    setIsEditing(false)
    await fetchEvents()
    onClose()
  }

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return

    const formData = new FormData()
    formData.append("id", selectedEvent.id.toString())

    await removeEvent(formData)
    setSelectedEvent(null)
    setIsEditing(false)

    onClose()
  }

  const fetchEvents = async () => {
    const eventData = await getAllEvents()
    console.log("Fetched Events:", eventData)
    setFetchedEvents(eventData)
  }

  useEffect(() => {
    if (isOpen) {
      fetchEvents()
    }
  }, [isOpen])


  const filteredEvents = fetchedEvents.filter(
    (event) =>
      new Date(event.date).toISOString().split("T")[0] === date.toISOString().split("T")[0]
  )

  const timeSlots = []
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}:00`
      timeSlots.push(time)
    }
  }

  const eventsByTime: Record<string, Event> = {}
  filteredEvents.forEach((event) => {
    eventsByTime[event.start_time] = event
  })

  console.log("time slots", timeSlots)
  console.log("filteredEvents", filteredEvents)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{formatDate(date)}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="border rounded-lg overflow-y-auto max-h-[60vh]">
            <div className="p-2 bg-gray-50 font-medium">Time Slots</div>
            <div className="divide-y">
              {timeSlots.map((time) => {
                const hasEvent = eventsByTime[time]
                return (
                  <div
                    key={time}
                    className={`p-2 flex justify-between items-center cursor-pointer hover:bg-gray-50 ${
                      selectedSlot === time ? "bg-blue-50" : ""
                    } ${hasEvent ? "bg-blue-100" : ""}`}
                    onClick={() => (hasEvent ? handleEventClick(hasEvent) : handleSlotClick(time))}
                  >
                    <span>{formatTime(time)}</span>
                    {hasEvent ? (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{hasEvent.title}</span>
                        <Edit className="h-4 w-4 text-gray-500" />
                      </div>
                    ) : (
                      <Plus className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div>
            {selectedSlot && (
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-medium mb-4">Add Event at {formatTime(selectedSlot)}</h3>
                <form action={handleAddEvent} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input id="title" name="title" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" name="description" rows={3} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="color">Color</Label>
                    <Input id="color" name="color" type="color" defaultValue="#3b82f6" className="h-10 w-full" />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setSelectedSlot(null)}>
                      Cancel
                    </Button>
                    <Button type="submit">Save</Button>
                  </div>
                </form>
              </div>
            )}

            {isEditing && selectedEvent && (
              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Edit Event</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedEvent(null)
                      setIsEditing(false)
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <form action={handleUpdateEvent} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-title">Title</Label>
                    <Input id="edit-title" name="title" defaultValue={selectedEvent.title} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea
                      id="edit-description"
                      name="description"
                      rows={3}
                      defaultValue={selectedEvent.description || ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-color">Color</Label>
                    <Input
                      id="edit-color"
                      name="color"
                      type="color"
                      defaultValue={selectedEvent.color}
                      className="h-10 w-full"
                    />
                  </div>
                  <div className="flex justify-between">
                    <Button type="button" variant="destructive" onClick={handleDeleteEvent}>
                      <Trash className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                    <div className="flex space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setSelectedEvent(null)
                          setIsEditing(false)
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="submit">Update</Button>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
