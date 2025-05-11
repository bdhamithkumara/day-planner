import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { getServerSession } from "next-auth/next"
import { LoginButton } from "@/components/login-button"

export default async function LoginPage() {
  const session = await getServerSession()

  if (session) {
    redirect("/")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight">Day Planner</CardTitle>
          <CardDescription>Sign in to start planning your day</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <LoginButton />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-center justify-center space-y-2">
          <p className="text-sm text-muted-foreground">Plan your day in 15-minute increments</p>
        </CardFooter>
      </Card>
    </div>
  )
}
