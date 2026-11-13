import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BriefcaseBusiness,
  CalendarDays,
  ChartNoAxesCombined,
  Clock3,
  TrendingUp,
  CircleCheck,
  CircleX,
  ArrowUpRight,
  ClipboardList,
} from "lucide-react";
import { getApplications, type Application } from "../api/applications";

const pipelineStatuses = [
  { label: "Saved", color: "pipeline-saved" },
  { label: "Applied", color: "pipeline-applied" },
  { label: "Assessment", color: "pipeline-assessment" },
  { label: "Interview", color: "pipeline-interview" },
  { label: "Offer", color: "pipeline-offer" },
];

function normalizeStatus(status: string) {
  return status.trim().toLowerCase();
}

function formatDate(dateValue: string | null) {
  if (!dateValue) return "—";

  const date = new Date(`${dateValue.slice(0, 10)}T00:00:00`);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function Overview() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    getApplications()
      .then((data) => {
        if (active) setApplications(data);
      })
      .catch(() => {
        if (active) setError("Unable to load your overview. Please try again.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const countStatus = (status: string) =>
    applications.filter(
      (application) =>
        normalizeStatus(application.status) === status.toLowerCase(),
    ).length;

  const interviews = applications.filter((application) =>
    ["interview", "assessment"].includes(normalizeStatus(application.status)),
  ).length;

  const offers = countStatus("Offer");
  const rejected = countStatus("Rejected");
  const activeApplications = applications.filter((application) =>
    ["saved", "applied", "assessment", "interview"].includes(
      normalizeStatus(application.status),
    ),
  ).length;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const followUpApplications = applications
    .filter((application) => {
      if (!application.follow_up_date) return false;

      const date = new Date(
        `${application.follow_up_date.slice(0, 10)}T00:00:00`,
      );
      const daysUntil = (date.getTime() - today.getTime()) / 86400000;

      return !Number.isNaN(date.getTime()) && daysUntil >= 0 && daysUntil <= 7;
    })
    .sort((a, b) =>
      (a.follow_up_date ?? "").localeCompare(b.follow_up_date ?? ""),
    );

  const recentApplications = [...applications]
    .sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 5);

  const stats = [
    {
      label: "Total applications",
      value: applications.length,
      caption: "Opportunities tracked",
      icon: BriefcaseBusiness,
      color: "stat-icon-blue",
    },
    {
      label: "Interviews & assessments",
      value: interviews,
      caption: "Progress in the pipeline",
      icon: CalendarDays,
      color: "stat-icon-purple",
    },
    {
      label: "Offers received",
      value: offers,
      caption: "Potential next steps",
      icon: TrendingUp,
      color: "stat-icon-green",
    },
    {
      label: "Follow-ups due",
      value: followUpApplications.length,
      caption: "Due within the next 7 days",
      icon: Clock3,
      color: "stat-icon-orange",
    },
  ];

  const responseRate =
    applications.length > 0
      ? Math.round(((interviews + offers) / applications.length) * 100)
      : 0;

  return (
    <>
      <section className="dashboard-welcome">
        <div>
          <span className="dashboard-eyebrow">YOUR CAREER JOURNEY</span>
          <h2>Your job search at a glance</h2>
          <p>Track your progress, stay prepared, and keep moving forward.</p>
        </div>
        <div className="welcome-icon">
          <BriefcaseBusiness size={32} />
        </div>
      </section>

      {error && (
        <div className="applications-error" role="alert">
          {error}
        </div>
      )}

      <section className="dashboard-stats">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <article className="dashboard-stat-card" key={stat.label}>
              <span className={`stat-icon ${stat.color}`}>
                <Icon size={21} />
              </span>
              <p>{stat.label}</p>
              <strong>{loading ? "—" : stat.value}</strong>
              <span className="stat-caption">{stat.caption}</span>
            </article>
          );
        })}
      </section>

      <section className="applications-section">
        <div className="applications-heading">
          <div>
            <h2>Application pipeline</h2>
            <p>See where your opportunities currently stand.</p>
          </div>
          <Link className="secondary-button" to="/applications">
            Manage jobs
          </Link>
        </div>

        <div className="pipeline-grid">
          {pipelineStatuses.map((status) => {
            const count = countStatus(status.label);
            const percentage =
              applications.length > 0 ? (count / applications.length) * 100 : 0;

            return (
              <article className="pipeline-card" key={status.label}>
                <span className="pipeline-label">{status.label}</span>
                <strong className="pipeline-number">
                  {loading ? "—" : count}
                </strong>
                <div className="pipeline-track">
                  <span
                    className={`pipeline-fill ${status.color}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="pipeline-caption">
                  {loading
                    ? "Loading"
                    : `${Math.round(percentage)}% of applications`}
                </span>
              </article>
            );
          })}
        </div>
      </section>

      <section className="dashboard-stats">
        <article className="dashboard-stat-card">
          <span className="stat-icon stat-icon-green">
            <CircleCheck size={21} />
          </span>
          <p>Interview / offer rate</p>
          <strong>{loading ? "—" : `${responseRate}%`}</strong>
          <span className="stat-caption">
            Interviews and offers relative to all applications
          </span>
        </article>

        <article className="dashboard-stat-card">
          <span className="stat-icon stat-icon-orange">
            <CircleX size={21} />
          </span>
          <p>Rejected applications</p>
          <strong>{loading ? "—" : rejected}</strong>
          <span className="stat-caption">Keep learning from each outcome</span>
        </article>

        <article className="dashboard-stat-card">
          <span className="stat-icon stat-icon-blue">
            <ClipboardList size={21} />
          </span>
          <p>Active opportunities</p>
          <strong>{loading ? "—" : activeApplications}</strong>
          <span className="stat-caption">
            Saved, applied, assessment, or interview
          </span>
        </article>
      </section>

      <section className="applications-section">
        <div className="applications-heading">
          <div>
            <h2>Recent applications</h2>
            <p>Your latest tracked opportunities.</p>
          </div>
          <Link className="secondary-button" to="/applications">
            View all
          </Link>
        </div>

        {loading ? (
          <div className="applications-empty">
            <p>Loading your applications...</p>
          </div>
        ) : recentApplications.length === 0 ? (
          <div className="applications-empty">
            <span className="empty-icon">
              <BriefcaseBusiness size={23} />
            </span>
            <h3>Start tracking your job search</h3>
            <p>Add your first application to see your progress here.</p>
            <Link className="dashboard-add-button" to="/applications">
              Go to My Applications
            </Link>
          </div>
        ) : (
          <div className="applications-table-wrap">
            <table className="applications-table">
              <thead>
                <tr>
                  <th>Company / Role</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Follow-up</th>
                </tr>
              </thead>
              <tbody>
                {recentApplications.map((application) => (
                  <tr key={application.id}>
                    <td>
                      <strong>{application.company_name}</strong>
                      <span className="table-job-title">
                        {application.job_title}
                      </span>
                    </td>
                    <td>{application.location || "—"}</td>
                    <td>
                      <span
                        className={`application-status status-${normalizeStatus(application.status)}`}
                      >
                        {application.status}
                      </span>
                    </td>
                    <td>{formatDate(application.follow_up_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="applications-section">
        <div className="applications-heading">
          <div>
            <h2>Upcoming follow-ups</h2>
            <p>Scheduled follow-ups within the next seven days.</p>
          </div>
          <Link className="secondary-button" to="/follow-ups">
            View follow-ups
          </Link>
        </div>

        {loading ? (
          <div className="applications-empty">
            <p>Checking your follow-ups...</p>
          </div>
        ) : followUpApplications.length === 0 ? (
          <div className="applications-empty">
            <span className="empty-icon">
              <Clock3 size={23} />
            </span>
            <h3>You're up to date</h3>
            <p>No follow-ups are scheduled for the next seven days.</p>
          </div>
        ) : (
          <div className="follow-up-list">
            {followUpApplications.slice(0, 4).map((application) => (
              <article className="follow-up-item" key={application.id}>
                <div className="follow-up-item-icon">
                  <Clock3 size={19} />
                </div>
                <div className="follow-up-item-content">
                  <strong>{application.company_name}</strong>
                  <span>{application.job_title}</span>
                  <small>{formatDate(application.follow_up_date)}</small>
                </div>
                <Link
                  className="follow-up-open-link"
                  to={`/applications/${application.id}`}
                  aria-label={`View ${application.company_name} application`}
                >
                  <ArrowUpRight size={19} />
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="applications-section">
        <div className="applications-heading">
          <div>
            <h2>Keep your momentum</h2>
            <p>Go directly to the tools you need.</p>
          </div>
        </div>

        <div className="dashboard-stats">
          <Link className="dashboard-stat-card" to="/applications">
            <span className="stat-icon stat-icon-blue">
              <BriefcaseBusiness size={21} />
            </span>
            <p>Manage applications</p>
            <span className="stat-caption">Add, update, and organize jobs</span>
          </Link>

          <Link className="dashboard-stat-card" to="/analytics">
            <span className="stat-icon stat-icon-purple">
              <ChartNoAxesCombined size={21} />
            </span>
            <p>Review analytics</p>
            <span className="stat-caption">Understand your pipeline</span>
          </Link>

          <Link className="dashboard-stat-card" to="/follow-ups">
            <span className="stat-icon stat-icon-orange">
              <Clock3 size={21} />
            </span>
            <p>Check follow-ups</p>
            <span className="stat-caption">Stay on top of reminders</span>
          </Link>
        </div>
      </section>
    </>
  );
}
