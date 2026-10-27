import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarClock,
  ChartNoAxesCombined,
  RefreshCw,
  Target,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getApplications, type Application } from "../api/applications";
import PipelineAnalytics from "../components/PipelineAnalytics";

function ApplicationActivityChart({
  applications,
}: {
  applications: Application[];
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dayOfWeek = (today.getDay() + 6) % 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - dayOfWeek);

  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);

    return {
      date,
      key: `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`,
      label: date.toLocaleDateString("en", { weekday: "short" }),
    };
  });

  const counts = days.map((day) =>
    applications.filter((application) => {
      const sourceDate = application.applied_date || application.created_at;
      if (!sourceDate) return false;

      const date = new Date(sourceDate);
      if (Number.isNaN(date.getTime())) return false;

      date.setHours(0, 0, 0, 0);

      return (
        `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}` ===
        day.key
      );
    }).length,
  );

  const maxCount = Math.max(...counts, 1);
  const axisStep = Math.max(1, Math.ceil(maxCount / 3));
  const axisMax = Math.ceil(maxCount / axisStep) * axisStep;

  const chartWidth = 640;
  const chartHeight = 170;
  const left = 38;
  const right = 18;
  const top = 16;
  const bottom = 32;
  const plotWidth = chartWidth - left - right;
  const plotHeight = chartHeight - top - bottom;

  const points = counts.map((count, index) => ({
    x: left + (plotWidth / 6) * index,
    y: top + plotHeight - (count / axisMax) * plotHeight,
    count,
  }));

  const line = points.map((point) => `${point.x},${point.y}`).join(" ");
  const area = `${left},${top + plotHeight} ${line} ${
    left + plotWidth
  },${top + plotHeight}`;

  const totalThisWeek = counts.reduce((sum, count) => sum + count, 0);

  const axisValues = Array.from(
    { length: axisMax / axisStep + 1 },
    (_, index) => axisMax - index * axisStep,
  );

  return (
    <section className="activity-chart-card">
      <div className="activity-chart-header">
        <div>
          <span className="analytics-eyebrow">YOUR RECENT ACTIVITY</span>
          <h3>Application activity</h3>
          <p>Applications recorded this week.</p>
        </div>
        <div className="activity-chart-total">
          <strong>{totalThisWeek}</strong>
          <span>This week</span>
        </div>
      </div>

      {applications.length === 0 ? (
        <div className="activity-chart-empty">
          <ChartNoAxesCombined size={28} />
          <strong>Your activity will appear here</strong>
          <p>Add an opportunity to start tracking your job-search activity.</p>
        </div>
      ) : (
        <>
          <div className="activity-chart-visual">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              role="img"
              aria-label={`Application activity from Monday to Sunday. ${totalThisWeek} applications recorded this week.`}
              preserveAspectRatio="xMidYMid meet"
            >
              {axisValues.map((value, index) => {
                const y =
                  top + plotHeight - (value / axisMax) * plotHeight;

                return (
                  <g key={index}>
                    <line
                      x1={left}
                      y1={y}
                      x2={chartWidth - right}
                      y2={y}
                      className="activity-chart-gridline"
                    />
                    <text
                      x={left - 12}
                      y={y + 4}
                      textAnchor="end"
                      className="activity-chart-axis-label"
                    >
                      {value}
                    </text>
                  </g>
                );
              })}

              <polygon points={area} className="activity-chart-area" />

              <polyline
                points={line}
                className="activity-chart-line"
                fill="none"
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {points.map((point, index) => (
                <g key={days[index].key}>
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="4"
                    className="activity-chart-point"
                  >
                    <title>
                      {days[index].date.toLocaleDateString("en", {
                        month: "short",
                        day: "numeric",
                      })}
                      : {point.count}{" "}
                      {point.count === 1 ? "application" : "applications"}
                    </title>
                  </circle>
                  <text
                    x={point.x}
                    y={chartHeight - 10}
                    textAnchor="middle"
                    className="activity-chart-axis-label"
                  >
                    {days[index].label}
                  </text>
                </g>
              ))}
            </svg>
          </div>
          <p className="activity-chart-footnote">
            Based on application dates, or creation dates when no application
            date is set.
          </p>
        </>
      )}
    </section>
  );
}

export default function AnalyticsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    const loadApplications = async () => {
      try {
        setError("");
        const data = await getApplications();

        if (active) setApplications(data);
      } catch {
        if (active) setError("Unable to load analytics. Please try again.");
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadApplications();

    return () => {
      active = false;
    };
  }, []);

  const activeCount = applications.filter((application) =>
    ["applied", "assessment", "interview"].includes(
      application.status.toLowerCase(),
    ),
  ).length;

  const interviewCount = applications.filter(
    (application) => application.status.toLowerCase() === "interview",
  ).length;

  const offerCount = applications.filter(
    (application) => application.status.toLowerCase() === "offer",
  ).length;

  const upcomingFollowUps = applications.filter((application) => {
    if (!application.follow_up_date) return false;

    const followUp = new Date(application.follow_up_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    followUp.setHours(0, 0, 0, 0);

    return (
      followUp >= today &&
      !["rejected", "withdrawn", "offer"].includes(
        application.status.toLowerCase(),
      )
    );
  }).length;

  const metrics = [
    {
      label: "Total applications",
      value: applications.length,
      detail: "All tracked opportunities",
      icon: BriefcaseBusiness,
      style: "analytics-metric-purple",
    },
    {
      label: "Active pipeline",
      value: activeCount,
      detail: "Applied, assessment or interview",
      icon: ChartNoAxesCombined,
      style: "analytics-metric-blue",
    },
    {
      label: "Interviews",
      value: interviewCount,
      detail: "Currently at interview stage",
      icon: Target,
      style: "analytics-metric-violet",
    },
    {
      label: "Offers",
      value: offerCount,
      detail: "Offers received",
      icon: ArrowUpRight,
      style: "analytics-metric-green",
    },
  ];

  return (
    <section className="analytics-page">
      <div className="analytics-page-header">
        <div>
          <span className="analytics-eyebrow">PERFORMANCE OVERVIEW</span>
          <h2>Application analytics</h2>
          <p>Turn your job-search activity into clearer next steps.</p>
        </div>

        <button
          type="button"
          className="analytics-header-action"
          onClick={() => navigate("/applications")}
        >
          <BriefcaseBusiness size={16} />
          View applications
          <ArrowUpRight size={15} />
        </button>
      </div>

      {loading ? (
        <div className="analytics-state">
          <span className="loading-indicator" />
          <p>Preparing your analytics...</p>
        </div>
      ) : error ? (
        <div className="analytics-state analytics-state-error" role="alert">
          <p>{error}</p>
          <button
            type="button"
            className="analytics-header-action"
            onClick={() => window.location.reload()}
          >
            <RefreshCw size={15} />
            Try again
          </button>
        </div>
      ) : (
        <>
          <div className="analytics-welcome">
            <div className="analytics-welcome-icon">
              <ChartNoAxesCombined size={23} />
            </div>
            <div>
              <span>Your job search at a glance</span>
              <p>
                {applications.length === 0
                  ? "Add your first opportunity to start tracking your progress."
                  : `You are tracking ${applications.length} ${
                      applications.length === 1
                        ? "opportunity"
                        : "opportunities"
                    }. Review your pipeline to decide what to focus on next.`}
              </p>
            </div>
          </div>

          <div className="analytics-metric-grid">
            {metrics.map((metric) => {
              const MetricIcon = metric.icon;

              return (
                <article className="analytics-metric-card" key={metric.label}>
                  <div className="analytics-metric-top">
                    <span className="analytics-metric-label">
                      {metric.label}
                    </span>
                    <span className={`analytics-metric-icon ${metric.style}`}>
                      <MetricIcon size={19} />
                    </span>
                  </div>
                  <strong>{metric.value}</strong>
                  <span className="analytics-metric-detail">
                    {metric.detail}
                  </span>
                </article>
              );
            })}
          </div>

          <div className="analytics-content-heading">
            <div>
              <h3>Pipeline performance</h3>
              <p>Explore how your tracked applications are progressing.</p>
            </div>
          </div>

          <PipelineAnalytics applications={applications} />

          <ApplicationActivityChart applications={applications} />

          <div className="analytics-insights-heading">
            <div>
              <h3>Next steps</h3>
              <p>Useful reminders based on your saved application data.</p>
            </div>
          </div>

          <div className="analytics-insights-grid">
            <article className="analytics-insight-card">
              <span className="analytics-insight-icon analytics-metric-blue">
                <CalendarClock size={19} />
              </span>
              <div className="analytics-insight-copy">
                <h4>Follow-up reminders</h4>
                <p>
                  {upcomingFollowUps > 0
                    ? `${upcomingFollowUps} ${
                        upcomingFollowUps === 1
                          ? "application has"
                          : "applications have"
                      } a follow-up scheduled for today or a future date.`
                    : "No upcoming follow-ups are scheduled. Add a follow-up date when you need to check in with an employer."}
                </p>
              </div>
              <button
                type="button"
                className="analytics-insight-link"
                onClick={() => navigate("/follow-ups")}
              >
                View follow-ups
                <ArrowUpRight size={15} />
              </button>
            </article>

            <article className="analytics-insight-card">
              <span className="analytics-insight-icon analytics-metric-green">
                <Target size={19} />
              </span>
              <div className="analytics-insight-copy">
                <h4>Keep your pipeline moving</h4>
                <p>
                  {applications.length === 0
                    ? "Start by recording roles that interest you, then update their status as you progress."
                    : activeCount > 0
                      ? `${activeCount} ${
                          activeCount === 1
                            ? "application is"
                            : "applications are"
                        } in your active pipeline. Keep statuses and next steps up to date.`
                      : "Review saved opportunities and update application statuses when you take the next step."}
                </p>
              </div>
              <button
                type="button"
                className="analytics-insight-link"
                onClick={() => navigate("/applications")}
              >
                Manage applications
                <ArrowUpRight size={15} />
              </button>
            </article>
          </div>
        </>
      )}
    </section>
  );
}