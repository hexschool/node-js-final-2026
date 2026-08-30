const { IsNull } = require("typeorm");
const { dataSource } = require("../db/data-source");
const appError = require("../utils/appError");
const { isValidString, isInteger } = require("../utils/validUtils");


const adminCoursesController = {
  async getAll(req, res, next) {
    const courseRepo = dataSource.getRepository("Course");
    const courses = await courseRepo.find({
      where: {
        user_id: req.user.id,
      },
      order: {
        start_at: "ASC",
      },
    });
    const bookingRepo = dataSource.getRepository("CourseBooking");
    const now = new Date();
    const data = [];

    for (const c of courses) {
      const count = await bookingRepo.count({
        where: {
          course_id: c.id,
          cancelled_at: IsNull(),
        },
      });

      let status;
      if (new Date(c.start_at) > now)
        status = "尚未開始";
      else if (new Date(c.end_at) <= now)
        status = "已結束";
      else
        status = "進行中";
      
      data.push({
        id: c.id,
        name: c.name,
        start_at: c.start_at,
        end_at: c.end_at,
        max_participants: c.max_participants,
        meeting_url: c.meeting_url,
        participants: count,
        status,
      });
    }

    res.json({
      status: "success",
      data
    });
  },

  async create(req, res, next) {
    const {
      skill_id,
      name,
      description,
      start_at,
      end_at,
      max_participants, 
      meeting_url,
    } = req.body;

    if (
      !isValidString(skill_id) ||
      !isValidString(name) ||
      !isValidString(description) ||
      !start_at ||
      !end_at ||
      !isValidString(meeting_url) ||
      !meeting_url.startsWith("https") ||
      !isInteger(max_participants) ||
      max_participants < 0
    ) {
      return next(appError(400, "欄位未填寫正確"));
    }

    const courseRepo = dataSource.getRepository("Course");
    const course = await courseRepo.save({
      user_id: req.user.id,
      skill_id,
      name: name.trim(),
      description: description.trim(),
      start_at,
      end_at,
      max_participants,
      meeting_url,
    });

    res.status(201).json({
      status: "success",
      data: {
        course
      }
    });

  },

  async getOne(req, res, next) {
    const courseRepo = dataSource.getRepository("Course");
    const course = await courseRepo.findOne({
      where: {
        id: req.params.courseId,
        user_id: req.user.id,
      },
      relations: {
        skill: true,
      },
    });
    if (!course) {
      return next(appError(400, "課程不存在"));
    }

    res.json({
      status: "success",
      data: {
        id: course.id,
        name: course.name,
        description: course.description,
        start_at: course.start_at,
        end_at: course.end_at,
        max_participants: course.max_participants,
        meeting_url: course.meeting_url,
        skill_id: course.skill_id,
        skill_name: course.skill.name,
      },
    });

  },
  
  async update(req, res, next) {
    const {
      skill_id,
      name,
      description,
      start_at,
      end_at,
      max_participants,
      meeting_url,
    } = req.body;

    if (
      !isValidString(skill_id) ||
      !isValidString(name) ||
      !isValidString(description) ||
      !start_at ||
      !end_at ||
      !isValidString(meeting_url) ||
      !meeting_url.startsWith("https") ||
      !isInteger(max_participants) ||
      max_participants < 0
    ) {
      return next(appError(400, "欄位未填寫正確"));
    }

    const courseRepo = dataSource.getRepository("Course");
    const result = await courseRepo.update(
      {
        id: req.params.courseId,
        user_id: req.user.id,
      },
      {
        skill_id,
        name: name.trim(),
        description: description.trim(),
        start_at,
        end_at,
        max_participants,
        meeting_url,
      },
    );
    if (result.affected === 0) {
      return next(appError(400, "課程不存在"));
    }
    const updated = await courseRepo.findOneBy({
      id: req.params.courseId
    });
    res.json({
      status: "success",
      data: {
        course: updated
      },
    });

  },
};

module.exports = adminCoursesController;