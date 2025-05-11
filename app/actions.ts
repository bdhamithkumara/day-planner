"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { createEvent, updateEvent, deleteEvent , getEventsByMonth} from "@/lib/db" // Import authOptions

export async function addEvent(formData: FormData) {
  const session = await getServerSession(authOptions); // Pass authOptions explicitly

  if (!session?.user?.id) {
    console.error("Session or user ID missing:", session); // Debug log
    throw new Error("You must be logged in to create an event");
  }

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const date = formData.get("date") as string;
  const startTime = formData.get("startTime") as string;
  const endTime = formData.get("endTime") as string;
  const color = formData.get("color") as string;

  if (!title || !date || !startTime || !endTime) {
    throw new Error("Missing required fields");
  }

  await createEvent(session.user.id, title, description || null, date, startTime, endTime, color);

  revalidatePath("/");
}

export async function editEvent(formData: FormData) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    throw new Error("You must be logged in to update an event")
  }

  const eventId = Number.parseInt(formData.get("id") as string)
  const title = formData.get("title") as string
  const description = formData.get("description") as string
  const date = formData.get("date") as string
  const startTime = formData.get("startTime") as string
  const endTime = formData.get("endTime") as string
  const color = formData.get("color") as string

  if (!eventId || !title || !date || !startTime || !endTime) {
    throw new Error("Missing required fields")
  }

  await updateEvent(eventId, session.user.id, title, description || null, date, startTime, endTime, color)

  revalidatePath("/")
}

export async function removeEvent(formData: FormData) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    throw new Error("You must be logged in to delete an event")
  }

  const eventId = Number.parseInt(formData.get("id") as string)

  if (!eventId) {
    throw new Error("Event ID is required")
  }

  await deleteEvent(eventId, session.user.id)

  revalidatePath("/")
}

export async function getAllEvents() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    throw new Error("You must be logged in to delete an event")
  }

  const date = new Date()
  const month = date.getMonth() + 1
  const year = date.getFullYear()

  const events = await getEventsByMonth(session?.user?.id , year, month)

  revalidatePath("/")

  return events
}
