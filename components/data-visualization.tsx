"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LucideBarChart, LucideLineChart, LucidePieChart, Eye, X, Sparkles } from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"

interface DataVisualizationProps {
  columns: string[]
  data: any[]
}

export function DataVisualization({ columns, data }: DataVisualizationProps) {
  const [chartType, setChartType] = useState<string>("")
  const [selectedColumns, setSelectedColumns] = useState<string[]>([])
  const [labelColumn, setLabelColumn] = useState<string>("")
  const [autoSelectedLabel, setAutoSelectedLabel] = useState<string>("")
  const [showChart, setShowChart] = useState(false)

  // Get potential label columns (text columns that could serve as labels)
  const getLabelColumns = () => {
    return columns.filter((column) => {
      // Check if column contains mostly text/string values
      const sampleValues = data.slice(0, 10).map((item) => item[column])
      const hasText = sampleValues.some((value) => typeof value === "string" && value.length > 0)
      return hasText
    })
  }

  // Auto-select the best label column based on selected data columns
  const autoSelectLabelColumn = (dataColumns: string[]) => {
    if (dataColumns.length === 0) return ""

    const labelColumns = getLabelColumns()
    if (labelColumns.length === 0) return ""

    // Priority order for label selection
    const labelPriority = [
      // Common name fields
      "name",
      "title",
      "label",
      "description",
      // ID fields
      "id",
      "user_id",
      "project_id",
      "item_id",
      // Category fields
      "category",
      "type",
      "status",
      "group",
      // Date fields (as fallback)
      "date",
      "created_at",
      "updated_at",
    ]

    // First, try to find columns that match common naming patterns
    for (const priority of labelPriority) {
      const found = labelColumns.find((col) => col.toLowerCase().includes(priority.toLowerCase()))
      if (found && !dataColumns.includes(found)) {
        return found
      }
    }

    // If no priority match, find the column with the most unique values
    let bestColumn = ""
    let maxUniqueValues = 0

    labelColumns.forEach((column) => {
      if (!dataColumns.includes(column)) {
        const uniqueValues = new Set(data.map((item) => item[column])).size
        const totalValues = data.length
        const uniqueRatio = uniqueValues / totalValues

        // Prefer columns with high uniqueness (good for identification)
        // but not 100% unique (which might be random IDs)
        if (uniqueRatio > 0.3 && uniqueRatio < 0.95 && uniqueValues > maxUniqueValues) {
          maxUniqueValues = uniqueValues
          bestColumn = column
        }
      }
    })

    // If still no good match, just use the first available text column
    if (!bestColumn) {
      bestColumn = labelColumns.find((col) => !dataColumns.includes(col)) || ""
    }

    return bestColumn
  }

  // Auto-select label when data columns change
  useEffect(() => {
    if (selectedColumns.length > 0) {
      const autoLabel = autoSelectLabelColumn(selectedColumns)
      setAutoSelectedLabel(autoLabel)
      if (!labelColumn || selectedColumns.includes(labelColumn)) {
        setLabelColumn(autoLabel)
      }
    } else {
      setAutoSelectedLabel("")
      setLabelColumn("")
    }
  }, [selectedColumns, data, columns])

  const labelColumns = getLabelColumns()

  // Generate chart data from the selected columns
  const generateChartData = () => {
    if (selectedColumns.length === 0 || data.length === 0) return []

    const effectiveLabelColumn = labelColumn || autoSelectedLabel

    if (chartType === "pie") {
      // For pie charts, use only the first selected column
      const column = selectedColumns[0]
      const isNumeric = data.some((item) => typeof item[column] === "number")

      if (isNumeric) {
        return data.slice(0, 15).map((item, index) => ({
          name:
            effectiveLabelColumn && item[effectiveLabelColumn]
              ? String(item[effectiveLabelColumn]).substring(0, 20)
              : `Item ${index + 1}`,
          value: item[column] || 0,
          fullName:
            effectiveLabelColumn && item[effectiveLabelColumn]
              ? String(item[effectiveLabelColumn])
              : `Item ${index + 1}`,
        }))
      } else {
        const counts: Record<string, number> = {}
        data.forEach((item) => {
          const value = String(item[column] || "Unknown")
          counts[value] = (counts[value] || 0) + 1
        })
        return Object.entries(counts).map(([name, value]) => ({
          name: name.length > 20 ? `${name.substring(0, 20)}...` : name,
          value,
          fullName: name,
        }))
      }
    } else {
      // For bar and line charts, support multiple columns
      if (selectedColumns.length === 1) {
        const column = selectedColumns[0]
        const isNumeric = data.some((item) => typeof item[column] === "number")

        if (isNumeric) {
          return data.slice(0, 15).map((item, index) => ({
            name:
              effectiveLabelColumn && item[effectiveLabelColumn]
                ? String(item[effectiveLabelColumn]).substring(0, 15)
                : `Item ${index + 1}`,
            [column]: item[column] || 0,
            fullName:
              effectiveLabelColumn && item[effectiveLabelColumn]
                ? String(item[effectiveLabelColumn])
                : `Item ${index + 1}`,
          }))
        } else {
          const counts: Record<string, number> = {}
          data.forEach((item) => {
            const value = String(item[column] || "Unknown")
            counts[value] = (counts[value] || 0) + 1
          })
          return Object.entries(counts).map(([name, value]) => ({
            name: name.length > 15 ? `${name.substring(0, 15)}...` : name,
            [column]: value,
            fullName: name,
          }))
        }
      } else {
        // Multiple columns - create comparative data
        return data.slice(0, 15).map((item, index) => {
          const dataPoint: any = {
            name:
              effectiveLabelColumn && item[effectiveLabelColumn]
                ? String(item[effectiveLabelColumn]).substring(0, 15)
                : `Item ${index + 1}`,
            fullName:
              effectiveLabelColumn && item[effectiveLabelColumn]
                ? String(item[effectiveLabelColumn])
                : `Item ${index + 1}`,
          }
          selectedColumns.forEach((column) => {
            dataPoint[column] = item[column] || 0
          })
          return dataPoint
        })
      }
    }
  }

  const chartData = generateChartData()

  // Chart configuration for shadcn/ui
  const chartConfig = selectedColumns.reduce((config, column, index) => {
    config[column] = {
      label: column,
      color: `hsl(var(--chart-${(index % 5) + 1}))`,
    }
    return config
  }, {} as any)

  // Hardcoded colors for better compatibility when downloading
  const COLORS = [
    "#e11d48", // Red
    "#059669", // Green
    "#0284c7", // Blue
    "#ca8a04", // Yellow
    "#7c3aed", // Purple
  ]

  // Custom tooltip that shows full names
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-sm mb-2">{data.fullName || label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.dataKey}: ${entry.value}`}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  // Handle column selection
  const handleColumnSelect = (column: string) => {
    if (!selectedColumns.includes(column)) {
      // Limit to 5 columns for readability
      if (selectedColumns.length < 5) {
        setSelectedColumns([...selectedColumns, column])
        setShowChart(false)
      }
    }
  }

  // Remove column from selection
  const removeColumn = (column: string) => {
    setSelectedColumns(selectedColumns.filter((col) => col !== column))
    setShowChart(false)
  }

  // Handle visualization button click
  const handleVisualize = () => {
    if (chartType && selectedColumns.length > 0) {
      setShowChart(true)
    }
  }

  // Reset selections
  const handleReset = () => {
    setChartType("")
    setSelectedColumns([])
    setLabelColumn("")
    setAutoSelectedLabel("")
    setShowChart(false)
  }

  // Get chart type icon
  const getChartIcon = (type: string) => {
    switch (type) {
      case "bar":
        return <LucideBarChart className="h-4 w-4" />
      case "line":
        return <LucideLineChart className="h-4 w-4" />
      case "pie":
        return <LucidePieChart className="h-4 w-4" />
      default:
        return null
    }
  }

  // Get available columns (exclude already selected ones and label column)
  const availableColumns = columns.filter((col) => !selectedColumns.includes(col) && col !== labelColumn)

  // Render the appropriate chart based on the selected type
  const renderChart = () => {
    if (!showChart || !chartType || selectedColumns.length === 0 || data.length === 0) {
      return null
    }

    if (chartType === "bar") {
      return (
        <div className="h-80">
          <ChartContainer config={chartConfig} className="h-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 60,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} interval={0} />
                <YAxis />
                <ChartTooltip content={<CustomTooltip />} />
                <Legend />
                {selectedColumns.map((column, index) => (
                  <Bar key={column} dataKey={column} name={column} fill={COLORS[index % COLORS.length]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      )
    }

    if (chartType === "line") {
      return (
        <div className="h-80">
          <ChartContainer config={chartConfig} className="h-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 60,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} interval={0} />
                <YAxis />
                <ChartTooltip content={<CustomTooltip />} />
                <Legend />
                {selectedColumns.map((column, index) => (
                  <Line
                    key={column}
                    type="monotone"
                    dataKey={column}
                    stroke={COLORS[index % COLORS.length]}
                    strokeWidth={2}
                    activeDot={{ r: 6 }}
                    name={column}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      )
    }

    if (chartType === "pie") {
      return (
        <div className="h-80">
          <ChartContainer config={chartConfig} className="h-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip content={<CustomTooltip />} />
                <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ paddingLeft: "20px" }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      )
    }

    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Visualization</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Step 1: Select Chart Type */}
          <div>
            <label className="text-sm font-medium mb-2 block">Step 1: Select Chart Type</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { value: "bar", label: "Bar Chart", icon: <LucideBarChart className="h-5 w-5" /> },
                { value: "line", label: "Line Chart", icon: <LucideLineChart className="h-5 w-5" /> },
                { value: "pie", label: "Pie Chart", icon: <LucidePieChart className="h-5 w-5" /> },
              ].map((type) => (
                <Button
                  key={type.value}
                  variant={chartType === type.value ? "default" : "outline"}
                  className="h-16 flex flex-col gap-2"
                  onClick={() => {
                    setChartType(type.value)
                    setShowChart(false)
                  }}
                >
                  {type.icon}
                  <span className="text-sm">{type.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Step 2: Select Data Columns */}
          {chartType && (
            <div>
              <label className="text-sm font-medium mb-2 block">
                Step 2: Select Data Columns
                {chartType === "pie" && " (Pie charts use only the first column)"}
                {chartType !== "pie" && " (Up to 5 columns)"}
              </label>

              {/* Selected Columns */}
              {selectedColumns.length > 0 && (
                <div className="mb-3">
                  <div className="flex flex-wrap gap-2">
                    {selectedColumns.map((column, index) => (
                      <Badge
                        key={column}
                        variant="default"
                        className="flex items-center gap-1"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      >
                        {column}
                        <X
                          className="h-3 w-3 cursor-pointer hover:bg-white/20 rounded"
                          onClick={() => removeColumn(column)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Auto-selected Label Info */}
              {autoSelectedLabel && (
                <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-950 rounded-md border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                    <Sparkles className="h-4 w-4" />
                    <span>Auto-selected "{autoSelectedLabel}" as labels for better chart readability</span>
                  </div>
                </div>
              )}

              {/* Column Selection */}
              {availableColumns.length > 0 &&
                (chartType !== "pie" ? selectedColumns.length < 5 : selectedColumns.length === 0) && (
                  <Select onValueChange={handleColumnSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a column to add" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableColumns.map((column) => (
                        <SelectItem key={column} value={column}>
                          {column}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

              {chartType !== "pie" && selectedColumns.length >= 5 && (
                <p className="text-sm text-muted-foreground">Maximum of 5 columns reached for better readability.</p>
              )}
            </div>
          )}

          {/* Step 3: Visualize Button */}
          {chartType && selectedColumns.length > 0 && (
            <div className="flex gap-3">
              <Button onClick={handleVisualize} className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Visualize Data
              </Button>
              <Button variant="outline" onClick={handleReset}>
                Reset
              </Button>
            </div>
          )}

          {/* Chart Display */}
          {showChart && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                {getChartIcon(chartType)}
                <span className="font-medium">
                  {chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart - {selectedColumns.join(", ")}
                  {(labelColumn || autoSelectedLabel) && ` (Labels: ${labelColumn || autoSelectedLabel})`}
                </span>
              </div>
              {renderChart()}
            </div>
          )}

          {/* Empty State */}
          {!chartType && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <LucideBarChart className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Create Your Visualization</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Start by selecting a chart type above, then choose one or more data columns. Labels will be
                automatically selected for better readability.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
