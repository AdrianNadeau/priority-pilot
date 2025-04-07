const db = require("../models");

const companyPortfolioName = async (req, res, next) => {
  try {
    // Ensure the session contains the company ID
    if (!req.session || !req.session.company || !req.session.company.id) {
      res.locals.portfolio_name = "Unknown Portfolio";
      return next();
    }

    const company_id_fk = req.session.company.id;

    // Fetch the company headline from the database
    const company = await db.companies.findOne({
      where: { id: company_id_fk },
      attributes: ["company_headline"],
    });

    // Set the portfolio name in `res.locals` for use in views
    if (company && company.company_headline) {
      res.locals.portfolio_name = company.company_headline;
    } else {
      res.locals.portfolio_name = "Unknown Portfolio";
    }

    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    console.error("Error fetching company headline:", error);
    res.locals.portfolio_name = "Error Fetching Portfolio Name";
    next(); // Proceed even if there's an error
  }
};

module.exports = companyPortfolioName;
