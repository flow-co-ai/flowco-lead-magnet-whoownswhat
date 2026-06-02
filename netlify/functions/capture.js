/* ============================================================
   Netlify Function — capture.js
   Token lives in Netlify env var: MONDAY_API_TOKEN
   ============================================================ */

const MONDAY_API = "https://api.monday.com/v2";
const BOARD_ID   = "8122098964";
const GROUP_ID   = "new_group_mkm87t4c";

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

  const { name, email, company, utm_source } = payload;
  if (!name || !email || !company) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing required fields" }) };
  }

  // Source: UTM param from payload → Referer header → "Direct"
  const referer = event.headers?.referer || event.headers?.Referer || "";
  const source  = utm_source || (referer ? new URL(referer).hostname : "Direct");

  try {
    // DEBUG: log real column IDs — remove after confirming IDs
    const colData = await mondayQuery(token, `{ boards(ids: [${BOARD_ID}]) { columns { id title type } } }`);
    console.log("COLUMNS:", JSON.stringify(colData?.data?.boards?.[0]?.columns));

    // Column IDs below — update after checking logs from the debug line above
    const columnValues = JSON.stringify({
      email__1:    { email: email, text: email },   // Email column
      text__1:     company,                          // Company column
      status:      { label: "New" },                 // Status column
      text0:       source,                           // Source column
      text1:       "Lead Magnet",                    // Medium column
      text2:       "Who Owns What",                  // Campaign column
    });

    const itemName = name;

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
    console.log("Created Monday item:", itemId, "| Lead:", email, "| Source:", source);

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
