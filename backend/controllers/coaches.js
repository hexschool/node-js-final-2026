const { MoreThan } = require("typeorm");
const { dataSource } = require("../db/data-source");
const appError = require("../utils/appError");
const { isValidString } = require("../utils/validUtils");

const coachesController = {
  async getAll(req, res, next) {
    const { per, page } = req.query;
    const perNum = Number(per);
    const pageNum = Number(page);

    if (
      !per ||
      !page ||
      !Number.isInteger(perNum) ||
      !Number.isInteger(pageNum) ||
      perNum < 0 || 
      pageNum < 1
    ) {
      return next(appError(400, "欄位未填寫正確"));
    }

    const offset = (pageNum - 1) * perNum;
    const coachRepo = dataSource.getRepository("Coach");
    const coaches = await coachRepo.find({
      relations: {
        user: true,
      },
      order: {
        created_at: "ASC",
      },
      take: perNum,
      skip: offset,
    });
    const data = coaches.map((c) => ({
      id: c.id,
      user_id: c.user_id,
      name: c.user.name,
    }));
    res.json({
      status: "success",
      data,
    });

  },

  async getOne(req, res, next) {
    const { coachId } = req.params;
    if (!isValidString(coachId)) {
      return next(appError(400, "欄位未填寫正確"));
    }

    const coachRepo = dataSource.getRepository("Coach");
    const coach = await coachRepo.findOne({
      where: {
        id: coachId,
      },
      relations: {
        user: true,
      },
    });
    if (!coach) {
      return next(appError(400, "找不到該教練"));
    }

    const clsRepo = dataSource.getRepository("CoachLinkSkill");
    const links = await clsRepo.find({
      where: {
        coach_id: coachId,
      },
      relations: {
        skill: true
      },
    });
    res.json({
      status: "success",
      data: {
        user: {
          name: coach.user.name,
          role: coach.user.role,
        },
        coach: {
          id: coach.id,
          user_id: coach.user_id,
          experience_years: coach.experience_years,
          description: coach.description,
          profile_image_url: coach.profile_image_url,
          created_at: coach.created_at,
          updated_at: coach.updated_at,
          skills: links.map((l) => l.skill.name),
        },
      },
    });

  },

  async getCourses(req, res, next) {
    const { coachId } = req.params;
    const coachRepo = dataSource.getRepository("Coach");
    const coach = await coachRepo.findOne({
      where: {
        id: coachId,
      }
    });

    if (!coach) {
      return next(appError(400, "找不到該教練"));
    }

    const courseRepo = dataSource.getRepository("Course");
    const courses = await courseRepo.find({
      where: {
        user_id: coach.user_id,
        end_at: MoreThan(new Date()),
      },
      relations: {
        user: true,
        skill: true,
      },
      order: {
        start_at: "ASC"
      },
    });
    const data = courses.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      start_at: c.start_at,
      end_at: c.end_at,
      max_participants: c.max_participants,
      coach_name: c.user.name,
      skill_name: c.skill.name,
    }));
    res.json({
      status: "success",
      data
    });

  },
};

module.exports = coachesController;