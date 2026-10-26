import { useEffect, useState } from "react";
import { getApplications, type Application } from "../api/applications";

export default function FollowUpsPage() {
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
        if (active) setError("Unable to load follow-ups. Please try again.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const followUps = applications
    .filter((application) => application.follow_up_date)
    .map((application) => {
      const date = new Date(`${application.follow_up_date!.slice(0, 10)}T00:00:00`);
      return { ...application, followUpDate: date };
    })
    .filter((application) => !Number.isNaN(application.followUpDate.getTime()))
    .sort((a, b) => a.followUpDate.getTime() - b.followUpDate.getTime());

  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  return (
    <section className="applications-section">
      <div className="applications-heading">
        <div>
          <h2>Follow-ups</h2>
          <p>Keep track of the next steps in your job search.</p>
        </div>
      </div>

      {loading ? (
        <p>Loading follow-ups...</p>
      ) : error ? (
        <p className="applications-error" role="alert">{error}</p>
      ) : followUps.length === 0 ? (
        <div className="applications-empty">
          <h3>No follow-ups scheduled</h3>
          <p>Add a follow-up date to an application to see it here.</p>
        </div>
      ) : (
        <div className="applications-table-wrap">
          <table className="applications-table">
            <thead>
              <tr>
                <th>Company / Role</th>
                <th>Follow-up date</th>
                <th>Reminder</th>
              </tr>
            </thead>
            <tbody>
              {followUps.map((application) => {
                const overdue = application.followUpDate < today;
                const dueToday = application.followUpDate.getTime() === today.getTime();

                return (
                  <tr key={application.id}>
                    <td>
                      <strong>{application.company_name}</strong>
                      <span className="table-job-title">{application.job_title}</span>
                    </td>
                    <td>{formatDate(application.followUpDate)}</td>
                    <td>
                      <span className={`follow-up-badge follow-up-${overdue ? "overdue" : "upcoming"}`}>
                        {overdue ? "Overdue" : dueToday ? "Due today" : "Scheduled"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
