"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import {
  Globe,
  FileText,
  Database,
  Brain,
  Settings,
  CheckCircle,
  AlertCircle,
  XCircle,
  Activity,
  Zap,
  Search,
  Users,
} from "lucide-react"

interface Tool {
  id: string
  name: string
  category: "search" | "medical" | "professional" | "llm" | "processing"
  description: string
  icon: React.ReactNode
  status: "active" | "inactive" | "error" | "limited"
  enabled: boolean
  apiLimit: number
  apiUsed: number
  responseTime: number
  successRate: number
  lastUsed: string
  features: string[]
}

export function ToolsDashboard() {
  const [tools, setTools] = useState<Tool[]>([
    {
      id: "google-search",
      name: "Google Search API",
      category: "search",
      description: "Primary web search engine for gathering public information",
      icon: <Globe className="h-4 w-4" />,
      status: "active",
      enabled: true,
      apiLimit: 1000,
      apiUsed: 247,
      responseTime: 450,
      successRate: 98.5,
      lastUsed: "2 minutes ago",
      features: ["Web Search", "News Search", "Scholar Search"],
    },
    {
      id: "bing-api",
      name: "Bing Search API",
      category: "search",
      description: "Secondary search engine for comprehensive coverage",
      icon: <Search className="h-4 w-4" />,
      status: "active",
      enabled: true,
      apiLimit: 500,
      apiUsed: 89,
      responseTime: 520,
      successRate: 96.2,
      lastUsed: "5 minutes ago",
      features: ["Web Search", "News Search", "Image Search"],
    },
    {
      id: "pubmed",
      name: "PubMed API",
      category: "medical",
      description: "Medical literature and research publication database",
      icon: <FileText className="h-4 w-4" />,
      status: "active",
      enabled: true,
      apiLimit: 10000,
      apiUsed: 1234,
      responseTime: 680,
      successRate: 99.1,
      lastUsed: "1 minute ago",
      features: ["Literature Search", "Citation Analysis", "Abstract Extraction"],
    },
    {
      id: "linkedin",
      name: "LinkedIn API",
      category: "professional",
      description: "Professional networking and career information",
      icon: <Users className="h-4 w-4" />,
      status: "limited",
      enabled: true,
      apiLimit: 100,
      apiUsed: 87,
      responseTime: 890,
      successRate: 94.8,
      lastUsed: "10 minutes ago",
      features: ["Profile Search", "Professional History", "Network Analysis"],
    },
    {
      id: "gpt4",
      name: "GPT-4 Turbo",
      category: "llm",
      description: "Primary language model for analysis and synthesis",
      icon: <Brain className="h-4 w-4" />,
      status: "active",
      enabled: true,
      apiLimit: 50000,
      apiUsed: 12450,
      responseTime: 1200,
      successRate: 99.7,
      lastUsed: "30 seconds ago",
      features: ["Text Analysis", "Information Synthesis", "Decision Making"],
    },
    {
      id: "medical-directories",
      name: "Medical Directories",
      category: "medical",
      description: "Healthcare provider directories and licensing boards",
      icon: <Database className="h-4 w-4" />,
      status: "active",
      enabled: true,
      apiLimit: 2000,
      apiUsed: 456,
      responseTime: 750,
      successRate: 97.3,
      lastUsed: "3 minutes ago",
      features: ["License Verification", "Board Certifications", "Practice Information"],
    },
    {
      id: "data-processor",
      name: "Data Processing Engine",
      category: "processing",
      description: "Structured data extraction and formatting",
      icon: <Zap className="h-4 w-4" />,
      status: "active",
      enabled: true,
      apiLimit: 0, // No limit
      apiUsed: 0,
      responseTime: 150,
      successRate: 99.9,
      lastUsed: "1 minute ago",
      features: ["Data Structuring", "Quality Filtering", "Format Conversion"],
    },
    {
      id: "institution-apis",
      name: "Institution APIs",
      category: "professional",
      description: "Hospital and medical institution databases",
      icon: <Database className="h-4 w-4" />,
      status: "error",
      enabled: false,
      apiLimit: 300,
      apiUsed: 45,
      responseTime: 0,
      successRate: 0,
      lastUsed: "2 hours ago",
      features: ["Staff Directories", "Department Information", "Affiliation Data"],
    },
  ])

  const toggleTool = (toolId: string) => {
    setTools(
      tools.map((tool) =>
        tool.id === toolId ? { ...tool, enabled: !tool.enabled, status: !tool.enabled ? "active" : "inactive" } : tool,
      ),
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-secondary"
      case "limited":
        return "text-yellow-600"
      case "error":
        return "text-destructive"
      case "inactive":
        return "text-muted-foreground"
      default:
        return "text-muted-foreground"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4" />
      case "limited":
        return <AlertCircle className="h-4 w-4" />
      case "error":
        return <XCircle className="h-4 w-4" />
      case "inactive":
        return <XCircle className="h-4 w-4" />
      default:
        return <XCircle className="h-4 w-4" />
    }
  }

  const getCategoryTools = (category: string) => {
    return tools.filter((tool) => tool.category === category)
  }

  const getOverallStats = () => {
    const activeTools = tools.filter((tool) => tool.status === "active").length
    const totalApiUsage = tools.reduce((sum, tool) => sum + tool.apiUsed, 0)
    const avgResponseTime = tools.reduce((sum, tool) => sum + tool.responseTime, 0) / tools.length
    const avgSuccessRate = tools.reduce((sum, tool) => sum + tool.successRate, 0) / tools.length

    return { activeTools, totalApiUsage, avgResponseTime, avgSuccessRate }
  }

  const stats = getOverallStats()

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Tool Integration Dashboard
          </CardTitle>
          <CardDescription>Monitor and manage AI agent tools, APIs, and data sources</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-card-foreground">{stats.activeTools}</div>
              <div className="text-sm text-muted-foreground">Active Tools</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-card-foreground">{stats.totalApiUsage.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">API Calls Today</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-card-foreground">{Math.round(stats.avgResponseTime)}ms</div>
              <div className="text-sm text-muted-foreground">Avg Response Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-card-foreground">{stats.avgSuccessRate.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Success Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tools by Category */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">All Tools</TabsTrigger>
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="medical">Medical</TabsTrigger>
          <TabsTrigger value="professional">Professional</TabsTrigger>
          <TabsTrigger value="llm">LLM</TabsTrigger>
          <TabsTrigger value="processing">Processing</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {tools.map((tool) => (
              <ToolCard
                key={tool.id}
                tool={tool}
                onToggle={toggleTool}
                getStatusColor={getStatusColor}
                getStatusIcon={getStatusIcon}
              />
            ))}
          </div>
        </TabsContent>

        {["search", "medical", "professional", "llm", "processing"].map((category) => (
          <TabsContent key={category} value={category} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {getCategoryTools(category).map((tool) => (
                <ToolCard
                  key={tool.id}
                  tool={tool}
                  onToggle={toggleTool}
                  getStatusColor={getStatusColor}
                  getStatusIcon={getStatusIcon}
                />
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

function ToolCard({
  tool,
  onToggle,
  getStatusColor,
  getStatusIcon,
}: {
  tool: Tool
  onToggle: (id: string) => void
  getStatusColor: (status: string) => string
  getStatusIcon: (status: string) => React.ReactNode
}) {
  return (
    <Card className={`transition-all duration-200 ${tool.enabled ? "" : "opacity-60"}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-lg bg-muted ${tool.enabled ? "text-card-foreground" : "text-muted-foreground"}`}
            >
              {tool.icon}
            </div>
            <div>
              <CardTitle className="text-base">{tool.name}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <div className={`flex items-center gap-1 ${getStatusColor(tool.status)}`}>
                  {getStatusIcon(tool.status)}
                  <span className="text-xs capitalize">{tool.status}</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {tool.category}
                </Badge>
              </div>
            </div>
          </div>
          <Switch checked={tool.enabled} onCheckedChange={() => onToggle(tool.id)} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{tool.description}</p>

        {/* API Usage */}
        {tool.apiLimit > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>API Usage</span>
              <span>
                {tool.apiUsed.toLocaleString()} / {tool.apiLimit.toLocaleString()}
              </span>
            </div>
            <Progress value={(tool.apiUsed / tool.apiLimit) * 100} className="h-2" />
          </div>
        )}

        {/* Performance Metrics */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">Response Time</div>
            <div className="font-medium">{tool.responseTime}ms</div>
          </div>
          <div>
            <div className="text-muted-foreground">Success Rate</div>
            <div className="font-medium">{tool.successRate}%</div>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">Features</div>
          <div className="flex flex-wrap gap-1">
            {tool.features.map((feature) => (
              <Badge key={feature} variant="secondary" className="text-xs">
                {feature}
              </Badge>
            ))}
          </div>
        </div>

        {/* Last Used */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Activity className="h-3 w-3" />
          <span>Last used {tool.lastUsed}</span>
        </div>
      </CardContent>
    </Card>
  )
}
