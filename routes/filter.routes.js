const express = require("express");
const router = express.Router();

// Clear filter session and DB values for the current user
router.post("/clear", async (req, res) => {
  try {
    // Remove filter values from session
    req.session.filtered_start = null;
    req.session.filtered_end = null;

    // Optionally, clear from DB for the current user
    if (req.session.person && req.session.person.id) {
      const db = require("../models");
      await db.persons.update(
        { filtered_start: null, filtered_end: null },
        { where: { id: req.session.person.id } },
      );
    }
    req.session.save(() => {
      res.json({ success: true });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
