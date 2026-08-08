const CareerRoadmap = require('../models/careerRoadmapSchema');

const saveCareerRoadmap = async (req, res) => {
  try {
    const { roadmapData } = req.body;

    if (!roadmapData) {
      return res.status(400).json({
        success: false,
        message: 'Career roadmap data is required',
      });
    }

    const careerRoadmap = await CareerRoadmap.findOneAndUpdate(
      { user: req.user.id },
      {
        user: req.user.id,
        careerInsight: roadmapData.careerInsight,
        targetRoles: roadmapData.targetRoles,
        learningRoadmap: roadmapData.learningRoadmap,
        overallRecommendation: roadmapData.overallRecommendation,
        updatedAt: new Date(),
      },
      { new: true, upsert: true },
    );

    console.log('Career roadmap saved:', careerRoadmap);

    res.json({
      success: true,
      message: 'Career roadmap saved successfully',
      data: careerRoadmap,
    });
  } catch (error) {
    console.log('Save career roadmap error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getCareerRoadmap = async (req, res) => {
  try {
    const careerRoadmap = await CareerRoadmap.findOne({
      user: req.user.id,
    });

    if (!careerRoadmap) {
      return res.status(404).json({
        success: false,
        message: 'No career roadmap found for this user',
      });
    }

    res.json({
      success: true,
      data: careerRoadmap,
    });
  } catch (error) {
    console.log('Get career roadmap error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  saveCareerRoadmap,
  getCareerRoadmap,
};
