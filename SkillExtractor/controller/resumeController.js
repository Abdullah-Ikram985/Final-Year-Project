const extractTextFromBuffer = require('../services/pdfServices.js');
const CandidateProfile = require('../models/candidateProfileSchema');
const CareerRoadmap = require('../models/careerRoadmapSchema');
const { OpenAI } = require('openai');

const CHAT_MODEL = process.env.POLLINATIONS_CHAT_MODEL || 'openai';

function createPollinationsClient() {
  return new OpenAI({
    apiKey:
      process.env.POLLINATIONS_API_KEY || 'sk_AgUQwN07V2kliWsQHxgnO1XGIL0yJ826',
    baseURL: 'https://gen.pollinations.ai/v1',
  });
}

const safeJsonParse = (value, fallback = null) => {
  try {
    const clean = value.replace(/```json|```/gi, '').trim();
    return JSON.parse(clean);
  } catch {
    return fallback;
  }
};

const getResumeData = async (req, res) => {
  try {
    const openai = createPollinationsClient();

    const profile = await CandidateProfile.findOne({ user: req.user.id });

    if (!profile || !profile.pdfUrl) {
      return res.status(400).json({
        success: false,
        message: 'Resume PDF not found in candidate profile',
      });
    }

    const pdfUrl = profile.pdfUrl;

    const response = await fetch(pdfUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        Accept: 'application/pdf',
      },
    });

    if (!response.ok) {
      return res.status(400).json({
        success: false,
        message: `Failed to fetch PDF. Status: ${response.status}`,
      });
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const text = await extractTextFromBuffer(buffer);

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Could not extract text from resume PDF',
      });
    }

    const careerRoadmapPrompt = `You are an expert AI Career Counselor and Technical Mentor.

You will analyze a candidate's resume and generate a personalized career roadmap.

========================
INPUT (USER RESUME)
========================
${text}

========================
TASK
========================

1. Analyze the resume carefully
2. Detect the most suitable career domain
3. Predict 3 best target roles based on:
   - current skills
   - experience
   - industry trends

4. For each target role:
   - calculate match percentage (0–100)
   - identify missing skills
   - classify missing skills into: HIGH / MEDIUM / LOW priority

5. Generate a learning roadmap:
   - each skill must include recommended courses
   - courses must be REALISTIC and from:
     - Udemy
     - Coursera
     - edX

6. Each course must include:
   - title
   - platform
   - duration (estimated)
   - level (Beginner / Intermediate / Advanced)
   - skill it covers

7. Choose ONLY relevant, modern tech courses (no random or outdated content)

========================
OUTPUT FORMAT (STRICT JSON ONLY)
========================

Return ONLY valid JSON with this exact structure:
{
  "careerInsight": { "domain": "", "summary": "" },
  "targetRoles": [
    {
      "role": "",
      "matchPercent": 0,
      "whyThisRole": "",
      "missingSkills": [{ "skill": "", "priority": "HIGH | MEDIUM | LOW" }]
    }
  ],
  "learningRoadmap": [
    {
      "skill": "",
      "priority": "HIGH | MEDIUM | LOW",
      "courses": [
        {
          "title": "",
          "platform": "Udemy | Coursera | edX",
          "duration": "",
          "level": "Beginner | Intermediate | Advanced",
          "urlHint": ""
        }
      ]
    }
  ],
  "overallRecommendation": { "bestRole": "", "reason": "", "nextStep": "" }
}

========================
RULES
========================
- Do NOT return extra text
- Do NOT include markdown
- Only return JSON
- Be realistic with skills and roles
- Base everything ONLY on resume data`;

    let structuredData = null;

    try {
      const resumeResult = await openai.chat.completions.create({
        model: CHAT_MODEL,
        temperature: 0.1,
        max_tokens: 1200,
        messages: [
          {
            role: 'system',
            content:
              'You are an expert HR AI system. Always respond with valid JSON only. No markdown, no extra text.',
          },
          {
            role: 'user',
            content: `Extract structured data from this resume and return a JSON object with these exact fields:
- title (string)
- institution (string)
- phoneNumber (string)
- location (string)
- linkedinProfileLink (string)
- personalWebsiteLink (string)
- skills (array of strings)
- professionalBio (string)
- experience (array of objects with fields: title, company, duration)
- education (array of objects with fields: degree, institution, year)
- preferredRole (string)

Resume Text:
${text}`,
          },
        ],
      });

      const content = resumeResult?.choices?.[0]?.message?.content || '{}';
      structuredData = safeJsonParse(content, null);

      if (!structuredData) {
        throw new Error('Resume extraction returned invalid JSON');
      }
    } catch (resumeErr) {
      console.error('Resume extraction failed:', resumeErr.message);
      throw resumeErr;
    }

    let careerRoadmapData = null;

    try {
      const careerResult = await openai.chat.completions.create({
        model: CHAT_MODEL,
        temperature: 0.1,
        max_tokens: 2500,
        messages: [
          {
            role: 'system',
            content:
              'You are an expert AI Career Counselor. Always respond with valid JSON only. No markdown, no extra text.',
          },
          {
            role: 'user',
            content: careerRoadmapPrompt,
          },
        ],
      });

      const content = careerResult?.choices?.[0]?.message?.content || '{}';
      careerRoadmapData = safeJsonParse(content, null);

      if (!careerRoadmapData) {
        throw new Error('Career roadmap extraction returned invalid JSON');
      }

      await CareerRoadmap.findOneAndUpdate(
        { user: req.user.id },
        {
          user: req.user.id,
          careerInsight: careerRoadmapData.careerInsight,
          targetRoles: careerRoadmapData.targetRoles,
          learningRoadmap: careerRoadmapData.learningRoadmap,
          overallRecommendation: careerRoadmapData.overallRecommendation,
          updatedAt: new Date(),
        },
        { new: true, upsert: true },
      );
    } catch (careerErr) {
      console.error('Career roadmap extraction failed:', careerErr.message);
      careerRoadmapData = null;
    }

    return res.json({
      success: true,
      data: {
        resumeData: structuredData,
        careerRoadmap: careerRoadmapData,
      },
    });
  } catch (error) {
    console.error('Controller error:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = getResumeData;
