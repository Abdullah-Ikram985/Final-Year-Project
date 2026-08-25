export const formatDate = (value) => {
  if (!value) return "N/A";

  return new Date(value).toLocaleDateString("en-PK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const formatStatusLabel = (status = "") =>
  status.charAt(0).toUpperCase() + status.slice(1);

export const getApplicationStatusClass = (status = "") => {
  const normalized = status.toLowerCase();

  if (normalized === "shortlisted" || normalized === "hired") {
    return "active";
  }

  if (normalized === "rejected") {
    return "inactive";
  }

  if (normalized === "reviewed") {
    return "pending";
  }

  return "pending";
};

export const getJobStatusClass = (status = "") => {
  const normalized = status.toLowerCase();

  if (normalized === "active") return "active";
  if (normalized === "closed") return "inactive";
  if (normalized === "rejected") return "rejected";
  if (normalized === "pending") return "pending";
  if (normalized === "draft") return "draft";
  return "pending";
};
