import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const backendBaseUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8001";

export async function uploadNpiFile(file: File): Promise<string[]> {
  const form = new FormData();
  form.append("file", file);
  // Use Next.js api proxy to avoid CORS
  const res = await fetch(`/api/ingest`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
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
  const res = await fetch(`/api/profile/agents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ npi_list: npiList }),
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
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
