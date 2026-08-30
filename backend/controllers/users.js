const { dataSource } = require("../db/data-source");
const appError = require("../utils/appError");
const { isValidString, isValidPassword } = require("../utils/validUtils");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("../config");

const PWD_ERR = `密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字`;

const usersContorller = {
  //註冊
  async signup(req, res, next) {
    const { name, email, password } = req.body;
    if (
      !isValidString(name) ||
      !isValidString(email) ||
      !isValidString(password)
    ) {
      next(appError(400, "欄位未填寫正確"));
      return;
    }

    if (!isValidPassword(password)) {
      next(appError(400, PWD_ERR));
      return;
    }

    const userRepo = dataSource.getRepository("User");
    const findUser = await userRepo.findOneBy({
      email: email.trim().toLowerCase(),
    });

    if (findUser) {
      next(appError(409, "Email 已被使用"));
      return;
    }

    const hashed = await bcrypt.hash(password, 10);

    const newUser = await userRepo.save({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: "USER",
      password: hashed,
    });

    res.status(201).json({
      status: "success",
      data: {
        user: {
          id: newUser.id,
          name: newUser.name,
        }
      },
    });
    return;
  },

  // 登入
  async login(req, res, next) {
    const { email, password } = req.body;
    if (
      !isValidString(email) ||
      !isValidString(password)
    ) {
      next(appError(400, "欄位未填寫正確"));
      return;
    }

    if (!isValidPassword(password)) {
      next(appError(400, PWD_ERR));
      return;
    }

    const userRepo = dataSource.getRepository("User");
    const findUser = await userRepo.findOneBy({
      email: email.trim().toLowerCase(),
    });

    // 查資料庫有無此帳號
    if (!findUser) {
      next(appError(400, "使用者不存在或密碼輸入錯誤"));
      return;
    }

    // 比對密碼
    const isMatch = await bcrypt.compare(password, findUser.password);
    if (!isMatch) {
      next(appError(400, "使用者不存在或密碼輸入錯誤"));
      return;
    }

    // 驗證成功給token
    const token = await jwt.sign(
      {
        id: findUser.id,
        role: findUser.role,
      },
      config.get("secret.jwtSecret"),
      {
        expiresIn: config.get("secret.jwtExpiresDay"),       
      },
    );

    res.status(201).json({
      status: "success",
      data: {
        token,
        user: {
          name: findUser.name,
        },
      },
    });
    return;
  },

  async profile(req, res, next) {
    
    res.json({
      status: "success",
      data: {
        user: {
          name: req.user.name,
          email: req.user.email,
        }
      },
    });
    return;
  },

  async putProfile(req, res, next) {
    const { name } = req.body;
    if (!isValidString(name)) {
      next(appError(400, "欄位未填寫正確"));
      return;
    }

    const userRepo = dataSource.getRepository("User");
    const findUser = await userRepo.findOneBy({id: req.user.id});

    if (findUser.name === name) {
      next(appError(400, "使用者名稱未變更"));
      return;
    }

    const newName = await userRepo.update(
      { id: req.user.id },
      { name: name.trim() },
    );
    if (newName.affected === 0) {
      next(appError(400, "更新使用者資料失敗"));
    }

    res.json({
      status: "success",
      data: {
        user: {
          name: name.trim()
        }
      }
    });
    return;
  },

  async putPassword(req, res, next) {
    const { 
      password,
      new_password,
      confirm_new_password 
    } = req.body;

    // 三欄任一缺漏／空字串
    if (
      !isValidString(password) ||
      !isValidString(new_password) ||
      !isValidString(confirm_new_password)
    ) {
      next(appError(400, "欄位未填寫正確"));
      return;
    }
    // 三欄任一不符密碼規則
    if (
      !isValidPassword(password) ||
      !isValidPassword(new_password) ||
      !isValidPassword(confirm_new_password)
    ) {
      next(appError(400, PWD_ERR));
      return;
    }
    
    // 新密碼與確認新密碼不一致
    if (new_password !== confirm_new_password) {
      next(appError(400, "新密碼與驗證新密碼不一致"));
      return;
    }
    // 舊密碼比對錯誤
    const userRepo = dataSource.getRepository("User");
    const findUser = await userRepo.findOneBy({
      id: req.user.id,
    });
    const isMatch = await bcrypt.compare(password, findUser.password);
    if (!isMatch) {
      next(appError(400, "密碼輸入錯誤"));
      return;
    }

    // 新密碼與舊密碼相同
    const isSame = await bcrypt.compare(new_password, findUser.password);
    if (isSame) {
      next(appError(400, "新密碼不能與舊密碼相同"));
      return;
    }

    // 密碼再加密
    const hashed = await bcrypt.hash(new_password, 10);
    const result = await userRepo.update(
      { id: req.user.id },
      { password: hashed }
    );
    if (result.affected === 0) {
      next(appError(400, "更新使用者資料失敗"));
      return;
    }


    res.json({
      status: "success",
      data: null
    });
  },

  async getCreditPackage(req, res, next) {
    const purchaseRepo = dataSource.getRepository("CreditPurchase");
    const purchases = await purchaseRepo.find({
      where: { 
        user_id: req.user.id
       },
      relations: {
        creditPackage: true
      },
      order: { 
        purchase_at: "DESC" 
      },
    });
    const data = purchases.map((p) => ({
      name: p.creditPackage.name,
      purchased_credits: p.purchased_credits,
      price_paid: p.price_paid,
      purchase_at: p.purchase_at,
    }));
    res.json({ 
      status: "success",
      data
    });
    return;
  },

  async getCourse(req, res, next) {
    const puchaseRepo = dataSource.getRepository("CreditPurchase");
    const bookingRepo = dataSource.getRepository("CourseBooking");

    // 購買總共多少堂包
    const purchases = await puchaseRepo.find({
      where: {
        user_id: req.user.id
      }
    });
    const totalCredits = purchases.reduce((sum, p) => sum + p.purchased_credits, 0);
    // 查詢預定課程(未取消)
    const allBookings = await bookingRepo.find({
      where: {
        user_id: req.user.id
      },
      relations: {
        course: {
          user: true
        }
      },
      order: {
        course: {
          start_at: "ASC"
        }
      },
    });
    // 已使用的堂數
    const creditUsage = allBookings.filter((b) => !b.cancelled_at).length;
    // 剩下的堂數
    const creditRemin = totalCredits - creditUsage;
    // 已預約課程的列表
    const courseBooking = allBookings.map((b) => ({
      course_id: b.course_id,
      name: b.course.name,
      start_at: b.course.start_at,
      end_at: b.course.end_at,
      meeting_url: b.course.meeting_url,
      coach_name: b.course.user.name,
      cancelled_at: b.cancelled_at,
    }));

    res.json({
      status: "success",
      data: {
        credit_remain: creditRemin,
        credit_usage: creditUsage,
        course_booking: courseBooking
      },
    });
    return;
  },

};

module.exports = usersContorller;

