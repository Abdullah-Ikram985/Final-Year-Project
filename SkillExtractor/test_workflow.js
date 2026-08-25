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

const PORT = 8009;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '1d',
  });

async function runTests() {
  console.log('🚀 Starting Job Approval / Rejection Workflow Integration Tests...\n');

  const DB = process.env.DATABASE?.replace(
    '<PASSWORD>',
    process.env.DATABASE_PASSWORD || '',
  );

  await mongoose.connect(DB);
  console.log('✅ Connected to MongoDB Atlas');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`✅ Test server running on http://localhost:${PORT}\n`);

  let testRecruiterUser, testRecruiterProfile;
  let testCandidateUser, testCandidateProfile;
  let testAdminUser;
  let testJobA, testJobB;

  try {
    // ─── Setup Test Users ──────────────────────────────────────────────────
    console.log('--- Setting Up Test Accounts ---');

    // 1. Recruiter
    testRecruiterUser = await User.findOne({ email: 'test_recruiter_workflow@test.com' });
    if (!testRecruiterUser) {
      testRecruiterUser = await User.create({
        name: 'Workflow Recruiter',
        email: 'test_recruiter_workflow@test.com',
        password: 'Password123!',
        role: 'recruiter',
      });
    }
    testRecruiterProfile = await RecruiterProfile.findOne({ user: testRecruiterUser._id });
    if (!testRecruiterProfile) {
      testRecruiterProfile = await RecruiterProfile.create({
        user: testRecruiterUser._id,
        companyName: 'Workflow Test Corp',
        industry: 'Education & Tech',
      });
    }

    // 2. Candidate
    testCandidateUser = await User.findOne({ email: 'test_candidate_workflow@test.com' });
    if (!testCandidateUser) {
      testCandidateUser = await User.create({
        name: 'Workflow Candidate',
        email: 'test_candidate_workflow@test.com',
        password: 'Password123!',
        role: 'candidate',
      });
    }
    testCandidateProfile = await CandidateProfile.findOne({ user: testCandidateUser._id });
    if (!testCandidateProfile) {
      testCandidateProfile = await CandidateProfile.create({
        user: testCandidateUser._id,
        title: 'Assistant Professor in CS',
        skills: ['Python', 'Machine Learning', 'Data Science'],
      });
    }

    // 3. Admin
    testAdminUser = await User.findOne({ email: 'test_admin_workflow@test.com' });
    if (!testAdminUser) {
      testAdminUser = await User.create({
        name: 'Workflow Admin',
        email: 'test_admin_workflow@test.com',
        password: 'Password123!',
        role: 'admin',
      });
    }

    const recruiterToken = signToken(testRecruiterUser._id);
    const candidateToken = signToken(testCandidateUser._id);
    const adminToken = signToken(testAdminUser._id);

    console.log('✅ Recruiter, Candidate, and Admin test credentials ready.\n');

    // ─── TEST 1: Recruiter creates Job A ──────────────────────────────────
    console.log('▶ TEST 1: Recruiter Creates Job (Status must be "Pending")');
    const createRes = await axios.post(
      `${BASE_URL}/jobs/create`,
      {
        title: 'Workflow Assistant Professor - AI',
        department: 'Computer Science',
        location: 'Islamabad',
        salary: 1800000,
        jobType: 'Full-time',
        skills: ['Python', 'Machine Learning', 'Deep Learning'],
        description: 'Teaching and research in artificial intelligence.',
      },
      { headers: { Authorization: `Bearer ${recruiterToken}` } },
    );

    testJobA = createRes.data.data.job;
    if (testJobA.jobStatus !== 'Pending') {
      throw new Error(`Expected jobStatus to be "Pending", but got "${testJobA.jobStatus}"`);
    }
    console.log(`  ✓ Job created with status "${testJobA.jobStatus}"`);
    console.log(`  ✓ Response message: "${createRes.data.message}"`);
    console.log('✅ TEST 1 PASSED\n');

    // ─── TEST 2: Candidate visibility of Pending Job A ─────────────────────
    console.log('▶ TEST 2: Candidate Queries (Pending job must be HIDDEN from candidate)');
    const candAllJobsRes = await axios.get(`${BASE_URL}/jobs/allJobs`, {
      headers: { Authorization: `Bearer ${candidateToken}` },
    });
    const foundInAll = (candAllJobsRes.data?.data?.jobs || []).some(
      (j) => j._id.toString() === testJobA._id.toString(),
    );
    if (foundInAll) {
      throw new Error('Pending Job A was found in candidate allJobs listing!');
    }
    console.log('  ✓ Pending job is NOT in candidate allJobs list');

    // Check candidate job detail
    try {
      await axios.get(`${BASE_URL}/jobs/jobDetail/${testJobA._id}`, {
        headers: { Authorization: `Bearer ${candidateToken}` },
      });
      throw new Error('Candidate was able to access pending jobDetail!');
    } catch (err) {
      if (err.response && err.response.status === 404) {
        console.log('  ✓ Candidate access to pending jobDetail correctly returned 404');
      } else {
        throw err;
      }
    }

    // Check candidate apply
    try {
      await axios.post(
        `${BASE_URL}/jobs/applyToJob/${testJobA._id}`,
        {},
        { headers: { Authorization: `Bearer ${candidateToken}` } },
      );
      throw new Error('Candidate was able to apply to pending job!');
    } catch (err) {
      if (err.response && (err.response.status === 400 || err.response.status === 404)) {
        console.log('  ✓ Applying to pending job correctly blocked');
      } else {
        throw err;
      }
    }
    console.log('✅ TEST 2 PASSED\n');

    // ─── TEST 3: Security / Authorization Checks ──────────────────────────
    console.log('▶ TEST 3: Security & Authorization Restrictions');
    // Recruiter attempts admin approve
    try {
      await axios.patch(
        `${BASE_URL}/jobs/admin/approve/${testJobA._id}`,
        {},
        { headers: { Authorization: `Bearer ${recruiterToken}` } },
      );
      throw new Error('Recruiter was able to call admin approve API!');
    } catch (err) {
      if (err.response?.status === 403) {
        console.log('  ✓ Recruiter calling admin approve returned 403 Forbidden');
      } else {
        throw err;
      }
    }

    // Candidate attempts admin approve
    try {
      await axios.patch(
        `${BASE_URL}/jobs/admin/approve/${testJobA._id}`,
        {},
        { headers: { Authorization: `Bearer ${candidateToken}` } },
      );
      throw new Error('Candidate was able to call admin approve API!');
    } catch (err) {
      if (err.response?.status === 403) {
        console.log('  ✓ Candidate calling admin approve returned 403 Forbidden');
      } else {
        throw err;
      }
    }

    // Recruiter attempts to self-approve via updateJobStatus
    try {
      await axios.patch(
        `${BASE_URL}/jobs/updateJobStatus/${testJobA._id}`,
        { jobStatus: 'Active' },
        { headers: { Authorization: `Bearer ${recruiterToken}` } },
      );
      throw new Error('Recruiter was able to self-approve pending job via updateJobStatus!');
    } catch (err) {
      if (err.response?.status === 400) {
        console.log('  ✓ Recruiter self-approve via updateJobStatus correctly blocked with 400');
      } else {
        throw err;
      }
    }
    console.log('✅ TEST 3 PASSED\n');

    // ─── TEST 4: Admin Rejection Flow ─────────────────────────────────────
    console.log('▶ TEST 4: Admin Rejection Flow & Recruiter Notification');
    // Admin gets pending jobs
    const pendingRes = await axios.get(`${BASE_URL}/jobs/admin/pending`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const isPendingPresent = (pendingRes.data?.data?.jobs || []).some(
      (j) => j._id.toString() === testJobA._id.toString(),
    );
    if (!isPendingPresent) {
      throw new Error('Pending Job A not listed in admin pending jobs endpoint!');
    }
    console.log('  ✓ Job A listed in admin pending queue');

    // Admin rejects Job A with reason
    const rejectionReason = 'Job description must include specific publication requirements.';
    const rejectRes = await axios.patch(
      `${BASE_URL}/jobs/admin/reject/${testJobA._id}`,
      { reason: rejectionReason },
      { headers: { Authorization: `Bearer ${adminToken}` } },
    );

    if (rejectRes.data.data.job.jobStatus !== 'Rejected') {
      throw new Error(`Expected status to be "Rejected", got "${rejectRes.data.data.job.jobStatus}"`);
    }
    console.log(`  ✓ Job A status updated to "${rejectRes.data.data.job.jobStatus}"`);
    console.log(`  ✓ Stored rejection reason: "${rejectRes.data.data.job.rejectionReason}"`);

    // Recruiter checks notifications
    const notifsRes = await axios.get(`${BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${recruiterToken}` },
    });
    const rejectionNotif = (notifsRes.data?.data?.notifications || []).find(
      (n) => n.jobId?._id?.toString() === testJobA._id.toString() || n.jobId?.toString() === testJobA._id.toString(),
    );
    if (!rejectionNotif) {
      throw new Error('Recruiter did not receive rejection notification!');
    }
    console.log(`  ✓ Recruiter received rejection notification: "${rejectionNotif.title}" - "${rejectionNotif.message}"`);

    // Recruiter checks myJobs
    const myJobsRes = await axios.get(`${BASE_URL}/jobs/myJobs`, {
      headers: { Authorization: `Bearer ${recruiterToken}` },
    });
    const jobAInMyJobs = myJobsRes.data?.data?.jobs?.find(
      (j) => j._id.toString() === testJobA._id.toString(),
    );
    if (!jobAInMyJobs || jobAInMyJobs.jobStatus !== 'Rejected') {
      throw new Error('Job A status not updated in recruiter myJobs!');
    }
    console.log(`  ✓ Recruiter sees Job A as "${jobAInMyJobs.jobStatus}" with reason: "${jobAInMyJobs.rejectionReason}"`);
    console.log('✅ TEST 4 PASSED\n');

    // ─── TEST 5: Admin Approval Flow & Candidate Application ───────────────
    console.log('▶ TEST 5: Admin Approval Flow & Candidate Live Application');
    // Recruiter creates Job B
    const createResB = await axios.post(
      `${BASE_URL}/jobs/create`,
      {
        title: 'Workflow Associate Professor - Data Science',
        department: 'Computer Science',
        location: 'Lahore',
        salary: 2400000,
        jobType: 'Full-time',
        skills: ['Python', 'Data Science', 'Machine Learning'],
        description: 'Advanced data analytics and statistical modeling.',
      },
      { headers: { Authorization: `Bearer ${recruiterToken}` } },
    );
    testJobB = createResB.data.data.job;
    console.log(`  ✓ Job B created with status "${testJobB.jobStatus}"`);

    // Admin approves Job B
    const approveRes = await axios.patch(
      `${BASE_URL}/jobs/admin/approve/${testJobB._id}`,
      {},
      { headers: { Authorization: `Bearer ${adminToken}` } },
    );
    if (approveRes.data.data.job.jobStatus !== 'Active') {
      throw new Error(`Expected approved status "Active", got "${approveRes.data.data.job.jobStatus}"`);
    }
    console.log(`  ✓ Job B approved and status is now "${approveRes.data.data.job.jobStatus}"`);

    // Recruiter checks approval notification
    const notifsAfterApprove = await axios.get(`${BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${recruiterToken}` },
    });
    const approvalNotif = (notifsAfterApprove.data?.data?.notifications || []).find(
      (n) =>
        (n.jobId?._id?.toString() === testJobB._id.toString() || n.jobId?.toString() === testJobB._id.toString()) &&
        n.type === 'job_approved',
    );
    if (!approvalNotif) {
      throw new Error('Recruiter did not receive approval notification for Job B!');
    }
    console.log(`  ✓ Recruiter received approval notification: "${approvalNotif.title}" - "${approvalNotif.message}"`);

    // Candidate queries allJobs -> Job B MUST be visible
    const candJobsAfterApprove = await axios.get(`${BASE_URL}/jobs/allJobs`, {
      headers: { Authorization: `Bearer ${candidateToken}` },
    });
    const foundBInAll = (candJobsAfterApprove.data?.data?.jobs || []).some(
      (j) => j._id.toString() === testJobB._id.toString(),
    );
    if (!foundBInAll) {
      throw new Error('Approved Job B was NOT found in candidate allJobs listing!');
    }
    console.log('  ✓ Approved Job B is now visible to candidates in allJobs');

    // Candidate accesses jobDetail
    const detailB = await axios.get(`${BASE_URL}/jobs/jobDetail/${testJobB._id}`, {
      headers: { Authorization: `Bearer ${candidateToken}` },
    });
    if (!detailB.data?.data?.job) {
      throw new Error('Candidate could not fetch detail of approved Job B');
    }
    console.log('  ✓ Candidate successfully fetched details for approved Job B');

    // Candidate completes prerequisite mock interview for Job B
    await MockInterview.create({
      candidate: testCandidateUser._id,
      job: testJobB._id,
      questions: [{ questionId: 'q1', question: 'Explain your data science approach?' }],
      answers: [{ questionId: 'q1', question: 'Explain your data science approach?', answer: 'I use Python and ML pipelines.', score: 85 }],
      overallReadinessScore: 85,
      status: 'completed',
    });
    console.log('  ✓ Candidate completed prerequisite AI Mock Interview for Job B');

    // Candidate applies to Job B
    const applyRes = await axios.post(
      `${BASE_URL}/jobs/applyToJob/${testJobB._id}`,
      {},
      { headers: { Authorization: `Bearer ${candidateToken}` } },
    );
    if (applyRes.data.status !== 'success') {
      throw new Error(`Application failed: ${JSON.stringify(applyRes.data)}`);
    }
    console.log('  ✓ Candidate successfully submitted application to approved Job B');
    console.log('✅ TEST 5 PASSED\n');

    // ─── TEST 6: Notification Management ──────────────────────────────────
    console.log('▶ TEST 6: Notification Read & Management APIs');
    // Mark specific notification as read
    const markReadRes = await axios.patch(
      `${BASE_URL}/notifications/${approvalNotif._id}/read`,
      {},
      { headers: { Authorization: `Bearer ${recruiterToken}` } },
    );
    if (!markReadRes.data?.data?.notification?.isRead) {
      throw new Error('Notification was not marked as read!');
    }
    console.log('  ✓ Single notification marked as read');

    // Mark all notifications as read
    const markAllRes = await axios.patch(
      `${BASE_URL}/notifications/mark-all-read`,
      {},
      { headers: { Authorization: `Bearer ${recruiterToken}` } },
    );
    console.log(`  ✓ Mark all as read: "${markAllRes.data.message}"`);

    const finalNotifs = await axios.get(`${BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${recruiterToken}` },
    });
    if (finalNotifs.data.unreadCount !== 0) {
      throw new Error(`Expected unread count 0, got ${finalNotifs.data.unreadCount}`);
    }
    console.log(`  ✓ Verified unread notification count is now ${finalNotifs.data.unreadCount}`);
    console.log('✅ TEST 6 PASSED\n');

    // ─── Clean Up ─────────────────────────────────────────────────────────
    console.log('--- Cleaning Up Test Data ---');
    await Job.findByIdAndDelete(testJobA._id);
    await Job.findByIdAndDelete(testJobB._id);
    await Notification.deleteMany({ recipient: testRecruiterUser._id });
    await MockInterview.deleteMany({ candidate: testCandidateUser._id });
    console.log('✓ Cleaned up test jobs, mock interviews, and test notifications.');

    console.log('\n========================================');
    console.log('🎉 ALL 6 INTEGRATION TESTS PASSED 100%');
    console.log('========================================\n');
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
