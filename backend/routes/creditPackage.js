const isAuth = require("../middlewares/isAuth");
const creditPackageController = require("../controllers/creditPackage");

const router = require("express").Router();

router.get("/", creditPackageController.getAll);

router.post("/", creditPackageController.create);

router.delete("/:creditPackageId", creditPackageController.remove);

router.post("/:creditPackageId", isAuth, creditPackageController.purchase);

module.exports = router;