const jwt = require("jsonwebtoken");
const config = require("../config");
const appError = require("../utils/appError");
const { dataSource } = require("../db/data-source");

async function isAuth(req, res, next) {
  try {
    const auth = req.headers.authorization;

    // 沒帶 Authorization header、或格式不是 Bearer
    if (!auth || !auth.startsWith("Bearer ")) {
      return next(appError(401, "請先登入"));
    }

    // 從authorization分析出token出來並驗證
    const token = auth.split(" ")[1];
    const decode = await jwt.verify(
      token,
      config.get("secret.jwtSecret")
    );

    // 查詢資料庫
    const findUser = await dataSource.getRepository("User").findOneBy({
      id: decode.id,
    });
    if (!findUser) {
      return next(appError(401, "無效的 token"));
    }

    req.user = findUser;
    next();
  } catch (error) {
    // jwt.verify ===> name = TokenExpiredError
    if (error.name === "TokenExpiredError") {
      return next(appError(401, "Token 已過期"));
    }
    
    return next(appError(401, "無效的 token"));
  }
}

module.exports = isAuth;