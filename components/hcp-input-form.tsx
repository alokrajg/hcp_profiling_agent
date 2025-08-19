"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Plus, X, Upload, FileText, User } from "lucide-react"

interface HCPInputFormProps {
  hcpList: any[]
  setHcpList: (list: any[]) => void
  onStartProcessing: () => void
}

export function HCPInputForm({ hcpList, setHcpList, onStartProcessing }: HCPInputFormProps) {
  const [currentHCP, setCurrentHCP] = useState({
    name: "",
    specialty: "",
    institution: "",
    location: "",
    npi: "",
    additionalInfo: "",
  })

  const addHCP = () => {
    if (currentHCP.name && currentHCP.specialty) {
      setHcpList([...hcpList, { ...currentHCP, id: Date.now() }])
      setCurrentHCP({
        name: "",
        specialty: "",
        institution: "",
        location: "",
        npi: "",
        additionalInfo: "",
      })
    }
  }

  const removeHCP = (id: number) => {
    setHcpList(hcpList.filter((hcp) => hcp.id !== id))
  }

  const handleBulkUpload = () => {
    // Simulate bulk upload functionality
    const sampleHCPs = [
      {
        id: Date.now() + 1,
        name: "Dr. Sarah Johnson",
        specialty: "Cardiology",
        institution: "Mayo Clinic",
        location: "Rochester, MN",
        npi: "1234567890",
        additionalInfo: "Interventional cardiology specialist",
      },
      {
        id: Date.now() + 2,
        name: "Dr. Michael Chen",
        specialty: "Oncology",
        institution: "MD Anderson",
        location: "Houston, TX",
        npi: "0987654321",
        additionalInfo: "Breast cancer research focus",
      },
    ]
    setHcpList([...hcpList, ...sampleHCPs])
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Add Healthcare Professional
          </CardTitle>
          <CardDescription>Enter HCP details manually or upload a batch file for processing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                placeholder="Dr. John Smith"
                value={currentHCP.name}
                onChange={(e) => setCurrentHCP({ ...currentHCP, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialty">Specialty *</Label>
              <Input
                id="specialty"
                placeholder="Cardiology"
                value={currentHCP.specialty}
                onChange={(e) => setCurrentHCP({ ...currentHCP, specialty: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="institution">Institution</Label>
              <Input
                id="institution"
                placeholder="Mayo Clinic"
                value={currentHCP.institution}
                onChange={(e) => setCurrentHCP({ ...currentHCP, institution: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="Rochester, MN"
                value={currentHCP.location}
                onChange={(e) => setCurrentHCP({ ...currentHCP, location: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="npi">NPI Number</Label>
            <Input
              id="npi"
              placeholder="1234567890"
              value={currentHCP.npi}
              onChange={(e) => setCurrentHCP({ ...currentHCP, npi: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="additionalInfo">Additional Information</Label>
            <Textarea
              id="additionalInfo"
              placeholder="Any additional context or specific areas of interest..."
              value={currentHCP.additionalInfo}
              onChange={(e) => setCurrentHCP({ ...currentHCP, additionalInfo: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={addHCP} className="flex-1">
              <Plus className="mr-2 h-4 w-4" />
              Add HCP
            </Button>
            <Button variant="outline" onClick={handleBulkUpload}>
              <Upload className="mr-2 h-4 w-4" />
              Bulk Upload
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* HCP List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              HCP Queue ({hcpList.length})
            </span>
            {hcpList.length > 0 && (
              <Button onClick={onStartProcessing} size="sm">
                Start Processing
              </Button>
            )}
          </CardTitle>
          <CardDescription>Healthcare professionals ready for AI analysis</CardDescription>
        </CardHeader>
        <CardContent>
          {hcpList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <User className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No HCPs added yet</p>
              <p className="text-sm">Add healthcare professionals to begin processing</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {hcpList.map((hcp) => (
                <div
                  key={hcp.id}
                  className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-card-foreground">{hcp.name}</h4>
                      <Badge variant="secondary" className="text-xs">
                        {hcp.specialty}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {hcp.institution && `${hcp.institution} • `}
                      {hcp.location}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeHCP(hcp.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
