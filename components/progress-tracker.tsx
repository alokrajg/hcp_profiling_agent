"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import {
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Users,
  Database,
  Zap,
  Calendar,
  BarChart3,
  PieChartIcon,
} from "lucide-react"

interface ProgressTrackerProps {
  hcpList: any[]
  processingStatus: "idle" | "processing" | "completed"
}

interface ProcessingMetrics {
  totalHCPs: number
  completedHCPs: number
  processingTime: number
  averageTimePerHCP: number
  successRate: number
  apiCallsUsed: number
  dataPointsCollected: number
  confidenceScore: number
}

interface HCPProgress {
  id: string
  name: string
  status: "pending" | "processing" | "completed" | "error"
  progress: number
  startTime?: Date
  endTime?: Date
  processingTime?: number
  dataPoints: number
  confidenceScore: number
  errors: string[]
}

export function ProgressTracker({ hcpList, processingStatus }: ProgressTrackerProps) {
  const [metrics, setMetrics] = useState<ProcessingMetrics>({
    totalHCPs: hcpList.length,
    completedHCPs: processingStatus === "completed" ? hcpList.length : 0,
    processingTime: 0,
    averageTimePerHCP: 0,
    successRate: 100,
    apiCallsUsed: 0,
    dataPointsCollected: 0,
    confidenceScore: 0,
  })

  const [hcpProgress, setHCPProgress] = useState<HCPProgress[]>([])
  const [processingHistory, setProcessingHistory] = useState<any[]>([])

  // Initialize HCP progress tracking
  useEffect(() => {
    const initialProgress: HCPProgress[] = hcpList.map((hcp, index) => ({
      id: hcp.id || `hcp-${index}`,
      name: hcp.name,
      status:
        processingStatus === "completed" ? "completed" : processingStatus === "processing" ? "processing" : "pending",
      progress: processingStatus === "completed" ? 100 : processingStatus === "processing" ? Math.random() * 100 : 0,
      startTime: processingStatus !== "idle" ? new Date(Date.now() - Math.random() * 3600000) : undefined,
      endTime: processingStatus === "completed" ? new Date() : undefined,
      processingTime: processingStatus === "completed" ? Math.floor(Math.random() * 300) + 60 : undefined,
      dataPoints: Math.floor(Math.random() * 50) + 20,
      confidenceScore: Math.floor(Math.random() * 20) + 80,
      errors: [],
    }))
    setHCPProgress(initialProgress)
  }, [hcpList, processingStatus])

  // Update metrics based on progress
  useEffect(() => {
    const completedCount = hcpProgress.filter((hcp) => hcp.status === "completed").length
    const totalProcessingTime = hcpProgress
      .filter((hcp) => hcp.processingTime)
      .reduce((sum, hcp) => sum + (hcp.processingTime || 0), 0)
    const avgTime = completedCount > 0 ? totalProcessingTime / completedCount : 0
    const totalDataPoints = hcpProgress.reduce((sum, hcp) => sum + hcp.dataPoints, 0)
    const avgConfidence =
      hcpProgress.length > 0 ? hcpProgress.reduce((sum, hcp) => sum + hcp.confidenceScore, 0) / hcpProgress.length : 0

    setMetrics({
      totalHCPs: hcpList.length,
      completedHCPs: completedCount,
      processingTime: totalProcessingTime,
      averageTimePerHCP: avgTime,
      successRate: hcpProgress.length > 0 ? (completedCount / hcpProgress.length) * 100 : 100,
      apiCallsUsed: completedCount * 15 + Math.floor(Math.random() * 50),
      dataPointsCollected: totalDataPoints,
      confidenceScore: avgConfidence,
    })
  }, [hcpProgress, hcpList.length])

  // Mock historical data for charts
  const performanceData = [
    { date: "2024-01", hcps: 45, avgTime: 180, confidence: 87 },
    { date: "2024-02", hcps: 62, avgTime: 165, confidence: 89 },
    { date: "2024-03", hcps: 78, avgTime: 155, confidence: 91 },
    { date: "2024-04", hcps: 94, avgTime: 145, confidence: 93 },
    { date: "2024-05", hcps: 112, avgTime: 140, confidence: 94 },
    { date: "2024-06", hcps: 128, avgTime: 135, confidence: 95 },
  ]

  const toolUsageData = [
    { name: "Web Search", value: 35, color: "#164e63" },
    { name: "PubMed", value: 25, color: "#10b981" },
    { name: "LinkedIn", value: 20, color: "#059669" },
    { name: "Medical Directories", value: 15, color: "#0891b2" },
    { name: "Other", value: 5, color: "#475569" },
  ]

  const statusDistribution = [
    { name: "Completed", count: hcpProgress.filter((h) => h.status === "completed").length },
    { name: "Processing", count: hcpProgress.filter((h) => h.status === "processing").length },
    { name: "Pending", count: hcpProgress.filter((h) => h.status === "pending").length },
    { name: "Error", count: hcpProgress.filter((h) => h.status === "error").length },
  ]

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  return (
    <div className="space-y-6">
      {/* Overview Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Total HCPs</span>
            </div>
            <div className="text-2xl font-bold">{metrics.totalHCPs}</div>
            <div className="text-xs text-muted-foreground">{metrics.completedHCPs} completed</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Avg Time</span>
            </div>
            <div className="text-2xl font-bold">{formatTime(Math.floor(metrics.averageTimePerHCP))}</div>
            <div className="text-xs text-muted-foreground">per HCP</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Success Rate</span>
            </div>
            <div className="text-2xl font-bold">{metrics.successRate.toFixed(1)}%</div>
            <div className="text-xs text-muted-foreground">processing success</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Database className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Data Points</span>
            </div>
            <div className="text-2xl font-bold">{metrics.dataPointsCollected.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">collected</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Progress Tracking */}
      <Tabs defaultValue="current" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="current">Current Batch</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Current Processing Status
              </CardTitle>
              <CardDescription>Real-time progress for {hcpList.length} healthcare professionals</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Overall Progress */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Overall Progress</span>
                  <span className="text-sm text-muted-foreground">
                    {metrics.completedHCPs} / {metrics.totalHCPs} completed
                  </span>
                </div>
                <Progress value={(metrics.completedHCPs / metrics.totalHCPs) * 100} className="h-3" />
              </div>

              {/* Individual HCP Progress */}
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {hcpProgress.map((hcp) => (
                    <div key={hcp.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${
                              hcp.status === "completed"
                                ? "bg-secondary text-secondary-foreground"
                                : hcp.status === "processing"
                                  ? "bg-primary text-primary-foreground"
                                  : hcp.status === "error"
                                    ? "bg-destructive text-destructive-foreground"
                                    : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {hcp.status === "completed" ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : hcp.status === "error" ? (
                              <AlertCircle className="h-4 w-4" />
                            ) : (
                              hcp.name.charAt(0)
                            )}
                          </div>
                          <div>
                            <h4 className="font-medium text-sm">{hcp.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge
                                variant={
                                  hcp.status === "completed"
                                    ? "secondary"
                                    : hcp.status === "processing"
                                      ? "default"
                                      : hcp.status === "error"
                                        ? "destructive"
                                        : "outline"
                                }
                                className="text-xs"
                              >
                                {hcp.status}
                              </Badge>
                              {hcp.processingTime && (
                                <span className="text-xs text-muted-foreground">{formatTime(hcp.processingTime)}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{Math.round(hcp.progress)}%</div>
                          <div className="text-xs text-muted-foreground">{hcp.dataPoints} data points</div>
                        </div>
                      </div>

                      <Progress value={hcp.progress} className="h-2 mb-2" />

                      <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <span>Confidence: {hcp.confidenceScore}%</span>
                        {hcp.startTime && <span>Started: {hcp.startTime.toLocaleTimeString()}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="h-4 w-4" />
                  Processing Status Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={statusDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#164e63" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <PieChartIcon className="h-4 w-4" />
                  Tool Usage Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={toolUsageData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {toolUsageData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Resource Utilization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">API Calls Used</div>
                  <div className="text-2xl font-bold">{metrics.apiCallsUsed.toLocaleString()}</div>
                  <Progress value={75} className="h-2 mt-2" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Processing Time</div>
                  <div className="text-2xl font-bold">{formatTime(metrics.processingTime)}</div>
                  <Progress value={60} className="h-2 mt-2" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Avg Confidence</div>
                  <div className="text-2xl font-bold">{metrics.confidenceScore.toFixed(1)}%</div>
                  <Progress value={metrics.confidenceScore} className="h-2 mt-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Performance Trends
              </CardTitle>
              <CardDescription>Historical processing performance over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="hcps"
                    stroke="#164e63"
                    strokeWidth={2}
                    name="HCPs Processed"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="avgTime"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Avg Time (s)"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="confidence"
                    stroke="#059669"
                    strokeWidth={2}
                    name="Confidence %"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-secondary" />
                  <span className="text-sm font-medium">Processing Speed</span>
                </div>
                <div className="text-2xl font-bold text-secondary">+12%</div>
                <div className="text-xs text-muted-foreground">vs last month</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-secondary" />
                  <span className="text-sm font-medium">Accuracy</span>
                </div>
                <div className="text-2xl font-bold text-secondary">+3%</div>
                <div className="text-xs text-muted-foreground">confidence improvement</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="h-4 w-4 text-secondary" />
                  <span className="text-sm font-medium">Data Quality</span>
                </div>
                <div className="text-2xl font-bold text-secondary">+8%</div>
                <div className="text-xs text-muted-foreground">more data points</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Processing History
              </CardTitle>
              <CardDescription>Previous processing batches and their outcomes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    date: "2024-01-15",
                    hcps: 25,
                    duration: "45m 30s",
                    success: 96,
                    confidence: 92,
                  },
                  {
                    date: "2024-01-10",
                    hcps: 18,
                    duration: "32m 15s",
                    success: 100,
                    confidence: 89,
                  },
                  {
                    date: "2024-01-05",
                    hcps: 31,
                    duration: "58m 45s",
                    success: 94,
                    confidence: 91,
                  },
                ].map((batch, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-medium">{new Date(batch.date).toLocaleDateString()}</h4>
                        <p className="text-sm text-muted-foreground">{batch.hcps} HCPs processed</p>
                      </div>
                      <Badge variant="secondary">{batch.success}% success</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Duration:</span>
                        <div className="font-medium">{batch.duration}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Success Rate:</span>
                        <div className="font-medium">{batch.success}%</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Avg Confidence:</span>
                        <div className="font-medium">{batch.confidence}%</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
