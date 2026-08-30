const express = require("express");
const config = require("./config/index");
const cors = require("cors");
const { dataSource } = require("./db/data-source");
const appError = require("./utils/appError");
const skill = require("./routes/skill");
const users = require("./routes/users");
const creditPackage = require("./routes/creditPackage");
const adminCourses = require("./routes/adminCourses");
const adminCoaches = require("./routes/adminCoaches");
const coaches = require("./routes/coaches");
const courses = require("./routes/courses");


const app = express();
app.use(cors());
app.use(express.json());

// API
app.get("/healthcheck", async (req, res, next) => {
  try {
    await dataSource.query("SELECT 1");
    res.status(200).send("OK");
  } catch (error) {
    res.status(503).send("Service Unavailable");
  }
});

// 業務邏輯
app.use("/api/coaches/skill", skill);
app.use("/api/users", users);

app.use("/api/credit-package", creditPackage);
app.use("/api/admin/coaches/courses", adminCourses);
app.use("/api/admin/coaches", adminCoaches);
app.use("/api/coaches", coaches);
app.use("/api/courses", courses);


// 404錯誤
app.use((req, res, next) => {
  next(appError(404, "找不到路由"));
  return;
});

// 全域錯誤
app.use((err, req, res, next) => {
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    status: statusCode === 500 ? "error" : "failed",
    message: err.message || "伺服器錯誤"
  })
});

// 啟動
dataSource
  .initialize()
  .then(() => {
    app.listen(config.get("web.port"), () => {
      console.log(`Server is running on ${config.get("web.port")}`);
    });
})
.catch((err) => {
  console.error("資料庫連線失敗", err);
  process.exit(1);
});




