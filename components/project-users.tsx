"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, UserPlus } from "lucide-react"
import { Label } from "@/components/ui/label"

interface ProjectUser {
  id: number
  projectId: number
  userId: number
  email: string
  role: string
}

interface ProjectUsersProps {
  projectId: number
  users: ProjectUser[]
  onAddUser: (projectId: number, email: string, role: string) => void
  onRemoveUser: (id: number) => void
}

export function ProjectUsers({ projectId, users, onAddUser, onRemoveUser }: ProjectUsersProps) {
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("viewer")
  const [isAdding, setIsAdding] = useState(false)

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault()
    setIsAdding(true)

    try {
      onAddUser(projectId, email, role)
      setEmail("")
      setRole("viewer")
    } catch (error) {
      console.error("Error adding user:", error)
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add User to Project</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddUser} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2 md:col-span-2">
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
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isAdding}>
                <UserPlus className="h-4 w-4 mr-2" />
                {isAdding ? "Adding..." : "Add User"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Project Users</CardTitle>
        </CardHeader>
        <CardContent>
          {users.length > 0 ? (
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-md">
                  <div>
                    <p className="font-medium">{user.email}</p>
                    <p className="text-sm text-muted-foreground capitalize">{user.role}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => onRemoveUser(user.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-8 text-muted-foreground">No users assigned to this project yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
