const isAuth = require("../middlewares/isAuth");
const isCoach = require("../middlewares/isCoach");
const usersContorller = require("../controllers/users");

const router = require("express").Router();


router.post("/signup", usersContorller.signup);

router.post("/login", usersContorller.login);

//教練
router.get("/profile", isAuth, usersContorller.profile);

router.put("/profile", isAuth, usersContorller.putProfile);

router.put("/password", isAuth, usersContorller.putPassword);

router.get("/credit-package", isAuth, usersContorller.getCreditPackage);

router.get("/courses", isAuth, usersContorller.getCourse);

module.exports = router;