import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs";
import { createObjectCsvWriter } from "csv-writer";

// Enhanced function to extract phone numbers
function extractPhone(text) {
  const phonePatterns = [
    // Canadian format: (902) 123-4567, 902-123-4567, 902.123.4567
    /(?:\+1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g,
    // Toll-free: 1-800-123-4567, 800-123-4567
    /(?:1[-.\s]?)?(?:800|888|877|866|855|844|833|822)[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g,
    // International format: +1 902 123 4567
    /\+1\s?([0-9]{3})\s?([0-9]{3})\s?([0-9]{4})/g,
  ];

  for (const pattern of phonePatterns) {
    const matches = text.match(pattern);
    if (matches) return matches[0];
  }
  return null;
}

// Enhanced function to extract email addresses
function extractEmail(text) {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const matches = text.match(emailRegex);
  // Filter out common non-contact emails
  const excludePatterns = [
    "example.com",
    "test.com",
    "domain.com",
    "email.com",
  ];
  if (matches) {
    const validEmails = matches.filter(
      (email) => !excludePatterns.some((pattern) => email.includes(pattern)),
    );
    return validEmails.length > 0 ? validEmails[0] : null;
  }
  return null;
}

// Enhanced function to extract Canadian addresses
function extractAddress(text) {
  // Canadian postal code patterns and address formats
  const addressPatterns = [
    // Full address with postal code: 123 Main St, Halifax, NS B3H 3C3
    /(\d+\s+[A-Za-z\s,]+(?:St|Street|Ave|Avenue|Rd|Road|Dr|Drive|Blvd|Boulevard|Way|Lane|Ln|Ct|Court|Place|Pl)\b[^,]*,\s*[A-Za-z\s]+,\s*[A-Z]{2}\s+[A-Z]\d[A-Z]\s*\d[A-Z]\d)/gi,
    // Address with city and province: 123 Main Street, Halifax NS
    /(\d+\s+[A-Za-z\s]+(?:St|Street|Ave|Avenue|Rd|Road|Dr|Drive|Blvd|Boulevard|Way|Lane|Ln|Ct|Court|Place|Pl)\b[^,]*,\s*[A-Za-z\s]+\s+[A-Z]{2})/gi,
    // PO Box addresses: PO Box 123, Halifax, NS B3H 3C3
    /(P\.?O\.?\s*Box\s*\d+[^,]*,\s*[A-Za-z\s]+,\s*[A-Z]{2}\s+[A-Z]\d[A-Z]\s*\d[A-Z]\d)/gi,
  ];

  for (const pattern of addressPatterns) {
    const matches = text.match(pattern);
    if (matches) return matches[0].trim();
  }
  return null;
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

// Enhanced function to scrape detailed data from organization homepage
async function scrapeHomepageData(url) {
  try {
    console.log(`  → Scraping: ${url}`);
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": "1",
      },
    });

    const $ = cheerio.load(response.data);

    // Extract basic page info
    const title = $("title").text().trim();
    const description =
      $('meta[name="description"]').attr("content") ||
      $('meta[property="og:description"]').attr("content") ||
      "";
    const keywords = $('meta[name="keywords"]').attr("content") || "";

    // Enhanced contact information extraction
    const pageText = $("body").text();
    const pageHtml = $("body").html();

    // Look for contact information in specific sections first
    let phone = null;
    let email = null;
    let address = null;

    // Priority search in contact sections
    const contactSelectors = [
      ".contact",
      ".contact-info",
      ".contact-us",
      ".contact-section",
      ".footer",
      ".footer-contact",
      ".address",
      ".location",
      "#contact",
      "#contact-info",
      "#footer",
    ];

    for (const selector of contactSelectors) {
      const sectionText = $(selector).text();
      if (sectionText) {
        if (!phone) phone = extractPhone(sectionText);
        if (!email) email = extractEmail(sectionText);
        if (!address) address = extractAddress(sectionText);
      }
    }

    // Fallback to full page search if not found in contact sections
    if (!phone) phone = extractPhone(pageText);
    if (!email) email = extractEmail(pageText);
    if (!address) address = extractAddress(pageText);

    // Look for structured data (JSON-LD, microdata)
    let structuredPhone = null;
    let structuredEmail = null;
    let structuredAddress = null;

    $('script[type="application/ld+json"]').each((i, el) => {
      try {
        const data = JSON.parse($(el).html());
        if (data.telephone && !structuredPhone)
          structuredPhone = data.telephone;
        if (data.email && !structuredEmail) structuredEmail = data.email;
        if (data.address && !structuredAddress) {
          if (typeof data.address === "string") {
            structuredAddress = data.address;
          } else if (data.address.streetAddress) {
            structuredAddress = `${data.address.streetAddress}, ${data.address.addressLocality}, ${data.address.addressRegion} ${data.address.postalCode}`;
          }
        }
      } catch (e) {
        // Ignore JSON parsing errors
      }
    });

    // Use structured data if available and not found otherwise
    if (!phone && structuredPhone) phone = structuredPhone;
    if (!email && structuredEmail) email = structuredEmail;
    if (!address && structuredAddress) address = structuredAddress;

    // Extract social media with better patterns
    const socialMedia = extractSocialMedia($);

    // Add YouTube and TikTok
    if (!socialMedia) socialMedia = {};
    $('a[href*="youtube.com"], a[href*="youtu.be"]').each((i, el) => {
      if (!socialMedia.youtube) socialMedia.youtube = $(el).attr("href");
    });
    $('a[href*="tiktok.com"]').each((i, el) => {
      if (!socialMedia.tiktok) socialMedia.tiktok = $(el).attr("href");
    });

    // Enhanced programs/services extraction
    const programs = [];
    const serviceSelectors = [
      "h1, h2, h3, h4",
      ".service",
      ".program",
      ".offering",
      ".what-we-do",
      ".services",
      ".programs",
    ];

    serviceSelectors.forEach((selector) => {
      $(selector).each((i, el) => {
        const text = $(el).text().trim();
        const textLower = text.toLowerCase();
        if (
          (textLower.includes("program") ||
            textLower.includes("service") ||
            textLower.includes("initiative") ||
            textLower.includes("support") ||
            textLower.includes("help")) &&
          text.length > 5 &&
          text.length < 100
        ) {
          if (!programs.includes(text)) {
            programs.push(text);
          }
        }
      });
    });

    // Enhanced donation link search
    let donationLink = null;
    const donationSelectors = [
      'a[href*="donate"]',
      'a[href*="give"]',
      'a[href*="support"]',
      'a[href*="contribution"]',
      ".donate-button",
      ".give-button",
      ".donation-link",
      ".support-link",
    ];

    for (const selector of donationSelectors) {
      $(selector).each((i, el) => {
        const href = $(el).attr("href") || "";
        const text = $(el).text().toLowerCase();
        if (
          (text.includes("donate") ||
            text.includes("give") ||
            text.includes("support") ||
            href.includes("donate") ||
            href.includes("give")) &&
          href
        ) {
          donationLink = href.startsWith("http")
            ? href
            : new URL(href, url).href;
          return false; // break
        }
      });
      if (donationLink) break;
    }

    // Look for hours of operation
    let hours = null;
    const hoursText = pageText.match(
      /(hours|open|closed).*?(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday).*?(?:\d{1,2}:\d{2}|\d{1,2}\s*(?:am|pm))/gi,
    );
    if (hoursText) hours = hoursText[0];

    // Extract mission/about text
    let mission = null;
    const missionSelectors = [
      ".mission",
      ".about",
      ".about-us",
      ".description",
      ".overview",
    ];
    for (const selector of missionSelectors) {
      const missionText = $(selector).first().text().trim();
      if (missionText && missionText.length > 50 && missionText.length < 500) {
        mission = missionText;
        break;
      }
    }

    console.log(
      `  ✓ Scraped: ${title.substring(0, 50)}... | Phone: ${phone ? "✓" : "✗"} | Email: ${email ? "✓" : "✗"} | Address: ${address ? "✓" : "✗"}`,
    );

    return {
      homepage_title: title,
      homepage_description: description,
      homepage_keywords: keywords,
      phone,
      email,
      address,
      social_media:
        Object.keys(socialMedia || {}).length > 0 ? socialMedia : null,
      programs: programs.length > 0 ? programs.slice(0, 8) : null, // Increased limit
      donation_link: donationLink,
      hours_of_operation: hours,
      mission_statement: mission,
      last_scraped: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`  ✗ Error scraping ${url}:`, error.message);
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
      hours_of_operation: null,
      mission_statement: null,
      last_scraped: new Date().toISOString(),
    };
  }
}

async function fetchAtlanticCanadaNonprofits() {
  // Search for Atlantic Canada nonprofits using various approaches

  let allOrganizations = [];

  console.log("Searching CanadaHelps for Atlantic Canada organizations...");

  // Search CanadaHelps by province
  const provinces = [
    { code: "NS", name: "Nova Scotia" },
    { code: "NB", name: "New Brunswick" },
    { code: "PE", name: "Prince Edward Island" },
    { code: "NL", name: "Newfoundland and Labrador" },
  ];

  for (const province of provinces) {
    console.log(`\nSearching ${province.name}...`);

    try {
      // Try different search approaches for each province
      const searchUrls = [
        `https://www.canadahelps.org/en/charities/?location=${province.code.toLowerCase()}`,
        `https://www.canadahelps.org/en/explore/charities/?province=${province.code}`,
        `https://www.canadahelps.org/en/charities/search/?q=${province.name.replace(" ", "+")}`,
      ];

      for (const searchUrl of searchUrls) {
        try {
          console.log(`Trying: ${searchUrl}`);
          const response = await axios.get(searchUrl, {
            timeout: 10000,
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            },
          });

          const $ = cheerio.load(response.data);

          // Look for various charity listing patterns
          const selectors = [
            ".charity-card",
            ".charity-item",
            ".search-result",
            ".charity-listing",
            ".org-card",
            "[data-charity]",
          ];

          let foundOrgs = false;

          selectors.forEach((selector) => {
            $(selector).each((index, element) => {
              const $el = $(element);
              const name =
                $el
                  .find("h2, h3, .name, .title, .charity-name")
                  .first()
                  .text()
                  .trim() || $el.find("a").first().text().trim();

              if (name && name.length > 3) {
                const location = $el
                  .find(".location, .city, .address")
                  .text()
                  .trim();
                const description = $el
                  .find(".description, .summary")
                  .text()
                  .trim();
                const link = $el.find("a").first().attr("href");

                allOrganizations.push({
                  source: "CanadaHelps",
                  name: name,
                  ein: null,
                  city: location.split(",")[0] || "",
                  state: province.code,
                  category: null,
                  description: description,
                  url:
                    link && link.startsWith("/")
                      ? `https://www.canadahelps.org${link}`
                      : link,
                });

                foundOrgs = true;
              }
            });
          });

          if (foundOrgs) {
            console.log(`Found organizations using ${searchUrl}`);
            break; // Move to next province if we found results
          }
        } catch (error) {
          console.log(`Failed to search ${searchUrl}: ${error.message}`);
        }

        // Add delay between requests
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error(`Error searching ${province.name}:`, error.message);
    }
  }

  // Also search Charity Navigator for Canadian organizations
  console.log("\nSearching Charity Navigator for Canadian organizations...");

  try {
    const charityNavResponse = await axios.get(
      "https://www.charitynavigator.org/api/organizations",
      {
        params: {
          country: "Canada",
          state:
            "Nova Scotia,New Brunswick,Prince Edward Island,Newfoundland and Labrador",
        },
        timeout: 10000,
      },
    );

    if (charityNavResponse.data && charityNavResponse.data.organizations) {
      charityNavResponse.data.organizations.forEach((org) => {
        allOrganizations.push({
          source: "Charity Navigator",
          name: org.charityName,
          ein: org.ein,
          city: org.mailingAddress?.city || "",
          state: org.mailingAddress?.stateOrProvince || "",
          category: org.cause?.categoryName || null,
          url:
            org.websiteURL || `https://www.charitynavigator.org/ein/${org.ein}`,
        });
      });
    }
  } catch (error) {
    console.error("Error searching Charity Navigator:", error.message);
  }

  // Add known Atlantic Canada organizations with their websites
  console.log("\nAdding known Atlantic Canada organizations...");

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

  // Now enhance with homepage data
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
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Rate limiting
    }

    const enhancedOrg = {
      ...org,
      ...homepageData,
    };

    enhancedOrganizations.push(enhancedOrg);

    // Save progress every 10 organizations
    if ((i + 1) % 10 === 0) {
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

  // Create CSV export with enhanced fields
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
      { id: "mission_statement", title: "Mission Statement" },
      { id: "programs", title: "Programs/Services" },
      { id: "social_media", title: "Social Media" },
      { id: "donation_link", title: "Donation Link" },
      { id: "hours_of_operation", title: "Hours of Operation" },
      { id: "last_scraped", title: "Last Scraped" },
    ],
  });

  // Prepare data for CSV (flatten complex fields)
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
