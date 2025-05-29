"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useData } from "@/lib/data-context"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ExcelUploader } from "@/components/excel-uploader"
import { DataTable } from "@/components/data-table"
import { DataVisualization } from "@/components/data-visualization"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Users, FileSpreadsheet, BarChart, Calendar, Tag, CheckCircle, FileText } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { getProject, updateProject, projectUsers, uploadExcelData, selectColumns } = useData()
  const [activeTab, setActiveTab] = useState("data")
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [projectData, setProjectData] = useState<any[]>([])

  const projectId = Number(params.id)
  const project = getProject(projectId)

  // Filter users for this project
  const projectUsersList = projectUsers.filter((pu) => pu.projectId === projectId)

  useEffect(() => {
    setIsAdmin(user?.role === "admin")
    setLoading(false)
  }, [user])

  useEffect(() => {
    if (!loading) {
      if (!project) {
        router.push("/dashboard/projects")
        return
      }

      // If user is not admin and this is not their assigned project, redirect
      if (user?.role !== "admin") {
        const userHasAccess = projectUsersList.some((pu) => pu.userId === user?.id)
        if (!userHasAccess) {
          router.push("/dashboard")
        }
      }
    }
  }, [project, router, user, projectId, loading, projectUsersList])

  // Fetch project data from Supabase
  useEffect(() => {
    if (project) {
      fetchProjectData()
    }
  }, [project])

  const fetchProjectData = async () => {
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
    }
  }

  if (loading || !project) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  const handleUploadData = async (data: any[]) => {
    await uploadExcelData(projectId, data)
    // Refresh project data after upload
    fetchProjectData()
  }

  const handleSelectColumns = async (columns: string[]) => {
    await selectColumns(projectId, columns)
  }

  const handleBackClick = () => {
    if (isAdmin) {
      router.push("/dashboard/projects")
    } else {
      router.push("/dashboard")
    }
  }

  // Get the appropriate file type icon based on data source
  const getFileTypeIcon = () => {
    if (project.data_source === "csv") {
      return <FileText className="h-4 w-4 text-muted-foreground" />
    }
    return <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
  }

  // Get the data source display name
  const getDataSourceName = () => {
    switch (project.data_source) {
      case "csv":
        return "CSV File"
      case "excel":
        return "Excel File"
      case "api":
        return "API Integration"
      case "database":
        return "Database Connection"
      default:
        return "Excel File"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={handleBackClick}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
            <p className="text-muted-foreground">{project.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {project.tags &&
            Array.isArray(project.tags) &&
            project.tags.map((tag: string, index: number) => (
              <Badge key={index} variant="secondary">
                {tag}
              </Badge>
            ))}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
          <TabsTrigger value="visualizations">Visualizations</TabsTrigger>
          {isAdmin && <TabsTrigger value="users">Users</TabsTrigger>}
          {isAdmin && <TabsTrigger value="settings">Settings</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Data Columns</CardTitle>
                {getFileTypeIcon()}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{project.selectedColumns.length}</div>
                <p className="text-xs text-muted-foreground">
                  Selected from {project.columns.length} available columns
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{projectUsersList.length}</div>
                <p className="text-xs text-muted-foreground">Users with access to this project</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Today</div>
                <p className="text-xs text-muted-foreground">{project.refreshFrequency || "Manual"} refresh</p>
              </CardContent>
            </Card>
          </div>

          {/* Selected Columns Section - Highlighted for both admin and users */}
          <Card className="border-brand-200 dark:border-brand-800">
            <CardHeader className="bg-brand-50 dark:bg-brand-900/20">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-brand-500 mr-2" />
                <CardTitle>Selected Data Columns</CardTitle>
              </div>
              <CardDescription>
                {isAdmin
                  ? "These columns will be visible to users assigned to this project"
                  : "The admin has selected these columns for you to view"}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {project.selectedColumns.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {project.selectedColumns.map((column: string) => (
                    <div key={column} className="flex items-center gap-2 p-3 bg-muted rounded-md">
                      <Tag className="h-4 w-4 text-brand-500" />
                      <span className="font-medium text-sm">{column}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  {isAdmin
                    ? "No columns selected yet. Go to the Data tab to select columns."
                    : "No data columns have been selected for this project yet."}
                </div>
              )}
              {isAdmin && project.selectedColumns.length > 0 && (
                <div className="mt-4 flex justify-end">
                  <Button variant="outline" size="sm" onClick={() => setActiveTab("data")}>
                    Manage Selected Columns
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Project Information</CardTitle>
              <CardDescription>Detailed information about this project</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Category</dt>
                  <dd className="text-sm font-semibold mt-1 capitalize">{project.category || "Retail"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Data Source</dt>
                  <dd className="text-sm font-semibold mt-1 capitalize">{getDataSourceName()}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Refresh Frequency</dt>
                  <dd className="text-sm font-semibold mt-1 capitalize">{project.refreshFrequency || "Manual"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Visibility</dt>
                  <dd className="text-sm font-semibold mt-1">{project.isPublic ? "Public" : "Private"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Created By</dt>
                  <dd className="text-sm font-semibold mt-1">Admin</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Created At</dt>
                  <dd className="text-sm font-semibold mt-1">{project.createdAt || "Today"}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          {isAdmin && (
            <ExcelUploader
              projectId={projectId}
              onUpload={handleUploadData}
              onSelectColumns={handleSelectColumns}
              existingColumns={project.columns}
              selectedColumns={project.selectedColumns}
            />
          )}

          {project.selectedColumns.length > 0 ? (
            <DataTable columns={project.selectedColumns} data={projectData} projectId={projectId} />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                {getFileTypeIcon()}
                <h3 className="text-lg font-medium mb-2 mt-4">No Data Columns Selected</h3>
                <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
                  {isAdmin
                    ? `Upload a ${project.data_source === "csv" ? "CSV" : "Excel"} file and select columns to display data here.`
                    : "No data columns have been selected for this project yet."}
                </p>
                {isAdmin && <Button onClick={() => setActiveTab("data")}>Upload Data</Button>}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="visualizations" className="space-y-6">
          {project.selectedColumns.length > 0 ? (
            <DataVisualization columns={project.selectedColumns} data={projectData} />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <BarChart className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Data Available for Visualization</h3>
                <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
                  {isAdmin
                    ? `Upload a ${project.data_source === "csv" ? "CSV" : "Excel"} file and select columns to create visualizations.`
                    : "No data columns have been selected for visualization yet."}
                </p>
                {isAdmin && <Button onClick={() => setActiveTab("data")}>Upload Data</Button>}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {isAdmin && (
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Project Users</CardTitle>
                <CardDescription>Manage users who have access to this project</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Button onClick={() => router.push(`/dashboard/projects/${projectId}/users`)}>
                    <Users className="h-4 w-4 mr-2" />
                    Manage Users
                  </Button>
                </div>

                {projectUsersList.length > 0 ? (
                  <div className="space-y-4">
                    {projectUsersList.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 border rounded-md">
                        <div>
                          <p className="font-medium">{user.email}</p>
                          <p className="text-sm text-muted-foreground capitalize">{user.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-8 text-muted-foreground">No users assigned to this project yet.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Project Settings</CardTitle>
                <CardDescription>Configure project settings and permissions</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center py-8 text-muted-foreground">
                  Project settings functionality will be implemented in a future update.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
