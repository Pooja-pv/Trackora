import { useEffect, useState } from "react";
import { getApplications, type Application } from "../api/applications";
import PipelineAnalytics from "../components/PipelineAnalytics";

export default function AnalyticsPage() {
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
        if (active) setError("Unable to load analytics. Please try again.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="applications-section">
      <div className="applications-heading">
        <div>
          <h2>Application analytics</h2>
          <p>Understand your job-search pipeline.</p>
        </div>
      </div>

      {loading ? (
        <p>Loading analytics...</p>
      ) : error ? (
        <p className="applications-error" role="alert">{error}</p>
      ) : (
        <PipelineAnalytics applications={applications} />
      )}
    </section>
  );
}
