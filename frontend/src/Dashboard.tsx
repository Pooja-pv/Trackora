import { useEffect, useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  CalendarDays,
  ChartNoAxesCombined,
  CirclePlus,
  Clock3,
  Pencil,
  Search,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";
import {
  createApplication,
  deleteApplication,
  getApplications,
  updateApplication,
  type Application,
  type ApplicationStatus,
} from "./api/applications";
import PipelineAnalytics from "./components/PipelineAnalytics";

const statusOptions: ApplicationStatus[] = [
  "Saved",
  "Applied",
  "Assessment",
  "Interview",
  "Offer",
  "Rejected",
  "Withdrawn",
];

const displayStatus = (value: string) => {
  const normalized = value.toLowerCase();
  return statusOptions.find((item) => item.toLowerCase() === normalized) ?? value;
};

const getToday = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDate = (value?: string | null) => {
  if (!value) return "—";

  const date = new Date(`${value.slice(0, 10)}T00:00:00`);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getFollowUpState = (value?: string | null) => {
  if (!value) return "none";

  const date = value.slice(0, 10);
  const today = getToday();
  const nextWeek = new Date(`${today}T00:00:00`);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const year = nextWeek.getFullYear();
  const month = String(nextWeek.getMonth() + 1).padStart(2, "0");
  const day = String(nextWeek.getDate()).padStart(2, "0");
  const nextWeekString = `${year}-${month}-${day}`;

  if (date < today) return "overdue";
  if (date <= nextWeekString) return "upcoming";
  return "scheduled";
};

export default function Dashboard() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState<ApplicationStatus>("Saved");
  const [followUpDate, setFollowUpDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;

    const loadApplications = async () => {
      try {
        const data = await getApplications();

        if (active) {
          setApplications(data);
          setError("");
        }
      } catch {
        if (active) {
          setError("Unable to load your applications. Please refresh and try again.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadApplications();

    return () => {
      active = false;
    };
  }, []);

  const filteredApplications = useMemo(() => {
    const query = search.trim().toLowerCase();

    return applications.filter((application) => {
      const matchesSearch = [
        application.company_name,
        application.job_title,
        application.location,
      ].some((value) => value?.toLowerCase().includes(query));

      const matchesStatus =
        statusFilter === "all" ||
        application.status.toLowerCase() === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [applications, search, statusFilter]);

  const interviewCount = applications.filter((application) =>
    ["interview", "assessment"].includes(application.status.toLowerCase()),
  ).length;

  const offerCount = applications.filter(
    (application) => application.status.toLowerCase() === "offer",
  ).length;

  const followUpsDue = applications.filter((application) => {
    const state = getFollowUpState(application.follow_up_date);
    return state === "overdue" || state === "upcoming";
  }).length;

  const resetForm = () => {
    setCompany("");
    setPosition("");
    setLocation("");
    setStatus("Saved");
    setFollowUpDate("");
    setEditingId(null);
    setShowForm(false);
    setError("");
  };

  const openNewForm = () => {
    resetForm();
    setSuccess("");
    setShowForm(true);
    window.setTimeout(() => {
      document.getElementById("application-form")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);
  };

  const startEditing = (application: Application) => {
    setCompany(application.company_name);
    setPosition(application.job_title);
    setLocation(application.location ?? "");
    setStatus(displayStatus(application.status) as ApplicationStatus);
    setFollowUpDate(application.follow_up_date?.slice(0, 10) ?? "");
    setEditingId(application.id);
    setShowForm(true);
    setError("");
    setSuccess("");

    window.setTimeout(() => {
      document.getElementById("application-form")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);
  };

  const saveApplication = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!company.trim() || !position.trim()) {
      setError("Please enter both the company name and job title.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    const existingApplication = applications.find(
      (application) => application.id === editingId,
    );

    const payload = {
      company_name: company.trim(),
      job_title: position.trim(),
      location: location.trim(),
      status: status.toLowerCase(),
      applied_date: existingApplication?.applied_date ?? getToday(),
      follow_up_date: followUpDate || null,
    };

    try {
      if (editingId !== null) {
        const updated = await updateApplication(editingId, payload);

        setApplications((current) =>
          current.map((application) =>
            application.id === editingId ? updated : application,
          ),
        );

        setSuccess("Application updated successfully.");
      } else {
        const created = await createApplication(payload);

        setApplications((current) => [created, ...current]);
        setSuccess("Application added successfully.");
      }

      setShowForm(false);
      setEditingId(null);
      setCompany("");
      setPosition("");
      setLocation("");
      setStatus("Saved");
      setFollowUpDate("");
    } catch {
      setError("Unable to save the application. Please check your details and try again.");
    } finally {
      setSaving(false);
    }
  };

  const removeApplication = async (id: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this application?",
    );

    if (!confirmed) return;

    setDeletingId(id);
    setError("");
    setSuccess("");

    try {
      await deleteApplication(id);

      setApplications((current) =>
        current.filter((application) => application.id !== id),
      );

      if (editingId === id) resetForm();

      setSuccess("Application deleted successfully.");
    } catch {
      setError("Unable to delete the application. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="dashboard-content">
      <div className="dashboard-page">
        <aside className="dashboard-sidebar">
          <div className="dashboard-brand">
            <span className="dashboard-brand-icon">
              <BriefcaseBusiness size={21} />
            </span>
            <span>Trackora</span>
          </div>

          <p className="sidebar-section-label">WORKSPACE</p>

          <a href="#dashboard" className="sidebar-link sidebar-link-active">
            <ChartNoAxesCombined size={19} />
            <span>Dashboard</span>
          </a>

          <div className="sidebar-bottom">
            <div className="sidebar-tip">
              <TrendingUp size={20} />
              <strong>Stay organized. Move forward.</strong>
              <p>Every application is a step closer to your next opportunity.</p>
            </div>
          </div>
        </aside>

        <main className="dashboard-main" id="dashboard">
          <header className="dashboard-topbar">
            <div>
              <p className="dashboard-breadcrumb">YOUR CAREER WORKSPACE</p>
              <h1>Dashboard</h1>
            </div>

            <button
              type="button"
              className="dashboard-add-button"
              onClick={openNewForm}
            >
              <CirclePlus size={18} />
              Add application
            </button>
          </header>

          <section className="dashboard-welcome">
            <div>
              <span className="dashboard-eyebrow">YOUR CAREER JOURNEY</span>
              <h2>Your job search at a glance</h2>
              <p>Keep track of your opportunities and next steps.</p>
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

          {success && (
            <div className="applications-success" role="status">
              {success}
            </div>
          )}

          <section className="dashboard-stats">
            <article className="dashboard-stat-card">
              <span className="stat-icon stat-icon-blue">
                <BriefcaseBusiness size={21} />
              </span>
              <p>Total applications</p>
              <strong>{applications.length}</strong>
              <span className="stat-caption">Opportunities tracked</span>
            </article>

            <article className="dashboard-stat-card">
              <span className="stat-icon stat-icon-purple">
                <CalendarDays size={21} />
              </span>
              <p>Interviews</p>
              <strong>{interviewCount}</strong>
              <span className="stat-caption">Interview-stage applications</span>
            </article>

            <article className="dashboard-stat-card">
              <span className="stat-icon stat-icon-green">
                <TrendingUp size={21} />
              </span>
              <p>Offers</p>
              <strong>{offerCount}</strong>
              <span className="stat-caption">Offers received</span>
            </article>

            <article className="dashboard-stat-card">
              <span className="stat-icon stat-icon-orange">
                <Clock3 size={21} />
              </span>
              <p>Follow-ups due</p>
              <strong>{followUpsDue}</strong>
              <span className="stat-caption">Due today or within 7 days</span>
            </article>
          </section>

          <PipelineAnalytics applications={applications} />

          {showForm && (
            <section className="application-form-card" id="application-form">
              <div className="section-heading">
                <div>
                  <h2>
                    {editingId !== null ? "Edit application" : "Add application"}
                  </h2>
                  <p>Keep your job search details up to date.</p>
                </div>

                <button
                  type="button"
                  className="form-cancel-button"
                  aria-label="Close form"
                  onClick={resetForm}
                >
                  <X size={18} />
                </button>
              </div>

              <form className="application-form" onSubmit={saveApplication}>
                <label>
                  Company name
                  <input
                    type="text"
                    value={company}
                    onChange={(event) => setCompany(event.target.value)}
                    placeholder="e.g. Google"
                    required
                  />
                </label>

                <label>
                  Job title
                  <input
                    type="text"
                    value={position}
                    onChange={(event) => setPosition(event.target.value)}
                    placeholder="e.g. Python Developer"
                    required
                  />
                </label>

                <label>
                  Location
                  <input
                    type="text"
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                    placeholder="e.g. Kochi or Remote"
                  />
                </label>

                <label>
                  Application status
                  <select
                    value={status}
                    onChange={(event) =>
                      setStatus(event.target.value as ApplicationStatus)
                    }
                  >
                    {statusOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Follow-up date
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(event) => setFollowUpDate(event.target.value)}
                  />
                </label>

                <div className="application-form-actions">
                  <button
                    type="button"
                    className="form-cancel-button"
                    onClick={resetForm}
                    disabled={saving}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="dashboard-add-button"
                    disabled={saving}
                  >
                    {saving
                      ? "Saving..."
                      : editingId !== null
                        ? "Save changes"
                        : "Save application"}
                  </button>
                </div>
              </form>
            </section>
          )}

          <section className="applications-section">
            <div className="applications-heading">
              <div>
                <h2>Your applications</h2>
                <p>Manage your applications and stay on top of follow-ups.</p>
              </div>

              <span className="application-count">
                {filteredApplications.length}{" "}
                {filteredApplications.length === 1 ? "application" : "applications"}
              </span>
            </div>

            <div className="application-toolbar">
              <div className="application-search">
                <Search size={18} />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search company, role or location"
                  aria-label="Search applications"
                />
              </div>

              <select
                className="status-filter"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                aria-label="Filter by status"
              >
                <option value="all">All statuses</option>
                {statusOptions.map((option) => (
                  <option key={option} value={option.toLowerCase()}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            {loading ? (
              <div className="applications-empty">
                <span className="loading-indicator" />
                <p>Loading your applications...</p>
              </div>
            ) : filteredApplications.length === 0 ? (
              <div className="applications-empty">
                <span className="empty-icon">
                  <BriefcaseBusiness size={23} />
                </span>
                <h3>
                  {applications.length === 0
                    ? "No applications yet"
                    : "No matching applications"}
                </h3>
                <p>
                  {applications.length === 0
                    ? "Add your first opportunity to start organizing your job search."
                    : "Try changing your search or status filter."}
                </p>

                {applications.length === 0 && (
                  <button
                    type="button"
                    className="dashboard-add-button"
                    onClick={openNewForm}
                  >
                    <CirclePlus size={17} />
                    Add application
                  </button>
                )}
              </div>
            ) : (
              <div className="applications-table-wrap">
                <table className="applications-table">
                  <thead>
                    <tr>
                      <th>Company / Role</th>
                      <th>Location</th>
                      <th>Status</th>
                      <th>Date added</th>
                      <th>Follow-up</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredApplications.map((application) => {
                      const applicationStatus = displayStatus(application.status);
                      const followUpState = getFollowUpState(
                        application.follow_up_date,
                      );

                      return (
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
                              className={`application-status status-${application.status.toLowerCase()}`}
                            >
                              {applicationStatus}
                            </span>
                          </td>

                          <td>{formatDate(application.applied_date)}</td>

                          <td>
                            {application.follow_up_date ? (
                              <div className="follow-up-cell">
                                <span>
                                  {formatDate(application.follow_up_date)}
                                </span>
                                {followUpState !== "scheduled" && (
                                  <span
                                    className={`follow-up-badge follow-up-${followUpState}`}
                                  >
                                    {followUpState === "overdue"
                                      ? "Overdue"
                                      : "Upcoming"}
                                  </span>
                                )}
                              </div>
                            ) : (
                              "—"
                            )}
                          </td>

                          <td>
                            <div className="application-row-actions">
                              <button
                                type="button"
                                className="application-action-button"
                                aria-label={`Edit ${application.company_name}`}
                                title="Edit application"
                                onClick={() => startEditing(application)}
                              >
                                <Pencil size={16} />
                              </button>

                              <button
                                type="button"
                                className="application-action-button application-delete-button"
                                aria-label={`Delete ${application.company_name}`}
                                title="Delete application"
                                disabled={deletingId === application.id}
                                onClick={() =>
                                  void removeApplication(application.id)
                                }
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <footer className="dashboard-footer">
            <span>Trackora</span>
            <span>Stay organized. Move forward.</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
