// tokens.js
require("dotenv").config();
const axios = require("axios");

function assertEnv() {
  const id = process.env.FB_APP_ID && process.env.FB_APP_ID.trim();
  const secret = process.env.FB_APP_SECRET && process.env.FB_APP_SECRET.trim();
  if (!id || !secret) {
    throw new Error(
      "FB_APP_ID or FB_APP_SECRET missing. Check .env (no quotes, no spaces) and dotenv loading."
    );
  }
  return { id, secret };
}

async function getAppAccessToken() {
  const { id, secret } = assertEnv();

  try {
    // Preferred: OAuth client_credentials
    const { data } = await axios.get("https://graph.facebook.com/oauth/access_token", {
      params: {
        client_id: id,
        client_secret: secret,
        grant_type: "client_credentials",
      },
      timeout: 10000,
    });
    if (!data?.access_token) {
      throw new Error("No access_token in response");
    }
    return data.access_token;
  } catch (err) {
    // Log full error details
    const detail = err?.response?.data || { message: err.message };
    console.error("getAppAccessToken error:", detail);

    // Fallback: composed app token (valid for oEmbed)
    const fallback = `${id}|${secret}`;
    return fallback;
  }
}

// Optional: quick sanity check helper
async function verifyAppToken(token) {
  try {
    const { data } = await axios.get("https://graph.facebook.com/v19.0/app", {
      params: { access_token: token },
      timeout: 8000,
    });
    return data; // { id, name }
  } catch (err) {
    console.error("verifyAppToken error:", err?.response?.data || err.message);
    return null;
  }
}

module.exports = { getAppAccessToken, verifyAppToken };
