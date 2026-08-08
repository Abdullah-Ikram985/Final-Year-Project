const { OpenAI } = require('openai');

// ─── Same Pollinations client as your existing code ───────────────────────
const EMBEDDING_MODEL = 'openai-3-small'; // text-embedding-3-small via Pollinations

function createPollinationsClient() {
  console.log('EMBEDDING_MODEL', EMBEDDING_MODEL);
  console.log('apiKey', process.env.POLLINATIONS_API_KEY);
  return new OpenAI({
    apiKey:
      process.env.POLLINATIONS_API_KEY || 'sk_AgUQwN07V2kliWsQHxgnO1XGIL0yJ826',
    baseURL: 'https://gen.pollinations.ai/v1',
  });
}

/**
 * Generate an embedding vector for a given text string.
 * Returns a number[] (1536 dimensions for text-embedding-3-small)
 */
const generateEmbedding = async (text) => {
  const openai = createPollinationsClient();

  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text.slice(0, 8000), // safe token limit
  });

  return response.data[0].embedding; // number[]
};

/**
 * Cosine similarity between two equal-length vectors.
 * Returns a score between -1 and 1 (higher = more similar).
 */
const cosineSimilarity = (vecA, vecB) => {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;

  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    magA += vecA[i] * vecA[i];
    magB += vecB[i] * vecB[i];
  }

  const magnitude = Math.sqrt(magA) * Math.sqrt(magB);
  return magnitude === 0 ? 0 : dot / magnitude;
};

/**
 * Build a rich text blob from a job document.
 * More context = better embedding quality.
 */
const buildJobText = (job) => {
  return `
    Job Title: ${job.title || ''}
    Department: ${job.department || ''}
    Location: ${job.location || ''}
    Job Type: ${job.jobType || ''}
    Required Skills: ${(job.skills || []).join(', ')}
    Description: ${job.description || ''}
  `.trim();
};

/**
 * Build a rich text blob from a candidate profile document.
 */
const buildCandidateText = (profile) => {
  const uniqueSkills = [
    ...new Set((profile.skills || []).map((s) => s.trim())),
  ];

  const experienceText = (profile.experience || [])
    .map((e) => `${e.title} at ${e.company} (${e.duration})`)
    .join(', ');

  const educationText = (profile.education || [])
    .map((e) => `${e.degree} (${e.year})`)
    .join(', ');

  return `
    Title: ${profile.title || ''}
    Preferred Role: ${profile.preferredRole || ''}
    Skills: ${uniqueSkills.join(', ')}
    Experience: ${experienceText}
    Education: ${educationText}
    Bio: ${profile.professionalBio || ''}
    Location: ${profile.location || ''}
  `.trim();
};

module.exports = {
  generateEmbedding,
  cosineSimilarity,
  buildJobText,
  buildCandidateText,
};
