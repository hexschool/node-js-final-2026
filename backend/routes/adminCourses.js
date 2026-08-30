const isAuth = require("../middlewares/isAuth");
const isCoach = require("../middlewares/isCoach");
const adminCoursesController = require("../controllers/adminCourses");

const router = require("express").Router();

router.get("/", isAuth, isCoach, adminCoursesController.getAll);

router.post("/", isAuth, isCoach, adminCoursesController.create);

router.get("/:courseId", isAuth, adminCoursesController.getOne);

router.put("/:courseId", isAuth, adminCoursesController.update);

module.exports = router;