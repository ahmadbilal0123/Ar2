"use client"

import { useAuth } from "@/lib/auth-context"
import { useData } from "@/lib/data-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, FileSpreadsheet, UserPlus, PenSquare } from 'lucide-react'

export default function ProjectsPage() {
  const { user } = useAuth()
  const { projects, projectUsers, deleteProject } = useData()
  const router = useRouter()

  // Redirect non-admin users
  useEffect(() => {
    if (user && user.role !== "admin") {
      router.push("/dashboard")
    }
  }, [user, router])

  if (user?.role !== "admin") {
    return null
  }

  // Sort projects by creation date (newest first)
  const sortedProjects = [...projects].sort((a, b) => {
    const dateA = new Date(a.created_at || 0).getTime()
    const dateB = new Date(b.created_at || 0).getTime()
    return dateB - dateA // Newest first
  })

  const handleDeleteProject = (id: number) => {
    if (confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      deleteProject(id)
    }
  }

  const handleViewProject = (id: number) => {
    router.push(`/dashboard/projects/${id}`)
  }

  const handleCreateUser = () => {
    router.push(`/dashboard/users`)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">Manage your data projects</p>
        </div>
        <Button onClick={() => router.push("/dashboard/projects/new")}>Create New Project</Button>
      </div>

      <div className="grid gap-6">
        {sortedProjects.length > 0 ? (
          sortedProjects.map((project) => {
            const projectUserCount = projectUsers.filter((pu) => pu.projectId === project.id).length

            return (
              <Card key={project.id} className="transition-all duration-200 hover:shadow-md">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{project.name}</CardTitle>
                      <CardDescription className="mt-1">{project.description}</CardDescription>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {project.created_at && (
                        <span>Created: {new Date(project.created_at).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Columns</p>
                        <p className="text-sm text-muted-foreground">
                          {project.selectedColumns.length} selected / {project.columns.length} total
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <UserPlus className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Users</p>
                        <p className="text-sm text-muted-foreground">{projectUserCount} assigned</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 flex items-center justify-center">
                        <div className={`h-2 w-2 rounded-full ${project.data_source === 'csv' ? 'bg-green-500' : 'bg-blue-500'}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Data Source</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {project.data_source || 'Excel'} File
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" size="sm" onClick={() => handleDeleteProject(project.id)}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleCreateUser}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Create a User
                    </Button>
                    <Button size="sm" onClick={() => handleViewProject(project.id)}>
                      <PenSquare className="h-4 w-4 mr-2" />
                      View Project
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            )
          })
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>No Projects</CardTitle>
              <CardDescription>You haven't created any projects yet.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center py-8 text-muted-foreground">Get started by creating your first project.</p>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button onClick={() => router.push("/dashboard/projects/new")}>Create New Project</Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  )
}
