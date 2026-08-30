const { dataSource } = require("../db/data-source");
const appError = require("../utils/appError");
const { isValidString, isInteger } = require("../utils/validUtils");

const creditPackageController = {
  async getAll(req, res, next) {
    const repo = dataSource.getRepository("CreditPackage");
    const packages = await repo.find({
      order: { 
        created_at: "ASC"
      },
      select: {
        id: true,
        name: true,
        credit_amount: true,
        price: true
      },
    });
    res.json({
      status: "success",
      data: packages
    });

  },

  async create(req, res, next) {
    const { name, credit_amount, price } = req.body;
    if (
      !isValidString(name) ||
      !isInteger(credit_amount) ||
      credit_amount < 0 ||
      !isInteger(price) ||
      price < 0
    ) {
      return next(appError(400, "欄位未填寫正確"));
    }

    const repo = dataSource.getRepository("CreditPackage");
    const existing = await repo.findOneBy({ name: name.trim() });
    if (existing) {
      return next(appError(409, "資料重複"));
    }
    const pkg = await repo.save({ name: name.trim(), credit_amount, price });
    res.json({
      status: "success",
      data: {
        id: pkg.id,
        name: pkg.name,
        credit_amount: pkg.credit_amount,
        price: pkg.price,
        createdAt: pkg.created_at,
      },
    });

  },

  async remove(req, res, next) {
    const repo = dataSource.getRepository("CreditPackage");
    const result = await repo.delete(req.params.creditPackageId);
    if (result.affected === 0) {
      return next(appError(400, "ID錯誤"));
    }
    res.json({
      status: "success",
      data: {
        raw: result.raw,
        affected: result.affected
      }
    });

  },
  async purchase(req, res, next) {
    const { creditPackageId } = req.params;
    const repo = dataSource.getRepository("CreditPackage");
    const findPackage = await repo.findOneBy({ id: creditPackageId });
    if (!findPackage) {
      return next(appError(400, "ID錯誤"));
    }

    const purchaseRepo = dataSource.getRepository("CreditPurchase");
    await purchaseRepo.save({
      user_id: req.user.id,
      credit_package_id: findPackage.id,
      purchased_credits: findPackage.credit_amount,
      price_paid: findPackage.price,
    });
    

    res.json({
      status: "success",
      data: null 
    });

  },
};

module.exports = creditPackageController;
