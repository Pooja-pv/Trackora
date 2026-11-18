import { useState } from "react";
import {
  createApplication,
  extractJobDetails,
  type CreateApplicationData,
  type WorkMode,
} from "../api/applications";

const initialForm: CreateApplicationData = {
  company_name: "",
  job_title: "",
  job_url: "",
  location: "",
  work_mode: "",
  status: "saved",
  job_description: "",
  notes: "",
  salary_range: "",
  applied_date: "",
  interview_date: null,
  follow_up_date: null,
};

function getErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (
      error as {
        response?: {
          data?: unknown;
          status?: number;
        };
      }
    ).response;

    if (response?.data && typeof response.data === "object") {
      const data = response.data as Record<string, unknown>;

      if (typeof data.error === "string") {
        return data.error;
      }

      return Object.entries(data)
        .map(([field, messages]) => {
          const details = Array.isArray(messages)
            ? messages.join(", ")
            : typeof messages === "string"
              ? messages
              : JSON.stringify(messages);

          return `${field}: ${details}`;
        })
        .join(" | ");
    }

    if (response?.status) {
      return `The server returned error ${response.status}.`;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred. Please try again.";
}

function isValidJobUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      Boolean(url.hostname)
    );
  } catch {
    return false;
  }
}

function clearExtractedFields(
  current: CreateApplicationData,
  jobUrl = current.job_url,
): CreateApplicationData {
  return {
    ...current,
    job_url: jobUrl,
    company_name: "",
    job_title: "",
    location: "",
    work_mode: "",
    job_description: "",
  };
}

export default function ImportJobsPage() {
  const [form, setForm] = useState<CreateApplicationData>(initialForm);
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [extractionMessage, setExtractionMessage] = useState("");

  function updateField<K extends keyof CreateApplicationData>(
    field: K,
    value: CreateApplicationData[K],
  ) {
    setForm((current) => {
      if (field === "job_url" && value !== current.job_url) {
        return clearExtractedFields(current, String(value));
      }

      return {
        ...current,
        [field]: value,
      };
    });

    setError("");
    setSuccess("");

    if (field === "job_url") {
      setExtractionMessage("");
    }
  }

  async function handleExtract() {
    setError("");
    setSuccess("");
    setExtractionMessage("");

    const url = form.job_url.trim();

    if (!url || !isValidJobUrl(url)) {
      setForm((current) => clearExtractedFields(current, url));
      setError("Enter a valid HTTP or HTTPS job posting URL first.");
      return;
    }

    setForm((current) => clearExtractedFields(current, url));
    setExtracting(true);

    try {
      const details = await extractJobDetails(url);

      if (!details.job_title?.trim() || !details.company_name?.trim()) {
        throw new Error(
          "A specific job listing could not be identified. Open an individual job posting URL or enter the details manually.",
        );
      }

      setForm((current) => ({
        ...current,
        job_url: details.job_url || url,
        job_title: details.job_title || "",
        company_name: details.company_name || "",
        location: details.location || "",
        work_mode: ["onsite", "remote", "hybrid"].includes(details.work_mode)
          ? details.work_mode
          : "",
        job_description: details.job_description || "",
      }));

      const found = [
        details.job_title,
        details.company_name,
        details.location,
        details.job_description,
      ].filter((value) => value?.trim()).length;

      setExtractionMessage(
        found > 0
          ? "Details extracted where available. Review and edit them before saving."
          : "No job details were detected. Enter the details manually.",
      );
    } catch (err: unknown) {
      setForm((current) => clearExtractedFields(current, url));
      setExtractionMessage("");
      setError(getErrorMessage(err));
    } finally {
      setExtracting(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.company_name.trim() || !form.job_title.trim()) {
      setError("Please enter the company name and job title.");
      return;
    }

    const jobUrl = form.job_url.trim();

    if (jobUrl && !isValidJobUrl(jobUrl)) {
      setError("Please enter a valid job posting URL.");
      return;
    }

    setSaving(true);

    try {
      await createApplication({
        ...form,
        company_name: form.company_name.trim(),
        job_title: form.job_title.trim(),
        job_url: jobUrl,
        location: form.location.trim(),
        job_description: form.job_description.trim(),
        notes: form.notes.trim(),
        salary_range: form.salary_range.trim(),
        applied_date: form.applied_date || null,
        interview_date: form.interview_date || null,
        follow_up_date: form.follow_up_date || null,
      });

      setForm({ ...initialForm });
      setExtractionMessage("");
      setSuccess("Job saved to Trackora successfully.");
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="applications-section">
      {(error || success) && (
        <div
          className={`import-job-toast ${
            error ? "import-job-toast-error" : "import-job-toast-success"
          }`}
          role={error ? "alert" : "status"}
          aria-live={error ? "assertive" : "polite"}
        >
          <span>{error || success}</span>
          <button
            type="button"
            className="import-job-toast-close"
            onClick={() => {
              setError("");
              setSuccess("");
            }}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      )}

      <div className="applications-heading">
        <div>
          <h2>Import jobs</h2>
          <p>
            Extract job details from a public listing and review them before
            saving.
          </p>
        </div>
      </div>

      <div className="import-job-panel">
        <div className="import-job-intro">
          <h3>Import from a job URL</h3>
          <p>
            Paste a public job posting link and let Trackora find available
            details. Some websites may block automatic extraction.
          </p>
        </div>

        <form className="import-job-form" onSubmit={handleSubmit}>
          <div className="import-job-field import-job-field-full">
            <label htmlFor="import-job-url">Job posting URL</label>
            <input
              id="import-job-url"
              type="url"
              placeholder="https://example.com/jobs/python-developer"
              value={form.job_url}
              onChange={(event) => updateField("job_url", event.target.value)}
            />
            <span className="import-job-hint">
              Use the original public job listing URL.
            </span>
            <div className="import-job-actions">
              <button
                type="button"
                onClick={handleExtract}
                disabled={extracting || saving}
              >
                {extracting ? "Extracting..." : "Extract Details"}
              </button>
            </div>
          </div>

          {extractionMessage && (
            <p className="import-job-message import-job-success" role="status">
              {extractionMessage}
            </p>
          )}

          <div className="import-job-field">
            <label htmlFor="import-company">Company name *</label>
            <input
              id="import-company"
              type="text"
              placeholder="Company name"
              value={form.company_name}
              onChange={(event) =>
                updateField("company_name", event.target.value)
              }
              required
            />
          </div>

          <div className="import-job-field">
            <label htmlFor="import-title">Job title *</label>
            <input
              id="import-title"
              type="text"
              placeholder="Junior Python Developer"
              value={form.job_title}
              onChange={(event) => updateField("job_title", event.target.value)}
              required
            />
          </div>

          <div className="import-job-field">
            <label htmlFor="import-location">Location</label>
            <input
              id="import-location"
              type="text"
              placeholder="Kochi, Remote, etc."
              value={form.location}
              onChange={(event) => updateField("location", event.target.value)}
            />
          </div>

          <div className="import-job-field">
            <label htmlFor="import-work-mode">Work mode</label>
            <select
              id="import-work-mode"
              value={form.work_mode}
              onChange={(event) =>
                updateField("work_mode", event.target.value as WorkMode | "")
              }
            >
              <option value="">Not specified</option>
              <option value="onsite">On-site</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>

          <div className="import-job-field">
            <label htmlFor="import-status">Application status</label>
            <select
              id="import-status"
              value={form.status}
              onChange={(event) => updateField("status", event.target.value)}
            >
              <option value="saved">Saved</option>
              <option value="applied">Applied</option>
              <option value="assessment">Assessment</option>
              <option value="interview">Interview</option>
              <option value="offer">Offer</option>
              <option value="rejected">Rejected</option>
              <option value="withdrawn">Withdrawn</option>
            </select>
          </div>

          <div className="import-job-field">
            <label htmlFor="import-salary">Salary range</label>
            <input
              id="import-salary"
              type="text"
              placeholder="₹3–5 LPA"
              value={form.salary_range}
              onChange={(event) =>
                updateField("salary_range", event.target.value)
              }
            />
          </div>

          <div className="import-job-field">
            <label htmlFor="import-applied-date">Date applied</label>
            <input
              id="import-applied-date"
              type="date"
              value={form.applied_date ?? ""}
              onChange={(event) =>
                updateField("applied_date", event.target.value)
              }
            />
          </div>

          <div className="import-job-field import-job-field-full">
            <label htmlFor="import-description">Job description</label>
            <textarea
              id="import-description"
              rows={5}
              placeholder="Review or enter the job responsibilities and requirements..."
              value={form.job_description}
              onChange={(event) =>
                updateField("job_description", event.target.value)
              }
            />
          </div>

          <div className="import-job-field import-job-field-full">
            <label htmlFor="import-notes">Notes</label>
            <textarea
              id="import-notes"
              rows={3}
              placeholder="Recruiter details, deadlines, or other notes..."
              value={form.notes}
              onChange={(event) => updateField("notes", event.target.value)}
            />
          </div>

          <div className="import-job-actions">
            <button type="submit" disabled={saving || extracting}>
              {saving ? "Saving..." : "Review and Save Job"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
