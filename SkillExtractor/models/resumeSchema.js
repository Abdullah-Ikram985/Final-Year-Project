const { Type } = require('@google/genai');

const resumeSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING }, 
    institution: { type: Type.STRING },

    phoneNumber: { type: Type.STRING },
    location: { type: Type.STRING },

    linkedinProfileLink: { type: Type.STRING },
    personalWebsiteLink: { type: Type.STRING },

    skills: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },

    professionalBio: { type: Type.STRING }, 

    experience: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          company: { type: Type.STRING },
          duration: { type: Type.STRING },
        },
        required: ['title', 'company', 'duration'],
      },
    },

    education: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          degree: { type: Type.STRING },
          institution: { type: Type.STRING },
          year: { type: Type.STRING },
        },
        required: ['degree', 'institution', 'year'],
      },
    },

    preferredRole: { type: Type.STRING }, 
  },
  required: [
    'title',
    'phoneNumber',
    'location',
    'skills',
    'professionalBio',
    'experience',
    'education',
  ],
};

module.exports = resumeSchema;
