export const buildResumePrompt = (
  resumeText,
  targetRole
) => {
  return `
Analyze the following resume.

Resume:
${resumeText}

Target Role:
${targetRole}

Return JSON only.

{
  "currentSkills": [],
  "missingSkills": [],
  "roadmap": [],
  "recommendedCourses": [],
  "interviewTopics": []
}
`;
};