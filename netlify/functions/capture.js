/* ============================================================
   Netlify Function — capture.js
   Receives lead data from the gate form, finds the right
   Monday.com board/group, and creates an item.
   Token lives in Netlify env var: MONDAY_API_TOKEN
   ============================================================ */

const MONDAY_API = "https://api.monday.com/v2";
const BOARD_ID   = "8122098964";
const GROUP_ID   = "warm_leads";
const SOURCE     = "Lead Magnet - Who Owns What";

async function mondayQuery(token, query) {
  const res = await fetch(MONDAY_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": token,
      "API-Version": "2024-01",
    },
    body: JSON.stringify({ query }),
  });
  return res.json();
}

exports.handler = async (event) => {
  // CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const token = process.env.MONDAY_API_TOKEN;
  if (!token) {
    console.error("MONDAY_API_TOKEN not set");
    return { statusCode: 500, body: JSON.stringify({ error: "Server misconfiguration" }) };
  }

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const { name, email, company, medium } = payload;
  if (!name || !email || !company) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing required fields" }) };
  }

  try {
    // Build column values — adjust column IDs to match your board
    // These are the most common default column IDs in Monday CRM boards.
    // If items land without some fields, check your board's column IDs
    // at: monday.com → board → column settings → copy column ID.
    const columnValues = JSON.stringify({
      email:       { email: email, text: email },
      text:        company,                          // "Company" text column
      lead_source: { label: SOURCE },                // Status/dropdown column
      medium__1:   { label: medium || "Organic" },   // Medium status column
    });

    const itemName = `${name} — ${company}`;

    const mutation = `
      mutation {
        create_item(
          board_id: ${BOARD_ID},
          group_id: "${GROUP_ID}",
          item_name: "${itemName.replace(/"/g, '\\"')}",
          column_values: ${JSON.stringify(columnValues)}
        ) {
          id
        }
      }
    `;

    const result = await mondayQuery(token, mutation);

    if (result.errors) {
      console.error("Monday mutation errors:", result.errors);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Monday API error", details: result.errors }),
      };
    }

    const itemId = result?.data?.create_item?.id;
    console.log("Created Monday item:", itemId, "| Lead:", email);

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ success: true, itemId }),
    };

  } catch (err) {
    console.error("capture.js error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal error", message: err.message }),
    };
  }
};
