/**
 * Migration Script: Add next_milestone_date_details column
 * Run this script to add the missing column to the persons table
 * Usage: node scripts/add_milestone_column.js
 */

const db = require("../models");

async function addMilestoneColumn() {
  try {
    console.log(
      "Starting migration: Adding next_milestone_date_details column...",
    );

    // Check if column already exists
    const [results] = await db.sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='persons' AND column_name='next_milestone_date_details'
    `);

    if (results.length > 0) {
      console.log(
        "Column next_milestone_date_details already exists in persons table",
      );
      return;
    }

    // Add the column
    await db.sequelize.query(`
      ALTER TABLE persons 
      ADD COLUMN next_milestone_date_details VARCHAR(255)
    `);

    console.log(
      "✅ Successfully added next_milestone_date_details column to persons table",
    );

    // Verify the column was added
    const [verification] = await db.sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name='persons' AND column_name='next_milestone_date_details'
    `);

    if (verification.length > 0) {
      console.log(
        "✅ Verification successful. Column details:",
        verification[0],
      );
    }
  } catch (error) {
    console.error("❌ Error adding column:", error);
  } finally {
    await db.sequelize.close();
    process.exit(0);
  }
}

// Run the migration
addMilestoneColumn();
