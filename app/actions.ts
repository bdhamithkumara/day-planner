"use server";

import { revalidatePath } from "next/cache";

// Helper function to escape HTML characters
function escapeHtml(unsafeString: string | null | undefined): string {
  if (unsafeString === null || unsafeString === undefined) {
    return ""; // Or handle as you see fit, e.g., return null and adjust logic below
  }
  return unsafeString
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const YYYYMMDD_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const HHMM_REGEX = /^\d{2}:\d{2}$/;
const HEX_COLOR_REGEX = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { createEvent, updateEvent, deleteEvent , getEventsByMonth} from "@/lib/db" // Import authOptions

export async function addEvent(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("You must be logged in to create an event");

  const rawTitle = formData.get("title") as string;
  const rawDescription = formData.get("description") as string;
  const date = formData.get("date") as string;        // <-- keep as string
  const startTime = formData.get("startTime") as string;
  const endTime = formData.get("endTime") as string;
  const rawColor = formData.get("color") as string | null; // Retrieve as potentially null

  if (!rawTitle || !date || !startTime || !endTime) { // Color removed from this check
    throw new Error("Missing required fields (title, date, startTime, endTime are required)");
  }

  if (!YYYYMMDD_REGEX.test(date)) {
    throw new Error("Invalid date format. Expected YYYY-MM-DD.");
  }
  if (!HHMM_REGEX.test(startTime)) {
    throw new Error("Invalid start time format. Expected HH:MM.");
  }
  if (!HHMM_REGEX.test(endTime)) {
    throw new Error("Invalid end time format. Expected HH:MM.");
  }

  let colorToStore: string | undefined = undefined;
  if (rawColor && rawColor.trim() !== "") { // If color is provided and not just whitespace
    if (!HEX_COLOR_REGEX.test(rawColor)) {
      throw new Error("Invalid color format. Expected hex color (e.g., #RRGGBB or #RGB).");
    }
    colorToStore = rawColor;
  }
  // If rawColor is null, empty, or whitespace, colorToStore remains undefined.

  const title = escapeHtml(rawTitle);
  const description = rawDescription ? escapeHtml(rawDescription) : null;

  await createEvent(
    session.user.id,
    title,
    description, // Pass sanitized description
    date,       
    startTime,
    endTime,
    colorToStore // Pass the processed color
  );

  revalidatePath("/");
}


export async function editEvent(formData: FormData) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    throw new Error("You must be logged in to update an event")
  }

  const eventId = Number.parseInt(formData.get("id") as string)
  if (isNaN(eventId)) {
    throw new Error("Invalid Event ID format. Event ID must be a number.");
  }
  const rawTitle = formData.get("title") as string
  const rawDescription = formData.get("description") as string
  const date = formData.get("date") as string
  const startTime = formData.get("startTime") as string
  const endTime = formData.get("endTime") as string
  const color = formData.get("color") as string

  if (!eventId || !rawTitle || !date || !startTime || !endTime || !color) { // Keep validation on rawTitle and ensure color is also present
    throw new Error("Missing required fields")
  }

  if (!YYYYMMDD_REGEX.test(date)) {
    throw new Error("Invalid date format. Expected YYYY-MM-DD.");
  }
  if (!HHMM_REGEX.test(startTime)) {
    throw new Error("Invalid start time format. Expected HH:MM.");
  }
  if (!HHMM_REGEX.test(endTime)) {
    throw new Error("Invalid end time format. Expected HH:MM.");
  }
  if (!HEX_COLOR_REGEX.test(color)) {
    throw new Error("Invalid color format. Expected hex color (e.g., #RRGGBB or #RGB).");
  }

  const title = escapeHtml(rawTitle);
  const description = rawDescription ? escapeHtml(rawDescription) : null;

  await updateEvent(eventId, session.user.id, title, description, date, startTime, endTime, color)

  revalidatePath("/")
}

export async function removeEvent(formData: FormData) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    throw new Error("You must be logged in to delete an event")
  }

  const eventId = Number.parseInt(formData.get("id") as string)
  if (isNaN(eventId)) {
    throw new Error("Invalid Event ID format. Event ID must be a number.");
  }

  if (!eventId) { // This check can remain as a fallback, though isNaN should catch non-numeric strings
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
