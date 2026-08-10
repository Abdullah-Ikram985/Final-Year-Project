const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const mongoose = require('mongoose');
const User = require('./models/userModel');
const RecruiterProfile = require('./models/recruiterProfileSchema');
const Job = require('./models/jobSchema');
const DB = "mongodb+srv://ahmadzohaib302_db_user:Adso6iTFDjjgSZ3C@cluster0.yh3n3yx.mongodb.net/SkillExtractor?appName=Cluster0";
const jobsData = [
  { title:"Frontend Developer", department:"Engineering", location:"Lahore", salary:"120000", jobType:"Full-time", skills:["React","JavaScript","CSS"], description:"Build modern UI with React & Tailwind. 2+ years experience." },
  { title:"Backend Developer", department:"Engineering", location:"Islamabad", salary:"150000", jobType:"Full-time", skills:["Node.js","Express","MongoDB"], description:"Develop REST APIs and microservices. Node.js expert required." },
  { title:"UI/UX Designer", department:"Design", location:"Remote", salary:"90000", jobType:"Remote", skills:["Figma","Adobe XD","Prototyping"], description:"Design user-friendly interfaces for web and mobile apps." },
  { title:"Data Analyst", department:"Analytics", location:"Karachi", salary:"110000", jobType:"Full-time", skills:["Python","SQL","Power BI"], description:"Analyze data and create dashboards. Python/SQL must." },
  { title:"Mobile App Developer", department:"Engineering", location:"Lahore", salary:"130000", jobType:"Full-time", skills:["Flutter","Dart","Firebase"], description:"Build cross-platform apps with Flutter." },
  { title:"DevOps Engineer", department:"Infrastructure", location:"Islamabad", salary:"160000", jobType:"Contract", skills:["Docker","AWS","CI/CD"], description:"Manage cloud infrastructure and deployments." },
  { title:"HR Manager", department:"Human Resources", location:"Karachi", salary:"80000", jobType:"Full-time", skills:["Recruitment","Communication","HRMS"], description:"Handle hiring and employee relations." },
  { title:"Content Writer", department:"Marketing", location:"Remote", salary:"60000", jobType:"Part-time", skills:["SEO","Writing","WordPress"], description:"Write SEO optimized blogs and articles." },
  { title:"Machine Learning Engineer", department:"AI/ML", location:"Lahore", salary:"180000", jobType:"Full-time", skills:["Python","TensorFlow","ML"], description:"Build ML models for real-world problems." },
  { title:"QA Engineer", department:"Quality Assurance", location:"Islamabad", salary:"95000", jobType:"Full-time", skills:["Selenium","Testing","JIRA"], description:"Test web apps and ensure quality." },
];
(async () => {
  await mongoose.connect(DB);
  console.log("DB connected");
  let recruiters = [];
  for(let i=1;i<=2;i++){
    let email = `recruiter${i}@test.com`;
    let user = await User.findOne({email});
    if(!user){
      user = await User.create({ name:`Recruiter ${i}`, email, password:"Recruiter@123", role:"recruiter" });
      await RecruiterProfile.create({ user: user._id, companyName: `Tech Solutions ${i}`, companyLocation: i===1?"Lahore":"Islamabad" });
      console.log(`Created recruiter: ${email} / Recruiter@123`);
    }
    let profile = await RecruiterProfile.findOne({user: user._id});
    recruiters.push(profile);
  }
  for(let i=0;i<jobsData.length;i++){
    let recruiter = recruiters[i%2];
    let exists = await Job.findOne({ title: jobsData[i].title, createdBy: recruiter._id });
    if(!exists){
      await Job.create({ createdBy: recruiter._id, jobStatus:"Active", ...jobsData[i] });
      console.log(`Created job: ${jobsData[i].title}`);
    } else {
      console.log(`Already exists: ${jobsData[i].title}`);
    }
  }
  const count = await Job.countDocuments();
  console.log(`\nDone! Total jobs in DB: ${count}`);
  console.log(`\nRecruiters to login:\n - recruiter1@test.com / Recruiter@123\n - recruiter2@test.com / Recruiter@123\nAdmin: admin@edumatch.com / Admin@12345`);
  await mongoose.disconnect();
})();
