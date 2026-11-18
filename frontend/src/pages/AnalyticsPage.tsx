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
import {
  countActive,
  countFollowUpsDue,
  countInterviewStage,
} from "../utils/metrics";



function ApplicationActivityChart({
  applications,
}: {
  applications: Application[];
}) {
  const [period, setPeriod] = useState<7 | 30 | 90>(7);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDate = new Date(today);

  if (period === 7) {
    const dayOfWeek = today.getDay();
    startDate.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
  } else {
    startDate.setDate(today.getDate() - period + 1);
  }

  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + period - 1);

  const dateKey = (date: Date) =>
    `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

  const days = Array.from({ length: period }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);

    return {
      date,
      key: dateKey(date),
    };
  });

  const counts = days.map((day) =>
    applications.filter((application) => {
      const sourceDate = application.applied_date || application.created_at;
      if (!sourceDate) return false;

      const date = new Date(sourceDate);
      if (Number.isNaN(date.getTime())) return false;

      date.setHours(0, 0, 0, 0);
      return dateKey(date) === day.key;
    }).length,
  );

  const total = counts.reduce((sum, count) => sum + count, 0);
  const maxCount = Math.max(...counts, 1);
  const axisStep = Math.max(1, Math.ceil(maxCount / 3));
  const axisMax = Math.max(
    axisStep,
    Math.ceil(maxCount / axisStep) * axisStep,
  );

  const chartWidth = 720;
  const chartHeight = 250;
  const left = 44;
  const right = 18;
  const top = 24;
  const bottom = 42;
  const plotWidth = chartWidth - left - right;
  const plotHeight = chartHeight - top - bottom;

  const points = counts.map((count, index) => ({
    x: left + (plotWidth / Math.max(period - 1, 1)) * index,
    y: top + plotHeight - (count / axisMax) * plotHeight,
    count,
  }));

  const line = points.map((point) => `${point.x},${point.y}`).join(" ");
  const area = `${left},${top + plotHeight} ${line} ${left + plotWidth},${top + plotHeight}`;

  const axisValues = Array.from(
    { length: Math.ceil(axisMax / axisStep) + 1 },
    (_, index) => axisMax - index * axisStep,
  );

  const labelIndexes =
    period === 7
      ? Array.from({ length: 7 }, (_, index) => index)
      : Array.from(
          new Set(
            Array.from({ length: 7 }, (_, index) =>
              Math.round((index * (period - 1)) / 6),
            ),
          ),
        );

  const formatDate = (date: Date, includeYear = false) =>
    date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      ...(includeYear ? { year: "numeric" } : {}),
    });

  const selected =
    selectedIndex === null
      ? null
      : {
          ...days[selectedIndex],
          ...points[selectedIndex],
        };

  return (
    <section className="activity-chart-card">
      <div className="activity-chart-header">
        <div className="activity-chart-heading">
          <span className="analytics-eyebrow">YOUR RECENT ACTIVITY</span>
          <h3>Application activity</h3>
          <p>
            {period === 7 ? "Week of " : ""}
            {formatDate(startDate)}
            {" – "}
            {formatDate(endDate, true)}
          </p>
        </div>

        <div className="activity-chart-total">
          <strong>{total}</strong>
          <span>
            {period === 7
              ? "This week"
              : `Last ${period} days`}
          </span>
        </div>
      </div>

      <div
        className="activity-period-switch"
        role="group"
        aria-label="Activity reporting period"
      >
        {([7, 30, 90] as const).map((value) => (
          <button
            key={value}
            type="button"
            className={period === value ? "active" : ""}
            aria-pressed={period === value}
            onClick={() => {
              setPeriod(value);
              setSelectedIndex(null);
            }}
          >
            {value === 7 ? "Week" : `${value} days`}
          </button>
        ))}
      </div>

      {applications.length === 0 ? (
        <div className="activity-chart-empty">
          <ChartNoAxesCombined size={28} />
          <strong>Your activity will appear here</strong>
          <p>Add an opportunity to start tracking your job-search activity.</p>
        </div>
      ) : (
        <>
          {total === 0 && (
            <div className="activity-chart-no-results">
              No applications recorded in this period. Try a longer date range
              or add an application to see your activity here.
            </div>
          )}

          <div className="activity-chart-visual">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              role="group"
              aria-label={`Application activity from ${formatDate(startDate)} to ${formatDate(endDate)}. ${total} applications recorded.`}
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <linearGradient
                  id="activityChartGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.34" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.015" />
                </linearGradient>
              </defs>

              {axisValues.map((value) => {
                const y = top + plotHeight - (value / axisMax) * plotHeight;

                return (
                  <g key={value}>
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
                <g
                  key={days[index].key}
                  className="activity-chart-data-point"
                  onMouseEnter={() => setSelectedIndex(index)}
                  onMouseLeave={() => setSelectedIndex(null)}
                >
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={selectedIndex === index ? 6 : period === 7 ? 4 : 2.5}
                    className={`activity-chart-point${selectedIndex === index ? " selected" : ""}`}
                  />
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={period === 7 ? 12 : 8}
                    fill="transparent"
                    tabIndex={0}
                    role="button"
                    aria-label={`${formatDate(days[index].date)}: ${point.count} ${point.count === 1 ? "application" : "applications"}`}
                    onFocus={() => setSelectedIndex(index)}
                    onBlur={() => setSelectedIndex(null)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedIndex(index);
                      }
                      if (event.key === "Escape") {
                        setSelectedIndex(null);
                      }
                    }}
                  />
                </g>
              ))}

              {labelIndexes.map((index) => (
                <text
                  key={days[index].key}
                  x={points[index].x}
                  y={chartHeight - 12}
                  textAnchor="middle"
                  className="activity-chart-axis-label"
                >
                  {period === 7
                    ? days[index].date.toLocaleDateString("en-IN", {
                        weekday: "short",
                      })
                    : formatDate(days[index].date)}
                </text>
              ))}
            </svg>
          </div>

          {selected && (
            <div className="activity-chart-tooltip" aria-live="polite">
              <span>{formatDate(selected.date, true)}</span>
              <strong>
                {selected.count}{" "}
                {selected.count === 1 ? "application" : "applications"}
              </strong>
            </div>
          )}

          <p className="activity-chart-footnote">
            Based on application dates, or creation dates when no application
            date is set. Select or hover over a chart point for details.
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

  const activeCount = countActive(applications);

  const interviewCount = countInterviewStage(applications);

  const offerCount = applications.filter(
    (application) => application.status.toLowerCase() === "offer",
  ).length;

  const upcomingFollowUps = countFollowUpsDue(applications);

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
      label: "Interviews & assessments",
      value: interviewCount,
      detail: "Interview and assessment stages",
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
                      } a follow-up that is overdue or due within 7 days.`
                    : "No follow-ups are due. Add a follow-up date when you need to check in with an employer."}
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