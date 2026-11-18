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
  applied_date: string | null;
  interview_date: string | null;
  follow_up_date: string | null;
}

export async function getApplications(): Promise<Application[]> {
  const applications: Application[] = [];
  let page = 1;

  while (true) {
    const response = await apiClient.get("applications/", {
      params: { page },
    });
    const data = response.data;

    // Support both an unpaginated response and DRF's paginated response.
    if (Array.isArray(data)) {
      return page === 1 ? data as Application[] : applications.concat(data as Application[]);
    }

    if (!data || !Array.isArray(data.results)) {
      throw new Error("Unexpected applications API response format.");
    }

    applications.push(...(data.results as Application[]));

    // DRF returns `next: null` when there are no more pages.
    if (!data.next) {
      return applications;
    }

    page += 1;
  }
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


export interface ExtractedJobDetails {
  job_url: string;
  job_title: string;
  company_name: string;
  location: string;
  work_mode: WorkMode | "";
  job_description: string;
}

export async function extractJobDetails(
  url: string,
): Promise<ExtractedJobDetails> {
  const response = await apiClient.post<ExtractedJobDetails>(
    "applications/extract/",
    { url },
  );

  return response.data;
}
