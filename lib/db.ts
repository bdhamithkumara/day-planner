import { neon } from "@neondatabase/serverless"

// Initialize the SQL client
export const sql = neon(process.env.DATABASE_URL!)

// Event type definition
export type Event = {
  id: number
  user_id: string
  title: string
  description: string | null
  date: string
  start_time: string
  end_time: string
  color: string
  created_at: string
  updated_at: string
}

// Function to get events for a specific date and user
export async function getEventsByDate(userId: string, date: string) {
  try {
    const events = await sql `
      SELECT * FROM events 
      WHERE user_id = ${userId} AND date = ${date}
      ORDER BY start_time ASC
    `
    return events
  } catch (error) {
    console.error("Database error:", error)
    throw new Error("Failed to fetch events")
  }
}

// Function to create a new event
export async function createEvent(
  userId: string,
  title: string,
  description: string | null,
  date: string,
  startTime: string,
  endTime: string,
  color = "#3b82f6",
) {
  try {
    const result = await sql `
      INSERT INTO events (user_id, title, description, date, start_time, end_time, color)
      VALUES (${userId}, ${title}, ${description}, ${date}, ${startTime}, ${endTime}, ${color})
      RETURNING *
    `
    return result[0]
  } catch (error) {
    console.error("Database error:", error)
    throw new Error("Failed to create event")
  }
}

// Function to update an event
export async function updateEvent(
  eventId: number,
  userId: string,
  title: string,
  description: string | null,
  date: string,
  startTime: string,
  endTime: string,
  color: string,
) {
  try {
    const result = await sql `
      UPDATE events
      SET title = ${title}, 
          description = ${description}, 
          date = ${date}, 
          start_time = ${startTime}, 
          end_time = ${endTime}, 
          color = ${color},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${eventId} AND user_id = ${userId}
      RETURNING *
    `
    return result[0]
  } catch (error) {
    console.error("Database error:", error)
    throw new Error("Failed to update event")
  }
}

// Function to delete an event
export async function deleteEvent(eventId: number, userId: string) {
  try {
    await sql`
      DELETE FROM events
      WHERE id = ${eventId} AND user_id = ${userId}
    `
    return true
  } catch (error) {
    console.error("Database error:", error)
    throw new Error("Failed to delete event")
  }
}

// Function to get events for a month
export async function getEventsByMonth(userId: string, year: number, month: number) {
  try {
    const startDate = `${year}-${month.toString().padStart(2, "0")}-01`

    // Adjust year if month is December (12)
    const nextMonth = month === 12 ? 1 : month + 1
    const nextYear = month === 12 ? year + 1 : year

    const endDate = `${nextYear}-${nextMonth.toString().padStart(2, "0")}-01`

    // Remove the generic type argument from sql
    const events = await sql`
      SELECT * FROM events 
      WHERE user_id = ${userId} 
      AND date >= ${startDate} 
      AND date < ${endDate}
      ORDER BY date ASC, start_time ASC
    `

    return events
  } catch (error) {
    console.error("Database error:", error)
    throw new Error("Failed to fetch events for month")
  }
}

