"use client";

import React from "react";

import type { ReactNode } from "react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  Brain,
  FileText,
  X,
  Loader2,
  CheckCircle,
  Globe,
  Mail,
  Twitter,
  BookOpen,
  Upload,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  ArrowUpDown,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  fetchProfilesWithAgents,
  uploadNpiFile,
  type BackendProfile,
} from "@/lib/utils";

interface HCP {
  id: number;
  name: string;
  specialty: string;
  affiliation?: string;
  location?: string;
  degrees?: string;
  email?: string;
}

interface ProcessingStep {
  name: string;
  icon: ReactNode;
  status: "pending" | "active" | "completed";
  description: string;
}

interface HCPProfile {
  id: number;
  fullName: string;
  specialty: string;
  affiliation: string;
  location: string;
  degrees: string;
  socialMediaHandles: {
    twitter?: string;
    linkedin?: string;
  };
  followers: {
    twitter?: string;
    linkedin?: string;
  };
  topInterests: string[];
  recentActivity: string;
  publications: number;
  engagementStyle: string;
  confidence: number;
  summary: string;
  // Agent-specific fields
  npi?: string;
  pubmed?: any;
  web?: any[];
  // New fields from updated_team_backend.py
  gender?: string;
  publicationYears?: string;
  topPublicationJournals?: string;
  topPublicationTitles?: string;
  journalClassification?: string;
  researchPrestigeScore?: number;
  topInfluentialPublications?: string;
  totalTrials?: number;
  activeTrials?: number;
  completedTrials?: number;
  conditions?: string;
  interventions?: string;
  roles?: string;
  trialInvolvement?: string;
  leadershipRoles?: string;
  impactSummary?: string;
  // Additional fields from updated backend
  practiceCity?: string;
  practiceState?: string;
  education?: string;
  affiliations?: string;
}

export default function HCPProfilingTool() {
  const [hcpList, setHcpList] = useState<HCP[]>([]);
  const [profiles, setProfiles] = useState<HCPProfile[]>([]);
  const [processingStatus, setProcessingStatus] = useState<
    "idle" | "processing" | "completed"
  >("idle");
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof HCPProfile | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [npiList, setNpiList] = useState<string[]>([]);

  const processingSteps = [
    {
      name: "HCP Data Ingestion",
      icon: <Users className="h-4 w-4" />,
      status: "pending",
      description: "Processing uploaded HCP list",
    },
    {
      name: "Online Data Crawling",
      icon: <Globe className="h-4 w-4" />,
      status: "pending",
      description: "Crawling LinkedIn, directories, social media",
    },
    {
      name: "Publication Research",
      icon: <BookOpen className="h-4 w-4" />,
      status: "pending",
      description: "Searching PubMed and medical journals",
    },
    {
      name: "Social Media Analysis",
      icon: <Twitter className="h-4 w-4" />,
      status: "pending",
      description: "Analyzing social presence and engagement",
    },
    {
      name: "Profile Summarization",
      icon: <Brain className="h-4 w-4" />,
      status: "pending",
      description: "AI-powered profile generation",
    },
    {
      name: "Document Generation",
      icon: <FileText className="h-4 w-4" />,
      status: "pending",
      description: "Creating structured reports",
    },
    {
      name: "Email Dispatch",
      icon: <Mail className="h-4 w-4" />,
      status: "pending",
      description: "Sending reports to stakeholders",
    },
  ];

  const startProcessing = async () => {
    // Use current hcpList to get NPIs, or fallback to npiList
    const currentNpis =
      hcpList.length > 0
        ? hcpList.map((hcp) => hcp.name.replace("NPI ", ""))
        : npiList;

    if (currentNpis.length === 0) return;

    setProcessingStatus("processing");
    setProgress(0);

    // Simulate step progress UI while making the real API call
    setCurrentStep(0);
    setProgress(100 / processingSteps.length);

    try {
      const backendProfiles: BackendProfile[] = await fetchProfilesWithAgents(
        currentNpis
      );
      // Map backend profiles to UI type (ids are strings from NPI)
      const uiProfiles: HCPProfile[] = backendProfiles.map((p, index) => {
        // Ensure unique ID - use NPI if available, otherwise generate unique ID
        const uniqueId = p.npi
          ? Number(p.npi)
          : Date.now() + index + Math.random();

        return {
          id: uniqueId,
          fullName:
            p.fullName || (p.npi ? `NPI ${p.npi}` : `Profile ${index + 1}`),
          specialty: p.specialty || "",
          affiliation: p.affiliation || "",
          location: p.location || "",
          degrees: p.degrees || "",
          socialMediaHandles: p.socialMediaHandles || {},
          followers: p.followers || {},
          topInterests: p.topInterests || [],
          recentActivity: p.recentActivity || "",
          publications: p.publications || 0,
          engagementStyle: p.engagementStyle || "",
          confidence: p.confidence || 80,
          summary: p.summary || "",
          // Agent-specific fields
          npi: p.npi,
          pubmed: p.pubmed,
          web: p.web,
        };
      });

      // Finish the step progress animation
      for (let step = 1; step < processingSteps.length; step++) {
        setCurrentStep(step);
        await new Promise((resolve) => setTimeout(resolve, 150));
        setProgress(((step + 1) / processingSteps.length) * 100);
      }

      setProfiles(uiProfiles);
      setProcessingStatus("completed");
    } catch (err) {
      console.error(err);
      setProcessingStatus("idle");
    }
  };

  const reset = () => {
    setProcessingStatus("idle");
    setProgress(0);
    setCurrentStep(0);
    setProfiles([]);
    setHcpList([]);
    setNpiList([]);
  };

  const removeHCP = (id: number) => {
    const updatedHcpList = hcpList.filter((hcp) => hcp.id !== id);
    setHcpList(updatedHcpList);

    // Also update npiList to keep them in sync
    const updatedNpis = updatedHcpList.map((hcp) =>
      hcp.name.replace("NPI ", "")
    );
    setNpiList(updatedNpis);
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement> | { target: { files: FileList } }
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const npis = await uploadNpiFile(file);
      setNpiList(npis);
      // Create a minimal placeholder queue using NPIs (names will be filled after processing)
      const placeholders: HCP[] = npis.map((npi, idx) => ({
        id: Date.now() + idx,
        name: `NPI ${npi}`,
        specialty: "",
      }));
      setHcpList(placeholders);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDragDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload({ target: { files } });
    }
  };

  // Custom hook for drag and drop functionality
  const useDragAndDrop = () => {
    return {
      onDrop: handleDragDrop,
      onDragOver: (e: React.DragEvent) => e.preventDefault(),
      onDragEnter: (e: React.DragEvent) => e.preventDefault(),
    };
  };

  const dragDropHandlers = useDragAndDrop();

  // Export profiles to CSV
  const exportToCSV = () => {
    if (profiles.length === 0) return;

    // Define CSV headers
    const headers = [
      "Full Name",
      "Specialty",
      "Affiliation",
      "Location",
      "Degrees",
      "Gender",
      "Research Score",
      "Clinical Trials",
      "Publication Years",
      "Practice City",
      "Practice State",
      "Publications",
      "Top Journals",
      "Top Titles",
      "Influential Publications",
      "Conditions",
      "Interventions",
      "Leadership Roles",
      "Impact Summary",
      "Social Media",
      "Followers",
      "Top Interests",
      "Recent Activity",
      "Engagement Style",
      "Confidence",
      "NPI ID",
      "Professional Summary",
    ];

    // Convert profiles to CSV rows
    const csvRows = [
      headers.join(","),
      ...profiles.map((profile) =>
        [
          `"${profile.fullName}"`,
          `"${profile.specialty}"`,
          `"${profile.affiliation}"`,
          `"${profile.location}"`,
          `"${profile.degrees}"`,
          `"${profile.gender || ""}"`,
          `"${profile.researchPrestigeScore || 0}"`,
          `"${profile.totalTrials || 0}"`,
          `"${profile.publicationYears || ""}"`,
          `"${profile.practiceCity || ""}"`,
          `"${profile.practiceState || ""}"`,
          `"${profile.publications || 0}"`,
          `"${profile.topPublicationJournals || ""}"`,
          `"${profile.topPublicationTitles || ""}"`,
          `"${profile.topInfluentialPublications || ""}"`,
          `"${profile.conditions || ""}"`,
          `"${profile.interventions || ""}"`,
          `"${profile.leadershipRoles || ""}"`,
          `"${profile.impactSummary || ""}"`,
          `"${profile.socialMediaHandles.linkedin || ""}"`,
          `"${profile.followers.linkedin || 0}"`,
          `"${profile.topInterests.join("; ")}"`,
          `"${profile.recentActivity}"`,
          `"${profile.engagementStyle}"`,
          `"${profile.confidence}%"`,
          `"${profile.npi || ""}"`,
          `"${profile.summary}"`,
        ].join(",")
      ),
    ];

    // Create and download CSV file
    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `hcp_profiles_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSort = (field: keyof HCPProfile) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const toggleRowExpansion = (id: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const filteredAndSortedProfiles = profiles
    .filter(
      (profile) =>
        profile.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.affiliation.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (!sortField) return 0;
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }
      return 0;
    });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-card-foreground">
                HCP Profiling Agent
              </h1>
              <p className="text-base text-muted-foreground">
                AI-powered comprehensive healthcare professional analysis
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-10">
        {/* Upload Section - Show when no profiles */}
        {profiles.length === 0 && processingStatus === "idle" && (
          <Card className="mb-8">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center justify-between text-xl">
                <span>Upload HCP Data</span>
                {hcpList.length > 0 && (
                  <Button onClick={startProcessing} size="lg" className="px-6">
                    <Brain className="mr-2 h-5 w-5" />
                    Start AI Analysis
                  </Button>
                )}
              </CardTitle>
              <CardDescription className="text-base">
                Upload a CSV or Excel file with NPI numbers to start analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <div
                  className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors relative"
                  {...dragDropHandlers}
                >
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      Drag & drop Excel file with HCP list
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Supports .xlsx/.xls/.csv files with NPI column
                    </p>
                  </div>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              </div>

              {hcpList.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">
                    Uploaded NPIs ({hcpList.length}):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {hcpList.map((hcp) => (
                      <Badge key={hcp.id} variant="outline" className="text-xs">
                        {hcp.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {(processingStatus !== "idle" || profiles.length > 0) && (
          <Card>
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-3 text-xl">
                <Brain className="h-6 w-6 text-primary" />
                AI Agent Processing Pipeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between text-base font-medium">
                  <span>Overall Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-3" />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {processingSteps.map((step, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-4 rounded-lg border bg-card/50"
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        index < currentStep
                          ? "bg-secondary text-secondary-foreground"
                          : index === currentStep
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {index < currentStep ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : index === currentStep &&
                        processingStatus === "processing" ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        step.icon
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm">{step.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {step.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {processingStatus === "completed" && profiles.length > 0 && (
          <Card>
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center justify-between text-xl">
                <div className="flex items-center gap-3">
                  <FileText className="h-6 w-6 text-primary" />
                  Comprehensive HCP Profiles
                </div>
                <Button
                  onClick={reset}
                  variant="outline"
                  size="sm"
                  className="px-4"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload More
                </Button>
              </CardTitle>
              <CardDescription className="text-base">
                AI-generated detailed professional profiles ready for
                stakeholder dispatch
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 flex gap-4 items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, specialty, or affiliation..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Badge variant="outline" className="px-3 py-2">
                  <Filter className="h-4 w-4 mr-2" />
                  {filteredAndSortedProfiles.length} of {profiles.length}{" "}
                  profiles
                </Badge>
              </div>

              <div className="border rounded-xl shadow-sm bg-card">
                <div className="w-full overflow-x-auto">
                  <ScrollArea className="h-[700px] w-full">
                    <Table className="w-full">
                      <TableHeader className="sticky top-0 bg-card border-b-2 border-border z-10">
                        <TableRow className="hover:bg-transparent">
                          <TableHead
                            className="font-bold text-card-foreground py-4 px-4 cursor-pointer hover:bg-muted/20"
                            onClick={() => handleSort("fullName")}
                          >
                            <div className="flex items-center gap-2">
                              Full Name
                              <ArrowUpDown className="h-4 w-4" />
                            </div>
                          </TableHead>
                          <TableHead
                            className="font-bold text-card-foreground py-4 px-4 cursor-pointer hover:bg-muted/20"
                            onClick={() => handleSort("specialty")}
                          >
                            <div className="flex items-center gap-2">
                              Specialty
                              <ArrowUpDown className="h-4 w-4" />
                            </div>
                          </TableHead>
                          <TableHead
                            className="font-bold text-card-foreground py-4 px-4 cursor-pointer hover:bg-muted/20"
                            onClick={() => handleSort("affiliation")}
                          >
                            <div className="flex items-center gap-2">
                              Affiliation
                              <ArrowUpDown className="h-4 w-4" />
                            </div>
                          </TableHead>
                          <TableHead className="font-bold text-card-foreground py-4 px-4">
                            Location
                          </TableHead>
                          <TableHead className="font-bold text-card-foreground py-4 px-4">
                            Degrees
                          </TableHead>
                          <TableHead className="font-bold text-card-foreground py-4 px-4">
                            Social Media
                          </TableHead>
                          <TableHead className="font-bold text-card-foreground py-4 px-4">
                            Followers
                          </TableHead>
                          <TableHead
                            className="font-bold text-card-foreground py-4 px-4 cursor-pointer hover:bg-muted/20"
                            onClick={() => handleSort("publications")}
                          >
                            <div className="flex items-center gap-2">
                              Publications
                              <ArrowUpDown className="h-4 w-4" />
                            </div>
                          </TableHead>
                          <TableHead className="font-bold text-card-foreground py-4 px-4">
                            Top Interests
                          </TableHead>
                          <TableHead className="font-bold text-card-foreground py-4 px-4">
                            Recent Activity
                          </TableHead>
                          <TableHead className="font-bold text-card-foreground py-4 px-4">
                            Engagement Style
                          </TableHead>
                          <TableHead
                            className="font-bold text-card-foreground py-4 px-4 cursor-pointer hover:bg-muted/20"
                            onClick={() => handleSort("confidence")}
                          >
                            <div className="flex items-center gap-2">
                              Confidence
                              <ArrowUpDown className="h-4 w-4" />
                            </div>
                          </TableHead>
                          <TableHead className="font-bold text-card-foreground py-4 px-4">
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-4 w-4" />
                              PubMed Results
                            </div>
                          </TableHead>
                          <TableHead className="font-bold text-card-foreground py-4 px-4">
                            <div className="flex items-center gap-2">
                              <Globe className="h-4 w-4" />
                              Web Results
                            </div>
                          </TableHead>
                          <TableHead className="font-bold text-card-foreground py-4 px-4">
                            Gender
                          </TableHead>
                          <TableHead className="font-bold text-card-foreground py-4 px-4">
                            Research Score
                          </TableHead>
                          <TableHead className="font-bold text-card-foreground py-4 px-4">
                            Clinical Trials
                          </TableHead>
                          <TableHead className="font-bold text-card-foreground py-4 px-4">
                            Publication Years
                          </TableHead>
                          <TableHead className="font-bold text-card-foreground py-4 px-4">
                            Practice City
                          </TableHead>
                          <TableHead className="font-bold text-card-foreground py-4 px-4">
                            Practice State
                          </TableHead>
                          <TableHead className="font-bold text-card-foreground py-4 px-4">
                            Publications
                          </TableHead>
                          <TableHead className="font-bold text-card-foreground py-4 px-4">
                            Top Journals
                          </TableHead>
                          <TableHead className="font-bold text-card-foreground py-4 px-4">
                            Top Titles
                          </TableHead>
                          <TableHead className="font-bold text-card-foreground py-4 px-4">
                            Influential Pubs
                          </TableHead>
                          <TableHead className="font-bold text-card-foreground py-4 px-4">
                            Conditions
                          </TableHead>
                          <TableHead className="font-bold text-card-foreground py-4 px-4">
                            Interventions
                          </TableHead>
                          <TableHead className="font-bold text-card-foreground py-4 px-4">
                            Leadership Roles
                          </TableHead>
                          <TableHead className="font-bold text-card-foreground py-4 px-4">
                            Impact Summary
                          </TableHead>
                          <TableHead className="font-bold text-card-foreground py-4 px-4">
                            NPI ID
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAndSortedProfiles.map((profile, index) => (
                          <React.Fragment key={profile.id}>
                            <TableRow
                              className={`hover:bg-muted/30 transition-colors border-b ${
                                index % 2 === 0 ? "bg-card" : "bg-muted/10"
                              }`}
                            >
                              <TableCell className="font-semibold py-3 px-6 text-card-foreground">
                                {profile.fullName}
                              </TableCell>
                              <TableCell className="py-3">
                                <Badge
                                  variant="outline"
                                  className="font-medium"
                                >
                                  {profile.specialty}
                                </Badge>
                              </TableCell>
                              <TableCell className="py-3 font-medium">
                                <div
                                  className="text-xs text-muted-foreground max-w-48 truncate"
                                  title={profile.affiliation || "N/A"}
                                >
                                  {profile.affiliation || "N/A"}
                                </div>
                              </TableCell>
                              <TableCell className="py-3 text-muted-foreground">
                                {profile.location}
                              </TableCell>
                              <TableCell className="py-3">
                                <Badge
                                  variant="secondary"
                                  className="font-medium"
                                >
                                  {profile.degrees}
                                </Badge>
                              </TableCell>
                              <TableCell className="py-6">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <Twitter className="h-3 w-3 text-blue-500" />
                                    <span className="font-mono text-xs text-blue-600">
                                      {profile.socialMediaHandles.twitter}
                                    </span>
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    LinkedIn Profile
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="py-6">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    <span className="text-sm font-semibold">
                                      {profile.followers.twitter}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-blue-700 rounded-full"></div>
                                    <span className="text-sm font-semibold">
                                      {profile.followers.linkedin}
                                    </span>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="py-6">
                                <div className="text-center">
                                  <div className="text-lg font-bold text-primary">
                                    {profile.publications}+
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    PubMed
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="py-6">
                                <div className="flex flex-wrap gap-1">
                                  {profile.topInterests
                                    .slice(0, 2)
                                    .map((interest, idx) => (
                                      <Badge
                                        key={idx}
                                        variant="outline"
                                        className="text-xs bg-primary/5"
                                      >
                                        {interest}
                                      </Badge>
                                    ))}
                                  {profile.topInterests.length > 2 && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs bg-muted"
                                    >
                                      +{profile.topInterests.length - 2} more
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="py-6 max-w-60">
                                <div className="text-sm leading-relaxed">
                                  {profile.recentActivity}
                                </div>
                              </TableCell>
                              <TableCell className="py-6">
                                <Badge
                                  variant="outline"
                                  className="bg-secondary/20"
                                >
                                  {profile.engagementStyle}
                                </Badge>
                              </TableCell>
                              <TableCell className="py-6">
                                <div className="text-center">
                                  <Badge
                                    variant="secondary"
                                    className={`font-bold text-sm ${
                                      profile.confidence >= 90
                                        ? "bg-green-100 text-green-800"
                                        : profile.confidence >= 80
                                        ? "bg-blue-100 text-blue-800"
                                        : "bg-yellow-100 text-yellow-800"
                                    }`}
                                  >
                                    {profile.confidence}%
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell className="py-6">
                                <div className="text-center">
                                  {profile.pubmed ? (
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {profile.pubmed?.esearchresult?.count ||
                                        0}{" "}
                                      papers
                                    </Badge>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">
                                      No data
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="py-6">
                                <div className="text-center">
                                  {profile.web && profile.web.length > 0 ? (
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {profile.web.length} results
                                    </Badge>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">
                                      No data
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="py-6">
                                <div className="text-center">
                                  <Badge variant="outline" className="text-xs">
                                    {profile.gender || "N/A"}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell className="py-6">
                                <div className="text-center">
                                  <Badge
                                    variant="secondary"
                                    className={`font-bold text-sm ${
                                      (profile.researchPrestigeScore || 0) >= 80
                                        ? "bg-green-100 text-green-800"
                                        : (profile.researchPrestigeScore ||
                                            0) >= 60
                                        ? "bg-blue-100 text-blue-800"
                                        : "bg-yellow-100 text-yellow-800"
                                    }`}
                                  >
                                    {profile.researchPrestigeScore || 0}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell className="py-6">
                                <div className="text-center">
                                  <div className="text-sm font-semibold">
                                    {profile.totalTrials || 0}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {profile.trialInvolvement || "None"}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="py-6">
                                <div className="text-center">
                                  <div className="text-sm font-semibold">
                                    {profile.publicationYears || "N/A"}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="py-6">
                                <div className="text-center">
                                  <div className="text-xs text-muted-foreground">
                                    {profile.practiceCity || "N/A"}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="py-6">
                                <div className="text-center">
                                  <div className="text-xs text-muted-foreground">
                                    {profile.practiceState || "N/A"}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="py-6">
                                <div className="text-center">
                                  <div className="text-sm font-semibold">
                                    {profile.publications || 0}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="py-6">
                                <div className="text-center">
                                  <div
                                    className="text-xs text-muted-foreground max-w-32 truncate"
                                    title={
                                      profile.topPublicationJournals || "N/A"
                                    }
                                  >
                                    {profile.topPublicationJournals || "N/A"}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="py-6">
                                <div className="text-center">
                                  <div
                                    className="text-xs text-muted-foreground max-w-32 truncate"
                                    title={
                                      profile.topPublicationTitles || "N/A"
                                    }
                                  >
                                    {profile.topPublicationTitles || "N/A"}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="py-6">
                                <div className="text-center">
                                  <div
                                    className="text-xs text-muted-foreground max-w-32 truncate"
                                    title={
                                      profile.topInfluentialPublications ||
                                      "N/A"
                                    }
                                  >
                                    {profile.topInfluentialPublications ||
                                      "N/A"}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="py-6">
                                <div className="text-center">
                                  <div
                                    className="text-xs text-muted-foreground max-w-32 truncate"
                                    title={profile.conditions || "N/A"}
                                  >
                                    {profile.conditions || "N/A"}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="py-6">
                                <div className="text-center">
                                  <div
                                    className="text-xs text-muted-foreground max-w-32 truncate"
                                    title={profile.interventions || "N/A"}
                                  >
                                    {profile.interventions || "N/A"}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="py-6">
                                <div className="text-center">
                                  <div
                                    className="text-xs text-muted-foreground max-w-32 truncate"
                                    title={profile.leadershipRoles || "N/A"}
                                  >
                                    {profile.leadershipRoles || "N/A"}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="py-6">
                                <div className="text-center">
                                  <div
                                    className="text-xs text-muted-foreground max-w-32 truncate"
                                    title={profile.impactSummary || "N/A"}
                                  >
                                    {profile.impactSummary || "N/A"}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="py-6">
                                <div className="text-center">
                                  <code className="text-xs bg-muted px-2 py-1 rounded">
                                    {profile.npi || "N/A"}
                                  </code>
                                </div>
                              </TableCell>
                            </TableRow>
                          </React.Fragment>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              </div>

              <div className="mt-8 flex gap-4">
                <Button className="flex-1 py-4 text-base font-semibold">
                  <Mail className="mr-2 h-5 w-5" />
                  Email Reports to Stakeholders
                </Button>
                <Button
                  variant="outline"
                  className="py-4 px-8 text-base font-semibold bg-transparent"
                  onClick={exportToCSV}
                >
                  <FileText className="mr-2 h-5 w-5" />
                  Export Profiles
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
