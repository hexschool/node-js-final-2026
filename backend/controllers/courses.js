const { LessThanOrEqual, MoreThan, IsNull } = require("typeorm");
const { dataSource } = require("../db/data-source");
const appError = require("../utils/appError");
const { isValidString } = require("../utils/validUtils");

const courseController = {
  async getCourses(req, res, next) {
    const courseRepo = dataSource.getRepository("Course");
    const courses = await courseRepo.find({
      where: {
        start_at: LessThanOrEqual(new Date()),
        end_at: MoreThan(new Date()),
      },
      relations: {
        user: true,
        skill: true
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
      data: data
    });
    return;

  },

  async postBooking(req, res, next) {
    const { courseId } = req.params;
    const courseRepo = dataSource.getRepository("Course");
    const courseBookingRepo = dataSource.getRepository("CourseBooking");
    const creditPurchaseRepo = dataSource.getRepository("CreditPurchase");

    // courseId 查無此課程 → 「ID錯誤」
    const findCourse = await courseRepo.findOneBy({ id: courseId });
    if (!findCourse) {
      return next(appError(400, "ID錯誤"));
    }

    // 已有此課程的報名紀錄（含已取消） → 「已經報名過此課程」
    const findBooking = await courseBookingRepo.findOneBy({
      user_id: req.user.id,
      course_id: courseId,
    });
    if (findBooking) {
      return next(appError(400, "已經報名過此課程"));
    }
    
    // 剩餘堂數歸零（購買堂數加總 − 未名數 取消報≤ 0，沒買過方案也算） → 「已無可使用堂數」
    // 購買堂數加總
    const purchases = await creditPurchaseRepo.find({
      where: {
        user_id: req.user.id,
      },
    });
    const total = purchases.reduce((sum, p) => sum + p.purchased_credits, 0);

    // 未取消報名數(已花掉的點數)
    const used = await courseBookingRepo.count({
      where: {
        user_id: req.user.id,
        cancelled_at: IsNull(),
      },
    });
    if (total - used <= 0) {
      return next(appError(400, "已無可使用堂數"));
    }

    // 課程有效報名人數已達上限 → 「已達最大參加人數，無法參加」
    const bookingCount = await courseBookingRepo.count({
      where: {
        course_id: courseId,
        cancelled_at: IsNull(),
      }
    });
    if (bookingCount >= findCourse.max_participants) {
      return next(appError(400, "已達最大參加人數，無法參加"));
    }

    // 報名
    await courseBookingRepo.save({
      user_id: req.user.id,
      course_id: courseId,
    });

    res.status(201).json({
      status: "success",
      data: null
    });
    return;

  },

  async deleteBooking(req, res, next) {
    const { courseId } = req.params;
    const courseBookingRepo = dataSource.getRepository("CourseBooking");
    // 找不到「這位使用者對這門課、尚未取消」的報名紀錄 （課程不存在／從未報名／已經取消過，三種情況都回這句）
    const findBooking = await courseBookingRepo.findOneBy({
      user_id: req.user.id,
      course_id: courseId,
      cancelled_at: IsNull(),
    });
    if (!findBooking) {
      return next(appError(400, "ID錯誤"));
    }

    findBooking.cancelled_at = new Date();
    await courseBookingRepo.save(findBooking);

    res.json({
      status: "success",
      data: {},
    });
    return;

  },
};

module.exports = courseController;