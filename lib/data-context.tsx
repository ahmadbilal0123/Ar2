"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"
import { useAuth } from "./auth-context"
import { supabase } from "./supabase"

type Project = {
  id: number
  name: string
  description: string
  created_by: number // Changed from string to number
  columns: string[]
  selectedColumns: string[]
  category?: string
  is_public?: boolean
  data_source?: string
  refresh_frequency?: string
  tags?: string[]
  created_at?: string
}

type ProjectUser = {
  id: number
  projectId: number
  userId: string
  email: string
  role: string
}

type DataContextType = {
  projects: Project[]
  getProject: (id: number) => Project | undefined
  createProject: (project: Omit<Project, "id" | "columns" | "selectedColumns" | "created_by">) => Promise<number>
  updateProject: (id: number, project: Partial<Project>) => Promise<void>
  deleteProject: (id: number) => Promise<void>
  uploadExcelData: (projectId: number, data: any[]) => Promise<void>
  selectColumns: (projectId: number, columns: string[]) => Promise<void>
  projectUsers: ProjectUser[]
  addUserToProject: (projectId: number, email: string, role: string) => Promise<void>
  removeUserFromProject: (id: number) => Promise<void>
  getUserProjects: () => Promise<Project[]>
  isLoading: boolean
}

const DataContext = createContext<DataContextType | undefined>(undefined)

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [projectUsers, setProjectUsers] = useState<ProjectUser[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch projects and project users when the user changes
  useEffect(() => {
    if (user) {
      fetchProjects()
      fetchProjectUsers()
    } else {
      setProjects([])
      setProjectUsers([])
    }
  }, [user])

  // Fetch projects from Supabase
  const fetchProjects = async () => {
    setIsLoading(true)
    try {
      if (!user) return

      let query = supabase.from("projects").select("*").order("created_at", { ascending: false })

      // If user is not admin, only fetch projects they have access to
      if (user.role !== "admin") {
        const { data: userProjects } = await supabase.from("project_users").select("project_id").eq("user_id", user.id)

        if (!userProjects || userProjects.length === 0) {
          setProjects([])
          setIsLoading(false)
          return
        }

        const projectIds = userProjects.map((p) => p.project_id)
        query = query.in("id", projectIds)
      }

      const { data, error } = await query

      if (error) {
        console.error("Error fetching projects:", error)
        return
      }

      // For each project, fetch its columns
      const projectsWithColumns = await Promise.all(
        data.map(async (project) => {
          const { data: columnsData, error: columnsError } = await supabase
            .from("project_columns")
            .select("column_name, is_selected")
            .eq("project_id", project.id)

          if (columnsError) {
            console.error("Error fetching columns:", columnsError)
            return {
              ...project,
              columns: [],
              selectedColumns: [],
            }
          }

          const allColumns = columnsData.map((c) => c.column_name)
          const selectedColumns = columnsData.filter((c) => c.is_selected).map((c) => c.column_name)

          return {
            ...project,
            created_by: project.created_by,
            columns: allColumns,
            selectedColumns: selectedColumns,
            category: project.category,
            is_public: project.is_public,
            data_source: project.data_source,
            refresh_frequency: project.refresh_frequency,
            created_at: project.created_at,
          }
        }),
      )

      setProjects(projectsWithColumns)
    } catch (error) {
      console.error("Error in fetchProjects:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch project users from Supabase
  const fetchProjectUsers = async () => {
    try {
      if (!user) return

      let query = supabase.from("project_users").select("*")

      // If user is not admin, only fetch users for projects they have access to
      if (user.role !== "admin") {
        const { data: userProjects } = await supabase.from("project_users").select("project_id").eq("user_id", user.id)

        if (!userProjects || userProjects.length === 0) {
          setProjectUsers([])
          return
        }

        const projectIds = userProjects.map((p) => p.project_id)
        query = query.in("project_id", projectIds)
      }

      const { data, error } = await query

      if (error) {
        console.error("Error fetching project users:", error)
        return
      }

      const formattedUsers = data.map((pu) => ({
        id: pu.id,
        projectId: pu.project_id,
        userId: String(pu.user_id), // Ensure userId is stored as string
        email: pu.email,
        role: pu.role,
      }))

      console.log("Fetched project users:", formattedUsers)
      setProjectUsers(formattedUsers)
    } catch (error) {
      console.error("Error in fetchProjectUsers:", error)
    }
  }

  const getProject = (id: number) => {
    return projects.find((p) => p.id === id)
  }

  const createProject = async (project: Omit<Project, "id" | "columns" | "selectedColumns" | "created_by">) => {
    try {
      if (!user) throw new Error("User not authenticated")

      // Ensure we have a valid user ID
      let createdBy = 1 // Default fallback

      if (user.id) {
        // Try to convert to number if it's a string
        if (typeof user.id === "string") {
          const parsedId = Number.parseInt(user.id, 10)
          if (!isNaN(parsedId)) {
            createdBy = parsedId
          }
        } else if (typeof user.id === "number") {
          createdBy = user.id
        }
      }

      console.log("Creating project with data:", {
        name: project.name,
        description: project.description,
        created_by: createdBy,
        category: project.category,
        is_public: project.is_public,
        data_source: project.data_source,
        refresh_frequency: project.refresh_frequency,
        tags: project.tags,
      })

      // Create the project in Supabase
      const { data, error } = await supabase
        .from("projects")
        .insert({
          name: project.name,
          description: project.description || "",
          created_by: createdBy,
          category: project.category || "other",
          is_public: project.is_public || false,
          data_source: project.data_source || "excel",
          refresh_frequency: project.refresh_frequency || "manual",
          tags: project.tags || [],
        })
        .select()

      if (error) {
        console.error("Error creating project:", error)
        throw new Error(`Failed to create project: ${error.message}`)
      }

      if (!data || data.length === 0) {
        throw new Error("No data returned after project creation")
      }

      console.log("Project created successfully:", data[0])

      // Update local state with the new project at the beginning of the array
      const newProject = {
        ...data[0],
        columns: [],
        selectedColumns: [],
      }

      setProjects([newProject, ...projects])
      return newProject.id
    } catch (error) {
      console.error("Error in createProject:", error)
      throw error
    }
  }

  const updateProject = async (id: number, projectUpdate: Partial<Project>) => {
    try {
      if (!user) throw new Error("User not authenticated")

      const updateData: any = {}

      if (projectUpdate.name) updateData.name = projectUpdate.name
      if (projectUpdate.description) updateData.description = projectUpdate.description
      if (projectUpdate.category) updateData.category = projectUpdate.category
      if (projectUpdate.is_public !== undefined) updateData.is_public = projectUpdate.is_public
      if (projectUpdate.data_source) updateData.data_source = projectUpdate.data_source
      if (projectUpdate.refresh_frequency) updateData.refresh_frequency = projectUpdate.refresh_frequency
      if (projectUpdate.tags) updateData.tags = projectUpdate.tags

      const { error } = await supabase.from("projects").update(updateData).eq("id", id)

      if (error) {
        console.error("Error updating project:", error)
        throw error
      }

      // Update local state
      setProjects(projects.map((p) => (p.id === id ? { ...p, ...projectUpdate } : p)))
    } catch (error) {
      console.error("Error in updateProject:", error)
      throw error
    }
  }

  const deleteProject = async (id: number) => {
    try {
      if (!user) throw new Error("User not authenticated")

      const { error } = await supabase.from("projects").delete().eq("id", id)

      if (error) {
        console.error("Error deleting project:", error)
        throw error
      }

      // Update local state
      setProjects(projects.filter((p) => p.id !== id))
      setProjectUsers(projectUsers.filter((pu) => pu.projectId !== id))
    } catch (error) {
      console.error("Error in deleteProject:", error)
      throw error
    }
  }

  const uploadExcelData = async (projectId: number, data: any[]) => {
    try {
      if (!user) throw new Error("User not authenticated")
      if (data.length === 0) return

      // Extract column names from the first row
      const columns = Object.keys(data[0])

      // First, delete existing columns for this project
      await supabase.from("project_columns").delete().eq("project_id", projectId)

      // Insert new columns
      const columnInserts = columns.map((column) => ({
        project_id: projectId,
        column_name: column,
        is_selected: false,
      }))

      const { error: columnsError } = await supabase.from("project_columns").insert(columnInserts)

      if (columnsError) {
        console.error("Error inserting columns:", columnsError)
        throw columnsError
      }

      // Convert user.id to a number if it's a string
      const userId = typeof user.id === "string" ? Number.parseInt(user.id, 10) : user.id

      // If conversion failed, use a default value
      const createdBy = isNaN(userId) ? 1 : userId

      // Insert data rows
      const dataInserts = data.map((row) => ({
        project_id: projectId,
        row_data: row,
        created_by: createdBy.toString(), // Convert back to string for project_data table
      }))

      const { error: dataError } = await supabase.from("project_data").insert(dataInserts)

      if (dataError) {
        console.error("Error inserting data:", dataError)
        throw dataError
      }

      // Update local state
      const project = projects.find((p) => p.id === projectId)
      if (project) {
        const updatedProject = {
          ...project,
          columns,
        }
        setProjects(projects.map((p) => (p.id === projectId ? updatedProject : p)))
      }
    } catch (error) {
      console.error("Error in uploadExcelData:", error)
      throw error
    }
  }

  const selectColumns = async (projectId: number, columns: string[]) => {
    try {
      if (!user) throw new Error("User not authenticated")

      // Get all columns for this project
      const { data: existingColumns, error: fetchError } = await supabase
        .from("project_columns")
        .select("column_name")
        .eq("project_id", projectId)

      if (fetchError) {
        console.error("Error fetching columns:", fetchError)
        throw fetchError
      }

      // Update is_selected for each column
      const updates = existingColumns.map((col) => ({
        project_id: projectId,
        column_name: col.column_name,
        is_selected: columns.includes(col.column_name),
      }))

      const { error: updateError } = await supabase
        .from("project_columns")
        .upsert(updates, { onConflict: "project_id,column_name" })

      if (updateError) {
        console.error("Error updating columns:", updateError)
        throw updateError
      }

      // Update local state
      const project = projects.find((p) => p.id === projectId)
      if (project) {
        const updatedProject = {
          ...project,
          selectedColumns: columns,
        }
        setProjects(projects.map((p) => (p.id === projectId ? updatedProject : p)))
      }
    } catch (error) {
      console.error("Error in selectColumns:", error)
      throw error
    }
  }

  const addUserToProject = async (projectId: number, email: string, role: string) => {
    try {
      if (!user) throw new Error("User not authenticated")

      // Check if the user exists in the auth system
      const { data: userData, error: userError } = await supabase.from("users").select("id").eq("email", email).single()

      let userId
      if (userError || !userData) {
        // For demo purposes, create a placeholder user ID
        // In a real app, you might want to invite the user or handle this differently
        userId = `placeholder_${Date.now()}`
      } else {
        userId = userData.id
      }

      console.log("Adding user to project with ID:", userId, "Type:", typeof userId)

      const { data, error } = await supabase
        .from("project_users")
        .insert({
          project_id: projectId,
          user_id: String(userId), // Ensure user_id is stored as string
          email,
          role,
        })
        .select()

      if (error) {
        console.error("Error adding user to project:", error)
        throw error
      }

      const newProjectUser = {
        id: data[0].id,
        projectId: data[0].project_id,
        userId: String(data[0].user_id), // Ensure userId is stored as string
        email: data[0].email,
        role: data[0].role,
      }

      setProjectUsers([...projectUsers, newProjectUser])
    } catch (error) {
      console.error("Error in addUserToProject:", error)
      throw error
    }
  }

  const removeUserFromProject = async (id: number) => {
    try {
      if (!user) throw new Error("User not authenticated")

      const { error } = await supabase.from("project_users").delete().eq("id", id)

      if (error) {
        console.error("Error removing user from project:", error)
        throw error
      }

      setProjectUsers(projectUsers.filter((pu) => pu.id !== id))
    } catch (error) {
      console.error("Error in removeUserFromProject:", error)
      throw error
    }
  }

  const getUserProjects = async () => {
    try {
      if (!user) throw new Error("User not authenticated")

      const { data: userProjects, error: projectsError } = await supabase
        .from("project_users")
        .select("project_id")
        .eq("user_id", user.id)

      if (projectsError) {
        console.error("Error fetching user projects:", projectsError)
        throw projectsError
      }

      if (!userProjects || userProjects.length === 0) {
        return []
      }

      const projectIds = userProjects.map((p) => p.project_id)

      const { data: projects, error: projectError } = await supabase.from("projects").select("*").in("id", projectIds)

      if (projectError) {
        console.error("Error fetching projects:", projectError)
        throw projectError
      }

      // For each project, fetch its columns
      const projectsWithColumns = await Promise.all(
        projects.map(async (project) => {
          const { data: columnsData, error: columnsError } = await supabase
            .from("project_columns")
            .select("column_name, is_selected")
            .eq("project_id", project.id)

          if (columnsError) {
            console.error("Error fetching columns:", columnsError)
            return {
              ...project,
              columns: [],
              selectedColumns: [],
            }
          }

          const allColumns = columnsData.map((c) => c.column_name)
          const selectedColumns = columnsData.filter((c) => c.is_selected).map((c) => c.column_name)

          return {
            ...project,
            created_by: project.created_by,
            columns: allColumns,
            selectedColumns: selectedColumns,
            category: project.category,
            is_public: project.is_public,
            data_source: project.data_source,
            refresh_frequency: project.refresh_frequency,
            created_at: project.created_at,
          }
        }),
      )

      return projectsWithColumns
    } catch (error) {
      console.error("Error in getUserProjects:", error)
      throw error
    }
  }

  return (
    <DataContext.Provider
      value={{
        projects,
        getProject,
        createProject,
        updateProject,
        deleteProject,
        uploadExcelData,
        selectColumns,
        projectUsers,
        addUserToProject,
        removeUserFromProject,
        getUserProjects,
        isLoading,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider")
  }
  return context
}
