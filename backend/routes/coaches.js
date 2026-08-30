const coachesController = require("../controllers/coaches");

const router = require("express").Router();

router.get("/", coachesController.getAll);

router.get("/:coachId", coachesController.getOne);

router.get("/:coachId/courses", coachesController.getCourses);

module.exports = router;