"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useData } from "@/lib/data-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FolderKanban, Users, BarChart4, FileSpreadsheet, ChevronRight, PlusCircle, UserPlus } from "lucide-react"
import { DataTable } from "@/components/data-table"
import { DataVisualization } from "@/components/data-visualization"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function DashboardPage() {
  const { user } = useAuth()
  const { projects, projectUsers, isLoading } = useData()
  const router = useRouter()
  const [projectData, setProjectData] = useState<any[]>([])
  const [dataLoading, setDataLoading] = useState(false)
  const [userAccessibleProjects, setUserAccessibleProjects] = useState<any[]>([])
  const [selectedProjectIndex, setSelectedProjectIndex] = useState(0)

  const isAdmin = user?.role === "admin"

  // Get projects the user has access to
  useEffect(() => {
    if (user && !isLoading) {
      if (isAdmin) {
        // Admins can see all projects
        setUserAccessibleProjects(projects)
      } else {
        // Regular users can only see projects they're assigned to
        console.log("Current user ID:", user.id, "Type:", typeof user.id)
        console.log("Project users:", projectUsers)

        // More robust filtering that handles both string and number IDs
        const assignedProjectIds = projectUsers
          .filter((pu) => {
            const puUserId = String(pu.userId)
            const currentUserId = String(user.id)
            return puUserId === currentUserId
          })
          .map((pu) => pu.projectId)

        console.log("Assigned project IDs:", assignedProjectIds)

        const accessibleProjects = projects.filter((p) => assignedProjectIds.includes(p.id))
        console.log("Accessible projects:", accessibleProjects)

        setUserAccessibleProjects(accessibleProjects)
      }
    }
  }, [user, projects, projectUsers, isLoading, isAdmin])

  // Fetch data for the selected project
  useEffect(() => {
    if (userAccessibleProjects.length > 0 && user) {
      const projectIndex = Math.min(selectedProjectIndex, userAccessibleProjects.length - 1)
      fetchProjectData(userAccessibleProjects[projectIndex].id)
    }
  }, [userAccessibleProjects, user, selectedProjectIndex])

  const fetchProjectData = async (projectId: number) => {
    setDataLoading(true)
    try {
      const { data, error } = await supabase
        .from("project_data")
        .select("row_data")
        .eq("project_id", projectId)
        .limit(100) // Limit to 100 rows for performance

      if (error) {
        console.error("Error fetching project data:", error)
        return
      }

      // Extract row_data from each record
      const rowData = data.map((item) => item.row_data)
      setProjectData(rowData)
    } catch (error) {
      console.error("Error in fetchProjectData:", error)
    } finally {
      setDataLoading(false)
    }
  }

  const handleViewProject = (projectId: number) => {
    router.push(`/dashboard/projects/${projectId}`)
  }

  const handleCreateProject = () => {
    router.push("/dashboard/projects/new")
  }

  const handleCreateUser = () => {
    router.push("/dashboard/users")
  }

  const handleSelectProject = (index: number) => {
    setSelectedProjectIndex(index)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Welcome back, {isAdmin ? "Admin" : user?.email}!</p>
        </div>
        {isAdmin && (
          <Button onClick={handleCreateProject} className="w-full sm:w-auto">
            <PlusCircle className="h-4 w-4 mr-2" />
            Create New Project
          </Button>
        )}
      </div>

      <div className="grid gap-4 grid-cols-1 xs:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Projects</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userAccessibleProjects.length}</div>
            <p className="text-xs text-muted-foreground">
              {isAdmin ? "Projects you've created" : "Projects you have access to"}
            </p>
          </CardContent>
        </Card>

        {isAdmin && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projectUsers.length}</div>
              <p className="text-xs text-muted-foreground">Users assigned to projects</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Columns</CardTitle>
            <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userAccessibleProjects.reduce((acc, project) => acc + project.selectedColumns.length, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Selected columns across projects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visualizations</CardTitle>
            <BarChart4 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userAccessibleProjects.length * 2}</div>
            <p className="text-xs text-muted-foreground">Available data visualizations</p>
          </CardContent>
        </Card>
      </div>

      {/* Admin Quick Actions */}
      {isAdmin && (
        <Card className="bg-brand-50 dark:bg-gray-800/50 border-brand-200 dark:border-brand-800/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Admin Quick Actions</CardTitle>
            <CardDescription>Manage your projects and users quickly</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Button className="w-full h-10" onClick={handleCreateProject}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Create New Project
              </Button>
              <Button variant="outline" className="w-full h-10" onClick={() => router.push("/dashboard/projects")}>
                <FolderKanban className="h-4 w-4 mr-2" />
                Manage Projects
              </Button>
              <Button variant="outline" className="w-full h-10" onClick={handleCreateUser}>
                <UserPlus className="h-4 w-4 mr-2" />
                Create a User
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Projects Section */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-2">
          <div>
            <CardTitle className="text-lg sm:text-xl">Your Projects</CardTitle>
            <CardDescription className="text-sm">
              {isAdmin ? "Projects you've created and manage" : "Projects assigned to you by an admin"}
            </CardDescription>
          </div>
          {isAdmin && (
            <Button size="sm" onClick={handleCreateProject} className="w-full sm:w-auto">
              <PlusCircle className="h-4 w-4 mr-2" />
              New Project
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          {userAccessibleProjects.length > 0 ? (
            <ScrollArea className="w-full" type="always">
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 min-w-[600px]">
                {userAccessibleProjects.map((project, index) => (
                  <Card
                    key={project.id}
                    className={`overflow-hidden border-2 transition-all ${
                      selectedProjectIndex === index
                        ? "border-brand-500 dark:border-brand-400 shadow-md"
                        : "border-transparent"
                    }`}
                    onClick={() => handleSelectProject(index)}
                  >
                    <CardHeader className="bg-brand-50 dark:bg-gray-800 p-3 sm:p-4">
                      <CardTitle className="text-base sm:text-lg truncate">{project.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4">
                      <p className="text-xs sm:text-sm text-muted-foreground mb-3 line-clamp-2">
                        {project.description}
                      </p>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-xs text-muted-foreground">{project.selectedColumns.length} columns</p>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="p-3 pt-0 sm:p-4 sm:pt-0">
                      <Button
                        size="sm"
                        className="text-xs h-8 w-full"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleViewProject(project.id)
                        }}
                      >
                        View Project
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No projects found</p>
              {isAdmin && (
                <Button className="mt-4" onClick={handleCreateProject}>
                  Create New Project
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* User's Project Data Section */}
      {userAccessibleProjects.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                {userAccessibleProjects[selectedProjectIndex]?.name} Data
              </h2>
              <p className="text-sm text-muted-foreground">Viewing data for the selected project</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleViewProject(userAccessibleProjects[selectedProjectIndex].id)}
              className="w-full sm:w-auto"
            >
              View Full Project <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {userAccessibleProjects[selectedProjectIndex]?.selectedColumns.length > 0 ? (
            <>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base sm:text-lg">Selected Data Columns</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    The admin has selected these columns for your view
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="w-full max-h-[120px]">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 min-w-[400px]">
                      {userAccessibleProjects[selectedProjectIndex].selectedColumns.map((column: string) => (
                        <div key={column} className="bg-muted rounded-md p-2 text-xs sm:text-sm font-medium truncate">
                          {column}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base sm:text-lg">Data Table</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      View your project data in tabular format
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0 sm:p-4">
                    {dataLoading ? (
                      <div className="flex justify-center items-center py-12">
                        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <DataTable
                          columns={userAccessibleProjects[selectedProjectIndex].selectedColumns}
                          data={projectData}
                          projectId={userAccessibleProjects[selectedProjectIndex].id}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base sm:text-lg">Data Visualization</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Visual representation of your project data
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {dataLoading ? (
                      <div className="flex justify-center items-center py-12">
                        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : (
                      <div className="w-full overflow-x-auto">
                        <div className="min-w-[300px]">
                          <DataVisualization
                            columns={userAccessibleProjects[selectedProjectIndex].selectedColumns}
                            data={projectData}
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <FileSpreadsheet className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Data Columns Selected</h3>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  The admin has not selected any data columns for this project yet.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
