import {
  BriefcaseBusiness,
  CheckCircle2,
  ChartNoAxesCombined,
  MessageSquare,
  XCircle,
} from "lucide-react";
import type { Application } from "../api/applications";
import "./PipelineAnalytics.css";

type PipelineAnalyticsProps = {
  applications: Application[];
};

const stages = [
  { key: "saved", label: "Saved", color: "#d97706" },
  { key: "applied", label: "Applied", color: "#4285e8" },
  { key: "assessment", label: "Assessment", color: "#259b91" },
  { key: "interview", label: "Interview", color: "#7563e7" },
  { key: "offer", label: "Offer", color: "#25a875" },
  { key: "rejected", label: "Rejected", color: "#d65c68" },
  { key: "withdrawn", label: "Withdrawn", color: "#9290a5" },
];

export default function PipelineAnalytics({
  applications,
}: PipelineAnalyticsProps) {
  const counts = stages.map((stage) => ({
    ...stage,
    count: applications.filter(
      (application) => application.status.toLowerCase() === stage.key,
    ).length,
  }));

  const total = applications.length;
  const interviewCount = counts.find(
    (stage) => stage.key === "interview",
  )?.count ?? 0;
  const offerCount = counts.find(
    (stage) => stage.key === "offer",
  )?.count ?? 0;
  const rejectedCount = counts.find(
    (stage) => stage.key === "rejected",
  )?.count ?? 0;

  const activeApplications = applications.filter((application) =>
    ["applied", "assessment", "interview", "offer", "rejected"].includes(
      application.status.toLowerCase(),
    ),
  ).length;

  const interviewRate =
    activeApplications > 0
      ? Math.round(((interviewCount + offerCount) / activeApplications) * 100)
      : 0;

  const interviewOutcomes = interviewCount + offerCount + rejectedCount;
  const offerRate =
    interviewOutcomes > 0
      ? Math.round((offerCount / interviewOutcomes) * 100)
      : 0;

  return (
    <section className="pipeline-analytics">
      <div className="pipeline-heading">
        <div>
          <span className="pipeline-eyebrow">YOUR PROGRESS</span>
          <h2>Application pipeline</h2>
          <p>Understand how your opportunities are progressing.</p>
        </div>
        <span className="pipeline-heading-icon">
          <ChartNoAxesCombined size={21} />
        </span>
      </div>

      <div className="pipeline-metrics">
        <article className="pipeline-metric">
          <span className="pipeline-metric-icon pipeline-blue">
            <BriefcaseBusiness size={18} />
          </span>
          <span className="pipeline-metric-label">Active applications</span>
          <strong>{activeApplications}</strong>
          <span className="pipeline-metric-caption">
            Applications beyond Saved
          </span>
        </article>

        <article className="pipeline-metric">
          <span className="pipeline-metric-icon pipeline-purple">
            <MessageSquare size={18} />
          </span>
          <span className="pipeline-metric-label">Interview progress</span>
          <strong>{interviewRate}%</strong>
          <span className="pipeline-metric-caption">
            Interview-stage or offer applications / active applications
          </span>
        </article>

        <article className="pipeline-metric">
          <span className="pipeline-metric-icon pipeline-green">
            <CheckCircle2 size={18} />
          </span>
          <span className="pipeline-metric-label">Offer conversion</span>
          <strong>{offerRate}%</strong>
          <span className="pipeline-metric-caption">
            Offers / interview, offer and rejected applications
          </span>
        </article>
      </div>

      <div className="pipeline-breakdown">
        <div className="pipeline-breakdown-heading">
          <div>
            <h3>Status breakdown</h3>
            <p>{total} total {total === 1 ? "application" : "applications"}</p>
          </div>
        </div>

        {total === 0 ? (
          <div className="pipeline-empty">
            Add your first application to see your pipeline analytics.
          </div>
        ) : (
          <div className="pipeline-stage-list">
            {counts.map((stage) => {
              const percentage = Math.round((stage.count / total) * 100);

              return (
                <div className="pipeline-stage" key={stage.key}>
                  <div className="pipeline-stage-details">
                    <span className="pipeline-stage-name">
                      <span
                        className="pipeline-stage-dot"
                        style={{ backgroundColor: stage.color }}
                      />
                      {stage.label}
                    </span>
                    <span className="pipeline-stage-count">
                      {stage.count} · {percentage}%
                    </span>
                  </div>
                  <div
                    className="pipeline-stage-track"
                    role="progressbar"
                    aria-label={`${stage.label} applications`}
                    aria-valuemin={0}
                    aria-valuemax={total}
                    aria-valuenow={stage.count}
                  >
                    <span
                      className="pipeline-stage-fill"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: stage.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {rejectedCount > 0 && (
        <div className="pipeline-note">
          <XCircle size={16} />
          <span>
            {rejectedCount} {rejectedCount === 1 ? "application has" : "applications have"} been marked as rejected.
          </span>
        </div>
      )}
    </section>
  );
}
