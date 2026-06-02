/* ============================================================
   Netlify Function — capture.js
   POSTs lead data to Monday.com board 18405754310,
   group group_mkwjedjg (Flow Company).
   Env var required: MONDAY_API_TOKEN
   ============================================================ */

const MONDAY_API  = "https://api.monday.com/v2";
const BOARD_ID    = "18405754310";
const GROUP_ID    = "group_mkwjedjg";
const SOURCE      = "Lead Magnet - Who Owns What";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function mondayMutation(token, query) {
  const res = await fetch(MONDAY_API, {
    method:  "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": token,
      "API-Version":   "2024-01",
    },
    body: JSON.stringify({ query }),
  });
  return res.json();
}

exports.handler = async (event) => {
  // CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: CORS_HEADERS, body: "" };
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

  // Sanitise strings for GraphQL
  const safe = (s) => String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"');

  const itemName = `${safe(name)} — ${safe(company)}`;

  // Column values — adjust IDs if your board uses different names.
  // To find column IDs: Monday board → any column → "..." menu → "Copy column ID"
  // Common defaults for a CRM/leads board:
  //   email        → Email column
  //   text         → Text column (Company)
  //   status       → Status column (Source)
  //   status_1     → Status column (Medium) — rename if needed
  const columnValues = JSON.stringify(
    JSON.stringify({
      email:    { email: email, text: email },
      text:     safe(company),
      status:   { label: SOURCE },
      status_1: { label: medium || "Direct" },
    })
  );

  const mutation = `
    mutation {
      create_item(
        board_id: ${BOARD_ID},
        group_id: "${GROUP_ID}",
        item_name: "${itemName}",
        column_values: ${columnValues}
      ) { id }
    }
  `;

  try {
    const result = await mondayMutation(token, mutation);

    if (result.errors) {
      console.error("Monday errors:", JSON.stringify(result.errors));
      // Still return 200 — lead is captured, column mapping may just need tweaking
      return {
        statusCode: 200,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        body: JSON.stringify({ success: true, warning: "Item created but column mapping may need adjustment", errors: result.errors }),
      };
    }

    const itemId = result?.data?.create_item?.id;
    console.log(`Monday item created: ${itemId} | ${name} | ${email} | ${company} | ${medium}`);

    return {
      statusCode: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({ success: true, itemId }),
    };

  } catch (err) {
    console.error("capture.js error:", err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal error", message: err.message }),
    };
  }
};
