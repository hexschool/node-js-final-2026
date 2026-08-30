const { dataSource } = require("../db/data-source");
const appError = require("../utils/appError");
const { isInteger, isValidString } = require("../utils/validUtils");

const adminCoachesController = {
  async createCoach(req, res, next) {
    const { userId } = req.params;
    const {
      experience_years,
      description,
      profile_image_url
    } = req.body;

    if (
      !isInteger(experience_years) ||
      experience_years < 0 ||
      !isValidString(description)
    ) {
      return next(appError(400, "欄位未填寫正確"));
    }
    if (
      profile_image_url &&
      profile_image_url !== "" &&
      (typeof profile_image_url !== "string" ||
        !profile_image_url.startsWith("https"))
    ) {
      return next(appError(400, "欄位未填寫正確"));
    }

    const userRepo = dataSource.getRepository("User");
    const user = await userRepo.findOneBy({ id: userId });
    if (!user) {
      return next(appError(400, "使用者不存在"));
    }
    const coachRepo = dataSource.getRepository("Coach");
    const existCoach = await coachRepo.findOneBy({ user_id: userId });
    if (existCoach) {
      return next(appError(400, "使用者已經是教練"));
    }

    await userRepo.update(userId, { role: "COACH" });
    const coach = await coachRepo.save({
      user_id: userId,
      experience_years,
      description: description.trim(),
      profile_image_url: profile_image_url || null,
    });
    res.status(201).json({
      status: "success",
      data: {
        user: {
          name: user.name,
          role: "COACH"
        },
        coach,
      },
    });

  },

  async getCoach(req, res, next) {
    const coachRepo = dataSource.getRepository("Coach");
    const coach = await coachRepo.findOneBy({ user_id: req.user.id });
    if (!coach) {
      return next(appError(401, "使用者尚未成為教練"));
    }
    const clsRepo = dataSource.getRepository("CoachLinkSkill");
    const links = await clsRepo.find({ where: { coach_id: coach.id }});

    res.json({
      status: "success",
      data: {
        id: coach.id,
        experience_years: coach.experience_years,
        description: coach.description,
        profile_image_url: coach.profile_image_url,
        skill_ids: links.map((l) => l.skill_id),
      },
    });

  },

  async updateCoach(req, res, next) {
    const { 
      experience_years, 
      description,
      profile_image_url,
      skill_ids
    } = req.body;
    if (
      !isInteger(experience_years) ||
      experience_years < 0 ||
      !isValidString(description) ||
      !isValidString(profile_image_url) ||
      !profile_image_url.startsWith("https") ||
      !Array.isArray(skill_ids) ||
      skill_ids.length === 0
    ) {
      return next(appError(400, "欄位未填寫正確"));
    }

    const coachRepo = dataSource.getRepository("Coach");
    const coach = await coachRepo.findOneBy({ user_id: req.user.id });
    if (!coach) {
      return next(appError(401, "使用者尚未成為教練"));
    }

    await coachRepo.update(coach.id, {
      experience_years,
      description: description.trim(),
      profile_image_url,
    });
    const clsRepo = dataSource.getRepository("CoachLinkSkill");
    await clsRepo.delete({ coach_id: coach.id });
    for (const sid of skill_ids) {
      await clsRepo.save({ coach_id: coach.id, skill_id: sid });
    }
    res.json({
      status: "success",
      data: {
        id: coach.id,
        experience_years,
        description: description.trim(),
        profile_image_url,
        skill_ids,
      }
    });

  },

  async getRevenue(req, res, next) {

  },
};

module.exports = adminCoachesController;
