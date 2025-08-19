"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  FileText,
  Download,
  Search,
  Filter,
  User,
  Building,
  MapPin,
  Award,
  BookOpen,
  ExternalLink,
  Star,
  Calendar,
  Globe,
  Mail,
} from "lucide-react"

interface ResultsDisplayProps {
  hcpList: any[]
  processingStatus: "idle" | "processing" | "completed"
}

interface ProcessedHCP {
  id: string
  name: string
  specialty: string
  institution: string
  location: string
  npi: string
  profile: {
    summary: string
    credentials: string[]
    boardCertifications: string[]
    yearsExperience: number
    languages: string[]
  }
  research: {
    publications: Publication[]
    totalCitations: number
    hIndex: number
    researchAreas: string[]
  }
  professional: {
    currentPositions: Position[]
    previousPositions: Position[]
    affiliations: string[]
    awards: string[]
  }
  contact: {
    email?: string
    phone?: string
    website?: string
    linkedIn?: string
  }
  insights: {
    keyStrengths: string[]
    collaborationNetwork: string[]
    recentActivity: string[]
    riskFactors: string[]
  }
  lastUpdated: string
  confidenceScore: number
}

interface Publication {
  title: string
  journal: string
  year: number
  citations: number
  pmid?: string
  doi?: string
}

interface Position {
  title: string
  institution: string
  startDate: string
  endDate?: string
  description?: string
}

export function ResultsDisplay({ hcpList, processingStatus }: ResultsDisplayProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedHCP, setSelectedHCP] = useState<ProcessedHCP | null>(null)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  // Mock processed results - in real implementation, this would come from the processing pipeline
  const processedResults: ProcessedHCP[] = hcpList.map((hcp, index) => ({
    id: hcp.id || `hcp-${index}`,
    name: hcp.name,
    specialty: hcp.specialty,
    institution: hcp.institution || "Unknown Institution",
    location: hcp.location || "Unknown Location",
    npi: hcp.npi || "N/A",
    profile: {
      summary: `Dr. ${hcp.name} is a board-certified ${hcp.specialty.toLowerCase()} with extensive experience in clinical practice and research. Known for innovative approaches to patient care and significant contributions to medical literature.`,
      credentials: ["MD", "PhD", "FACC"],
      boardCertifications: [`American Board of ${hcp.specialty}`, "Internal Medicine"],
      yearsExperience: Math.floor(Math.random() * 20) + 10,
      languages: ["English", "Spanish"],
    },
    research: {
      publications: [
        {
          title: `Advances in ${hcp.specialty}: A Comprehensive Review`,
          journal: "New England Journal of Medicine",
          year: 2023,
          citations: 45,
          pmid: "12345678",
          doi: "10.1056/NEJMra2301234",
        },
        {
          title: `Clinical Outcomes in ${hcp.specialty} Patients`,
          journal: "Journal of the American Medical Association",
          year: 2022,
          citations: 78,
          pmid: "87654321",
          doi: "10.1001/jama.2022.12345",
        },
      ],
      totalCitations: 1250 + Math.floor(Math.random() * 500),
      hIndex: 15 + Math.floor(Math.random() * 10),
      researchAreas: [hcp.specialty, "Clinical Research", "Patient Outcomes"],
    },
    professional: {
      currentPositions: [
        {
          title: `Chief of ${hcp.specialty}`,
          institution: hcp.institution || "Medical Center",
          startDate: "2020-01-01",
          description: "Leading clinical operations and research initiatives",
        },
      ],
      previousPositions: [
        {
          title: `Associate Professor of ${hcp.specialty}`,
          institution: "University Medical School",
          startDate: "2015-01-01",
          endDate: "2019-12-31",
        },
      ],
      affiliations: ["American Medical Association", `American ${hcp.specialty} Association`],
      awards: ["Excellence in Patient Care Award", "Research Innovation Grant"],
    },
    contact: {
      email: `${hcp.name.toLowerCase().replace(/\s+/g, ".")}@${(hcp.institution || "hospital").toLowerCase().replace(/\s+/g, "")}.edu`,
      website: `https://www.${(hcp.institution || "hospital").toLowerCase().replace(/\s+/g, "")}.edu/doctors/${hcp.name.toLowerCase().replace(/\s+/g, "-")}`,
      linkedIn: `https://linkedin.com/in/dr-${hcp.name.toLowerCase().replace(/\s+/g, "-")}`,
    },
    insights: {
      keyStrengths: ["Clinical Excellence", "Research Leadership", "Patient Advocacy"],
      collaborationNetwork: ["Mayo Clinic", "Johns Hopkins", "Stanford Medicine"],
      recentActivity: ["Published 3 papers in 2023", "Spoke at International Conference", "Received Research Grant"],
      riskFactors: ["No significant concerns identified"],
    },
    lastUpdated: new Date().toISOString(),
    confidenceScore: 85 + Math.floor(Math.random() * 15),
  }))

  const filteredResults = processedResults.filter(
    (hcp) =>
      hcp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hcp.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hcp.institution.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const exportResults = (format: "json" | "csv" | "pdf") => {
    // Mock export functionality
    const data = JSON.stringify(processedResults, null, 2)
    const blob = new Blob([data], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `hcp-results.${format}`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (processingStatus === "idle") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Results Available</h3>
          <p className="text-muted-foreground text-center">
            Add healthcare professionals and start processing to view results here.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (processingStatus === "processing") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <h3 className="text-lg font-medium mb-2">Processing in Progress</h3>
          <p className="text-muted-foreground text-center">
            AI agents are gathering and analyzing information. Results will appear here when complete.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Results Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Processing Results
              </CardTitle>
              <CardDescription>
                Comprehensive profiles for {processedResults.length} healthcare professionals
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => exportResults("json")}>
                <Download className="mr-2 h-4 w-4" />
                Export JSON
              </Button>
              <Button variant="outline" size="sm" onClick={() => exportResults("csv")}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, specialty, or institution..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Grid/List */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Results List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">HCP Profiles ({filteredResults.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-96">
                <div className="space-y-2 p-4">
                  {filteredResults.map((hcp) => (
                    <div
                      key={hcp.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedHCP?.id === hcp.id ? "bg-primary/10 border-primary" : "hover:bg-muted/50"
                      }`}
                      onClick={() => setSelectedHCP(hcp)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm">{hcp.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {hcp.confidenceScore}%
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">{hcp.specialty}</p>
                      <p className="text-xs text-muted-foreground">{hcp.institution}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Detailed View */}
        <div className="lg:col-span-2">
          {selectedHCP ? (
            <HCPDetailView hcp={selectedHCP} />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <User className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Select an HCP</h3>
                <p className="text-muted-foreground text-center">
                  Choose a healthcare professional from the list to view detailed results.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function HCPDetailView({ hcp }: { hcp: ProcessedHCP }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              {hcp.name}
            </CardTitle>
            <CardDescription className="mt-1">
              {hcp.specialty} • {hcp.institution}
            </CardDescription>
          </div>
          <Badge variant="secondary">Confidence: {hcp.confidenceScore}%</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="research">Research</TabsTrigger>
            <TabsTrigger value="professional">Professional</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Professional Summary</h4>
                <p className="text-sm text-muted-foreground">{hcp.profile.summary}</p>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    Credentials
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {hcp.profile.credentials.map((cred) => (
                      <Badge key={cred} variant="outline" className="text-xs">
                        {cred}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Location
                  </h4>
                  <p className="text-sm text-muted-foreground">{hcp.location}</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Contact Information</h4>
                <div className="space-y-2">
                  {hcp.contact.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${hcp.contact.email}`} className="text-primary hover:underline">
                        {hcp.contact.email}
                      </a>
                    </div>
                  )}
                  {hcp.contact.website && (
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={hcp.contact.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Professional Profile
                        <ExternalLink className="ml-1 h-3 w-3 inline" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="research" className="space-y-4">
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-card-foreground">{hcp.research.publications.length}</div>
                <div className="text-sm text-muted-foreground">Publications</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-card-foreground">{hcp.research.totalCitations}</div>
                <div className="text-sm text-muted-foreground">Citations</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-card-foreground">{hcp.research.hIndex}</div>
                <div className="text-sm text-muted-foreground">H-Index</div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Recent Publications
              </h4>
              <div className="space-y-3">
                {hcp.research.publications.map((pub, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <h5 className="font-medium text-sm mb-1">{pub.title}</h5>
                    <p className="text-xs text-muted-foreground mb-2">
                      {pub.journal} • {pub.year} • {pub.citations} citations
                    </p>
                    <div className="flex gap-2">
                      {pub.pmid && (
                        <Badge variant="outline" className="text-xs">
                          PMID: {pub.pmid}
                        </Badge>
                      )}
                      {pub.doi && (
                        <Badge variant="outline" className="text-xs">
                          DOI: {pub.doi}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="professional" className="space-y-4">
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Building className="h-4 w-4" />
                Current Positions
              </h4>
              <div className="space-y-3">
                {hcp.professional.currentPositions.map((pos, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <h5 className="font-medium text-sm">{pos.title}</h5>
                    <p className="text-xs text-muted-foreground mb-1">{pos.institution}</p>
                    <p className="text-xs text-muted-foreground">Since {new Date(pos.startDate).getFullYear()}</p>
                    {pos.description && <p className="text-xs text-muted-foreground mt-2">{pos.description}</p>}
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium mb-3">Professional Affiliations</h4>
              <div className="flex flex-wrap gap-2">
                {hcp.professional.affiliations.map((affiliation) => (
                  <Badge key={affiliation} variant="secondary" className="text-xs">
                    {affiliation}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Star className="h-4 w-4" />
                Awards & Recognition
              </h4>
              <div className="space-y-2">
                {hcp.professional.awards.map((award, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <Award className="h-4 w-4 text-secondary" />
                    <span>{award}</span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            <div className="grid gap-4">
              <div>
                <h4 className="font-medium mb-3 text-secondary">Key Strengths</h4>
                <div className="space-y-2">
                  {hcp.insights.keyStrengths.map((strength, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <div className="h-2 w-2 rounded-full bg-secondary"></div>
                      <span>{strength}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-3">Collaboration Network</h4>
                <div className="flex flex-wrap gap-2">
                  {hcp.insights.collaborationNetwork.map((network) => (
                    <Badge key={network} variant="outline" className="text-xs">
                      {network}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Recent Activity
                </h4>
                <div className="space-y-2">
                  {hcp.insights.recentActivity.map((activity, index) => (
                    <div key={index} className="text-sm text-muted-foreground">
                      • {activity}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <Separator className="my-4" />

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Last updated: {new Date(hcp.lastUpdated).toLocaleString()}</span>
          <span>NPI: {hcp.npi}</span>
        </div>
      </CardContent>
    </Card>
  )
}
