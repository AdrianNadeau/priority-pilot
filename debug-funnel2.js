const { sequelize } = require("./models");

(async () => {
  try {
    console.log("=== INVESTIGATING FUNNEL DISCREPANCY ===\n");

    // Test the exact funnel query
    console.log("1. Testing exact funnel controller query:");
    const funnelQuery = `
      SELECT DISTINCT
        proj.company_id_fk,
        proj.id,
        proj.project_name,
        proj.start_date,
        proj.end_date,
        proj.health,
        proj.effort AS effort,
        prime_person.first_name AS prime_first_name,
        prime_person.last_name AS prime_last_name,
        sponsor_person.first_name AS sponsor_first_name,
        sponsor_person.last_name AS sponsor_last_name,
        proj.project_cost,
        phases.phase_name
      FROM
        projects proj
      LEFT JOIN
        persons prime_person ON prime_person.id = proj.prime_id_fk
      LEFT JOIN
        persons sponsor_person ON sponsor_person.id = proj.sponsor_id_fk
      LEFT JOIN
        phases ON phases.id = proj.phase_id_fk
      WHERE
        proj.company_id_fk = 23 AND proj.phase_id_fk = 1 AND proj.deleted_yn = false
      ORDER BY
        proj.id
    `;

    const funnelData = await sequelize.query(funnelQuery, {
      type: sequelize.QueryTypes.SELECT,
    });

    console.log(`Funnel query result count: ${funnelData.length}`);
    funnelData.forEach((p, i) => {
      console.log(`${i + 1}. ID ${p.id}: ${p.project_name}`);
    });

    // Test simpler query without JOINs
    console.log("\n2. Testing simple project count (no JOINs):");
    const simpleCount = await sequelize.query(
      "SELECT COUNT(*) as count FROM projects WHERE company_id_fk = 23 AND phase_id_fk = 1 AND deleted_yn = false",
      { type: sequelize.QueryTypes.SELECT },
    );
    console.log(`Simple count: ${simpleCount[0].count}`);

    // Check for duplicate phase records
    console.log("\n3. Checking phases table for duplicates:");
    const phaseCheck = await sequelize.query(
      "SELECT id, phase_name, COUNT(*) as count FROM phases GROUP BY id, phase_name ORDER BY id",
      { type: sequelize.QueryTypes.SELECT },
    );
    phaseCheck.forEach((p) => {
      if (p.count > 1) {
        console.log(
          `⚠️  Duplicate phase: ID ${p.id} (${p.phase_name}) appears ${p.count} times`,
        );
      } else {
        console.log(`✅ Phase ID ${p.id} (${p.phase_name}) - unique`);
      }
    });

    // Check for duplicate person records that might affect JOINs
    console.log("\n4. Checking for person duplicates that could affect JOINs:");
    const personCheck = await sequelize.query(
      "SELECT COUNT(DISTINCT id) as unique_persons, COUNT(*) as total_persons FROM persons WHERE company_id_fk = 23",
      { type: sequelize.QueryTypes.SELECT },
    );
    console.log(
      `Unique persons: ${personCheck[0].unique_persons}, Total records: ${personCheck[0].total_persons}`,
    );

    process.exit(0);
  } catch (e) {
    console.error("Error:", e.message);
    process.exit(1);
  }
})();
