import axios from "axios";
import * as cheerio from "cheerio";

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

// Enhanced function to extract social media links
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

  $('a[href*="youtube.com"], a[href*="youtu.be"]').each((i, el) => {
    if (!social.youtube) social.youtube = $(el).attr("href");
  });

  return Object.keys(social).length > 0 ? social : null;
}

async function testEnhancedScraping() {
  const testOrgs = [
    {
      name: "United Way Halifax",
      url: "https://www.unitedwayhalifax.ca/",
    },
    {
      name: "Feed Nova Scotia",
      url: "https://www.feednovascotia.ca/",
    },
    {
      name: "IWK Health Centre Foundation",
      url: "https://iwkfoundation.org/",
    },
  ];

  console.log("🧪 Testing Enhanced Homepage Scraping\n");

  for (const org of testOrgs) {
    console.log(`\n📋 Testing: ${org.name}`);
    console.log(`🔗 URL: ${org.url}`);

    try {
      const response = await axios.get(org.url, {
        timeout: 15000,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      });

      const $ = cheerio.load(response.data);

      // Extract basic page info
      const title = $("title").text().trim();
      const description =
        $('meta[name="description"]').attr("content") ||
        $('meta[property="og:description"]').attr("content") ||
        "";

      // Enhanced contact information extraction
      const pageText = $("body").text();

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

      // Extract social media
      const socialMedia = extractSocialMedia($);

      // Look for donation links
      let donationLink = null;
      const donationSelectors = [
        'a[href*="donate"]',
        'a[href*="give"]',
        'a[href*="support"]',
        ".donate-button",
        ".give-button",
        ".donation-link",
      ];

      for (const selector of donationSelectors) {
        $(selector).each((i, el) => {
          const href = $(el).attr("href") || "";
          const text = $(el).text().toLowerCase();
          if (
            (text.includes("donate") ||
              text.includes("give") ||
              href.includes("donate")) &&
            href
          ) {
            donationLink = href.startsWith("http")
              ? href
              : new URL(href, org.url).href;
            return false; // break
          }
        });
        if (donationLink) break;
      }

      console.log(`✅ Title: ${title.substring(0, 60)}...`);
      console.log(`📝 Description: ${description.substring(0, 80)}...`);
      console.log(`📞 Phone: ${phone || "Not found"}`);
      console.log(`✉️  Email: ${email || "Not found"}`);
      console.log(`🏠 Address: ${address || "Not found"}`);
      console.log(`💰 Donation Link: ${donationLink || "Not found"}`);
      console.log(
        `🌐 Social Media: ${socialMedia ? Object.keys(socialMedia).join(", ") : "Not found"}`,
      );
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }

    // Add delay between requests
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  console.log("\n🎉 Test Complete!");
}

testEnhancedScraping().catch(console.error);
