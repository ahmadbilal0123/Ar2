"use client"

import type React from "react"

import { useAuth } from "@/lib/auth-context"
import { useData } from "@/lib/data-context"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, FolderKanban, BarChart, LogOut, Menu, X, Moon, Sun, UserPlus } from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, logout, isLoading } = useAuth()
  const { projects, projectUsers, isLoading: dataLoading } = useData()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const [userProjects, setUserProjects] = useState<any[]>([])
  const [authChecked, setAuthChecked] = useState(false)

  // Handle authentication check
  useEffect(() => {
    if (!isLoading) {
      setAuthChecked(true)
      if (!user) {
        router.push("/login")
      }
    }
  }, [user, isLoading, router])

  // Get projects the user has access to
  useEffect(() => {
    if (user && !dataLoading) {
      if (user.role === "admin") {
        // Admins can see all projects
        setUserProjects(projects)
      } else {
        // Regular users can only see projects they're assigned to
        const assignedProjectIds = projectUsers.filter((pu) => pu.userId === user.id).map((pu) => pu.projectId)

        const accessibleProjects = projects.filter((p) => assignedProjectIds.includes(p.id))
        setUserProjects(accessibleProjects)
      }
    }
  }, [user, projects, projectUsers, dataLoading])

  // Show loading while checking authentication
  if (isLoading || !authChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  // Don't render if not authenticated
  if (!user) {
    return null
  }

  const isAdmin = user.role === "admin"

  // Determine if the current path is a project detail page
  const isProjectPage = pathname.includes("/dashboard/projects/") && !pathname.includes("/new")

  // Build navigation based on user role and assigned projects
  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ...(isAdmin
      ? [
          { name: "Projects", href: "/dashboard/projects", icon: FolderKanban },
          { name: "Create a User", href: "/dashboard/users", icon: UserPlus },
        ]
      : [
          // For regular users, add direct links to their assigned projects
          ...(userProjects.length > 0
            ? userProjects.map((project) => ({
                name: project.name,
                href: `/dashboard/projects/${project.id}`,
                icon: FolderKanban,
              }))
            : []),
        ]),
    { name: "Analytics", href: "/dashboard/analytics", icon: BarChart },
  ]

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const handleNavLinkClick = () => {
    setSidebarOpen(false)
  }

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar toggle - fixed position */}
      <div className="fixed top-4 right-4 z-50 md:hidden">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full bg-white dark:bg-gray-800 shadow-md"
          onClick={handleSidebarToggle}
          aria-label={sidebarOpen ? "Close menu" : "Open menu"}
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar for mobile - overlay style */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={handleSidebarToggle} aria-hidden="true" />
      )}

      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 ease-in-out bg-white dark:bg-gray-800 md:translate-x-0 md:static md:z-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4">
            <h1 className="text-xl font-bold text-brand-600 dark:text-brand-400">Data Management</h1>
          </div>
          <div className="flex-1 overflow-y-auto">
            <nav className="space-y-1 px-2">
              {navigation.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (isProjectPage && item.href.includes("/dashboard/projects/") && !item.href.includes("/new"))

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center px-3 py-3 text-sm font-medium rounded-md",
                      isActive
                        ? "bg-brand-100 text-brand-600 dark:bg-gray-700 dark:text-brand-400"
                        : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700",
                    )}
                    onClick={handleNavLinkClick}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>
          <div className="flex flex-shrink-0 border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center">
              <div className="ml-3 flex flex-col">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{user.email}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user.role}</p>
              </div>
            </div>
            <div className="ml-auto flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="h-9 w-9 rounded-full"
                aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              >
                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="h-9 w-9 rounded-full"
                aria-label="Log out"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto pt-16 md:pt-0">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">{children}</div>
          </div>
        </main>
      </div>
    </div>
  )
}
