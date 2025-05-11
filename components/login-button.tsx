"use client"

import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"

export function LoginButton() {
  return (
    <Button className="w-full" onClick={() => signIn("google", { callbackUrl: "/" })}>
      Sign in with Google
    </Button>
  )
}
