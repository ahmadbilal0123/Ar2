"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { FileSpreadsheet, Check, Search, AlertTriangle, FileText, Info } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import * as XLSX from "xlsx"
import { useData } from "@/lib/data-context"

interface ExcelUploaderProps {
  projectId: number
  onUpload: (data: any[]) => Promise<void>
  onSelectColumns: (columns: string[]) => Promise<void>
  existingColumns?: string[]
  selectedColumns?: string[]
}

export function ExcelUploader({
  projectId,
  onUpload,
  onSelectColumns,
  existingColumns = [],
  selectedColumns = [],
}: ExcelUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [columns, setColumns] = useState<string[]>(existingColumns)
  const [selected, setSelected] = useState<string[]>(selectedColumns)
  const [data, setData] = useState<any[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { getProject } = useData()
  const project = getProject(projectId)
  const dataSourceType = project?.data_source || "excel"

  // Determine accepted file types based on project data source
  const getAcceptedFileTypes = () => {
    if (dataSourceType === "csv") {
      return ".csv"
    } else {
      return ".xlsx,.xls"
    }
  }

  // Get button text based on data source type
  const getButtonText = () => {
    if (isUploading) return "Uploading..."

    if (dataSourceType === "csv") {
      return "Upload CSV File"
    } else {
      return "Upload Excel File"
    }
  }

  // Get file icon based on data source type
  const getFileIcon = () => {
    if (dataSourceType === "csv") {
      return <FileText className="h-5 w-5 mr-2" />
    } else {
      return <FileSpreadsheet className="h-5 w-5 mr-2" />
    }
  }

  // Minimum required columns for submission
  const MIN_COLUMNS = 3

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const selectedFile = files[0]

      // Validate file type
      const fileName = selectedFile.name.toLowerCase()
      const isCSV = fileName.endsWith(".csv")
      const isExcel = fileName.endsWith(".xlsx") || fileName.endsWith(".xls")

      // Check if file type matches project data source
      if (dataSourceType === "csv" && !isCSV) {
        setError("Please upload a CSV file. This project is configured for CSV data.")
        return
      } else if (dataSourceType === "excel" && !isExcel) {
        setError("Please upload an Excel file (XLSX/XLS). This project is configured for Excel data.")
        return
      }

      setFile(selectedFile)
      readExcel(selectedFile)
    }
  }

  const readExcel = async (file: File) => {
    setIsUploading(true)
    setError("")
    try {
      const data = await file.arrayBuffer()
      let jsonData: any[] = []

      // Check if file is CSV or Excel
      if (file.name.toLowerCase().endsWith(".csv")) {
        // Parse CSV
        const text = new TextDecoder().decode(data)
        const csvData = XLSX.read(text, { type: "string" })
        const worksheet = csvData.Sheets[csvData.SheetNames[0]]
        jsonData = XLSX.utils.sheet_to_json(worksheet)
      } else {
        // Parse Excel
        const workbook = XLSX.read(data)
        const worksheet = workbook.Sheets[workbook.SheetNames[0]]
        jsonData = XLSX.utils.sheet_to_json(worksheet)
      }

      if (jsonData.length > 0) {
        console.log("Data parsed:", jsonData.slice(0, 2))
        setData(jsonData as any[])
        const cols = Object.keys(jsonData[0] as object)
        setColumns(cols)
        // If we have existing selected columns, keep them if they exist in the new data
        if (selectedColumns.length > 0) {
          setSelected(selectedColumns.filter((col) => cols.includes(col)))
        }

        // Upload data to Supabase
        try {
          await onUpload(jsonData as any[])
          console.log("Data uploaded successfully")
        } catch (uploadError) {
          console.error("Error uploading data:", uploadError)
          setError("Failed to upload data. Please check the console for details.")
        }
      } else {
        setError("No data found in the file")
      }
    } catch (error) {
      console.error("Error reading file:", error)
      setError("Error reading file. Please try again with a valid file.")
    } finally {
      setIsUploading(false)
    }
  }

  // Toggle column selection - allow selecting/deselecting any column
  const handleColumnToggle = (column: string) => {
    setSelected((prev) => {
      if (prev.includes(column)) {
        return prev.filter((c) => c !== column)
      } else {
        return [...prev, column]
      }
    })
  }

  // Select all columns
  const handleSelectAll = () => {
    setSelected(columns)
  }

  // Deselect all columns
  const handleDeselectAll = () => {
    setSelected([])
  }

  // Filter columns based on search term
  const filteredColumns = columns.filter((column) => column.toLowerCase().includes(searchTerm.toLowerCase()))

  // Save selected columns - only show error on submission
  const handleSaveColumns = async () => {
    setIsSaving(true)
    setError("")

    try {
      // Validate that more than MIN_COLUMNS columns are selected
      if (selected.length <= MIN_COLUMNS) {
        setError(`You must select more than ${MIN_COLUMNS} columns before saving.`)
        setIsSaving(false)
        return
      }

      await onSelectColumns(selected)
      console.log("Selected columns saved successfully:", selected)
    } catch (saveError) {
      console.error("Error saving selected columns:", saveError)
      setError("Failed to save selected columns. Please check the console for details.")
    } finally {
      setIsSaving(false)
    }
  }

  // Get badge color based on selection count
  const getBadgeColor = () => {
    if (selected.length <= MIN_COLUMNS)
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
    return "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
  }

  return (
    <div className="space-y-6">
      <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
        <Info className="h-5 w-5 text-blue-500" />
        <AlertDescription className="text-blue-700 dark:text-blue-300">
          This project is configured for {dataSourceType === "csv" ? "CSV files" : "Excel files (XLSX/XLS)"}. Please
          upload the correct file type.
        </AlertDescription>
      </Alert>

      <div className="flex flex-wrap items-center gap-4">
        <input
          type="file"
          accept={getAcceptedFileTypes()}
          onChange={handleFileChange}
          className="hidden"
          ref={fileInputRef}
        />
        <Button onClick={triggerFileInput} disabled={isUploading} className="h-12 px-6 text-base">
          {getFileIcon()}
          {getButtonText()}
        </Button>
        {file && (
          <div className="flex items-center text-sm text-muted-foreground mt-2 md:mt-0">
            {getFileIcon()}
            <span className="truncate max-w-[200px]">{file.name}</span>
          </div>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-5 w-5" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {columns.length > 0 && (
        <Card className="border-brand-200 dark:border-brand-800">
          <CardHeader className="bg-brand-50 dark:bg-brand-900/20">
            <CardTitle className="flex items-center">
              <Check className="h-5 w-5 text-brand-500 mr-2" />
              Select Columns for Users
            </CardTitle>
            <CardDescription>
              Select the columns you want users to see. Only these selected columns will be visible to users assigned to
              this project.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            {selected.length <= MIN_COLUMNS && (
              <Alert className="mb-4" variant="warning">
                <AlertTriangle className="h-5 w-5 mr-2" />
                <AlertDescription>
                  <strong>Column Requirement:</strong> You must select more than {MIN_COLUMNS} columns for users to
                  view.
                  {selected.length <= MIN_COLUMNS && ` (${MIN_COLUMNS + 1 - selected.length} more needed)`}
                </AlertDescription>
              </Alert>
            )}

            <div className="mb-4 flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={getBadgeColor()}>
                  {selected.length} columns selected (must be &gt; {MIN_COLUMNS} to save)
                </Badge>
                <div className="flex gap-2 mt-2 md:mt-0">
                  <Button variant="outline" size="sm" onClick={handleSelectAll} className="h-9 px-4">
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDeselectAll} className="h-9 px-4">
                    Deselect All
                  </Button>
                </div>
              </div>
              <div className="relative w-full">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search columns..."
                  className="pl-10 h-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto p-2">
              {filteredColumns.map((column) => (
                <div key={column} className="flex items-center space-x-2 p-3 border rounded-md hover:bg-muted/50">
                  <Checkbox
                    id={`column-${column}`}
                    checked={selected.includes(column)}
                    onCheckedChange={() => handleColumnToggle(column)}
                    className="h-5 w-5"
                  />
                  <Label htmlFor={`column-${column}`} className="text-sm cursor-pointer flex-1 py-1">
                    {column}
                  </Label>
                  {selected.includes(column) && (
                    <Badge
                      variant="outline"
                      className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                    >
                      Selected
                    </Badge>
                  )}
                </div>
              ))}

              {filteredColumns.length === 0 && (
                <div className="col-span-3 text-center py-8 text-muted-foreground">
                  No columns found matching your search
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                onClick={handleSaveColumns}
                disabled={isSaving || selected.length <= MIN_COLUMNS}
                className={`h-12 px-6 text-base ${selected.length <= MIN_COLUMNS ? "bg-gray-400 hover:bg-gray-400 cursor-not-allowed" : "bg-brand-600 hover:bg-brand-700"}`}
              >
                <Check className="h-5 w-5 mr-2" />
                {isSaving ? "Saving..." : "Make Selected Columns Visible to Users"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
