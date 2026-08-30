const isAuth = require("../middlewares/isAuth");
const uploadController = require("../controllers/upload");

const router = require("express").Router();

router.post("/", isAuth, uploadController.postUploadImage);