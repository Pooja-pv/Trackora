import apiClient from "./client";

export type ApplicationStatus =
  | "Saved"
  | "Applied"
  | "Assessment"
  | "Interview"
  | "Offer"
  | "Rejected"
  | "Withdrawn";

export type WorkMode = "onsite" | "remote" | "hybrid";

export interface Application {
  id: number;
  company_name: string;
  job_title: string;
  job_url: string;
  location: string;
  work_mode: string;
  status: string;
  job_description: string;
  notes: string;
  salary_range: string;
  applied_date: string | null;
  interview_date: string | null;
  follow_up_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateApplicationData {
  company_name: string;
  job_title: string;
  job_url: string;
  location: string;
  work_mode: WorkMode | "";
  status: string;
  job_description: string;
  notes: string;
  salary_range: string;
  applied_date: string;
  interview_date: string | null;
  follow_up_date: string | null;
}

export async function getApplications(): Promise<Application[]> {
  const response = await apiClient.get("applications/");
  const data = response.data;

  if (Array.isArray(data)) {
    return data as Application[];
  }

  if (data && Array.isArray(data.results)) {
    return data.results as Application[];
  }

  throw new Error("Unexpected applications API response format.");
}

export async function createApplication(
  data: CreateApplicationData,
): Promise<Application> {
  const response = await apiClient.post<Application>("applications/", data);
  return response.data;
}

export async function updateApplication(
  id: number,
  data: CreateApplicationData,
): Promise<Application> {
  const response = await apiClient.patch<Application>(
    `applications/${id}/`,
    data,
  );
  return response.data;
}

export async function deleteApplication(id: number): Promise<void> {
  await apiClient.delete(`applications/${id}/`);
}
