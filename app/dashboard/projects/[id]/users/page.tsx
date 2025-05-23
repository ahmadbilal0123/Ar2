"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useData } from "@/lib/data-context"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, UserPlus, Trash2, Mail, Shield, Clock } from "lucide-react"
import Link from "next/link"

export default function ProjectUsersPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { getProject, projectUsers, addUserToProject, removeUserFromProject } = useData()

  const [email, setEmail] = useState("")
  const [role, setRole] = useState("viewer")
  const [isAdding, setIsAdding] = useState(false)
  const [activeTab, setActiveTab] = useState("all")

  const projectId = Number(params.id)
  const project = getProject(projectId)

  // Filter users for this project
  const allProjectUsers = projectUsers.filter((pu) => pu.projectId === projectId)

  // Filter users based on active tab
  const filteredUsers =
    activeTab === "all" ? allProjectUsers : allProjectUsers.filter((user) => user.role === activeTab)

  useEffect(() => {
    if (!project) {
      router.push("/dashboard/projects")
      return
    }

    // Redirect non-admin users
    if (user?.role !== "admin") {
      router.push("/dashboard")
    }
  }, [project, user, router])

  if (!project || user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault()
    setIsAdding(true)

    try {
      addUserToProject(projectId, email, role)
      setEmail("")
      setRole("viewer")
      alert("User added successfully!")
    } catch (error) {
      console.error("Error adding user:", error)
      alert("Failed to add user. Please try again.")
    } finally {
      setIsAdding(false)
    }
  }

  const handleRemoveUser = (id: number) => {
    if (confirm("Are you sure you want to remove this user from the project?")) {
      removeUserFromProject(id)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Link href={`/dashboard/projects/${projectId}`} className="mr-4">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage Users</h1>
          <p className="text-muted-foreground">Project: {project.name}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Add User to Project</CardTitle>
            <CardDescription>Invite users to collaborate on this project</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">User Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={role} onValueChange={setRole}>
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
              <Button type="submit" className="w-full" disabled={isAdding}>
                <UserPlus className="h-4 w-4 mr-2" />
                {isAdding ? "Adding..." : "Add User"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Role Permissions</CardTitle>
            <CardDescription>Understanding user access levels</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 border rounded-md">
                <h3 className="font-medium flex items-center">
                  <Badge className="mr-2 bg-green-100 text-green-800 hover:bg-green-100">Viewer</Badge>
                </h3>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• View project data and visualizations</li>
                  <li>• Cannot modify data or settings</li>
                  <li>• Cannot add or remove users</li>
                </ul>
              </div>

              <div className="p-4 border rounded-md">
                <h3 className="font-medium flex items-center">
                  <Badge className="mr-2 bg-blue-100 text-blue-800 hover:bg-blue-100">Editor</Badge>
                </h3>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• All Viewer permissions</li>
                  <li>• Upload and modify data</li>
                  <li>• Select columns for analysis</li>
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
                  <li>• Delete the project</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Users</CardTitle>
          <CardDescription>Users with access to this project</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">All Users ({allProjectUsers.length})</TabsTrigger>
              <TabsTrigger value="admin">
                Admins ({allProjectUsers.filter((u) => u.role === "admin").length})
              </TabsTrigger>
              <TabsTrigger value="editor">
                Editors ({allProjectUsers.filter((u) => u.role === "editor").length})
              </TabsTrigger>
              <TabsTrigger value="viewer">
                Viewers ({allProjectUsers.filter((u) => u.role === "viewer").length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              {filteredUsers.length > 0 ? (
                <div className="space-y-4">
                  {filteredUsers.map((projectUser) => (
                    <div key={projectUser.id} className="flex items-center justify-between p-4 border rounded-md">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-brand-100 flex items-center justify-center">
                          <Mail className="h-5 w-5 text-brand-600" />
                        </div>
                        <div>
                          <p className="font-medium">{projectUser.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant="outline"
                              className={`capitalize ${
                                projectUser.role === "admin"
                                  ? "bg-purple-100 text-purple-800"
                                  : projectUser.role === "editor"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-green-100 text-green-800"
                              }`}
                            >
                              <Shield className="h-3 w-3 mr-1" />
                              {projectUser.role}
                            </Badge>
                            <span className="text-xs text-muted-foreground flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              Added recently
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveUser(projectUser.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">No users found in this category</div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
