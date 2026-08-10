const fs=require('fs');
let c=fs.readFileSync('./controller/jobController.js','utf8');
c=c.replace(
  '    const candidateText = buildCandidateText(profile);\n    const candidateEmbedding = await generateEmbedding(candidateText);',
      let candidateEmbedding = null;
    let embeddingFailed = false;
    try {
      const candidateText = buildCandidateText(profile);
      candidateEmbedding = await generateEmbedding(candidateText);
    } catch (embErr) {
      console.warn('[Recommended] Candidate embedding failed, fallback to all Active jobs:', embErr.message);
      embeddingFailed = true;
    }
);
c=c.replace(
  '    // Score every job with cosine similarity\n    const scoredJobs = allJobs',
      const jobsWithEmbedding = allJobs.filter((j) => j.embedding && j.embedding.length > 0);
    if (embeddingFailed || jobsWithEmbedding.length === 0 || !candidateEmbedding) {
      console.log('[Recommended] Fallback: returning all Active jobs without scoring');
      const fallbackJobs = allJobs
        .filter((j) => j.jobStatus === 'Active')
        .map((job) => {
          const { embedding, ...rest } = job;
          return { ...rest, matchPercent: null, matchLabel: 'New' };
        })
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return res.status(200).json({ success: true, count: fallbackJobs.length, data: fallbackJobs });
    }
    // Score every job with cosine similarity
    const scoredJobs = jobsWithEmbedding
);
c=c.replace(
  '    console.log(\n      [Recommended] Jobs passing',
      if (scoredJobs.length === 0) {
      console.log('[Recommended] No jobs passed 60% threshold, fallback to all Active jobs');
      const fallbackJobs = allJobs
        .filter((j) => j.jobStatus === 'Active')
        .map((job) => {
          const { embedding, ...rest } = job;
          return { ...rest, matchPercent: null, matchLabel: 'New' };
        })
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return res.status(200).json({ success: true, count: fallbackJobs.length, data: fallbackJobs });
    }
    console.log(\n      \[Recommended] Jobs passing
);
fs.writeFileSync('./controller/jobController.js',c);
console.log('patched');
