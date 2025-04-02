const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const csv = require("csv-parser");
const fsExtra = require("fs-extra");

async function convertCSVRowsToPDF(csvFilePath, outputFolder) {
  console.log("Starting CSV to PDF conversion...");

  // Ensure output folder exists
  fsExtra.ensureDirSync(outputFolder);
  console.log(`Output folder ensured: ${outputFolder}`);

  // Check if CSV file exists
  if (!fs.existsSync(csvFilePath)) {
    console.error(`CSV file not found: ${csvFilePath}`);
    return;
  }
  console.log(`CSV file found: ${csvFilePath}`);

  // Read CSV file and parse data
  const rows = [];
  fs.createReadStream(csvFilePath)
    .pipe(csv())
    .on("data", (row) => {
      rows.push(row);
      console.log("Row added:", row);
    })
    .on("end", async () => {
      console.log(`Total rows read: ${rows.length}`);

      const browser = await puppeteer.launch();
      console.log("Puppeteer launched successfully.");

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];

        // Log the row to verify the column names and values
        console.log(`Row ${i + 1}:`, row);

        // Check if the row has a value in the "Total" column
        const totalValue = row["Total"] ? row["Total"].trim() : null; // Replace "Total" with the exact column name
        if (!totalValue || isNaN(totalValue) || Number(totalValue) === 0) {
          console.log(`Skipping row ${i + 1} as it has no valid Total value.`);
          continue; // Skip this row
        }

        console.log(`Processing row ${i + 1} with Total: ${totalValue}`);

        // Extract the first column value for Customer Name
        const firstColumnKey = Object.keys(row)[0];
        const companyName =
          row[firstColumnKey] && row[firstColumnKey].trim() !== ""
            ? row[firstColumnKey]
            : `Row_${i + 1}_Data`;

        console.log(`Processing row ${i + 1}: ${companyName}`);

        // Extract the purchase date from the row
        const purchaseDateRaw = row["Purchase Date (UTC)"]; // Replace with the actual column name in your CSV
        let formattedPurchaseDate = "UnknownDate";

        if (purchaseDateRaw) {
          try {
            const purchaseDate = new Date(purchaseDateRaw);
            formattedPurchaseDate = purchaseDate.toISOString().split("T")[0]; // Format as YYYY-MM-DD
          } catch (error) {
            console.error(
              `Error parsing purchase date for row ${i + 1}:`,
              error,
            );
          }
        }

        const excludedColumns = [
          "Customer Tag 1",
          "Customer Tag 2",
          "Customer Tag 3",
          "Market Name",
          "Market ID",
          "Product SKU",
          "Description",
          "Retail Package ID",
        ];

        // Generate the PDF file path with the purchase date
        const pdfPath = path.join(
          outputFolder,
          `${companyName}_${formattedPurchaseDate}.pdf`,
        );

        // Generate HTML for the row
        const htmlContent = `
          <html>
          <head><style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { text-align: center; margin-bottom: 20px; }
              table { width: 100%; border-collapse: collapse; }
              td, th { border: 1px solid black; padding: 8px; }
              th { background-color: #f2f2f2; text-align: left; }
              .logo { position: absolute; top: 20px; left: 20px; width: 100px; height: auto; }
          </style></head>
          <body>
              <h2 style="text-align: center;">Receipt from Vendasta Technologies Inc.</h2>
              <h1 style="text-align: center;">${companyName}</h1>
              <table>
                  ${Object.entries(row)
                    .filter(([key]) => !excludedColumns.includes(key)) // Exclude unwanted columns
                    .map(
                      ([key, value]) => `
                      <tr>
                        <th>${key}</th>
                        <td>${value}</td>
                      </tr>`,
                    )
                    .join("")}
              </table>
          </body>
          </html>
        `;

        const page = await browser.newPage();
        try {
          await page.setContent(htmlContent, { waitUntil: "networkidle0" });

          console.log(`Generating PDF for row ${i + 1}: ${pdfPath}`);

          await page.pdf({ path: pdfPath, format: "A4" });
          console.log(`PDF generated: ${pdfPath}`);
        } catch (error) {
          console.error(`Error generating PDF for row ${i + 1}:`, error);
        } finally {
          await page.close();
        }
      }
      console.log("All rows have been exported to PDFs.");
    });
}

// Example Usage
const csvFilePath =
  "C:/Users/adria/OneDrive/Documents/ANSoftwareServices/Vendasta/receipts/QARE-2025-2-report.csv";
const outputFolder =
  "C:/Users/adria/OneDrive/Documents/ANSoftwareServices/Vendasta/receipts/output_pdfs";

convertCSVRowsToPDF(csvFilePath, outputFolder);
