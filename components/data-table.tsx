"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, ChevronLeft, ChevronRight, Download } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"

interface DataTableProps {
  columns: string[]
  data?: any[]
  projectId: number
}

export function DataTable({ columns, data: initialData, projectId }: DataTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [data, setData] = useState<any[]>(initialData || [])
  const [loading, setLoading] = useState(!initialData)
  const itemsPerPage = 10

  // Fetch data from Supabase if not provided
  useEffect(() => {
    if (!initialData && projectId) {
      fetchData()
    }
  }, [initialData, projectId])

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data: projectData, error } = await supabase
        .from("project_data")
        .select("row_data")
        .eq("project_id", projectId)
        .limit(100) // Limit to 100 rows for performance

      if (error) {
        console.error("Error fetching project data:", error)
        return
      }

      // Extract row_data from each record
      const rowData = projectData.map((item) => item.row_data)
      setData(rowData)
    } catch (error) {
      console.error("Error in fetchData:", error)
    } finally {
      setLoading(false)
    }
  }

  // Filter data based on search term
  const filteredData = data.filter((item) => {
    return columns.some((column) => {
      const value = item[column]
      if (value === null || value === undefined) return false
      return String(value).toLowerCase().includes(searchTerm.toLowerCase())
    })
  })

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage)

  // Export data as CSV
  const exportData = () => {
    if (filteredData.length === 0) return

    // Create CSV content
    const csvContent = [
      columns.join(","), // Header row
      ...filteredData.map((row) =>
        columns
          .map((col) => {
            const value = row[col]
            // Handle values that might contain commas
            if (typeof value === "string" && value.includes(",")) {
              return `"${value}"`
            }
            return value !== undefined && value !== null ? value : ""
          })
          .join(","),
      ),
    ].join("\n")

    // Create a blob and download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `project-data-export.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Data Table</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center py-12">
            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-2">
            <CardTitle>Data Table</CardTitle>
            <Badge variant="outline" className="ml-2">
              {columns.length} columns selected
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search data..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1) // Reset to first page on search
                }}
              />
            </div>
            <Button variant="outline" size="icon" title="Export Data" onClick={exportData}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  {columns.map((column) => (
                    <th key={column} className="whitespace-nowrap px-4 py-3 text-left font-medium">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedData.length > 0 ? (
                  paginatedData.map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-t transition-colors hover:bg-muted/50">
                      {columns.map((column) => (
                        <td key={`${rowIndex}-${column}`} className="whitespace-nowrap px-4 py-3">
                          {row[column] !== undefined ? String(row[column]) : ""}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={columns.length} className="px-4 py-8 text-center text-muted-foreground">
                      {searchTerm ? "No results found" : "No data available"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredData.length)} of{" "}
              {filteredData.length} entries
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-sm">
                Page {currentPage} of {totalPages}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
