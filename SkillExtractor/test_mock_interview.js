const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'config.env') });
const mongoose = require('mongoose');
const http = require('http');
const axios = require('axios');
const jwt = require('jsonwebtoken');

const app = require('./app');
const User = require('./models/userModel');
const CandidateProfile = require('./models/candidateProfileSchema');
const RecruiterProfile = require('./models/recruiterProfileSchema');
const Job = require('./models/jobSchema');
const MockInterview = require('./models/mockInterviewSchema');

const PORT = 8011;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '1d',
  });

async function runTests() {
  console.log('🚀 Starting AI Mock Interview & Readiness Coach Integration Tests...\n');

  const DB = process.env.DATABASE?.replace(
    '<PASSWORD>',
    process.env.DATABASE_PASSWORD || '',
  );

  await mongoose.connect(DB);
  console.log('✅ Connected to MongoDB Atlas');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`✅ Test server running on http://localhost:${PORT}\n`);

  let candidateUser, candidateToken;
  let anotherCandidateUser, anotherCandidateToken;
  let recruiterUser, recruiterToken;
  let activeJob, pendingJob;
  let interviewSessionId;
  let generatedQuestions = [];

  try {
    // ─── 1. Setup Accounts ────────────────────────────────────────────────
    console.log('--- 1. Setting Up Test Accounts & Jobs ---');
    
    // Candidate A
    candidateUser = await User.findOne({ email: 'test_cand_mock_a@test.com' });
    if (!candidateUser) {
      candidateUser = await User.create({
        name: 'Dr. Sarah Khan',
        email: 'test_cand_mock_a@test.com',
        password: 'Password123!',
        role: 'candidate',
      });
    }
    await CandidateProfile.findOneAndUpdate(
      { user: candidateUser._id },
      {
        user: candidateUser._id,
        title: 'Postdoctoral Fellow in Artificial Intelligence',
        institution: 'NUST Islamabad',
        skills: ['Python', 'Deep Learning', 'PyTorch', 'Computer Vision', 'TensorFlow'],
        professionalBio: 'Researcher specializing in deep learning architectures and computer vision applications.',
        experience: [{ title: 'Research Assistant', company: 'AI Vision Lab', duration: '2 years' }],
        education: [{ degree: 'PhD in Computer Science', institution: 'NUST', year: '2024' }],
      },
      { upsert: true, new: true },
    );
    candidateToken = signToken(candidateUser._id);

    // Candidate B (For isolation checks)
    anotherCandidateUser = await User.findOne({ email: 'test_cand_mock_b@test.com' });
    if (!anotherCandidateUser) {
      anotherCandidateUser = await User.create({
        name: 'Ali Raza',
        email: 'test_cand_mock_b@test.com',
        password: 'Password123!',
        role: 'candidate',
      });
    }
    anotherCandidateToken = signToken(anotherCandidateUser._id);

    // Recruiter (For role restriction & applicant view checks)
    recruiterUser = await User.findOne({ email: 'test_recruiter_mock@test.com' });
    if (!recruiterUser) {
      recruiterUser = await User.create({
        name: 'Faculty Dean',
        email: 'test_recruiter_mock@test.com',
        password: 'Password123!',
        role: 'recruiter',
      });
    }
    recruiterToken = signToken(recruiterUser._id);

    // Admin (For admin analytics authorization checks)
    let adminUser = await User.findOne({ email: 'test_admin_mock@test.com' });
    if (!adminUser) {
      adminUser = await User.create({
        name: 'System Admin',
        email: 'test_admin_mock@test.com',
        password: 'Password123!',
        role: 'admin',
      });
    }
    const adminToken = signToken(adminUser._id);

    let recruiterProfile = await RecruiterProfile.findOne({ user: recruiterUser._id });
    if (!recruiterProfile) {
      recruiterProfile = await RecruiterProfile.create({
        user: recruiterUser._id,
        companyName: 'NUST Faculty Recruitment',
        industry: 'Education & Research',
      });
    }

    // Active Job
    activeJob = await Job.create({
      title: 'Assistant Professor - Machine Learning',
      department: 'Computer Science',
      location: 'Islamabad',
      salary: 2200000,
      jobType: 'Full-time',
      skills: ['Python', 'PyTorch', 'Deep Learning', 'Neural Networks'],
      description: 'Conduct research and teach undergraduate and graduate courses in Deep Learning and Artificial Intelligence.',
      jobStatus: 'Active',
      createdBy: recruiterProfile._id,
    });

    // Pending Job (Should not allow mock interview)
    pendingJob = await Job.create({
      title: 'Visiting Lecturer - Math',
      department: 'Mathematics',
      location: 'Lahore',
      salary: 900000,
      jobType: 'Part-time',
      skills: ['Linear Algebra', 'Calculus'],
      description: 'Teach introductory calculus.',
      jobStatus: 'Pending',
    });

    console.log('  ✓ Test candidate, recruiter, active job, and pending job ready.\n');

    // ─── 2. Test Start Mock Interview ─────────────────────────────────────
    console.log('▶ TEST 1: Start Mock Interview for Active Job');
    const startRes = await axios.post(
      `${BASE_URL}/mock-interviews/start`,
      { jobId: activeJob._id },
      { headers: { Authorization: `Bearer ${candidateToken}` } },
    );

    if (!startRes.data.success || !startRes.data.data.interviewId) {
      throw new Error('Failed to start mock interview session');
    }

    interviewSessionId = startRes.data.data.interviewId;
    generatedQuestions = startRes.data.data.questions || [];

    if (generatedQuestions.length !== 5) {
      throw new Error(`Expected exactly 5 questions, received ${generatedQuestions.length}`);
    }

    console.log(`  ✓ Interview Session started: ${interviewSessionId}`);
    console.log(`  ✓ Generated 5 tailored questions:`);
    generatedQuestions.forEach((q, i) => {
      console.log(`     Q${i + 1} [${q.questionType}]: ${q.question}`);
    });
    console.log('✅ TEST 1 PASSED\n');

    // ─── 3. Test Invalid & Non-Active Jobs ─────────────────────────────────
    console.log('▶ TEST 2: Validation on Inactive / Invalid Jobs');
    try {
      await axios.post(
        `${BASE_URL}/mock-interviews/start`,
        { jobId: pendingJob._id },
        { headers: { Authorization: `Bearer ${candidateToken}` } },
      );
      throw new Error('Should not allow starting interview on Pending job');
    } catch (err) {
      if (err.response?.status === 400) {
        console.log('  ✓ Correctly rejected Pending job with 400 Bad Request');
      } else {
        throw err;
      }
    }

    try {
      await axios.post(
        `${BASE_URL}/mock-interviews/start`,
        { jobId: new mongoose.Types.ObjectId() },
        { headers: { Authorization: `Bearer ${candidateToken}` } },
      );
      throw new Error('Should not allow starting interview on non-existent job');
    } catch (err) {
      if (err.response?.status === 404) {
        console.log('  ✓ Correctly returned 404 for non-existent job');
      } else {
        throw err;
      }
    }
    console.log('✅ TEST 2 PASSED\n');

    // ─── 4. Test Submit Answers & AI Evaluation with Distinct Answers ─────
    console.log('▶ TEST 3: Submit Answers & Dynamic Evaluation on Answers A, B, and C');

    // Answer A
    const ansA = "I have several years of Python and FastAPI experience. I built REST APIs using authentication, SQLAlchemy and PostgreSQL.";
    const resA = await axios.post(
      `${BASE_URL}/mock-interviews/${interviewSessionId}/answer`,
      { questionId: generatedQuestions[0].questionId, answer: ansA },
      { headers: { Authorization: `Bearer ${candidateToken}` } },
    );
    const evalA = resA.data.data;
    console.log(`  ✓ Answer A evaluated -> Score: ${evalA.score}/100 | Rel: ${evalA.feedback.relevance} | Tech: ${evalA.feedback.technicalCorrectness} | Comp: ${evalA.feedback.completeness}`);
    console.log(`     Strengths: ${(evalA.feedback.strengths || []).join('; ')}`);
    console.log(`     Improvements: ${(evalA.feedback.improvements || []).join('; ')}`);

    // Answer B ("I don't know.")
    const ansB = "I don't know.";
    const resB = await axios.post(
      `${BASE_URL}/mock-interviews/${interviewSessionId}/answer`,
      { questionId: generatedQuestions[1].questionId, answer: ansB },
      { headers: { Authorization: `Bearer ${candidateToken}` } },
    );
    const evalB = resB.data.data;
    console.log(`  ✓ Answer B evaluated -> Score: ${evalB.score}/100 | Rel: ${evalB.feedback.relevance} | Tech: ${evalB.feedback.technicalCorrectness} | Comp: ${evalB.feedback.completeness}`);
    console.log(`     Strengths: ${(evalB.feedback.strengths || []).join('; ')}`);
    console.log(`     Improvements: ${(evalB.feedback.improvements || []).join('; ')}`);

    // Answer C
    const ansC = "I would design the system using microservices, Docker and an API gateway. I would also add authentication, logging and monitoring.";
    const resC = await axios.post(
      `${BASE_URL}/mock-interviews/${interviewSessionId}/answer`,
      { questionId: generatedQuestions[2].questionId, answer: ansC },
      { headers: { Authorization: `Bearer ${candidateToken}` } },
    );
    const evalC = resC.data.data;
    console.log(`  ✓ Answer C evaluated -> Score: ${evalC.score}/100 | Rel: ${evalC.feedback.relevance} | Tech: ${evalC.feedback.technicalCorrectness} | Comp: ${evalC.feedback.completeness}`);
    console.log(`     Strengths: ${(evalC.feedback.strengths || []).join('; ')}`);
    console.log(`     Improvements: ${(evalC.feedback.improvements || []).join('; ')}`);

    // Verify scores are NOT all identical
    if (evalA.score === evalB.score && evalB.score === evalC.score) {
      throw new Error('FAILED: All three distinct answers received identical evaluation scores!');
    }

    if (evalB.score >= evalA.score || evalB.score >= evalC.score) {
      throw new Error('FAILED: "I don\'t know" received a higher score than valid technical answers!');
    }

    console.log('  ✓ Verified: Evaluations are genuinely dynamic, different answers receive distinct scores & feedback.');

    // Submit remaining answers for Q4 and Q5
    for (let i = 3; i < generatedQuestions.length; i++) {
      const q = generatedQuestions[i];
      const ans = `In my teaching and research at NUST, I design syllabi with modern deep learning benchmarks and foster collaborative student research projects.`;
      
      const res = await axios.post(
        `${BASE_URL}/mock-interviews/${interviewSessionId}/answer`,
        { questionId: q.questionId, answer: ans },
        { headers: { Authorization: `Bearer ${candidateToken}` } },
      );
      console.log(`  ✓ Q${i + 1} evaluated! Score: ${res.data.data.score}/100`);
    }
    console.log('✅ TEST 3 PASSED\n');

    // ─── 5. Test Security & Candidate Isolation ────────────────────────────
    console.log('▶ TEST 4: Security & Candidate Isolation');
    const q1 = generatedQuestions[0];
    // Candidate B tries to answer Candidate A's session
    try {
      await axios.post(
        `${BASE_URL}/mock-interviews/${interviewSessionId}/answer`,
        { questionId: q1.questionId, answer: 'Hijacked answer' },
        { headers: { Authorization: `Bearer ${anotherCandidateToken}` } },
      );
      throw new Error('Candidate B was able to answer Candidate A session!');
    } catch (err) {
      if (err.response?.status === 403) {
        console.log('  ✓ Candidate B access to Candidate A session blocked with 403 Forbidden');
      } else {
        throw err;
      }
    }

    // Recruiter tries to access mock-interviews
    try {
      await axios.post(
        `${BASE_URL}/mock-interviews/start`,
        { jobId: activeJob._id },
        { headers: { Authorization: `Bearer ${recruiterToken}` } },
      );
      throw new Error('Recruiter was able to call candidate mock-interview endpoint!');
    } catch (err) {
      if (err.response?.status === 403) {
        console.log('  ✓ Recruiter access to candidate mock-interview endpoints blocked with 403 Forbidden');
      } else {
        throw err;
      }
    }
    console.log('✅ TEST 4 PASSED\n');

    // ─── 6. Test Complete Interview & Final Report ────────────────────────
    console.log('▶ TEST 5: Complete Interview & Readiness Score Report');
    const completeRes = await axios.post(
      `${BASE_URL}/mock-interviews/${interviewSessionId}/complete`,
      {},
      { headers: { Authorization: `Bearer ${candidateToken}` } },
    );

    if (!completeRes.data.success || typeof completeRes.data.data.readinessScore !== 'number') {
      throw new Error('Failed to complete interview session');
    }

    const report = completeRes.data.data;
    console.log(`  ✓ Overall Interview Readiness Score: ${report.readinessScore}%`);
    console.log(`  ✓ Competency Breakdown:`);
    console.log(`     • Technical Knowledge: ${report.breakdown.technicalKnowledge}%`);
    console.log(`     • Communication: ${report.breakdown.communication}%`);
    console.log(`     • Job Relevance: ${report.breakdown.jobRelevance}%`);
    console.log(`     • Answer Quality: ${report.breakdown.answerQuality}%`);
    console.log(`  ✓ AI Recommendation: "${report.recommendation}"`);

    // Verify session in DB
    const dbSession = await MockInterview.findById(interviewSessionId);
    if (dbSession.status !== 'completed' || !dbSession.completedAt) {
      throw new Error('Database session status was not updated to completed');
    }
    console.log('  ✓ Database record verified with status = "completed"');
    console.log('✅ TEST 5 PASSED\n');

    // ─── 7. Test Fetch Session Details ────────────────────────────────────
    console.log('▶ TEST 6: Fetch Session by ID');
    const getRes = await axios.get(
      `${BASE_URL}/mock-interviews/${interviewSessionId}`,
      { headers: { Authorization: `Bearer ${candidateToken}` } },
    );
    if (!getRes.data.data.interview || getRes.data.data.interview.answers.length !== 5) {
      throw new Error('Fetched session details mismatch');
    }
    console.log(`  ✓ Fetched session with ${getRes.data.data.interview.answers.length} verified answers.`);
    console.log('✅ TEST 6 PASSED\n');

    // ─── 8. Test Mock Interview Prerequisite on Job Application ───────────
    console.log('▶ TEST 7: Mock Interview Completion Gating on Job Application');

    // Create a secondary active job (Job B)
    const activeJobB = await Job.create({
      title: 'Assistant Professor - Robotics',
      department: 'Mechatronics',
      location: 'Rawalpindi',
      salary: 2100000,
      jobType: 'Full-time',
      skills: ['ROS', 'C++', 'Control Systems'],
      description: 'Teach robotics and autonomous systems.',
      jobStatus: 'Active',
    });

    // 1. Check application status for Job A (completed interview) vs Job B (uncompleted)
    const statusResA = await axios.get(
      `${BASE_URL}/jobs/application-status/${activeJob._id}`,
      { headers: { Authorization: `Bearer ${candidateToken}` } },
    );
    if (!statusResA.data.data.hasCompletedMockInterview) {
      throw new Error('Expected hasCompletedMockInterview to be true for Job A');
    }
    console.log('  ✓ Status check: hasCompletedMockInterview = true for Job A (interview completed)');

    const statusResB = await axios.get(
      `${BASE_URL}/jobs/application-status/${activeJobB._id}`,
      { headers: { Authorization: `Bearer ${candidateToken}` } },
    );
    if (statusResB.data.data.hasCompletedMockInterview) {
      throw new Error('Expected hasCompletedMockInterview to be false for Job B');
    }
    console.log('  ✓ Status check: hasCompletedMockInterview = false for Job B (interview not attempted)');

    // 2. Attempt applying to Job B (without completed interview) -> MUST be blocked with 403
    try {
      await axios.post(
        `${BASE_URL}/jobs/applyToJob/${activeJobB._id}`,
        {},
        { headers: { Authorization: `Bearer ${candidateToken}` } },
      );
      throw new Error('Applying to Job B without completed mock interview should have failed!');
    } catch (err) {
      if (err.response?.status === 403) {
        console.log(`  ✓ Applying to Job B blocked with 403 Forbidden: "${err.response.data.message}"`);
      } else {
        throw err;
      }
    }

    // 3. Apply to Job A (with completed interview) -> MUST succeed with 200
    const applyResA = await axios.post(
      `${BASE_URL}/jobs/applyToJob/${activeJob._id}`,
      {},
      { headers: { Authorization: `Bearer ${candidateToken}` } },
    );
    if (applyResA.data.status !== 'success') {
      throw new Error('Applying to Job A with completed mock interview failed');
    }
    console.log('  ✓ Applying to Job A (with completed mock interview) SUCCEEDED with 200 OK');

    await Job.findByIdAndDelete(activeJobB._id);
    console.log('✅ TEST 7 PASSED\n');

    // ─── 9. Test Recruiter Views AI Interview Report & Security ───────────
    console.log('▶ TEST 8: Recruiter Views AI Interview Report & Security');

    // 1. Recruiter views candidate's completed interview for activeJob
    const recruiterInterviewRes = await axios.get(
      `${BASE_URL}/mock-interviews/recruiter/${candidateUser._id}/${activeJob._id}`,
      { headers: { Authorization: `Bearer ${recruiterToken}` } },
    );
    if (!recruiterInterviewRes.data?.data?.completed) {
      throw new Error('Expected completed interview report for candidate on activeJob');
    }
    const reportData = recruiterInterviewRes.data.data;
    console.log(`  ✓ Recruiter fetched report -> Score: ${reportData.overallReadinessScore}%`);
    console.log(`  ✓ Strengths: ${reportData.strengths.length} items, Areas to Improve: ${reportData.areasToImprove.length} items`);
    console.log(`  ✓ Q&A Breakdown: ${reportData.answers.length} verified answers with scores`);

    // 2. Recruiter views applicants list for activeJob -> aiInterview is attached
    const applicantsListRes = await axios.get(
      `${BASE_URL}/jobs/applicants/${activeJob._id}`,
      { headers: { Authorization: `Bearer ${recruiterToken}` } },
    );
    const applicantEntry = (applicantsListRes.data?.data?.applicants || []).find(
      (a) => a.candidate?.user?._id?.toString() === candidateUser._id.toString() || a.candidate?._id?.toString() === candidateUser._id.toString(),
    );
    if (!applicantEntry || !applicantEntry.aiInterview?.completed) {
      throw new Error('Expected applicant entry to include completed aiInterview summary');
    }
    console.log(`  ✓ Applicants list includes aiInterview summary -> Completed: ${applicantEntry.aiInterview.completed}, Score: ${applicantEntry.aiInterview.overallReadinessScore}%`);

    // 3. Security: Second recruiter attempts to access another recruiter's job interview
    const otherRecruiterUser = await User.create({
      name: 'Unauthorized Dean',
      email: 'unauth_recruiter_mock@test.com',
      password: 'Password123!',
      role: 'recruiter',
    });
    const otherRecruiterProfile = await RecruiterProfile.create({
      user: otherRecruiterUser._id,
      companyName: 'Other University',
      industry: 'Education',
    });
    const otherRecruiterToken = signToken(otherRecruiterUser._id);

    try {
      await axios.get(
        `${BASE_URL}/mock-interviews/recruiter/${candidateUser._id}/${activeJob._id}`,
        { headers: { Authorization: `Bearer ${otherRecruiterToken}` } },
      );
      throw new Error('Unauthorized recruiter was able to access job interview report!');
    } catch (err) {
      if (err.response?.status === 403) {
        console.log(`  ✓ Unauthorized recruiter access blocked with 403 Forbidden: "${err.response.data.message}"`);
      } else {
        throw err;
      }
    }

    // 4. Candidate without completed interview returns completed: false
    const notCompletedRes = await axios.get(
      `${BASE_URL}/mock-interviews/recruiter/${anotherCandidateUser._id}/${activeJob._id}`,
      { headers: { Authorization: `Bearer ${recruiterToken}` } },
    );
    if (notCompletedRes.data?.data?.completed !== false) {
      throw new Error('Expected completed: false for candidate who did not complete interview');
    }
    console.log('  ✓ Query for candidate without interview correctly returned completed: false');

    await User.findByIdAndDelete(otherRecruiterUser._id);
    await RecruiterProfile.findByIdAndDelete(otherRecruiterProfile._id);
    console.log('✅ TEST 8 PASSED\n');

    // ─── 10. Test Admin AI Interview Analytics & Security ──────────────────
    console.log('▶ TEST 9: Admin AI Mock Interview Analytics & Security');

    // 1. Admin fetches analytics -> MUST return 200 OK with correct aggregated metrics
    const analyticsRes = await axios.get(
      `${BASE_URL}/mock-interviews/admin/analytics`,
      { headers: { Authorization: `Bearer ${adminToken}` } },
    );
    if (analyticsRes.data?.status !== 'success' || !analyticsRes.data?.data) {
      throw new Error('Failed to fetch admin interview analytics');
    }
    const aData = analyticsRes.data.data;
    console.log(`  ✓ Total Interviews: ${aData.totalInterviews}, Completed: ${aData.completedInterviews}`);
    console.log(`  ✓ Avg Readiness: ${aData.averageReadinessScore}%, Avg Technical: ${aData.averageTechnicalKnowledge}%, Avg Comm: ${aData.averageCommunication}%`);
    console.log(`  ✓ Readiness Distribution: High=${aData.readinessDistribution.high}, Mod=${aData.readinessDistribution.moderate}, NeedsImprovement=${aData.readinessDistribution.needsImprovement}`);
    console.log(`  ✓ Completion Rate: ${aData.completionRate}%`);

    if (typeof aData.averageReadinessScore !== 'number' || typeof aData.totalInterviews !== 'number') {
      throw new Error('Analytics response missing expected numerical metrics');
    }

    // 2. Candidate attempts to access admin analytics -> MUST return 403 Forbidden
    try {
      await axios.get(
        `${BASE_URL}/mock-interviews/admin/analytics`,
        { headers: { Authorization: `Bearer ${candidateToken}` } },
      );
      throw new Error('Candidate was able to access admin interview analytics!');
    } catch (err) {
      if (err.response?.status === 403) {
        console.log(`  ✓ Candidate access blocked with 403 Forbidden: "${err.response.data.message}"`);
      } else {
        throw err;
      }
    }

    // 3. Recruiter attempts to access admin analytics -> MUST return 403 Forbidden
    try {
      await axios.get(
        `${BASE_URL}/mock-interviews/admin/analytics`,
        { headers: { Authorization: `Bearer ${recruiterToken}` } },
      );
      throw new Error('Recruiter was able to access admin interview analytics!');
    } catch (err) {
      if (err.response?.status === 403) {
        console.log(`  ✓ Recruiter access blocked with 403 Forbidden: "${err.response.data.message}"`);
      } else {
        throw err;
      }
    }

    console.log('✅ TEST 9 PASSED\n');

    // ─── Clean Up ─────────────────────────────────────────────────────────
    console.log('--- Cleaning Up Test Data ---');
    await MockInterview.deleteMany({ candidate: { $in: [candidateUser._id, anotherCandidateUser._id] } });
    await Job.findByIdAndDelete(activeJob._id);
    await Job.findByIdAndDelete(pendingJob._id);
    await User.findByIdAndDelete(adminUser._id);
    console.log('✓ Cleaned up test jobs and interview sessions.');

    console.log('\n======================================================');
    console.log('🎉 ALL 9 AI MOCK INTERVIEW INTEGRATION TESTS PASSED 100%');
    console.log('======================================================\n');
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
