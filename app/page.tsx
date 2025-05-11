import { redirect } from "next/navigation"
import { Calendar } from "@/components/calendar"
import { Header } from "@/components/header"
import { getEventsByMonth } from "@/lib/db"
import { getServerSession } from "next-auth/next"

export default async function Home() {
  const session = await getServerSession()

  if (!session || !session.user) {
    redirect("/login")
  }

  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth()

  // Use a default ID if user.id is not available
  const userId = session.user.id || "anonymous"

  const events = await getEventsByMonth(userId, currentYear, currentMonth)

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header user={session.user} />

      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">My Day Planner</h1>

        <div className="bg-white rounded-lg shadow p-6">
          <Calendar events={events} userId={userId} />
        </div>
      </main>

      <footer className="bg-white border-t py-4">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Day Planner App
        </div>
      </footer>
    </div>
  )
}
