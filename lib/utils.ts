import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const backendBaseUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8001";

export async function uploadNpiFile(file: File): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const lines = content.split("\n");
        const npis: string[] = [];

        for (const line of lines) {
          // Extract 10-digit NPIs using regex
          const npiMatches = line.match(/\b\d{10}\b/g);
          if (npiMatches) {
            npis.push(...npiMatches);
          }
        }

        // Remove duplicates and return
        const uniqueNpis = [...new Set(npis)];
        resolve(uniqueNpis);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
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
  // New fields from backend_data.py
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
}

export async function fetchProfiles(
  npiList: string[]
): Promise<BackendProfile[]> {
  const res = await fetch(`/api/profile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ npi_list: npiList }),
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

export async function fetchProfilesWithAgents(
  npiList: string[]
): Promise<BackendProfile[]> {
  try {
    const formData = new FormData();
    formData.append("npis", JSON.stringify(npiList));

    const res = await fetch(`/api/process-npis`, {
      method: "POST",
      body: formData,
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
