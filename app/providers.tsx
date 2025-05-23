"use client"

import type React from "react"

import { AuthProvider } from "@/lib/auth-context"
import { DataProvider } from "@/lib/data-context"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DataProvider>{children}</DataProvider>
    </AuthProvider>
  )
}
