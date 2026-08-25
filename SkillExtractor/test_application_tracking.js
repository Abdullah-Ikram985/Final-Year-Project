const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'config.env') });
const mongoose = require('mongoose');
const http = require('http');
const axios = require('axios');
const jwt = require('jsonwebtoken');

const app = require('./app');
const User = require('./models/userModel');
const RecruiterProfile = require('./models/recruiterProfileSchema');
const CandidateProfile = require('./models/candidateProfileSchema');
const Job = require('./models/jobSchema');
const Notification = require('./models/notificationSchema');
const MockInterview = require('./models/mockInterviewSchema');

const PORT = 8011;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '1d',
  });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runTests() {
  console.log('🚀 Starting Targeted Job-Specific Applicants Filtering & Sorting Integration Tests...\n');

  const DB = process.env.DATABASE?.replace(
    '<PASSWORD>',
    process.env.DATABASE_PASSWORD || '',
  );

  await mongoose.connect(DB);
  console.log('✅ Connected to MongoDB Atlas');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`✅ Test server running on http://localhost:${PORT}\n`);

  try {
    console.log('--- Setting Up Test Accounts & Prerequisites ---');

    const setupCandidate = async (name, email, title, skills) => {
      let user = await User.findOne({ email });
      if (!user) {
        user = await User.create({
          name,
          email,
          password: 'Password123!',
          role: 'candidate',
        });
      }
      let profile = await CandidateProfile.findOne({ user: user._id });
      if (!profile) {
        profile = await CandidateProfile.create({
          user: user._id,
          title,
          skills,
        });
      }
      return { user, profile, token: signToken(user._id) };
    };

    // Recruiter Alpha
    let recUser = await User.findOne({ email: 'test_rec_alpha_jobnotif@test.com' });
    if (!recUser) {
      recUser = await User.create({
        name: 'Recruiter Alpha',
        email: 'test_rec_alpha_jobnotif@test.com',
        password: 'Password123!',
        role: 'recruiter',
      });
    }
    let recProfile = await RecruiterProfile.findOne({ user: recUser._id });
    if (!recProfile) {
      recProfile = await RecruiterProfile.create({
        user: recUser._id,
        companyName: 'Alpha Tech',
        industry: 'Software',
      });
    }
    const recToken = signToken(recUser._id);

    // Recruiter Beta (Unauthorized)
    let recBetaUser = await User.findOne({ email: 'test_rec_beta_jobnotif@test.com' });
    if (!recBetaUser) {
      recBetaUser = await User.create({
        name: 'Recruiter Beta',
        email: 'test_rec_beta_jobnotif@test.com',
        password: 'Password123!',
        role: 'recruiter',
      });
    }
    let recBetaProfile = await RecruiterProfile.findOne({ user: recBetaUser._id });
    if (!recBetaProfile) {
      recBetaProfile = await RecruiterProfile.create({
        user: recBetaUser._id,
        companyName: 'Beta Corp',
        industry: 'Software',
      });
    }
    const recBetaToken = signToken(recBetaUser._id);

    // Candidates
    const ali = await setupCandidate('Ali', 'test_cand_ali@test.com', 'React Dev', ['React', 'JavaScript']);
    const hamza = await setupCandidate('Hamza', 'test_cand_hamza@test.com', 'React Dev', ['React', 'Redux']);
    const awais = await setupCandidate('Awais', 'test_cand_awais@test.com', 'React Dev', ['React', 'TypeScript']);
    const bilal = await setupCandidate('Bilal', 'test_cand_bilal@test.com', 'Frontend Dev', ['React', 'Next.js']);
    const usman = await setupCandidate('Usman', 'test_cand_usman@test.com', 'Python Dev', ['Python', 'FastAPI']);
    const sara = await setupCandidate('Sara', 'test_cand_sara@test.com', 'Python Dev', ['Python', 'Django']);

    const allUserIds = [
      recUser._id,
      recBetaUser._id,
      ali.user._id,
      hamza.user._id,
      awais.user._id,
      bilal.user._id,
      usman.user._id,
      sara.user._id,
    ];

    // Clean up notifications and mock interviews
    await Notification.deleteMany({ recipient: { $in: allUserIds } });
    await Job.deleteMany({
      title: { $in: ['React Developer', 'Python Developer'] },
      createdBy: { $in: [recProfile._id, recBetaProfile._id] },
    });
    await MockInterview.deleteMany({ candidate: { $in: allUserIds } });

    // Create Jobs for Recruiter Alpha
    const jobReact = await Job.create({
      createdBy: recProfile._id,
      title: 'React Developer',
      department: 'Frontend',
      location: 'Remote',
      salary: 90000,
      jobType: 'Full-time',
      skills: ['React', 'JavaScript'],
      description: 'Developing high-performance UI components.',
      jobStatus: 'Active',
    });

    const jobPython = await Job.create({
      createdBy: recProfile._id,
      title: 'Python Developer',
      department: 'Backend',
      location: 'Remote',
      salary: 95000,
      jobType: 'Full-time',
      skills: ['Python', 'FastAPI'],
      description: 'Developing high-performance APIs.',
      jobStatus: 'Active',
    });

    // Prerequisite mock interviews
    const completeInterview = async (candidateUserId, jobId) => {
      await MockInterview.create({
        candidate: candidateUserId,
        job: jobId,
        questions: [{ questionId: 'q1', question: 'Technical Question' }],
        answers: [{ questionId: 'q1', question: 'Technical Question', answer: 'Solid answer.', score: 90 }],
        overallReadinessScore: 90,
        status: 'completed',
      });
    };

    await completeInterview(ali.user._id, jobReact._id);
    await completeInterview(hamza.user._id, jobReact._id);
    await completeInterview(awais.user._id, jobReact._id);
    await completeInterview(bilal.user._id, jobReact._id);
    await completeInterview(usman.user._id, jobPython._id);
    await completeInterview(sara.user._id, jobPython._id);

    // Apply sequentially with small delay to test distinct timestamps:
    // 1. Ali applies to React
    await axios.post(`${BASE_URL}/jobs/applyToJob/${jobReact._id}`, {}, { headers: { Authorization: `Bearer ${ali.token}` } });
    await sleep(20);

    // 2. Hamza applies to React
    await axios.post(`${BASE_URL}/jobs/applyToJob/${jobReact._id}`, {}, { headers: { Authorization: `Bearer ${hamza.token}` } });
    await sleep(20);

    // 3. Awais applies to React
    await axios.post(`${BASE_URL}/jobs/applyToJob/${jobReact._id}`, {}, { headers: { Authorization: `Bearer ${awais.token}` } });
    await sleep(20);

    // 4. Usman applies to Python
    await axios.post(`${BASE_URL}/jobs/applyToJob/${jobPython._id}`, {}, { headers: { Authorization: `Bearer ${usman.token}` } });
    await sleep(20);

    // 5. Sara applies to Python
    await axios.post(`${BASE_URL}/jobs/applyToJob/${jobPython._id}`, {}, { headers: { Authorization: `Bearer ${sara.token}` } });

    console.log('✅ Test setup completed.\n');

    // ─── TEST 1: Click React Developer Notification ─────────────────────────
    console.log('▶ TEST 1: Click React Developer notification -> ONLY React Developer applicants (Newest First: Awais, Hamza, Ali)');
    const notifsRes = await axios.get(`${BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${recToken}` },
    });
    const notifs = notifsRes.data.data.notifications || [];
    const reactNotif = notifs.find((n) => n.jobId?._id?.toString() === jobReact._id.toString());
    if (!reactNotif) throw new Error('React Developer notification not found');

    const reactJobId = reactNotif.jobId?._id || reactNotif.jobId;
    const reactApplicantsRes = await axios.get(`${BASE_URL}/jobs/applicants/${reactJobId}`, {
      headers: { Authorization: `Bearer ${recToken}` },
    });
    const reactApplicants = reactApplicantsRes.data.data.applicants || [];
    const reactNames = reactApplicants.map((a) => a.candidate?.user?.name);

    if (reactApplicants.length !== 3) {
      throw new Error(`Expected exactly 3 applicants for React Developer, got ${reactApplicants.length}: ${reactNames.join(', ')}`);
    }
    if (!reactNames.includes('Ali') || !reactNames.includes('Hamza') || !reactNames.includes('Awais')) {
      throw new Error(`Missing expected React applicants: ${reactNames.join(', ')}`);
    }
    if (reactNames.includes('Usman') || reactNames.includes('Sara')) {
      throw new Error(`Python applicants (Usman/Sara) incorrectly appeared in React Developer applicants: ${reactNames.join(', ')}`);
    }

    // Verify newest applicant is first: Awais (3rd) -> Hamza (2nd) -> Ali (1st)
    if (reactNames[0] !== 'Awais' || reactNames[1] !== 'Hamza' || reactNames[2] !== 'Ali') {
      throw new Error(`Expected order [Awais, Hamza, Ali], got [${reactNames.join(', ')}]`);
    }

    console.log(`  ✓ React Developer applicants list (3, Newest First): ${reactNames.join(' -> ')}`);
    console.log('  ✓ Verified Usman and Sara MUST NOT and DO NOT appear in React Developer applicants');
    console.log('✅ TEST 1 PASSED\n');

    // ─── TEST 2: Click Python Developer Notification ────────────────────────
    console.log('▶ TEST 2: Click Python Developer notification -> ONLY Python Developer applicants (Newest First: Sara, Usman)');
    const pythonNotif = notifs.find((n) => n.jobId?._id?.toString() === jobPython._id.toString());
    if (!pythonNotif) throw new Error('Python Developer notification not found');

    const pythonJobId = pythonNotif.jobId?._id || pythonNotif.jobId;
    const pythonApplicantsRes = await axios.get(`${BASE_URL}/jobs/applicants/${pythonJobId}`, {
      headers: { Authorization: `Bearer ${recToken}` },
    });
    const pythonApplicants = pythonApplicantsRes.data.data.applicants || [];
    const pythonNames = pythonApplicants.map((a) => a.candidate?.user?.name);

    if (pythonApplicants.length !== 2) {
      throw new Error(`Expected exactly 2 applicants for Python Developer, got ${pythonApplicants.length}: ${pythonNames.join(', ')}`);
    }
    if (pythonNames[0] !== 'Sara' || pythonNames[1] !== 'Usman') {
      throw new Error(`Expected order [Sara, Usman], got [${pythonNames.join(', ')}]`);
    }
    if (pythonNames.includes('Ali') || pythonNames.includes('Hamza') || pythonNames.includes('Awais')) {
      throw new Error(`React applicants incorrectly appeared in Python Developer applicants: ${pythonNames.join(', ')}`);
    }
    console.log(`  ✓ Python Developer applicants list (2, Newest First): ${pythonNames.join(' -> ')}`);
    console.log('  ✓ Verified Ali, Hamza, Awais MUST NOT and DO NOT appear in Python Developer applicants');
    console.log('✅ TEST 2 PASSED\n');

    // ─── TEST 3: Bilal applies later to React Developer (Newest applicant appears 1st)
    console.log('▶ TEST 3: Bilal applies later -> Newest applicant Bilal appears FIRST (Bilal -> Awais -> Hamza -> Ali)');
    await sleep(20);
    await axios.post(`${BASE_URL}/jobs/applyToJob/${jobReact._id}`, {}, { headers: { Authorization: `Bearer ${bilal.token}` } });

    const updatedReactRes = await axios.get(`${BASE_URL}/jobs/applicants/${reactJobId}`, {
      headers: { Authorization: `Bearer ${recToken}` },
    });
    const updatedReactApplicants = updatedReactRes.data.data.applicants || [];
    const updatedReactNames = updatedReactApplicants.map((a) => a.candidate?.user?.name);

    if (updatedReactApplicants.length !== 4) {
      throw new Error(`Expected 4 applicants, got ${updatedReactApplicants.length}`);
    }
    if (updatedReactNames[0] !== 'Bilal') {
      throw new Error(`Expected Bilal to be FIRST, got ${updatedReactNames[0]}`);
    }
    if (updatedReactNames[1] !== 'Awais' || updatedReactNames[2] !== 'Hamza' || updatedReactNames[3] !== 'Ali') {
      throw new Error(`Expected order [Bilal, Awais, Hamza, Ali], got [${updatedReactNames.join(', ')}]`);
    }
    console.log(`  ✓ Updated React applicants (4, Newest First): ${updatedReactNames.join(' -> ')}`);
    console.log('✅ TEST 3 PASSED\n');

    // ─── TEST 4: Open normal recruiter Candidates tab without jobId ─────────
    console.log('▶ TEST 4: Normal recruiter Candidates tab without jobId (All candidates view)');
    const allCandsRes = await axios.get(`${BASE_URL}/jobs/allRecruiterCandidates`, {
      headers: { Authorization: `Bearer ${recToken}` },
    });
    const allApplicants = allCandsRes.data.data.applicants || [];
    if (allApplicants.length !== 6) {
      throw new Error(`Expected 6 total candidates across all jobs, got ${allApplicants.length}`);
    }
    console.log(`  ✓ Normal recruiter Candidates tab displays all ${allApplicants.length} candidates across jobs (Newest first)`);
    console.log('✅ TEST 4 PASSED\n');

    // ─── TEST 5: Click Ali from React Developer applicants -> Candidate Detail
    console.log('▶ TEST 5: Click Ali from React Developer applicants -> Candidate Detail with correct candidateId and jobId');
    const aliApplicant = updatedReactApplicants.find((a) => a.candidate?.user?.name === 'Ali');
    if (!aliApplicant) throw new Error('Ali applicant not found in React applicants');

    const aliCandidateId = aliApplicant.candidate._id.toString();
    const targetReactJobId = reactJobId.toString();

    const detailRes = await axios.get(`${BASE_URL}/jobs/applicants/${targetReactJobId}`, {
      headers: { Authorization: `Bearer ${recToken}` },
    });
    const resolvedCandidate = detailRes.data.data.applicants.find(
      (a) => a.candidate._id.toString() === aliCandidateId,
    );
    if (!resolvedCandidate || resolvedCandidate.candidate?.user?.name !== 'Ali') {
      throw new Error('Failed to resolve Ali candidate detail');
    }
    if (resolvedCandidate.jobId.toString() !== targetReactJobId) {
      throw new Error(`Candidate Detail jobId mismatch: expected ${targetReactJobId}, got ${resolvedCandidate.jobId}`);
    }
    console.log(`  ✓ Successfully opened Candidate Detail: Name="${resolvedCandidate.candidate.user.name}", candidateId=${aliCandidateId}, jobId=${targetReactJobId}`);
    console.log('✅ TEST 5 PASSED\n');

    // ─── TEST 6: Security Isolation (Another recruiter blocked from viewing job applicants)
    console.log('▶ TEST 6: Security Isolation (Another recruiter blocked from viewing job applicants)');
    try {
      await axios.get(`${BASE_URL}/jobs/applicants/${jobReact._id}`, {
        headers: { Authorization: `Bearer ${recBetaToken}` },
      });
      throw new Error('Recruiter Beta was able to access Recruiter Alpha job applicants!');
    } catch (authErr) {
      if (authErr.response?.status === 404 || authErr.response?.status === 403) {
        console.log(`  ✓ Recruiter Beta correctly blocked with status ${authErr.response.status}`);
      } else {
        throw authErr;
      }
    }
    console.log('✅ TEST 6 PASSED\n');

    // ─── Clean Up ───────────────────────────────────────────────────────────
    console.log('--- Cleaning Up Test Data ---');
    await Job.deleteMany({ _id: { $in: [jobReact._id, jobPython._id] } });
    await Notification.deleteMany({ recipient: { $in: allUserIds } });
    await MockInterview.deleteMany({ candidate: { $in: allUserIds } });
    console.log('✓ Cleaned up test jobs, notifications, and mock interviews.');

    console.log('\n================================================================');
    console.log('🎉 ALL 6 TARGETED JOB-SPECIFIC FILTERING & SORTING TESTS PASSED 100%');
    console.log('================================================================\n');
  } catch (err) {
    console.error('\n❌ TEST FAILED:', err.message);
    if (err.response?.data) {
      console.error('Response Data:', err.response.data);
    }
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    server.close();
    process.exit(0);
  }
}

runTests();
