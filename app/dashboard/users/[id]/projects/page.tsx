"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useData } from "@/lib/data-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, FolderKanban, Check, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

export default function UserProjectsPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { projects, projectUsers, addUserToProject, removeUserFromProject } = useData()

  const [userData, setUserData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Form state
  const [selectedProject, setSelectedProject] = useState<number | null>(null)
  const [selectedRole, setSelectedRole] = useState("viewer")
  const [isAssigning, setIsAssigning] = useState(false)

  const userId = params.id as string

  // Get user's assigned projects
  const userProjectAssignments = projectUsers.filter((pu) => String(pu.userId) === String(userId))

  // Get projects not yet assigned to this user
  const availableProjects = projects.filter(
    (project) => !userProjectAssignments.some((upa) => upa.projectId === project.id),
  )

  useEffect(() => {
    // Redirect non-admin users
    if (user && user.role !== "admin") {
      router.push("/dashboard")
      return
    }

    fetchUserData()
  }, [user, router, userId])

  const fetchUserData = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from("users").select("*").eq("id", userId).single()

      if (error) {
        console.error("Error fetching user:", error)
        setError("Failed to load user data")
        return
      }

      setUserData(data)

      // Set default project if available
      if (availableProjects.length > 0) {
        setSelectedProject(availableProjects[0].id)
      }
    } catch (err) {
      console.error("Error in fetchUserData:", err)
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleAssignProject = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsAssigning(true)
    setError("")
    setSuccess("")

    try {
      if (!selectedProject) {
        setError("Please select a project")
        setIsAssigning(false)
        return
      }

      await addUserToProject(selectedProject, userData.email, selectedRole)
      setSuccess("Project assigned successfully")

      // Reset form
      if (availableProjects.length > 1) {
        const nextProject = availableProjects.find((p) => p.id !== selectedProject)
        setSelectedProject(nextProject ? nextProject.id : null)
      } else {
        setSelectedProject(null)
      }
    } catch (err) {
      console.error("Error assigning project:", err)
      setError("Failed to assign project")
    } finally {
      setIsAssigning(false)
    }
  }

  const handleRemoveProject = async (assignmentId: number) => {
    if (!confirm("Are you sure you want to remove this project assignment?")) {
      return
    }

    try {
      await removeUserFromProject(assignmentId)
      setSuccess("Project removed successfully")
    } catch (err) {
      console.error("Error removing project:", err)
      setError("Failed to remove project")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center">
          <Link href="/dashboard/users" className="mr-4">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Not Found</h1>
            <p className="text-muted-foreground">The requested user could not be found</p>
          </div>
        </div>
        <Button onClick={() => router.push("/dashboard/users")}>Return to User Management</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Link href="/dashboard/users" className="mr-4">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage User Projects</h1>
          <p className="text-muted-foreground">
            User: <span className="font-medium">{userData.email}</span> ({userData.role})
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 text-green-800 border-green-200">
          <Check className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Assign Project</CardTitle>
            <CardDescription>Give this user access to a project</CardDescription>
          </CardHeader>
          <CardContent>
            {availableProjects.length > 0 ? (
              <form onSubmit={handleAssignProject} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="project">Project</Label>
                  <Select
                    value={selectedProject?.toString() || ""}
                    onValueChange={(value) => setSelectedProject(Number(value))}
                  >
                    <SelectTrigger id="project">
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableProjects.map((project) => (
                        <SelectItem key={project.id} value={project.id.toString()}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">
                        <div className="flex items-center">
                          <span>Viewer</span>
                          <Badge variant="outline" className="ml-2">
                            Read-only
                          </Badge>
                        </div>
                      </SelectItem>
                      <SelectItem value="editor">
                        <div className="flex items-center">
                          <span>Editor</span>
                          <Badge variant="outline" className="ml-2">
                            Can edit data
                          </Badge>
                        </div>
                      </SelectItem>
                      <SelectItem value="admin">
                        <div className="flex items-center">
                          <span>Admin</span>
                          <Badge variant="outline" className="ml-2">
                            Full access
                          </Badge>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={isAssigning || !selectedProject}>
                  {isAssigning ? "Assigning..." : "Assign Project"}
                </Button>
              </form>
            ) : (
              <div className="text-center py-8 text-muted-foreground">No more projects available to assign</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Role Permissions</CardTitle>
            <CardDescription>Understanding project access levels</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 border rounded-md">
                <h3 className="font-medium flex items-center">
                  <Badge className="mr-2 bg-green-100 text-green-800 hover:bg-green-100">Viewer</Badge>
                </h3>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• View project data and visualizations</li>
                  <li>• Only see columns selected by admin</li>
                  <li>• Cannot modify data or settings</li>
                </ul>
              </div>

              <div className="p-4 border rounded-md">
                <h3 className="font-medium flex items-center">
                  <Badge className="mr-2 bg-blue-100 text-blue-800 hover:bg-blue-100">Editor</Badge>
                </h3>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• All Viewer permissions</li>
                  <li>• Upload and modify data</li>
                  <li>• Cannot manage users or settings</li>
                </ul>
              </div>

              <div className="p-4 border rounded-md">
                <h3 className="font-medium flex items-center">
                  <Badge className="mr-2 bg-purple-100 text-purple-800 hover:bg-purple-100">Admin</Badge>
                </h3>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• All Editor permissions</li>
                  <li>• Add and remove users</li>
                  <li>• Modify project settings</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assigned Projects</CardTitle>
          <CardDescription>Projects this user has access to</CardDescription>
        </CardHeader>
        <CardContent>
          {userProjectAssignments.length > 0 ? (
            <div className="space-y-4">
              {userProjectAssignments.map((assignment) => {
                const project = projects.find((p) => p.id === assignment.projectId)
                return (
                  <div key={assignment.id} className="flex items-center justify-between p-4 border rounded-md">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-brand-100 flex items-center justify-center">
                        <FolderKanban className="h-5 w-5 text-brand-600" />
                      </div>
                      <div>
                        <p className="font-medium">{project ? project.name : "Unknown Project"}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant="outline"
                            className={`capitalize ${
                              assignment.role === "admin"
                                ? "bg-purple-100 text-purple-800"
                                : assignment.role === "editor"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-green-100 text-green-800"
                            }`}
                          >
                            {assignment.role}
                          </Badge>
                          {project && (
                            <span className="text-xs text-muted-foreground">
                              {project.selectedColumns.length} columns visible
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/dashboard/projects/${assignment.projectId}`)}
                      >
                        View Project
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveProject(assignment.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              This user has not been assigned to any projects yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
