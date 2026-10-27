
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  ExternalLink,
  MapPin,
  Pencil,
  Wallet,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getApplications, type Application } from "../api/applications";

const formatDate = (value?: string | null) => {
  if (!value) return "Not set";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not set";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "Not scheduled";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not scheduled";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const displayValue = (value?: string | null) =>
  value?.trim() || "Not provided";

const displayWorkMode = (value?: string | null) => {
  if (!value) return "Not specified";

  return value.charAt(0).toUpperCase() + value.slice(1).replaceAll("_", "-");
};

export default function ApplicationDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadApplication = async () => {
      try {
        const applications = await getApplications();
        const selected = applications.find((item) => String(item.id) === id);

        if (active) {
          setApplication(selected ?? null);
          setError(selected ? "" : "This application could not be found.");
        }
      } catch {
        if (active) {
          setError("Unable to load this application. Please try again.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadApplication();

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <section className="application-details-state">
        <span className="loading-indicator" />
        <p>Loading application details...</p>
      </section>
    );
  }

  if (!application) {
    return (
      <section className="application-details-state">
        <h2>Application unavailable</h2>
        <p>{error || "This application could not be found."}</p>
        <Link className="application-details-back" to="/applications">
          <ArrowLeft size={17} />
          Back to applications
        </Link>
      </section>
    );
  }

  const status =
    application.status.charAt(0).toUpperCase() + application.status.slice(1);

  return (
    <section className="application-details-page">
      <button
        type="button"
        className="application-details-back-button"
        onClick={() => navigate("/applications")}
      >
        <ArrowLeft size={17} />
        Back to applications
      </button>

      <div className="application-details-hero">
        <div className="application-details-heading">
          <span className="application-details-eyebrow">
            APPLICATION DETAILS
          </span>
          <h2>{application.job_title}</h2>
          <p>{application.company_name}</p>

          <div className="application-details-tags">
            <span
              className={`application-status status-${application.status.toLowerCase()}`}
            >
              {status}
            </span>
            <span className="application-details-tag">
              <MapPin size={15} />
              {displayValue(application.location)}
            </span>
            <span className="application-details-tag">
              {displayWorkMode(application.work_mode)}
            </span>
          </div>
        </div>

        <div className="application-details-actions">
          {application.job_url && (
            <a
              className="dashboard-add-button application-details-primary-link"
              href={application.job_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink size={17} />
              Open job posting
            </a>
          )}

          <button
            type="button"
            className="form-cancel-button"
            onClick={() =>
              navigate("/applications", {
                state: { editApplicationId: application.id },
              })
            }
          >
            <Pencil size={16} />
            Edit from applications
          </button>
        </div>
      </div>

      <div className="application-details-grid">
        <article className="application-details-card">
          <h3>Job information</h3>
          <dl>
            <div>
              <dt>Company</dt>
              <dd>{application.company_name}</dd>
            </div>
            <div>
              <dt>Job title</dt>
              <dd>{application.job_title}</dd>
            </div>
            <div>
              <dt>Location</dt>
              <dd>{displayValue(application.location)}</dd>
            </div>
            <div>
              <dt>Work mode</dt>
              <dd>{displayWorkMode(application.work_mode)}</dd>
            </div>
            <div>
              <dt>Salary range</dt>
              <dd>
                <Wallet size={15} />
                {displayValue(application.salary_range)}
              </dd>
            </div>
            <div>
              <dt>Job posting</dt>
              <dd>
                {application.job_url ? (
                  <a
                    href={application.job_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open original link <ExternalLink size={14} />
                  </a>
                ) : (
                  "Not provided"
                )}
              </dd>
            </div>
          </dl>
        </article>

        <article className="application-details-card">
          <h3>Application timeline</h3>
          <dl>
            <div>
              <dt>Applied date</dt>
              <dd>
                <CalendarDays size={15} />
                {formatDate(application.applied_date)}
              </dd>
            </div>
            <div>
              <dt>Interview</dt>
              <dd>
                <CalendarDays size={15} />
                {formatDateTime(application.interview_date)}
              </dd>
            </div>
            <div>
              <dt>Follow-up date</dt>
              <dd>
                <Clock3 size={15} />
                {formatDate(application.follow_up_date)}
              </dd>
            </div>
            <div>
              <dt>Last updated</dt>
              <dd>{formatDate(application.updated_at)}</dd>
            </div>
          </dl>
        </article>

        <article className="application-details-card application-details-full-width">
          <h3>Job description</h3>
          <p className="application-details-long-text">
            {displayValue(application.job_description)}
          </p>
        </article>

        <article className="application-details-card application-details-full-width">
          <h3>Personal notes</h3>
          <p className="application-details-long-text">
            {displayValue(application.notes)}
          </p>
        </article>
      </div>
    </section>
  );
}
