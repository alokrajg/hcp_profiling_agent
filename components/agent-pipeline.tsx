"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Brain, Database, Globe, FileText, CheckCircle, Clock, Zap, Loader2 } from "lucide-react"

interface AgentPipelineProps {
  hcpList: any[]
  processingStatus: "idle" | "processing" | "completed"
  setProcessingStatus: (status: "idle" | "processing" | "completed") => void
}

interface PipelineStep {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  status: "pending" | "active" | "completed" | "error"
  tools: string[]
  progress: number
  logs: string[]
}

export function AgentPipeline({ hcpList, processingStatus, setProcessingStatus }: AgentPipelineProps) {
  const [currentHCPIndex, setCurrentHCPIndex] = useState(0)
  const [overallProgress, setOverallProgress] = useState(0)
  const [pipelineSteps, setPipelineSteps] = useState<PipelineStep[]>([
    {
      id: "analysis",
      name: "Initial Analysis",
      description: "LLM agent analyzes HCP profile and determines search strategy",
      icon: <Brain className="h-4 w-4" />,
      status: "pending",
      tools: ["GPT-4", "Profile Analyzer"],
      progress: 0,
      logs: [],
    },
    {
      id: "web-search",
      name: "Web Search",
      description: "Gathering public information from web sources",
      icon: <Globe className="h-4 w-4" />,
      status: "pending",
      tools: ["Google Search", "Bing API", "DuckDuckGo"],
      progress: 0,
      logs: [],
    },
    {
      id: "pubmed",
      name: "PubMed Research",
      description: "Searching medical literature and publications",
      icon: <FileText className="h-4 w-4" />,
      status: "pending",
      tools: ["PubMed API", "Citation Parser", "Abstract Analyzer"],
      progress: 0,
      logs: [],
    },
    {
      id: "professional",
      name: "Professional Networks",
      description: "Gathering professional profile information",
      icon: <Database className="h-4 w-4" />,
      status: "pending",
      tools: ["LinkedIn API", "Professional Directories", "Institution APIs"],
      progress: 0,
      logs: [],
    },
    {
      id: "synthesis",
      name: "Information Synthesis",
      description: "LLM processes and structures collected information",
      icon: <Zap className="h-4 w-4" />,
      status: "pending",
      tools: ["GPT-4", "Data Structurer", "Quality Filter"],
      progress: 0,
      logs: [],
    },
  ])

  const simulateProcessing = async () => {
    if (hcpList.length === 0) return

    setProcessingStatus("processing")
    setCurrentHCPIndex(0)

    for (let hcpIndex = 0; hcpIndex < hcpList.length; hcpIndex++) {
      setCurrentHCPIndex(hcpIndex)

      // Reset steps for new HCP
      setPipelineSteps((steps) =>
        steps.map((step) => ({
          ...step,
          status: "pending",
          progress: 0,
          logs: [],
        })),
      )

      // Process each step
      for (let stepIndex = 0; stepIndex < pipelineSteps.length; stepIndex++) {
        // Set current step as active
        setPipelineSteps((steps) =>
          steps.map((step, idx) => ({
            ...step,
            status: idx === stepIndex ? "active" : idx < stepIndex ? "completed" : "pending",
          })),
        )

        // Simulate step processing with logs
        await simulateStepProcessing(stepIndex, hcpList[hcpIndex])

        // Mark step as completed
        setPipelineSteps((steps) =>
          steps.map((step, idx) => ({
            ...step,
            status: idx <= stepIndex ? "completed" : "pending",
            progress: idx === stepIndex ? 100 : step.progress,
          })),
        )

        // Update overall progress
        const totalSteps = pipelineSteps.length * hcpList.length
        const completedSteps = hcpIndex * pipelineSteps.length + stepIndex + 1
        setOverallProgress((completedSteps / totalSteps) * 100)
      }
    }

    setProcessingStatus("completed")
  }

  const simulateStepProcessing = async (stepIndex: number, hcp: any) => {
    const step = pipelineSteps[stepIndex]
    const logs = generateStepLogs(step, hcp)

    for (let i = 0; i < logs.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 800))

      setPipelineSteps((steps) =>
        steps.map((s, idx) =>
          idx === stepIndex
            ? {
                ...s,
                progress: ((i + 1) / logs.length) * 100,
                logs: [...s.logs, logs[i]],
              }
            : s,
        ),
      )
    }
  }

  const generateStepLogs = (step: PipelineStep, hcp: any): string[] => {
    switch (step.id) {
      case "analysis":
        return [
          `Analyzing profile for ${hcp.name}`,
          `Specialty identified: ${hcp.specialty}`,
          `Institution context: ${hcp.institution || "Unknown"}`,
          `Determining optimal search strategy`,
          `Search plan generated successfully`,
        ]
      case "web-search":
        return [
          `Initiating web search for ${hcp.name}`,
          `Searching professional websites and directories`,
          `Found 23 relevant web sources`,
          `Filtering and ranking results`,
          `Web search completed`,
        ]
      case "pubmed":
        return [
          `Querying PubMed for publications by ${hcp.name}`,
          `Found 12 potential publications`,
          `Analyzing citation patterns`,
          `Extracting research focus areas`,
          `PubMed analysis complete`,
        ]
      case "professional":
        return [
          `Searching professional networks`,
          `Checking institutional affiliations`,
          `Gathering professional credentials`,
          `Validating professional information`,
          `Professional profile compiled`,
        ]
      case "synthesis":
        return [
          `Processing collected information`,
          `Identifying key insights and patterns`,
          `Structuring data for output`,
          `Generating comprehensive summary`,
          `Information synthesis complete`,
        ]
      default:
        return [`Processing ${step.name}...`]
    }
  }

  const resetPipeline = () => {
    setProcessingStatus("idle")
    setCurrentHCPIndex(0)
    setOverallProgress(0)
    setPipelineSteps((steps) =>
      steps.map((step) => ({
        ...step,
        status: "pending",
        progress: 0,
        logs: [],
      })),
    )
  }

  return (
    <div className="space-y-6">
      {/* Pipeline Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            LLM Agent Processing Pipeline
          </CardTitle>
          <CardDescription>
            Autonomous information gathering and processing for {hcpList.length} healthcare professionals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Badge
                variant={
                  processingStatus === "processing"
                    ? "default"
                    : processingStatus === "completed"
                      ? "secondary"
                      : "outline"
                }
              >
                {processingStatus === "processing" && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                {processingStatus.charAt(0).toUpperCase() + processingStatus.slice(1)}
              </Badge>
              {processingStatus === "processing" && (
                <span className="text-sm text-muted-foreground">
                  Processing HCP {currentHCPIndex + 1} of {hcpList.length}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              {processingStatus === "idle" && hcpList.length > 0 && (
                <Button onClick={simulateProcessing}>Start Processing</Button>
              )}
              {processingStatus !== "idle" && (
                <Button variant="outline" onClick={resetPipeline}>
                  Reset Pipeline
                </Button>
              )}
            </div>
          </div>

          {processingStatus !== "idle" && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall Progress</span>
                <span>{Math.round(overallProgress)}%</span>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pipeline Steps */}
      <div className="grid gap-4">
        {pipelineSteps.map((step, index) => (
          <Card
            key={step.id}
            className={`transition-all duration-300 ${
              step.status === "active" ? "ring-2 ring-primary" : step.status === "completed" ? "bg-muted/50" : ""
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      step.status === "completed"
                        ? "bg-secondary text-secondary-foreground"
                        : step.status === "active"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {step.status === "completed" ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : step.status === "active" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      step.icon
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-base">{step.name}</CardTitle>
                    <CardDescription className="text-sm">{step.description}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {step.tools.map((tool) => (
                    <Badge key={tool} variant="outline" className="text-xs">
                      {tool}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardHeader>

            {(step.status === "active" || step.status === "completed") && (
              <CardContent className="pt-0">
                {step.status === "active" && (
                  <div className="mb-3">
                    <Progress value={step.progress} className="h-1" />
                  </div>
                )}

                {step.logs.length > 0 && (
                  <div className="space-y-1">
                    <Separator className="mb-2" />
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {step.logs.map((log, logIndex) => (
                        <div key={logIndex} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 flex-shrink-0" />
                          <span>{log}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Current HCP Being Processed */}
      {processingStatus === "processing" && hcpList[currentHCPIndex] && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Currently Processing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                {hcpList[currentHCPIndex].name.charAt(0)}
              </div>
              <div>
                <h4 className="font-medium">{hcpList[currentHCPIndex].name}</h4>
                <p className="text-sm text-muted-foreground">
                  {hcpList[currentHCPIndex].specialty} • {hcpList[currentHCPIndex].institution}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
