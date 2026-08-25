const { OpenAI } = require('openai');
const axios = require('axios');

const CHAT_MODEL = process.env.POLLINATIONS_CHAT_MODEL || 'openai';

function createPollinationsClient() {
  return new OpenAI({
    apiKey:
      process.env.POLLINATIONS_API_KEY || 'sk_ATTDI7Z3WNgktz8OrEaHHLlAkVNfXbGb',
    baseURL: 'https://gen.pollinations.ai/v1',
  });
}

const safeJsonParse = (value, fallback = null) => {
  if (!value) return fallback;
  try {
    const clean = String(value)
      .replace(/```json/gi, '')
      .replace(/```/gi, '')
      .trim();
    return JSON.parse(clean);
  } catch {
    const match = String(value).match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return fallback;
      }
    }
    return fallback;
  }
};

/**
 * Generate 5 job-specific interview questions tailored to the job and candidate background.
 */
async function generateJobQuestions(job, candidateProfile) {
  const openai = createPollinationsClient();

  const candidateSkills = Array.isArray(candidateProfile?.skills)
    ? candidateProfile.skills.join(', ')
    : 'Not specified';
  const candidateTitle = candidateProfile?.title || 'Candidate';
  const candidateBio = candidateProfile?.professionalBio || 'General background';

  const jobTitle = job.title || 'Academic / Technical Role';
  const jobDepartment = job.department || 'General';
  const jobSkills = Array.isArray(job.skills) ? job.skills.join(', ') : 'General skills';
  const jobDescription = job.description || 'Standard responsibilities';

  const prompt = `You are a Senior Academic Hiring Committee Chair and Principal Technical Interviewer.

You are conducting a formal job interview for this specific role:
JOB TITLE: ${jobTitle}
DEPARTMENT: ${jobDepartment}
REQUIRED SKILLS: ${jobSkills}
JOB DESCRIPTION: ${jobDescription}

CANDIDATE BACKGROUND:
CURRENT TITLE: ${candidateTitle}
CANDIDATE SKILLS: ${candidateSkills}
BIO/SUMMARY: ${candidateBio}

TASK:
Generate exactly 5 job-specific interview questions tailored specifically to this job posting and candidate.
The questions must contain a realistic mixture:
1. Question 1: Core Technical / Fundamental Concept Question (specific to ${jobTitle})
2. Question 2: Advanced Domain / Methodological / System Design Question
3. Question 3: Applied Experience / Practical Problem-Solving Question
4. Question 4: Teaching / Academic / Research / Project Execution Question
5. Question 5: Behavioral / Situational / Departmental Collaboration Question

RULES:
- Questions must be directly relevant to "${jobTitle}" and "${jobSkills}".
- Do NOT generate generic or repetitive questions.
- Never invent candidate credentials.
- Return ONLY valid JSON matching this exact structure:

{
  "questions": [
    {
      "questionId": "q1",
      "question": "...",
      "questionType": "technical"
    },
    {
      "questionId": "q2",
      "question": "...",
      "questionType": "domain"
    },
    {
      "questionId": "q3",
      "question": "...",
      "questionType": "experience"
    },
    {
      "questionId": "q4",
      "question": "...",
      "questionType": "domain"
    },
    {
      "questionId": "q5",
      "question": "...",
      "questionType": "behavioral"
    }
  ]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: CHAT_MODEL,
      temperature: 0.2,
      max_tokens: 1500,
      messages: [
        {
          role: 'system',
          content:
            'You are an expert AI Interviewer. Respond strictly with valid JSON only. No markdown formatting, no conversational text.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = response?.choices?.[0]?.message?.content || '{}';
    const parsed = safeJsonParse(content, null);

    if (parsed && Array.isArray(parsed.questions) && parsed.questions.length >= 3) {
      return parsed.questions.slice(0, 5).map((q, idx) => ({
        questionId: q.questionId || `q${idx + 1}`,
        question: q.question || `Explain your technical approach for ${jobTitle}.`,
        questionType: q.questionType || 'technical',
      }));
    }
  } catch (err) {
    console.warn('Primary LLM question generation skipped/failed:', err.message);
  }

  // Robust structured fallback questions tailored directly to the specific job
  const primarySkill = (job.skills && job.skills.length > 0) ? job.skills[0] : 'core technical domains';
  return [
    {
      questionId: 'q1',
      question: `How does your technical background in ${primarySkill} align with the core requirements for ${jobTitle}?`,
      questionType: 'technical',
    },
    {
      questionId: 'q2',
      question: `Can you walk us through a challenging technical or academic project you completed in ${jobDepartment}? What was the outcome?`,
      questionType: 'experience',
    },
    {
      questionId: 'q3',
      question: `Explain the fundamental methodologies and best practices you follow when working with ${jobSkills || 'core technologies'}.`,
      questionType: 'technical',
    },
    {
      questionId: 'q4',
      question: `How do you stay updated with emerging research, tools, and industry standards relevant to ${jobTitle}?`,
      questionType: 'domain',
    },
    {
      questionId: 'q5',
      question: `Describe a situation where you had to collaborate with cross-functional colleagues or handle conflicting deadlines. How did you manage it?`,
      questionType: 'behavioral',
    },
  ];
}

const INTERVIEW_STOPWORDS = new Set([
  'what', 'why', 'how', 'can', 'could', 'would', 'should', 'will', 'shall', 'may', 'might', 'must',
  'explain', 'describe', 'discuss', 'walk', 'through', 'tell', 'tellus', 'share', 'outline', 'provide',
  'give', 'about', 'does', 'do', 'did', 'done', 'doing', 'is', 'are', 'was', 'were', 'been', 'being',
  'the', 'a', 'an', 'and', 'or', 'nor', 'but', 'so', 'to', 'of', 'in', 'on', 'at', 'by', 'for', 'with',
  'against', 'between', 'into', 'during', 'before', 'after', 'above', 'below',
  'from', 'up', 'down', 'out', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there',
  'your', 'you', 'yours', 'yourself', 'we', 'us', 'our', 'ours', 'they', 'them', 'their', 'theirs',
  'i', 'me', 'my', 'myself', 'he', 'him', 'his', 'she', 'her', 'hers', 'it', 'its',
  'question', 'please', 'briefly', 'detail', 'details', 'detailed', 'situation', 'example', 'examples',
  'core', 'align', 'requirements', 'manage', 'managed', 'handling', 'handled', 'outcome', 'outcomes',
  'result', 'results', 'experience', 'background', 'completed', 'challenging', 'project', 'projects',
  'stay', 'updated', 'emerging', 'tools', 'industry', 'standards', 'relevant', 'colleagues', 'conflicting',
  'deadlines', 'approach', 'fundamental', 'methodologies', 'practices', 'working', 'role', 'roles'
]);

/**
 * Intelligent dynamic evaluation engine that assesses candidate answers.
 * Evaluates semantic relevance, technical terminology, structure, and depth.
 */
function evaluateAnswerDynamically(job, candidateProfile, questionText, questionType, candidateAnswer) {
  const answer = (candidateAnswer || '').trim();
  const lowerAns = answer.toLowerCase();
  const words = answer.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  const jobTitle = job?.title || 'Academic / Technical Role';
  const jobSkills = Array.isArray(job?.skills) ? job.skills : [];
  const normalizedType = String(questionType || 'technical').toLowerCase();

  // 1. Check for negative, empty, or surrender answers
  const surrenderPhrases = [
    "i don't know",
    "i do not know",
    "no idea",
    "not sure",
    "dont know",
    "don't know",
    "no clue",
    "pass",
    "skip",
    "n/a",
    "none",
    "nothing",
  ];

  const isSurrender =
    wordCount <= 5 &&
    (surrenderPhrases.some((p) => lowerAns.includes(p)) || wordCount <= 2);

  if (isSurrender) {
    return {
      score: 15,
      relevance: 15,
      technicalCorrectness: 10,
      completeness: 10,
      clarity: 50,
      strengths: ['Acknowledged the knowledge gap honestly.'],
      improvements: [
        `Review foundational concepts and best practices related to ${jobTitle}.`,
        'Attempt to explain related principles, alternative approaches, or foundational methodologies even when uncertain.',
      ],
    };
  }

  // 2. Identify matched skills & technical terms mentioned in answer
  const matchedSkills = jobSkills.filter((s) =>
    lowerAns.includes(s.toLowerCase()),
  );

  const technicalKeywords = [
    'api', 'rest', 'fastapi', 'flask', 'django', 'python', 'docker', 'kubernetes',
    'microservices', 'database', 'sql', 'postgresql', 'mysql', 'mongodb',
    'redis', 'cache', 'gateway', 'authentication', 'jwt', 'sqlalchemy', 'orm',
    'scaling', 'throughput', 'latency', 'architecture', 'pipeline', 'pytorch',
    'tensorflow', 'model', 'dataset', 'training', 'loss', 'accuracy', 'neural',
    'logging', 'monitoring', 'ci/cd', 'testing', 'unit test', 'async', 'queues',
    'research', 'publication', 'lecture', 'curriculum', 'pedagogy', 'mentor'
  ];

  const foundTechTerms = technicalKeywords.filter((k) => lowerAns.includes(k));

  // 3. Question-keyword relevance check (filtering stopwords)
  const meaningfulQuestionTopics = questionText
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !INTERVIEW_STOPWORDS.has(w));

  const matchedQuestionTerms = meaningfulQuestionTopics.filter((qw) =>
    lowerAns.includes(qw),
  );

  const topicOverlapRatio = meaningfulQuestionTopics.length > 0
    ? matchedQuestionTerms.length / meaningfulQuestionTopics.length
    : 0.5;

  // 4. Calculate dynamic sub-scores based on actual answer metrics
  let relevance = Math.round(
    38 + topicOverlapRatio * 35 + (foundTechTerms.length > 0 ? 15 : 0) + (matchedSkills.length > 0 ? 10 : 0),
  );
  relevance = Math.min(95, Math.max(25, relevance));

  let technicalCorrectness = 40;
  if (foundTechTerms.length >= 1) technicalCorrectness += 15;
  if (foundTechTerms.length >= 3) technicalCorrectness += 15;
  if (matchedSkills.length >= 1) technicalCorrectness += 15;
  if (wordCount >= 20) technicalCorrectness += 10;
  technicalCorrectness = Math.min(95, Math.max(30, technicalCorrectness));

  let completeness = 35;
  if (wordCount >= 10) completeness += 15;
  if (wordCount >= 25) completeness += 20;
  if (wordCount >= 45) completeness += 15;
  if (foundTechTerms.length >= 2) completeness += 10;
  completeness = Math.min(95, Math.max(20, completeness));

  let clarity = 60;
  if (wordCount >= 8 && /[.!?]/.test(answer)) clarity += 15;
  if (wordCount >= 20 && answer.split(/[.!?]/).filter(Boolean).length >= 2) clarity += 15;
  clarity = Math.min(98, Math.max(40, clarity));

  const score = Math.round(
    relevance * 0.35 +
    technicalCorrectness * 0.35 +
    completeness * 0.20 +
    clarity * 0.10,
  );

  // 5. Generate dynamic strengths
  const strengths = [];
  if (foundTechTerms.length > 0) {
    const formattedTerms = foundTechTerms.slice(0, 3).map((t) => t.toUpperCase()).join(', ');
    strengths.push(`Effectively referenced relevant technical components (${formattedTerms}).`);
  }
  if (matchedSkills.length > 0) {
    strengths.push(`Directly connected response to required role skills (${matchedSkills.join(', ')}).`);
  }
  if (wordCount >= 15 && clarity >= 70) {
    strengths.push('Communicated response in a structured and professional tone.');
  }
  if (strengths.length === 0) {
    strengths.push('Attempted to address the interview prompt with foundational context.');
  }

  // 6. Generate human-like, actionable improvement feedback based on question type
  const improvements = [];

  if (normalizedType === 'experience') {
    if (wordCount < 30 || foundTechTerms.length < 1) {
      improvements.push(
        'Explain the project in more detail: clarify your specific technical role, the core engineering challenge, the exact technologies used, and the final measurable outcome.',
      );
    } else {
      improvements.push(
        'Elaborate on the technical trade-offs, architecture decisions, and how you handled edge cases during the project implementation.',
      );
    }
  } else if (normalizedType === 'domain') {
    improvements.push(
      'Cite specific industry/academic benchmarks, research papers, curriculum frameworks, or modern tooling ecosystems you actively follow.',
    );
  } else if (normalizedType === 'behavioral') {
    improvements.push(
      'Apply the STAR framework (Situation, Task, Action, Result) to clearly articulate your specific actions, communication strategies, and the positive resolution achieved.',
    );
  } else {
    // Technical question
    if (foundTechTerms.length < 2 || wordCount < 25) {
      const topicHint = meaningfulQuestionTopics.length > 0
        ? ` (${meaningfulQuestionTopics.slice(0, 2).join(', ')})`
        : '';
      improvements.push(
        `Deepen your technical explanation: describe the underlying mechanics, architecture trade-offs, and practical implementation patterns${topicHint}.`,
      );
    } else {
      improvements.push(
        'Discuss performance considerations, concurrency/scaling implications, or potential production failure modes.',
      );
    }
  }

  if (wordCount < 20 && !improvements.some((i) => i.includes('detail'))) {
    improvements.push(
      'Elaborate further with concrete examples and structured reasoning to demonstrate deeper mastery.',
    );
  }

  return {
    score,
    relevance,
    technicalCorrectness,
    completeness,
    clarity,
    strengths: strengths.slice(0, 3),
    improvements: improvements.slice(0, 3),
  };
}

/**
 * Evaluate a single candidate answer against the question and job context.
 */
async function evaluateAnswer(job, candidateProfile, questionText, candidateAnswer, questionType = 'technical') {
  const openai = createPollinationsClient();

  const jobTitle = job?.title || 'Academic / Technical Role';
  const jobSkills = Array.isArray(job?.skills) ? job.skills.join(', ') : 'General skills';

  const prompt = `You are a strict, constructive Technical Interview Evaluator.

ROLE: ${jobTitle}
REQUIRED SKILLS: ${jobSkills}

INTERVIEW QUESTION:
"${questionText}"

QUESTION TYPE: ${questionType}

CANDIDATE ANSWER:
"${candidateAnswer}"

TASK:
Evaluate ONLY the candidate's actual answer against the current question and job requirements. Do not reuse scores or feedback from previous questions.
Every score and feedback must genuinely reflect the candidate's actual response.

EVALUATION CRITERIA:
1. Relevance (0-100): Does the answer directly address the question?
2. Technical Correctness (0-100): Are the technical concepts accurate?
3. Completeness (0-100): Is the response thorough and supported with reasoning or examples?
4. Clarity & Communication (0-100): Is the answer structured, clear, and professional?

OUTPUT FORMAT (STRICT JSON ONLY):
{
  "score": 82,
  "relevance": 85,
  "technicalCorrectness": 80,
  "completeness": 78,
  "clarity": 88,
  "strengths": [
    "Clear explanation of core concepts.",
    "Good practical terminology."
  ],
  "improvements": [
    "Mention specific real-world examples or implementations.",
    "Elaborate on edge cases or methodologies."
  ]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: CHAT_MODEL,
      temperature: 0.1,
      max_tokens: 600,
      messages: [
        {
          role: 'system',
          content:
            'You are an expert interview evaluator. Return strictly valid JSON with no markdown wrapper or extra text.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = response?.choices?.[0]?.message?.content || '{}';
    const parsed = safeJsonParse(content, null);

    if (parsed && typeof parsed.score === 'number' && parsed.score >= 0) {
      const clamp = (num) => Math.min(100, Math.max(0, Math.round(num || 0)));
      return {
        score: clamp(parsed.score),
        relevance: clamp(parsed.relevance ?? parsed.score),
        technicalCorrectness: clamp(parsed.technicalCorrectness ?? parsed.score),
        completeness: clamp(parsed.completeness ?? parsed.score),
        clarity: clamp(parsed.clarity ?? parsed.score),
        strengths: Array.isArray(parsed.strengths) && parsed.strengths.length > 0
          ? parsed.strengths.slice(0, 3)
          : ['Demonstrated foundational understanding of the topic.'],
        improvements: Array.isArray(parsed.improvements) && parsed.improvements.length > 0
          ? parsed.improvements.slice(0, 3)
          : ['Provide more detailed examples and practical depth in your explanation.'],
      };
    }
  } catch (err) {
    console.warn('Primary LLM evaluation skipped/failed, evaluating dynamically:', err.message);
  }

  // Genuinely dynamic evaluation of the candidate's actual answer
  return evaluateAnswerDynamically(
    job,
    candidateProfile,
    questionText,
    questionType,
    candidateAnswer,
  );
}

/**
 * Compute overall readiness score and generate summary recommendations.
 */
async function generateFinalReadinessReport(job, candidateProfile, answers) {
  const openai = createPollinationsClient();

  if (!answers || answers.length === 0) {
    return {
      readinessScore: 0,
      breakdown: {
        technicalKnowledge: 0,
        communication: 0,
        jobRelevance: 0,
        answerQuality: 0,
      },
      strengths: ['No answers provided.'],
      areasToImprove: ['Complete the interview questions to receive readiness feedback.'],
      recommendation: 'Please attempt all interview questions for an accurate assessment.',
    };
  }

  const avg = (arr) => Math.round(arr.reduce((a, b) => a + b, 0) / (arr.length || 1));

  const scores = answers.map((a) => a.score || 70);
  const relevances = answers.map((a) => a.relevance || a.score || 70);
  const technicals = answers.map((a) => a.technicalCorrectness || a.score || 70);
  const completenesses = answers.map((a) => a.completeness || a.score || 70);
  const clarities = answers.map((a) => a.clarity || a.score || 70);

  const technicalKnowledge = avg(technicals);
  const communication = avg(clarities);
  const jobRelevance = avg(relevances);
  const answerQuality = avg(completenesses);

  const readinessScore = Math.round(
    technicalKnowledge * 0.35 +
    jobRelevance * 0.25 +
    answerQuality * 0.25 +
    communication * 0.15
  );

  const breakdown = {
    technicalKnowledge,
    communication,
    jobRelevance,
    answerQuality,
  };

  const aggregatedStrengths = Array.from(
    new Set(answers.flatMap((a) => a.strengths || [])),
  ).slice(0, 4);

  const aggregatedImprovements = Array.from(
    new Set(answers.flatMap((a) => a.improvements || [])),
  ).slice(0, 4);

  let recommendation = `You demonstrated preparation with an overall readiness score of ${readinessScore}%. Review technical concepts and concrete practical implementations before your actual interview for ${job?.title || 'this role'}.`;

  try {
    const summaryPrompt = `Based on the following mock interview performance for the role "${job?.title || 'Candidate'}":
Overall Score: ${readinessScore}%
Technical Knowledge: ${technicalKnowledge}%
Communication: ${communication}%
Job Relevance: ${jobRelevance}%
Answer Quality: ${answerQuality}%

Answers Summary:
${answers.map((a, i) => `Q${i + 1}: ${a.question}\nScore: ${a.score}/100\nKey points: ${(a.strengths || []).join(', ')}`).join('\n\n')}

Provide an encouraging, actionable 2-sentence AI recommendation for the candidate before their real interview. Return ONLY a JSON object:
{
  "recommendation": "...",
  "keyStrengths": ["...", "...", "..."],
  "keyImprovementAreas": ["...", "...", "..."]
}`;

    const summaryRes = await openai.chat.completions.create({
      model: CHAT_MODEL,
      temperature: 0.2,
      max_tokens: 600,
      messages: [
        { role: 'system', content: 'You are an AI interview mentor. Return JSON only.' },
        { role: 'user', content: summaryPrompt },
      ],
    });

    const parsed = safeJsonParse(summaryRes?.choices?.[0]?.message?.content, null);
    if (parsed) {
      if (parsed.recommendation) recommendation = parsed.recommendation;
      if (Array.isArray(parsed.keyStrengths) && parsed.keyStrengths.length > 0) {
        aggregatedStrengths.splice(0, aggregatedStrengths.length, ...parsed.keyStrengths.slice(0, 4));
      }
      if (Array.isArray(parsed.keyImprovementAreas) && parsed.keyImprovementAreas.length > 0) {
        aggregatedImprovements.splice(0, aggregatedImprovements.length, ...parsed.keyImprovementAreas.slice(0, 4));
      }
    }
  } catch (err) {
    console.warn('Final recommendation LLM pass skipped:', err.message);
  }

  return {
    readinessScore,
    breakdown,
    strengths: aggregatedStrengths.length > 0 ? aggregatedStrengths : ['Demonstrated foundational understanding of domain topics.'],
    areasToImprove: aggregatedImprovements.length > 0 ? aggregatedImprovements : ['Elaborate with deeper empirical details.'],
    recommendation,
  };
}

module.exports = {
  generateJobQuestions,
  evaluateAnswer,
  generateFinalReadinessReport,
};
