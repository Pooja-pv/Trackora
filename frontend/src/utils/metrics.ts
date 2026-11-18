import type { Application } from "../api/applications";

// One place that defines what each dashboard number means,
// so every page shows the same value for the same label.

const INTERVIEW_STAGE = ["interview", "assessment"];
const ACTIVE_STAGE = ["applied", "assessment", "interview"];
const CLOSED_STAGE = ["rejected", "withdrawn", "offer"];

const normalizeStatus = (status: string) => status.trim().toLowerCase();

const toLocalDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/** Applications in the interview or assessment stage. */
export function countInterviewStage(applications: Application[]): number {
  return applications.filter((application) =>
    INTERVIEW_STAGE.includes(normalizeStatus(application.status)),
  ).length;
}

/** Applications still in progress: applied, assessment or interview. */
export function countActive(applications: Application[]): number {
  return applications.filter((application) =>
    ACTIVE_STAGE.includes(normalizeStatus(application.status)),
  ).length;
}

/**
 * Follow-ups that need attention: overdue, or due within the next 7 days.
 * Applications that are already closed (offer, rejected, withdrawn) are skipped.
 */
export function countFollowUpsDue(applications: Application[]): number {
  const limit = new Date();
  limit.setHours(0, 0, 0, 0);
  limit.setDate(limit.getDate() + 7);
  const limitKey = toLocalDateKey(limit);

  return applications.filter((application) => {
    if (!application.follow_up_date) return false;
    if (CLOSED_STAGE.includes(normalizeStatus(application.status))) {
      return false;
    }

    return application.follow_up_date.slice(0, 10) <= limitKey;
  }).length;
}
