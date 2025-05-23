"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, LineChart, PieChart } from "lucide-react"
import {
  BarChart as RechartsBarChart,
  Bar,
  LineChart as RechartsLineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

interface DataVisualizationProps {
  columns: string[]
  data: any[]
}

export function DataVisualization({ columns, data }: DataVisualizationProps) {
  const [selectedColumn, setSelectedColumn] = useState<string>(columns[0] || "")
  const [chartType, setChartType] = useState<string>("bar")

  // Generate chart data from the selected column
  const generateChartData = () => {
    if (!selectedColumn || data.length === 0) return []

    // For numeric data, count occurrences or use values directly
    const isNumeric = data.some((item) => typeof item[selectedColumn] === "number")

    if (isNumeric) {
      // Use values directly for numeric data
      return data.slice(0, 10).map((item, index) => ({
        name: `Item ${index + 1}`,
        value: item[selectedColumn] || 0,
      }))
    } else {
      // Count occurrences for categorical data
      const counts: Record<string, number> = {}
      data.forEach((item) => {
        const value = String(item[selectedColumn] || "")
        counts[value] = (counts[value] || 0) + 1
      })

      return Object.entries(counts).map(([name, value]) => ({ name, value }))
    }
  }

  const chartData = generateChartData()
  // Enhanced color palette with more vibrant and diverse colors
  const COLORS = [
    "#2563eb", // blue
    "#16a34a", // green
    "#ea580c", // orange
    "#9333ea", // purple
    "#dc2626", // red
    "#0891b2", // cyan
    "#ca8a04", // yellow
    "#be185d", // pink
    "#4f46e5", // indigo
    "#059669", // emerald
  ]

  // Render the appropriate chart based on the selected type
  const renderChart = () => {
    if (!selectedColumn || data.length === 0) {
      return <div className="flex items-center justify-center h-64 text-muted-foreground">No data to visualize</div>
    }

    if (chartType === "bar") {
      return (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart
              data={chartData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" name={selectedColumn}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </RechartsBarChart>
          </ResponsiveContainer>
        </div>
      )
    }

    if (chartType === "line") {
      return (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsLineChart
              data={chartData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="value"
                stroke={COLORS[0]}
                strokeWidth={2}
                activeDot={{ r: 8 }}
                name={selectedColumn}
              />
            </RechartsLineChart>
          </ResponsiveContainer>
        </div>
      )
    }

    if (chartType === "pie") {
      return (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={true}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, value, percent }) =>
                  name.length > 10
                    ? `${name.substring(0, 10)}...: ${(percent * 100).toFixed(0)}%`
                    : `${name}: ${(percent * 100).toFixed(0)}%`
                }
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name, props) => {
                  const total = chartData.reduce((sum, item) => sum + item.value, 0)
                  const percent = ((value / total) * 100).toFixed(1)
                  return [`${value} (${percent}%)`, props.payload.name]
                }}
              />
              <Legend
                layout="vertical"
                verticalAlign="middle"
                align="right"
                formatter={(value, entry, index) => {
                  return value.length > 15 ? `${value.substring(0, 15)}...` : value
                }}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
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
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Select Column</label>
              <Select value={selectedColumn} onValueChange={setSelectedColumn}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a column" />
                </SelectTrigger>
                <SelectContent>
                  {columns.map((column) => (
                    <SelectItem key={column} value={column}>
                      {column}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Chart Type</label>
              <Tabs value={chartType} onValueChange={setChartType} className="w-full">
                <TabsList className="grid grid-cols-3">
                  <TabsTrigger value="bar">
                    <BarChart className="h-4 w-4 mr-2" />
                    Bar
                  </TabsTrigger>
                  <TabsTrigger value="line">
                    <LineChart className="h-4 w-4 mr-2" />
                    Line
                  </TabsTrigger>
                  <TabsTrigger value="pie">
                    <PieChart className="h-4 w-4 mr-2" />
                    Pie
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          <div className="mt-4">{renderChart()}</div>
        </div>
      </CardContent>
    </Card>
  )
}
