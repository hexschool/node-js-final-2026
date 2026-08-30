const coursesController = require("../controllers/courses");
const isAuth = require("../middlewares/isAuth");

const router = require("express").Router();

router.get("/", coursesController.getCourses);

router.post("/:courseId", isAuth, coursesController.postBooking);

router.delete("/:courseId", isAuth, coursesController.deleteBooking);

module.exports = router;