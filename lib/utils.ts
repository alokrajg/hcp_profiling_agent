import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const backendBaseUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8001";

export async function uploadNpiFile(file: File): Promise<string[]> {
  try {
    const form = new FormData();
    form.append("file", file);

    const res = await fetch(`${backendBaseUrl}/api/upload-file`, {
      method: "POST",
      body: form,
    });

    if (!res.ok) {
      console.error("File upload failed:", res.status, res.statusText);
      throw new Error(await res.text());
    }

    const data = await res.json();
    return data.npis || [];
  } catch (error) {
    console.error("Error uploading file:", error);
    // Fallback: try to extract NPIs client-side
    return await extractNPIsFromFile(file);
  }
}

async function extractNPIsFromFile(file: File): Promise<string[]> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const lines = content.split("\n");
      const npis: string[] = [];

      // Check if this looks like a CSV with headers
      if (lines.length > 0) {
        const firstLine = lines[0].toLowerCase();
        console.log("First line:", firstLine);

        // If it has a header with 'npi' (case insensitive), try to parse as CSV
        if (firstLine.includes("npi") || firstLine.includes("NPI")) {
          console.log("Detected CSV with NPI column");
          const headers = firstLine
            .split(",")
            .map((h) => h.trim().replace(/"/g, ""));
          console.log("Headers found:", headers);
          const npiColumnIndex = headers.findIndex(
            (h) => h.toLowerCase() === "npi"
          );

          if (npiColumnIndex !== -1) {
            console.log(`NPI column found at index: ${npiColumnIndex}`);

            // Parse data rows
            for (let i = 1; i < lines.length; i++) {
              const line = lines[i].trim();
              if (line) {
                const values = line
                  .split(",")
                  .map((v) => v.trim().replace(/"/g, ""));
                if (values.length > npiColumnIndex) {
                  const npiValue = values[npiColumnIndex];
                  if (npiValue && npiValue.match(/^\d{10}$/)) {
                    npis.push(npiValue);
                    console.log(`Found NPI: ${npiValue}`);
                  }
                }
              }
            }
          }
        }
      }

      // Fallback: extract any 10-digit numbers if CSV parsing didn't work
      if (npis.length === 0) {
        console.log("Falling back to regex extraction");
        for (const line of lines) {
          const matches = line.match(/\b\d{10}\b/g);
          if (matches) {
            npis.push(...matches);
          }
        }
      }

      // Remove duplicates
      const uniqueNPIs = [...new Set(npis)];
      console.log(`Total NPIs found: ${uniqueNPIs.length}`);
      console.log(`NPIs: ${uniqueNPIs}`);
      resolve(uniqueNPIs);
    };
    reader.readAsText(file);
  });
}

export interface BackendProfile {
  id?: string; // Optional for agents response
  fullName: string;
  specialty: string;
  affiliation: string;
  location: string;
  degrees: string;
  socialMediaHandles: { twitter?: string; linkedin?: string };
  followers: { twitter?: string; linkedin?: string };
  topInterests: string[];
  recentActivity: string;
  publications: number;
  engagementStyle: string;
  confidence: number;
  summary: string;
  // Add fields for agents response
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

export async function fetchProfiles(
  npiList: string[]
): Promise<BackendProfile[]> {
  // Use the same endpoint as fetchProfilesWithAgents since we're using the updated backend
  return await fetchProfilesWithAgents(npiList);
}

export async function fetchProfilesWithAgents(
  npiList: string[]
): Promise<BackendProfile[]> {
  try {
    const res = await fetch(`${backendBaseUrl}/api/process-npis`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(npiList),
    });

    if (!res.ok) {
      console.error("API call failed:", res.status, res.statusText);
      return [];
    }

    const data = await res.json();
    return data.profiles || [];
  } catch (error) {
    console.error("Error fetching profiles:", error);
    return [];
  }
}

export async function sendEmail(
  to: string[],
  subject: string,
  html: string
): Promise<void> {
  const res = await fetch(`/api/email/dispatch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to, subject, html }),
  });
  if (!res.ok) throw new Error(await res.text());
}
