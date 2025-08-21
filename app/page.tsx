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
    if (npiList.length === 0) return;

    setProcessingStatus("processing");
    setProgress(0);

    // Simulate step progress UI while making the real API call
    setCurrentStep(0);
    setProgress(100 / processingSteps.length);

    try {
      const backendProfiles: BackendProfile[] = await fetchProfilesWithAgents(
        npiList
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
    setHcpList(hcpList.filter((hcp) => hcp.id !== id));
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
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
        <div
          className={`grid gap-8 ${
            processingStatus === "completed" && profiles.length > 0
              ? "xl:grid-cols-1"
              : "xl:grid-cols-5"
          }`}
        >
          <div
            className={`${
              processingStatus === "completed" && profiles.length > 0
                ? "hidden"
                : "xl:col-span-2"
            } space-y-8`}
          >
            <Card>
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center justify-between text-xl">
                  <span>HCP Queue ({hcpList.length})</span>
                  {hcpList.length > 0 && processingStatus === "idle" && (
                    <Button
                      onClick={startProcessing}
                      size="lg"
                      className="px-6"
                    >
                      <Brain className="mr-2 h-5 w-5" />
                      Start AI Analysis
                    </Button>
                  )}
                  {processingStatus !== "idle" && (
                    <Button
                      onClick={reset}
                      variant="outline"
                      size="lg"
                      className="px-6 bg-transparent"
                    >
                      Reset
                    </Button>
                  )}
                </CardTitle>
                <CardDescription className="text-base">
                  Healthcare professionals ready for comprehensive AI analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors relative">
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

                {hcpList.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="mx-auto h-16 w-16 mb-6 opacity-50" />
                    <p className="text-lg">No HCPs in queue</p>
                  </div>
                ) : (
                  <ScrollArea className="h-80">
                    <div className="space-y-3">
                      {hcpList.map((hcp) => (
                        <div
                          key={hcp.id}
                          className="flex items-center justify-between p-4 border rounded-lg bg-card/50"
                        >
                          <div className="space-y-1">
                            <h4 className="font-semibold text-base">
                              {hcp.name}
                            </h4>
                            {hcp.specialty && (
                              <p className="text-sm text-muted-foreground">
                                {hcp.specialty}
                              </p>
                            )}
                            {hcp.affiliation && (
                              <p className="text-xs text-muted-foreground">
                                {hcp.affiliation}
                              </p>
                            )}
                          </div>
                          {processingStatus === "idle" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeHCP(hcp.id)}
                            >
                              <X className="h-5 w-5" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>

          <div
            className={`${
              processingStatus === "completed" && profiles.length > 0
                ? "xl:col-span-1"
                : "xl:col-span-3"
            } space-y-8`}
          >
            {processingStatus !== "idle" && (
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
                          <div className="font-semibold text-sm">
                            {step.name}
                          </div>
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
                              <TableHead className="w-16 font-bold text-card-foreground py-4 px-2"></TableHead>
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
                                NPI ID
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredAndSortedProfiles.map((profile, index) => (
                              <React.Fragment key={profile.id}>
                                <TableRow
                                  className={`hover:bg-muted/30 transition-colors border-b cursor-pointer ${
                                    index % 2 === 0 ? "bg-card" : "bg-muted/10"
                                  }`}
                                  onClick={() => toggleRowExpansion(profile.id)}
                                >
                                  <TableCell className="py-6 px-4">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                    >
                                      {expandedRows.has(profile.id) ? (
                                        <ChevronUp className="h-4 w-4" />
                                      ) : (
                                        <ChevronDown className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </TableCell>
                                  <TableCell className="font-semibold py-6 px-6 text-card-foreground">
                                    {profile.fullName}
                                  </TableCell>
                                  <TableCell className="py-6">
                                    <Badge
                                      variant="outline"
                                      className="font-medium"
                                    >
                                      {profile.specialty}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="py-6 font-medium">
                                    {profile.affiliation}
                                  </TableCell>
                                  <TableCell className="py-6 text-muted-foreground">
                                    {profile.location}
                                  </TableCell>
                                  <TableCell className="py-6">
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
                                          +{profile.topInterests.length - 2}{" "}
                                          more
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
                                          {profile.pubmed?.esearchresult
                                            ?.count || 0}{" "}
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
                                      <code className="text-xs bg-muted px-2 py-1 rounded">
                                        {profile.npi || "N/A"}
                                      </code>
                                    </div>
                                  </TableCell>
                                </TableRow>
                                {expandedRows.has(profile.id) && (
                                  <TableRow className="bg-muted/5 border-b">
                                    <TableCell colSpan={15} className="py-6">
                                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4 bg-card rounded-lg border">
                                        <div>
                                          <h4 className="font-semibold text-sm mb-3 text-primary">
                                            Professional Summary
                                          </h4>
                                          <p className="text-sm text-muted-foreground leading-relaxed">
                                            {profile.summary}
                                          </p>
                                        </div>
                                        <div>
                                          <h4 className="font-semibold text-sm mb-3 text-primary">
                                            All Interests
                                          </h4>
                                          <div className="flex flex-wrap gap-2">
                                            {profile.topInterests.map(
                                              (interest, idx) => (
                                                <Badge
                                                  key={idx}
                                                  variant="outline"
                                                  className="text-xs"
                                                >
                                                  {interest}
                                                </Badge>
                                              )
                                            )}
                                          </div>
                                        </div>
                                        <div>
                                          <h4 className="font-semibold text-sm mb-3 text-primary">
                                            Agent Data
                                          </h4>
                                          <div className="space-y-2 text-xs">
                                            <div>
                                              <strong>NPI:</strong>{" "}
                                              {profile.npi || "N/A"}
                                            </div>
                                            <div>
                                              <strong>PubMed Papers:</strong>{" "}
                                              {profile.pubmed?.esearchresult
                                                ?.count || 0}
                                            </div>
                                            <div>
                                              <strong>Web Results:</strong>{" "}
                                              {profile.web?.length || 0}
                                            </div>
                                            {profile.web &&
                                              profile.web.length > 0 && (
                                                <div className="mt-2">
                                                  <strong>
                                                    Top Web Result:
                                                  </strong>
                                                  <div className="text-muted-foreground truncate">
                                                    {profile.web[0]?.title ||
                                                      "N/A"}
                                                  </div>
                                                </div>
                                              )}
                                          </div>
                                        </div>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                )}
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
                    >
                      <FileText className="mr-2 h-5 w-5" />
                      Export Profiles
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
