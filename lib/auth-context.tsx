"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

type User = {
  id: number | string // Allow both number and string types
  email: string
  role: "admin" | "user"
}

type AuthContextType = {
  user: User | null
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check for stored user on mount
    const checkStoredUser = () => {
      try {
        const storedUser = localStorage.getItem("user")
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser)
          // Ensure user ID is stored as string
          if (parsedUser && parsedUser.id) {
            parsedUser.id = String(parsedUser.id)
            setUser(parsedUser)
          }
        }
      } catch (error) {
        console.error("Error parsing stored user:", error)
        localStorage.removeItem("user")
      } finally {
        setIsLoading(false)
      }
    }

    checkStoredUser()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true)

      // Check if the user exists in our database
      const { data: userData, error: userError } = await supabase.from("users").select("*").eq("email", email).single()

      if (userError) {
        console.error("Error checking user:", userError)
        return { success: false, error: "User not found. Please check your email." }
      }

      // Check password
      if (userData.password !== password) {
        return { success: false, error: "Invalid password" }
      }

      // Create user object
      const userObj = {
        id: String(userData.id),
        email: userData.email,
        role: userData.role,
      }

      // Store user info in localStorage
      localStorage.setItem("user", JSON.stringify(userObj))

      // Update state
      setUser(userObj)

      // Wait a bit to ensure state is updated
      await new Promise((resolve) => setTimeout(resolve, 100))

      return { success: true }
    } catch (err) {
      console.error("Login error:", err)
      return { success: false, error: "An error occurred during login" }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("user")
    router.push("/login")
  }

  return <AuthContext.Provider value={{ user, login, logout, isLoading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
