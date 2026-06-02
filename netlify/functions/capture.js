/* ============================================================
   Netlify Function — capture.js
   Token lives in Netlify env var: MONDAY_API_TOKEN
   ============================================================ */

const MONDAY_API = "https://api.monday.com/v2";
const BOARD_ID   = "8122098964";
const GROUP_ID   = "new_group_mkm87t4c";

// Maps incoming source values → valid Monday Source labels
const SOURCE_MAP = {
  instagram: "ig", ig: "ig",
  facebook: "fb", fb: "fb", facebook_mobile_feed: "Facebook_Mobile_Feed",
  meta: "meta",
  google: "google",
  youtube: "youtube",
  tiktok: "tiktok",
  referral: "referral",
  personal: "personal",
  apollo: "apollo",
  website: "website",
  guidebook: "Guidebook",
  cold_email: "cold_email",
  cold_call: "Cold Call",
  unknown: "unknown",
};

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

  const { name, email, company, source: srcField, utm_source } = payload;
  if (!name || !email || !company) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing required fields" }) };
  }

  // Source: normalize to a valid Monday label, fallback to "unknown"
  const rawSource = (srcField || utm_source || "").toLowerCase().replace(/\s+/g, "_");
  const source = SOURCE_MAP[rawSource] || "unknown";

  try {
    const columnValues = JSON.stringify({
      lead_company:       company,
      lead_email:         { email: email, text: email },
      lead_status:        { label: "New" },
      status_1_mkm8938t:  { label: source },
      color_mksapa2t:     { label: "lead_magnet" },
      text_mksaxzyk:      "Who Owns What",
    });

    const mutation = `
      mutation {
        create_item(
          board_id: ${BOARD_ID},
          group_id: "${GROUP_ID}",
          item_name: "${name.replace(/"/g, '\\"')}",
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
