import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs";
import { createObjectCsvWriter } from "csv-writer";

// Helper function to extract phone numbers
function extractPhone(text) {
  const phoneRegex =
    /(?:\+1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
  const matches = text.match(phoneRegex);
  return matches ? matches[0] : null;
}

// Helper function to extract email addresses
function extractEmail(text) {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const matches = text.match(emailRegex);
  return matches ? matches[0] : null;
}

// Helper function to extract addresses
function extractAddress(text) {
  // Look for patterns like street address, city, province postal code
  const addressRegex =
    /(\d+\s+[A-Za-z\s]+(?:St|Street|Ave|Avenue|Rd|Road|Dr|Drive|Blvd|Boulevard|Way|Lane|Ln|Ct|Court)\b.*?[A-Z]{2}\s+[A-Z]\d[A-Z]\s*\d[A-Z]\d)/gi;
  const matches = text.match(addressRegex);
  return matches ? matches[0] : null;
}

// Helper function to extract social media links
function extractSocialMedia($) {
  const social = {};

  $('a[href*="facebook.com"]').each((i, el) => {
    if (!social.facebook) social.facebook = $(el).attr("href");
  });

  $('a[href*="twitter.com"], a[href*="x.com"]').each((i, el) => {
    if (!social.twitter) social.twitter = $(el).attr("href");
  });

  $('a[href*="instagram.com"]').each((i, el) => {
    if (!social.instagram) social.instagram = $(el).attr("href");
  });

  $('a[href*="linkedin.com"]').each((i, el) => {
    if (!social.linkedin) social.linkedin = $(el).attr("href");
  });

  return Object.keys(social).length > 0 ? social : null;
}

// Function to scrape detailed data from organization homepage
async function scrapeHomepageData(url) {
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    const $ = cheerio.load(response.data);

    // Extract basic page info
    const title = $("title").text().trim();
    const description = $('meta[name="description"]').attr("content") || "";
    const keywords = $('meta[name="keywords"]').attr("content") || "";

    // Extract contact information
    const pageText = $("body").text();
    const phone = extractPhone(pageText);
    const email = extractEmail(pageText);
    const address = extractAddress(pageText);

    // Extract social media
    const socialMedia = extractSocialMedia($);

    // Look for programs/services
    const programs = [];
    $("h1, h2, h3, h4").each((i, el) => {
      const text = $(el).text().trim().toLowerCase();
      if (
        text.includes("program") ||
        text.includes("service") ||
        text.includes("initiative")
      ) {
        programs.push($(el).text().trim());
      }
    });

    // Look for donation links
    let donationLink = null;
    $("a").each((i, el) => {
      const href = $(el).attr("href") || "";
      const text = $(el).text().toLowerCase();
      if (
        text.includes("donate") ||
        text.includes("give") ||
        href.includes("donate")
      ) {
        donationLink = href.startsWith("http") ? href : new URL(href, url).href;
        return false; // break
      }
    });

    return {
      homepage_title: title,
      homepage_description: description,
      homepage_keywords: keywords,
      phone,
      email,
      address,
      social_media: socialMedia,
      programs: programs.length > 0 ? programs.slice(0, 5) : null, // Limit to 5 programs
      donation_link: donationLink,
      last_scraped: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Error scraping ${url}:`, error.message);
    return {
      homepage_title: null,
      homepage_description: null,
      homepage_keywords: null,
      phone: null,
      email: null,
      address: null,
      social_media: null,
      programs: null,
      donation_link: null,
      last_scraped: new Date().toISOString(),
    };
  }
}

async function fetchAtlanticCanadaNonprofits() {
  let allOrganizations = [];

  console.log("Searching Atlantic Canada nonprofit directories...");

  // 1. Try the original New Brunswick directory that was working
  console.log("\n1. Searching New Brunswick directory...");
  try {
    const nbUrl =
      "https://www.amcnposolutions.com/directory-of-canadian-not-for-profit-associations/new-brunswick/";
    const nbResp = await axios.get(nbUrl);
    const $nb = cheerio.load(nbResp.data);

    $nb("ul.directory-list li").each((i, el) => {
      const text = $nb(el).text().trim();
      const parts = text.split("–");
      const name = parts[0].trim();
      const branch = parts[1] ? parts[1].trim() : "";

      if (name) {
        allOrganizations.push({
          source: "AMC Directory",
          name: name,
          ein: null,
          city: branch || "New Brunswick",
          state: "NB",
          category: null,
          description: null,
          url: null,
        });
      }
    });

    console.log(
      `Found ${$nb("ul.directory-list li").length} organizations in New Brunswick`,
    );
  } catch (error) {
    console.error("Error fetching New Brunswick directory:", error.message);
  }

  // 2. Try other Atlantic provinces from the same directory
  const provinces = [
    { code: "NS", name: "nova-scotia" },
    { code: "PE", name: "prince-edward-island" },
    { code: "NL", name: "newfoundland-and-labrador" },
  ];

  for (const province of provinces) {
    console.log(`\n2. Searching ${province.code} directory...`);
    try {
      const url = `https://www.amcnposolutions.com/directory-of-canadian-not-for-profit-associations/${province.name}/`;
      const resp = await axios.get(url);
      const $ = cheerio.load(resp.data);

      $("ul.directory-list li").each((i, el) => {
        const text = $(el).text().trim();
        const parts = text.split("–");
        const name = parts[0].trim();
        const branch = parts[1] ? parts[1].trim() : "";

        if (name) {
          allOrganizations.push({
            source: "AMC Directory",
            name: name,
            ein: null,
            city: branch || province.code,
            state: province.code,
            category: null,
            description: null,
            url: null,
          });
        }
      });

      console.log(
        `Found ${$("ul.directory-list li").length} organizations in ${province.code}`,
      );
    } catch (error) {
      console.error(
        `Error fetching ${province.code} directory:`,
        error.message,
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  // 3. Add known Atlantic Canada organizations with their websites
  console.log("\n3. Adding known Atlantic Canada organizations...");

  const knownOrganizations = [
    {
      source: "Known",
      name: "United Way Halifax",
      city: "Halifax",
      state: "NS",
      url: "https://www.unitedwayhalifax.ca/",
    },
    {
      source: "Known",
      name: "IWK Health Centre Foundation",
      city: "Halifax",
      state: "NS",
      url: "https://iwkfoundation.org/",
    },
    {
      source: "Known",
      name: "Feed Nova Scotia",
      city: "Halifax",
      state: "NS",
      url: "https://www.feednovascotia.ca/",
    },
    {
      source: "Known",
      name: "United Way of Greater Moncton",
      city: "Moncton",
      state: "NB",
      url: "https://www.unitedwaymoncton.ca/",
    },
    {
      source: "Known",
      name: "Hospice Greater Saint John",
      city: "Saint John",
      state: "NB",
      url: "https://www.hospicesaintjohn.ca/",
    },
    {
      source: "Known",
      name: "United Way PEI",
      city: "Charlottetown",
      state: "PE",
      url: "https://www.unitedwaypei.com/",
    },
    {
      source: "Known",
      name: "PEI Humane Society",
      city: "Charlottetown",
      state: "PE",
      url: "https://www.peihumanesociety.com/",
    },
    {
      source: "Known",
      name: "Janeway Children's Hospital Foundation",
      city: "St. John's",
      state: "NL",
      url: "https://www.janewayfoundation.nf.ca/",
    },
    {
      source: "Known",
      name: "Community Foundation of Newfoundland and Labrador",
      city: "St. John's",
      state: "NL",
      url: "https://www.cfnl.ca/",
    },
    {
      source: "Known",
      name: "Nova Scotia Nature Trust",
      city: "Halifax",
      state: "NS",
      url: "https://nsnt.ca/",
    },
    {
      source: "Known",
      name: "Heart and Stroke Foundation Nova Scotia",
      city: "Halifax",
      state: "NS",
      url: "https://www.heartandstroke.ca/what-we-do/in-your-community/nova-scotia",
    },
    {
      source: "Known",
      name: "Canadian Cancer Society Nova Scotia",
      city: "Halifax",
      state: "NS",
      url: "https://cancer.ca/en/about-us/offices-and-contacts/nova-scotia",
    },
    {
      source: "Known",
      name: "Big Brothers Big Sisters of Greater Halifax",
      city: "Halifax",
      state: "NS",
      url: "https://www.bigbrothersbigsisters.ca/en/local-agencies/greater-halifax/",
    },
    {
      source: "Known",
      name: "Salvation Army Nova Scotia",
      city: "Halifax",
      state: "NS",
      url: "https://www.salvationarmy.ca/nova-scotia/",
    },
    {
      source: "Known",
      name: "Easter Seals Nova Scotia",
      city: "Halifax",
      state: "NS",
      url: "https://www.easterseals.ns.ca/",
    },
  ];

  allOrganizations.push(
    ...knownOrganizations.map((org) => ({
      ...org,
      ein: null,
      category: null,
      description: null,
    })),
  );

  console.log(`Added ${knownOrganizations.length} known organizations`);

  // Remove duplicates
  const uniqueOrganizations = allOrganizations.filter(
    (org, index, self) =>
      index ===
      self.findIndex((o) => o.name === org.name && o.city === org.city),
  );

  console.log(`\nFound ${uniqueOrganizations.length} unique organizations`);

  // Save initial data
  fs.writeFileSync(
    "atlantic_nonprofits_basic.json",
    JSON.stringify(uniqueOrganizations, null, 2),
  );

  // Now enhance with homepage data for organizations with URLs
  console.log("\nEnhancing data with homepage information...");

  const enhancedOrganizations = [];

  for (let i = 0; i < uniqueOrganizations.length; i++) {
    const org = uniqueOrganizations[i];
    console.log(
      `\nProcessing ${i + 1}/${uniqueOrganizations.length}: ${org.name}`,
    );

    let homepageData = {};

    if (org.url) {
      homepageData = await scrapeHomepageData(org.url);
      await new Promise((resolve) => setTimeout(resolve, 3000)); // Rate limiting
    }

    const enhancedOrg = {
      ...org,
      ...homepageData,
    };

    enhancedOrganizations.push(enhancedOrg);

    // Save progress every 5 organizations
    if ((i + 1) % 5 === 0) {
      console.log(`Saving progress... (${i + 1} completed)`);
      fs.writeFileSync(
        "atlantic_nonprofits_detailed.json",
        JSON.stringify(enhancedOrganizations, null, 2),
      );
    }
  }

  // Final save
  fs.writeFileSync(
    "atlantic_nonprofits_detailed.json",
    JSON.stringify(enhancedOrganizations, null, 2),
  );

  // Create CSV export
  const csvWriter = createObjectCsvWriter({
    path: "atlantic_nonprofits.csv",
    header: [
      { id: "source", title: "Source" },
      { id: "name", title: "Organization Name" },
      { id: "city", title: "City" },
      { id: "state", title: "Province" },
      { id: "category", title: "Category" },
      { id: "description", title: "Description" },
      { id: "url", title: "URL" },
      { id: "phone", title: "Phone" },
      { id: "email", title: "Email" },
      { id: "address", title: "Address" },
      { id: "homepage_title", title: "Homepage Title" },
      { id: "homepage_description", title: "Homepage Description" },
      { id: "donation_link", title: "Donation Link" },
    ],
  });

  // Prepare data for CSV (flatten social media and programs)
  const csvData = enhancedOrganizations.map((org) => ({
    ...org,
    programs: org.programs ? org.programs.join("; ") : "",
    social_media: org.social_media
      ? Object.entries(org.social_media)
          .map(([key, value]) => `${key}: ${value}`)
          .join("; ")
      : "",
  }));

  await csvWriter.writeRecords(csvData);

  console.log(
    `\nCompleted! Enhanced data for ${enhancedOrganizations.length} organizations.`,
  );
  console.log("Files created:");
  console.log("- atlantic_nonprofits_basic.json (basic organization data)");
  console.log(
    "- atlantic_nonprofits_detailed.json (enhanced with homepage data)",
  );
  console.log("- atlantic_nonprofits.csv (CSV export)");

  return enhancedOrganizations;
}

fetchAtlanticCanadaNonprofits().catch(console.error);
