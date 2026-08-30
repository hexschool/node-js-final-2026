const isAuth = require("../middlewares/isAuth");
const isCoach = require("../middlewares/isCoach");
const adminCoachesController = require("../controllers/adminCoaches");

const router = require("express").Router();

router.post("/:userId", adminCoachesController.createCoach);

router.get("/", isAuth, isCoach, adminCoachesController.getCoach);

router.put("/", isAuth, isCoach, adminCoachesController.updateCoach);

router.get("/revenue", isAuth, isCoach, adminCoachesController.getRevenue);

module.exports = router;