import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./Overview.css";

import {
  BriefcaseBusiness,
  CalendarDays,
  ChartNoAxesCombined,
  Clock3,
  CircleCheck,
  CircleX,
  ArrowUpRight,
  ArrowRight,
  ClipboardList,
  Sparkles,
  Target,
  RefreshCw,
} from "lucide-react";

import { getApplications, type Application } from "../api/applications";
import {
  countActive,
  countFollowUpsDue,
  countInterviewStage,
} from "../utils/metrics";

const pipelineStatuses = [
  { label: "Saved", color: "saved" },
  { label: "Applied", color: "applied" },
  { label: "Assessment", color: "assessment" },
  { label: "Interview", color: "interview" },
  { label: "Offer", color: "offer" },
];

function normalizeStatus(status: string) {
  return status.trim().toLowerCase();
}

function formatDate(dateValue: string | null) {
  if (!dateValue) return "Not scheduled";

  const date = new Date(`${dateValue.slice(0, 10)}T00:00:00`);

  if (Number.isNaN(date.getTime())) return "Not scheduled";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getDaysUntil(dateValue: string | null, today: Date) {
  if (!dateValue) return null;

  const date = new Date(`${dateValue.slice(0, 10)}T00:00:00`);

  if (Number.isNaN(date.getTime())) return null;

  return Math.round((date.getTime() - today.getTime()) / 86400000);
}

function formatToday() {
  return new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function Overview() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Initial application loading.
  // State updates happen inside asynchronous callbacks rather than
  // synchronously inside the effect.
  useEffect(() => {
    let active = true;

    getApplications()
      .then((data) => {
        if (active) {
          setApplications(data);
        }
      })
      .catch(() => {
        if (active) {
          setError(
            "We couldn't load your applications. Check your connection and try again.",
          );
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  // Retry handler.
  const loadApplications = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getApplications();
      setApplications(data);
    } catch {
      setError(
        "We couldn't load your applications. Check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  const countStatus = (status: string) =>
    applications.filter(
      (application) =>
        normalizeStatus(application.status) === status.toLowerCase(),
    ).length;

  const interviews = countInterviewStage(applications);

  const offers = countStatus("Offer");
  const rejected = countStatus("Rejected");

  const activeApplications = countActive(applications);
  const followUpsDue = countFollowUpsDue(applications);

  const followUpApplications = useMemo(
    () =>
      applications
        .filter((application) => {
          const daysUntil = getDaysUntil(application.follow_up_date, today);

          return daysUntil !== null && daysUntil >= 0 && daysUntil <= 7;
        })
        .sort((a, b) =>
          (a.follow_up_date ?? "").localeCompare(b.follow_up_date ?? ""),
        ),
    [applications, today],
  );

  const recentApplications = useMemo(
    () =>
      [...applications]
        .sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;

          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;

          return dateB - dateA;
        })
        .slice(0, 5),
    [applications],
  );

  const responseRate =
    applications.length > 0
      ? Math.round(((interviews + offers) / applications.length) * 100)
      : 0;

  const stats = [
    {
      label: "Total applications",
      value: applications.length,
      caption: "Every opportunity in one place",
      icon: BriefcaseBusiness,
      tone: "blue",
    },
    {
      label: "Interviews & assessments",
      value: interviews,
      caption: "Moving through the process",
      icon: CalendarDays,
      tone: "violet",
    },
    {
      label: "Offers received",
      value: offers,
      caption: "A step closer to your goal",
      icon: ChartNoAxesCombined,
      tone: "green",
    },
    {
      label: "Follow-ups due",
      value: followUpsDue,
      caption: "Overdue or due in the next 7 days",
      icon: Clock3,
      tone: "amber",
    },
  ];

  return (
    <div className="overview-page">
      {/* Hero section */}
      <section className="overview-hero">
        <div className="overview-hero-copy">
          <span className="overview-kicker">
            <Sparkles size={14} /> YOUR CAREER WORKSPACE
          </span>

          <h2>
            Make your next move <span>count.</span>
          </h2>

          <p>
            A clear view of your job search, the progress you have made, and
            what deserves your attention next.
          </p>

          <div className="overview-hero-actions">
            <Link className="overview-primary-action" to="/applications">
              Manage applications <ArrowRight size={16} />
            </Link>

            <Link className="overview-secondary-action" to="/analytics">
              View analytics <ChartNoAxesCombined size={16} />
            </Link>
          </div>
        </div>

        <div className="overview-hero-art" aria-hidden="true">
          <div className="overview-orbit overview-orbit-one" />
          <div className="overview-orbit overview-orbit-two" />

          <div className="overview-hero-symbol">
            <Target size={42} strokeWidth={1.5} />
          </div>

          <span className="overview-hero-spark overview-spark-one">✦</span>

          <span className="overview-hero-spark overview-spark-two">✧</span>
        </div>

        <div className="overview-hero-date">
          <CalendarDays size={15} /> {formatToday()}
        </div>
      </section>

      {/* Error message */}
      {error && (
        <div className="overview-error" role="alert">
          <span>{error}</span>

          <button type="button" onClick={() => void loadApplications()}>
            <RefreshCw size={14} /> Try again
          </button>
        </div>
      )}

      {/* Statistics */}
      <section
        className="overview-section-block"
        aria-labelledby="overview-stats-title"
      >
        <div className="overview-section-heading overview-stats-heading">
          <div>
            <span className="overview-section-kicker">THE BIG PICTURE</span>

            <h2 id="overview-stats-title">Your job search snapshot</h2>

            <p>Key numbers that help you understand your momentum.</p>
          </div>

          <span className="overview-live-indicator">
            <span /> Workspace snapshot
          </span>
        </div>

        <div className="overview-stats-grid">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <article className="overview-stat-card" key={stat.label}>
                <div
                  className={`overview-stat-icon overview-tone-${stat.tone}`}
                >
                  <Icon size={20} />
                </div>

                <div className="overview-stat-label">{stat.label}</div>

                <strong className="overview-stat-value">
                  {loading ? (
                    <span className="overview-value-skeleton" />
                  ) : (
                    stat.value
                  )}
                </strong>

                <span className="overview-stat-caption">{stat.caption}</span>
              </article>
            );
          })}
        </div>
      </section>

      {/* Application pipeline */}
      <section className="overview-section-block overview-pipeline-section">
        <div className="overview-section-heading">
          <div>
            <span className="overview-section-kicker">PIPELINE HEALTH</span>

            <h2>Where things stand</h2>

            <p>See how your applications are moving through each stage.</p>
          </div>

          <Link className="overview-text-link" to="/applications">
            Open pipeline <ArrowUpRight size={16} />
          </Link>
        </div>

        <div className="overview-pipeline-grid">
          {pipelineStatuses.map((status) => {
            const count = countStatus(status.label);

            const percentage =
              applications.length > 0 ? (count / applications.length) * 100 : 0;

            return (
              <article className="overview-pipeline-card" key={status.label}>
                <div className="overview-pipeline-topline">
                  <span
                    className={`overview-pipeline-dot dot-${status.color}`}
                  />

                  <span>{status.label}</span>
                </div>

                <strong>{loading ? "—" : count}</strong>

                <div className="overview-progress-track">
                  <span
                    className={`overview-progress-fill fill-${status.color}`}
                    style={{
                      width: `${loading ? 0 : percentage}%`,
                    }}
                  />
                </div>

                <small>
                  {loading ? "Loading" : `${Math.round(percentage)}% of total`}
                </small>
              </article>
            );
          })}
        </div>
      </section>

      {/* Insights */}
      <div className="overview-insights-grid">
        <section className="overview-insight-card overview-conversion-card">
          <div className="overview-insight-icon overview-tone-green">
            <CircleCheck size={20} />
          </div>

          <div className="overview-insight-copy">
            <span className="overview-section-kicker">CONVERSION INSIGHT</span>

            <h3>{loading ? "—" : `${responseRate}%`}</h3>

            <p>
              Interview and offer stages compared with all tracked applications.
            </p>
          </div>

          <div className="overview-insight-decoration" aria-hidden="true">
            ↗
          </div>
        </section>

        <section className="overview-insight-card">
          <div className="overview-insight-icon overview-tone-blue">
            <ClipboardList size={20} />
          </div>

          <div className="overview-insight-copy">
            <span className="overview-section-kicker">
              ACTIVE OPPORTUNITIES
            </span>

            <h3>{loading ? "—" : activeApplications}</h3>

            <p>Applied, assessment, and interview-stage applications.</p>
          </div>
        </section>

        <section className="overview-insight-card">
          <div className="overview-insight-icon overview-tone-rose">
            <CircleX size={20} />
          </div>

          <div className="overview-insight-copy">
            <span className="overview-section-kicker">CLOSED APPLICATIONS</span>

            <h3>{loading ? "—" : rejected}</h3>

            <p>Use every outcome to refine your next application.</p>
          </div>
        </section>
      </div>

      {/* Recent applications */}
      <section className="overview-section-block">
        <div className="overview-section-heading">
          <div>
            <span className="overview-section-kicker">LATEST ACTIVITY</span>

            <h2>Recent applications</h2>

            <p>Your five most recently added opportunities.</p>
          </div>

          <Link className="overview-text-link" to="/applications">
            View all applications <ArrowRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div className="overview-empty-state">
            Loading your recent applications…
          </div>
        ) : recentApplications.length === 0 ? (
          <div className="overview-empty-state">
            <span className="overview-empty-icon">
              <BriefcaseBusiness size={22} />
            </span>

            <h3>Your next opportunity starts here</h3>

            <p>
              Add your first application and Trackora will organize your
              progress.
            </p>

            <Link className="overview-primary-action" to="/applications">
              Add your first application <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="overview-table-wrap">
            <table className="overview-recent-table">
              <thead>
                <tr>
                  <th>Company & role</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Follow-up date</th>
                  <th aria-label="Open application" />
                </tr>
              </thead>

              <tbody>
                {recentApplications.map((application) => (
                  <tr key={application.id}>
                    <td>
                      <strong>{application.company_name}</strong>

                      <span>{application.job_title}</span>
                    </td>

                    <td>{application.location || "—"}</td>

                    <td>
                      <span
                        className={`overview-status-pill status-${normalizeStatus(application.status)}`}
                      >
                        {application.status}
                      </span>
                    </td>

                    <td>{formatDate(application.follow_up_date)}</td>

                    <td>
                      <Link
                        className="overview-row-link"
                        to={`/applications/${application.id}`}
                        aria-label={`View ${application.company_name} application`}
                      >
                        <ArrowUpRight size={17} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Upcoming follow-ups */}
      <section className="overview-section-block overview-followups-section">
        <div className="overview-section-heading">
          <div>
            <span className="overview-section-kicker">STAY ONE STEP AHEAD</span>

            <h2>Upcoming follow-ups</h2>

            <p>Keep the conversations moving with timely follow-ups.</p>
          </div>

          <Link className="overview-text-link" to="/follow-ups">
            All follow-ups <ArrowRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div className="overview-empty-state">
            Checking your upcoming follow-ups…
          </div>
        ) : followUpApplications.length === 0 ? (
          <div className="overview-followup-empty">
            <div className="overview-followup-empty-icon">
              <Clock3 size={21} />
            </div>

            <div>
              <strong>You're all caught up</strong>

              <p>No follow-ups are scheduled in the next seven days.</p>
            </div>
          </div>
        ) : (
          <div className="overview-followup-list">
            {followUpApplications.slice(0, 4).map((application) => {
              const daysUntil = getDaysUntil(application.follow_up_date, today);

              return (
                <article
                  className="overview-followup-item"
                  key={application.id}
                >
                  <div className="overview-followup-date-icon">
                    <CalendarDays size={18} />
                  </div>

                  <div className="overview-followup-details">
                    <strong>{application.company_name}</strong>

                    <span>{application.job_title}</span>
                  </div>

                  <div className="overview-followup-when">
                    <strong>{formatDate(application.follow_up_date)}</strong>

                    <span>
                      {daysUntil === 0 ? "Due today" : `In ${daysUntil} days`}
                    </span>
                  </div>

                  <Link
                    className="overview-row-link"
                    to={`/applications/${application.id}`}
                    aria-label={`View ${application.company_name} application`}
                  >
                    <ArrowUpRight size={17} />
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Quick actions */}
      <section className="overview-quick-actions">
        <div>
          <span className="overview-section-kicker">YOUR NEXT STEP</span>

          <h2>Keep your momentum going.</h2>

          <p>Everything you need to stay organized is one click away.</p>
        </div>

        <div className="overview-quick-links">
          <Link to="/applications">
            <BriefcaseBusiness size={18} />
            <span>Applications</span>
            <ArrowUpRight size={15} />
          </Link>

          <Link to="/analytics">
            <ChartNoAxesCombined size={18} />
            <span>Analytics</span>
            <ArrowUpRight size={15} />
          </Link>

          <Link to="/import">
            <ClipboardList size={18} />
            <span>Import a job</span>
            <ArrowUpRight size={15} />
          </Link>
        </div>
      </section>
    </div>
  );
}
