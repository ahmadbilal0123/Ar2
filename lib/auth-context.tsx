"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"

type User = {
  id: number | string // Allow both number and string types
  email: string
  role: "admin" | "user"
}

type AuthContextType = {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Check for stored user on mount
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser)
      // Ensure user ID is stored as string
      if (parsedUser && parsedUser.id) {
        parsedUser.id = String(parsedUser.id)
      }
      setUser(parsedUser)
      setIsAuthenticated(true)
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    // This is handled in the login page now
    return true
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("user")
    setIsAuthenticated(false)
    router.push("/login")
  }

  // Add debugging for auth state
  useEffect(() => {
    console.log("Auth state updated:", {
      isAuthenticated,
      user,
      isLoading,
    })
  }, [isAuthenticated, user, isLoading])

  return <AuthContext.Provider value={{ user, login, logout, isLoading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
