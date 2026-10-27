import { useState } from "react";
import {
  createApplication,
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

    if (response?.data) {
      if (typeof response.data === "object" && response.data !== null) {
        return Object.entries(response.data)
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

      return String(response.data);
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

export default function ImportJobsPage() {
  const [form, setForm] = useState<CreateApplicationData>(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function updateField<K extends keyof CreateApplicationData>(
    field: K,
    value: CreateApplicationData[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
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

    if (jobUrl) {
      try {
        const parsedUrl = new URL(jobUrl);

        if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
          setError("Please enter a valid job posting URL.");
          return;
        }
      } catch {
        setError("Please enter a valid job posting URL.");
        return;
      }
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
        applied_date: form.applied_date || "",
        interview_date: form.interview_date || null,
        follow_up_date: form.follow_up_date || null,
      });

      setForm({ ...initialForm });
      setSuccess("Job saved to Trackora successfully.");
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="applications-section">
      <div className="applications-heading">
        <div>
          <h2>Import jobs</h2>
          <p>Add a job posting to Trackora and keep its details organized.</p>
        </div>
      </div>

      <div className="import-job-panel">
        <div className="import-job-intro">
          <h3>Add a job from a URL</h3>
          <p>
            Paste the job posting link, enter the details, and save the
            opportunity to your application tracker.
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
              Copy the URL from the original job listing.
            </span>
          </div>

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
              placeholder="Paste the job responsibilities and requirements..."
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

          {error && (
            <p className="import-job-message import-job-error" role="alert">
              {error}
            </p>
          )}

          {success && (
            <p className="import-job-message import-job-success" role="status">
              {success}
            </p>
          )}

          <div className="import-job-actions">
            <button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save to Trackora"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
