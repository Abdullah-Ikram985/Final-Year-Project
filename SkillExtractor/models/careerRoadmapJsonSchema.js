const { Type } = require('@google/genai');

const careerRoadmapJsonSchema = {
  type: Type.OBJECT,
  properties: {
    careerInsight: {
      type: Type.OBJECT,
      properties: {
        domain: { type: Type.STRING },
        summary: { type: Type.STRING },
      },
      required: ['domain', 'summary'],
    },
    targetRoles: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          role: { type: Type.STRING },
          matchPercent: { type: Type.NUMBER },
          whyThisRole: { type: Type.STRING },
          missingSkills: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                skill: { type: Type.STRING },
                priority: {
                  type: Type.STRING,
                  enum: ['HIGH', 'MEDIUM', 'LOW'],
                },
              },
              required: ['skill', 'priority'],
            },
          },
        },
        required: ['role', 'matchPercent', 'whyThisRole', 'missingSkills'],
      },
    },
    learningRoadmap: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          skill: { type: Type.STRING },
          priority: {
            type: Type.STRING,
            enum: ['HIGH', 'MEDIUM', 'LOW'],
          },
          courses: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                platform: {
                  type: Type.STRING,
                  enum: ['Udemy', 'Coursera', 'edX'],
                },
                duration: { type: Type.STRING },
                level: {
                  type: Type.STRING,
                  enum: ['Beginner', 'Intermediate', 'Advanced'],
                },
                urlHint: { type: Type.STRING },
              },
              required: ['title', 'platform', 'duration', 'level'],
            },
          },
        },
        required: ['skill', 'priority', 'courses'],
      },
    },
    overallRecommendation: {
      type: Type.OBJECT,
      properties: {
        bestRole: { type: Type.STRING },
        reason: { type: Type.STRING },
        nextStep: { type: Type.STRING },
      },
      required: ['bestRole', 'reason', 'nextStep'],
    },
  },
  required: [
    'careerInsight',
    'targetRoles',
    'learningRoadmap',
    'overallRecommendation',
  ],
};

module.exports = careerRoadmapJsonSchema;
