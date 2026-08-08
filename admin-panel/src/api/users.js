import apiClient, { getErrorMessage } from "./client";

export const fetchAllUsers = async () => {
  const allUsers = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const response = await apiClient.get("users/allUsers", {
      params: { page, limit: 100 },
    });

    const users = response.data?.data?.users || [];
    allUsers.push(...users);
    totalPages = response.data?.totalPages || 1;
    page += 1;
  }

  return allUsers;
};

export const fetchUsersSafely = async () => {
  try {
    const users = await fetchAllUsers();
    return { users, error: "" };
  } catch (error) {
    return {
      users: [],
      error: getErrorMessage(
        error,
        "Could not load users. Protected user APIs need authentication.",
      ),
    };
  }
};

export const fetchUserById = async (userId) => {
  const response = await apiClient.get(`users/getUserById/${userId}`);
  return response.data?.data?.user;
};

export const deleteUserById = async (userId) => {
  await apiClient.delete(`users/deleteUserById/${userId}`);
};

export const filterCandidates = (users = []) =>
  users.filter((user) => user.role === "candidate");

export const filterRecruiters = (users = []) =>
  users.filter((user) => user.role === "recruiter");

export const getUserStats = (users = []) => {
  const candidates = filterCandidates(users);
  const recruiters = filterRecruiters(users);
  const admins = users.filter((user) => user.role === "admin");

  return {
    totalUsers: users.length,
    totalCandidates: candidates.length,
    totalRecruiters: recruiters.length,
    totalAdmins: admins.length,
  };
};
