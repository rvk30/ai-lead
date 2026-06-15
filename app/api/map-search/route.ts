// import { NextRequest, NextResponse } from "next/server";
// import pool from "@/lib/db";
// import {
//   normalizeCompanyName,
// } from "@/lib/adapterRegistry";

// const { scrapeGoogleMaps } = require("../scripts/googleMapsScraper");

// export async function POST(req: NextRequest) {
//   try {
//     const { location, category } = await req.json();

//     if (!location || !category) {
//       return NextResponse.json(
//         { success: false, message: "Location and category are required" },
//         { status: 400 }
//       );
//     }

//     console.log(`Searching ${category} in ${location}`);

//     const leads = await scrapeGoogleMaps(location, category);

//     let inserted = 0;
//     let skipped = 0;

//     for (const lead of leads) {
//       try {
//         const transformed = {
//           company_name: lead.company_name?.trim() || "",
//           mobile_number: lead.mobile_number?.trim() || "",
//           email: "",
//           website_url: lead.website_url?.trim() || "",
//           address: lead.address?.trim() || "",
//           business_category: lead.business_category || category,
//           search_location: location,
//           search_keyword: category,
//         };

//         if (!transformed.company_name) {
//           skipped++;
//           continue;
//         }

//         const normalizedName = normalizeCompanyName(transformed.company_name);

//         // Duplicate Check
//         const duplicate = await pool.query(
//           `SELECT raw_id FROM lead_intelligence.raw_records
//            WHERE raw_payload->>'company_name' = $1
//            LIMIT 1`,
//           [normalizedName]
//         );

//         if (duplicate.rows.length > 0) {
//           skipped++;
//           continue;
//         }

//         // SIRF RAW RECORD — baki sab DB handle karega
//         await pool.query(
//           `INSERT INTO lead_intelligence.raw_records
//            (source_record_id, source_url, raw_payload)
//            VALUES ($1, $2, $3)`,
//           [
//             `google_maps_${Date.now()}_${transformed.company_name}`,
//             transformed.website_url || null,
//             JSON.stringify(transformed),
//           ]
//         );

//         inserted++;
//       } catch (dbError) {
//         console.error("DB INSERT ERROR:", lead.company_name, dbError);
//       }
//     }

//     return NextResponse.json({
//       success: true,
//       totalScraped: leads.length,
//       totalInserted: inserted,
//       totalSkipped: skipped,
//       data: leads,
//     });
//   } catch (error: any) {
//     console.error("MAP SEARCH ERROR:", error);
//     return NextResponse.json(
//       { success: false, message: error.message || "Internal Server Error" },
//       { status: 500 }
//     );
//   }
// }

import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import {
  normalizeCompanyName,
} from "@/lib/adapterRegistry";
const { scrapeGoogleMaps } = require("../scripts/googleMapsScraper");

export async function POST(req: NextRequest) {
  try {
    const { location, category } = await req.json();
    if (!location || !category) {
      return NextResponse.json(
        { success: false, message: "Location and category are required" },
        { status: 400 }
      );
    }
    console.log(`Searching ${category} in ${location}`);
    const leads = await scrapeGoogleMaps(location, category);
    let inserted = 0;
    let skipped = 0;
    for (const lead of leads) {
      try {
        const transformed = {
          company_name: lead.company_name?.trim() || "",
          mobile_number: lead.mobile_number?.trim() || "",
          email: "",
          website_url: lead.website_url?.trim() || "",
          address: lead.address?.trim() || "",
          business_category: lead.business_category || category,
          search_location: location,
          search_keyword: category,
          source_file: `google_maps_${category}_${location}`,
        };
        if (!transformed.company_name) {
          skipped++;
          continue;
        }
        const normalizedName = normalizeCompanyName(transformed.company_name);
        const duplicate = await pool.query(
          `SELECT raw_id FROM lead_intelligence.raw_records
           WHERE raw_payload->>'company_name' = $1
           LIMIT 1`,
          [normalizedName]
        );
        if (duplicate.rows.length > 0) {
          skipped++;
          continue;
        }
        await pool.query(
          `INSERT INTO lead_intelligence.raw_records
           (source_record_id, source_url, raw_payload)
           VALUES ($1, $2, $3)`,
          [
            `google_maps_${Date.now()}_${transformed.company_name}`,
            transformed.website_url || null,
            JSON.stringify(transformed),
          ]
        );
        inserted++;
      } catch (dbError) {
        console.error("DB INSERT ERROR:", lead.company_name, dbError);
      }
    }
    return NextResponse.json({
      success: true,
      totalScraped: leads.length,
      totalInserted: inserted,
      totalSkipped: skipped,
      data: leads,
    });
  } catch (error: any) {
    console.error("MAP SEARCH ERROR:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}