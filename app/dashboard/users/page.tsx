"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, UserPlus, Trash2, Mail, Shield, Search, Check } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase"

export default function UsersPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // New user form state
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    role: "user",
  })
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    // Redirect non-admin users
    if (user && user.role !== "admin") {
      router.push("/dashboard")
      return
    }

    fetchUsers()
  }, [user, router])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from("users").select("*")

      if (error) {
        console.error("Error fetching users:", error)
        setError("Failed to load users")
        return
      }

      setUsers(data || [])
    } catch (err) {
      console.error("Error in fetchUsers:", err)
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)
    setError("")
    setSuccess("")

    try {
      // Validate input
      if (!newUser.email || !newUser.password) {
        setError("Email and password are required")
        setIsCreating(false)
        return
      }

      // Check if user already exists
      const { data: existingUser } = await supabase.from("users").select("*").eq("email", newUser.email).single()

      if (existingUser) {
        setError("A user with this email already exists")
        setIsCreating(false)
        return
      }

      // Insert new user
      const { data, error } = await supabase
        .from("users")
        .insert({
          email: newUser.email,
          password: newUser.password, // In a real app, this should be hashed
          role: newUser.role,
        })
        .select()

      if (error) {
        console.error("Error creating user:", error)
        setError("Failed to create user")
        return
      }

      // Reset form and show success message
      setNewUser({
        email: "",
        password: "",
        role: "user",
      })
      setSuccess("User created successfully")
      fetchUsers() // Refresh user list
    } catch (err) {
      console.error("Error in handleCreateUser:", err)
      setError("An unexpected error occurred")
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteUser = async (id: number) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return
    }

    try {
      // Delete user
      const { error } = await supabase.from("users").delete().eq("id", id)

      if (error) {
        console.error("Error deleting user:", error)
        setError("Failed to delete user")
        return
      }

      setSuccess("User deleted successfully")
      fetchUsers() // Refresh user list
    } catch (err) {
      console.error("Error in handleDeleteUser:", err)
      setError("An unexpected error occurred")
    }
  }

  // Filter users based on active tab and search term
  const filteredUsers = users.filter((user) => {
    const matchesTab = activeTab === "all" || user.role === activeTab
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesTab && matchesSearch
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">Create and manage user accounts</p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
          <Check className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Create New User</CardTitle>
            <CardDescription>Add a new user to the system</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">
                      <div className="flex items-center">
                        <span>Admin</span>
                        <Badge variant="outline" className="ml-2 bg-purple-100 text-purple-800">
                          Full access
                        </Badge>
                      </div>
                    </SelectItem>
                    <SelectItem value="user">
                      <div className="flex items-center">
                        <span>User</span>
                        <Badge variant="outline" className="ml-2">
                          Limited access
                        </Badge>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={isCreating}>
                <UserPlus className="h-4 w-4 mr-2" />
                {isCreating ? "Creating..." : "Create User"}
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
                  <Badge className="mr-2 bg-purple-100 text-purple-800 hover:bg-purple-100">Admin</Badge>
                </h3>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• Create and manage projects</li>
                  <li>• Assign users to projects</li>
                  <li>• Control column visibility</li>
                  <li>• Create and manage users</li>
                  <li>• Full system access</li>
                </ul>
              </div>

              <div className="p-4 border rounded-md">
                <h3 className="font-medium flex items-center">
                  <Badge className="mr-2 bg-blue-100 text-blue-800 hover:bg-blue-100">User</Badge>
                </h3>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• View assigned projects</li>
                  <li>• See only columns selected by admin</li>
                  <li>• View data visualizations</li>
                  <li>• Cannot create or manage projects</li>
                  <li>• Cannot manage users</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle>Manage Users</CardTitle>
            <CardDescription>View and manage all users in the system</CardDescription>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">All Users ({users.length})</TabsTrigger>
              <TabsTrigger value="admin">Admins ({users.filter((u) => u.role === "admin").length})</TabsTrigger>
              <TabsTrigger value="user">Users ({users.filter((u) => u.role === "user").length})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              {filteredUsers.length > 0 ? (
                <div className="space-y-4">
                  {filteredUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-md">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-brand-100 flex items-center justify-center">
                          <Mail className="h-5 w-5 text-brand-600" />
                        </div>
                        <div>
                          <p className="font-medium">{user.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant="outline"
                              className={`capitalize ${
                                user.role === "admin" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              <Shield className="h-3 w-3 mr-1" />
                              {user.role}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/dashboard/users/${user.id}/projects`)}
                        >
                          Manage Projects
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">No users found</div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <p className="text-sm text-muted-foreground">
            Total users: {users.length} • Admins: {users.filter((u) => u.role === "admin").length} • Users:{" "}
            {users.filter((u) => u.role === "user").length}
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
