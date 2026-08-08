import apiClient from "./client";

export const fetchAllJobs = async () => {
  const response = await apiClient.get("jobs/allJobs");
  return response.data?.data?.jobs || [];
};

export const fetchJobById = async (jobId) => {
  const response = await apiClient.get(`jobs/getJobById/${jobId}`);
  return response.data?.data?.job;
};

export const deleteJobById = async (jobId) => {
  await apiClient.delete(`jobs/deleteJobById/${jobId}`);
};

export const extractRecruitersFromJobs = (jobs = []) => {
  const recruiterMap = new Map();

  jobs.forEach((job) => {
    const profile = job.createdBy;
    if (!profile?._id) return;

    const existing = recruiterMap.get(profile._id) || {
      profileId: profile._id,
      userId: profile.user?._id,
      name: profile.user?.name || "Unknown",
      email: profile.user?.email || "N/A",
      company: profile.companyName || "N/A",
      jobs: 0,
      activeJobs: 0,
    };

    existing.jobs += 1;
    if (job.jobStatus === "Active") {
      existing.activeJobs += 1;
    }

    recruiterMap.set(profile._id, existing);
  });

  return Array.from(recruiterMap.values());
};

export const extractApplicationsFromJobs = (jobs = []) => {
  const applications = [];

  jobs.forEach((job) => {
    (job.applicants || []).forEach((applicant) => {
      applications.push({
        id: applicant._id,
        jobId: job._id,
        jobTitle: job.title || "Untitled Job",
        recruiterName:
          job.createdBy?.companyName ||
          job.createdBy?.user?.name ||
          "N/A",
        candidateProfileId: applicant.candidate,
        status: applicant.status || "pending",
        appliedAt: applicant.appliedAt,
      });
    });
  });

  return applications.sort(
    (a, b) => new Date(b.appliedAt) - new Date(a.appliedAt),
  );
};

export const getJobStats = (jobs = []) => {
  const totalApplications = jobs.reduce(
    (sum, job) => sum + (job.applicants?.length || 0),
    0,
  );

  return {
    totalJobs: jobs.length,
    activeJobs: jobs.filter((job) => job.jobStatus === "Active").length,
    closedJobs: jobs.filter((job) => job.jobStatus === "Closed").length,
    draftJobs: jobs.filter((job) => job.jobStatus === "Draft").length,
    totalApplications,
  };
};
