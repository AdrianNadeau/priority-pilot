const Chance = require("chance");
/**
 * An instance of the Chance library used for generating random data.
 * @type {Chance}
 */
const chance = new Chance();

/**
 * Test data factory for generating mock data
 */
class TestDataFactory {
  constructor() {
    this.sequences = new Map();
  }

  // Generate unique sequential IDs
  sequence(name, start = 1) {
    if (!this.sequences.has(name)) {
      this.sequences.set(name, start);
    }
    const current = this.sequences.get(name);
    this.sequences.set(name, current + 1);
    return current;
  }

  // Generate company data
  company(overrides = {}) {
    return {
      id: this.sequence("company"),
      company_name: chance.company(),
      company_description: chance.sentence(),
      created_at: chance.date({ year: 2023 }),
      updated_at: new Date(),
      ...overrides,
    };
  }

  // Generate person/user data
  person(overrides = {}) {
    const firstName = chance.first();
    const lastName = chance.last();

    return {
      id: this.sequence("person"),
      first_name: firstName,
      last_name: lastName,
      email: chance.email({ domain: "test.com" }),
      password: "$2a$10$hashedpassword", // Mock hashed password
      phone: chance.phone(),
      company_id_fk: 1,
      created_at: chance.date({ year: 2023 }),
      updated_at: new Date(),
      ...overrides,
    };
  }

  // Generate project data
  project(overrides = {}) {
    const startDate = chance.date({ year: 2024 });
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + chance.integer({ min: 1, max: 12 }));

    return {
      id: this.sequence("project"),
      project_name: `${chance.word({ capitalize: true })} ${chance.word({ capitalize: true })} Project`,
      project_description: chance.paragraph({ sentences: 2 }),
      start_date: startDate,
      end_date: endDate,
      company_id_fk: 1,
      phase_id_fk: chance.integer({ min: 1, max: 4 }),
      priority_id_fk: chance.integer({ min: 1, max: 4 }),
      person_id_fk: chance.integer({ min: 1, max: 2 }),
      status_id_fk: chance.integer({ min: 1, max: 4 }),
      created_at: chance.date({ year: 2023 }),
      updated_at: new Date(),
      ...overrides,
    };
  }

  // Generate phase data
  phase(overrides = {}) {
    const phases = [
      "Planning",
      "Design",
      "Development",
      "Testing",
      "Deployment",
      "Maintenance",
    ];
    const phase = chance.pickone(phases);

    return {
      id: this.sequence("phase"),
      phase_name: phase,
      phase_description: `${phase} phase of the project`,
      created_at: new Date(),
      updated_at: new Date(),
      ...overrides,
    };
  }

  // Generate priority data
  priority(overrides = {}) {
    const priorities = [
      { name: "Low", color: "#28a745" },
      { name: "Medium", color: "#ffc107" },
      { name: "High", color: "#fd7e14" },
      { name: "Critical", color: "#dc3545" },
    ];
    const priority = chance.pickone(priorities);

    return {
      id: this.sequence("priority"),
      priority_name: priority.name,
      priority_description: `${priority.name} priority level`,
      priority_color: priority.color,
      created_at: new Date(),
      updated_at: new Date(),
      ...overrides,
    };
  }

  // Generate status data
  status(overrides = {}) {
    const statuses = [
      "Active",
      "On Hold",
      "Completed",
      "Cancelled",
      "Archived",
    ];
    const status = chance.pickone(statuses);

    return {
      id: this.sequence("status"),
      status_name: status,
      status_description: `Project is ${status.toLowerCase()}`,
      created_at: new Date(),
      updated_at: new Date(),
      ...overrides,
    };
  }

  // Generate tag data
  tag(overrides = {}) {
    const tags = [
      "Frontend",
      "Backend",
      "Database",
      "API",
      "Testing",
      "DevOps",
      "Mobile",
      "Web",
    ];

    return {
      id: this.sequence("tag"),
      tag_name: chance.pickone(tags),
      tag_description: chance.sentence(),
      tag_color: chance.color({ format: "hex" }),
      created_at: new Date(),
      updated_at: new Date(),
      ...overrides,
    };
  }

  // Generate change log data
  changeLog(overrides = {}) {
    const actions = ["Created", "Updated", "Deleted", "Archived", "Restored"];

    return {
      id: this.sequence("changeLog"),
      change_type: chance.pickone(actions),
      change_description: chance.sentence(),
      changed_by: chance.integer({ min: 1, max: 5 }),
      project_id_fk: chance.integer({ min: 1, max: 10 }),
      change_date: chance.date({ year: 2024 }),
      created_at: new Date(),
      updated_at: new Date(),
      ...overrides,
    };
  }

  // Generate multiple records
  createMany(factory, count, overrides = {}) {
    const results = [];
    for (let i = 0; i < count; i++) {
      results.push(factory(overrides));
    }
    return results;
  }

  // Generate related project data (project with dependencies)
  projectWithDependencies(overrides = {}) {
    const project = this.project(overrides);
    const phases = this.createMany(() => this.phase(), 4);
    const priorities = this.createMany(() => this.priority(), 4);
    const statuses = this.createMany(() => this.status(), 4);
    const tags = this.createMany(() => this.tag(), 3);
    const changeLogs = this.createMany(
      () => this.changeLog({ project_id_fk: project.id }),
      5,
    );

    return {
      project,
      phases,
      priorities,
      statuses,
      tags,
      changeLogs,
    };
  }

  // Generate complete dataset for testing
  generateCompleteDataset(options = {}) {
    const {
      companyCount = 2,
      userCount = 10,
      projectCount = 20,
      phaseCount = 4,
      priorityCount = 4,
      statusCount = 4,
      tagCount = 8,
    } = options;

    return {
      companies: this.createMany(() => this.company(), companyCount),
      users: this.createMany(() => this.person(), userCount),
      projects: this.createMany(() => this.project(), projectCount),
      phases: this.createMany(() => this.phase(), phaseCount),
      priorities: this.createMany(() => this.priority(), priorityCount),
      statuses: this.createMany(() => this.status(), statusCount),
      tags: this.createMany(() => this.tag(), tagCount),
    };
  }

  // Generate test data for specific scenarios
  generateScenarioData(scenario) {
    switch (scenario) {
      case "empty":
        return {
          companies: [],
          users: [],
          projects: [],
          phases: [],
          priorities: [],
          statuses: [],
          tags: [],
        };

      case "minimal":
        return {
          companies: [this.company()],
          users: [this.person()],
          projects: [this.project()],
          phases: [this.phase()],
          priorities: [this.priority()],
          statuses: [this.status()],
          tags: [this.tag()],
        };

      case "large":
        return this.generateCompleteDataset({
          companyCount: 10,
          userCount: 100,
          projectCount: 500,
          phaseCount: 10,
          priorityCount: 8,
          statusCount: 8,
          tagCount: 20,
        });

      case "overdue_projects":
        const overdueProjects = this.createMany(
          () =>
            this.project({
              end_date: chance.date({ year: 2023 }), // Past date
              status_id_fk: 1, // Active status
            }),
          5,
        );

        return {
          companies: [this.company()],
          users: this.createMany(() => this.person(), 3),
          projects: overdueProjects,
          phases: this.createMany(() => this.phase(), 4),
          priorities: this.createMany(() => this.priority(), 4),
          statuses: this.createMany(() => this.status(), 4),
          tags: this.createMany(() => this.tag(), 5),
        };

      case "high_priority_projects":
        const highPriorityProjects = this.createMany(
          () =>
            this.project({
              priority_id_fk: 4, // Critical priority
            }),
          8,
        );

        return {
          companies: [this.company()],
          users: this.createMany(() => this.person(), 5),
          projects: highPriorityProjects,
          phases: this.createMany(() => this.phase(), 4),
          priorities: this.createMany(() => this.priority(), 4),
          statuses: this.createMany(() => this.status(), 4),
          tags: this.createMany(() => this.tag(), 5),
        };

      default:
        return this.generateCompleteDataset();
    }
  }

  // Reset sequence counters
  resetSequences() {
    this.sequences.clear();
  }

  // Generate test user credentials
  generateTestCredentials() {
    return {
      valid: {
        email: "test@example.com",
        password: "password123",
      },
      invalid: {
        email: "wrong@example.com",
        password: "wrongpassword",
      },
      admin: {
        email: "admin@example.com",
        password: "adminpassword",
      },
    };
  }

  // Generate API test data
  generateApiTestData() {
    return {
      validProjectData: {
        project_name: "Test Project API",
        project_description: "Project created via API test",
        start_date: "2024-01-01",
        end_date: "2024-12-31",
        phase_id_fk: 1,
        priority_id_fk: 2,
        person_id_fk: 1,
        status_id_fk: 1,
      },
      invalidProjectData: {
        project_name: "", // Empty name should fail validation
        project_description: "Invalid project",
      },
      updateProjectData: {
        project_name: "Updated Project Name",
        project_description: "Updated description",
      },
    };
  }
}

module.exports = TestDataFactory;
