require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const RAW_FULL_NAME = process.env.FULL_NAME || "";
const RAW_DOB = process.env.DOB || "";
const EMAIL = (process.env.EMAIL || "").trim();
const ROLL_NUMBER = (process.env.ROLL_NUMBER || "").trim();

const FULL_NAME = RAW_FULL_NAME.trim().toLowerCase().replace(/\s+/g, "_");
const DOB_OK = /^\d{8}$/.test(RAW_DOB);

if (!FULL_NAME) {
  console.error("FATAL: FULL_NAME is missing in .env (expected non-empty).");
  process.exit(1);
}
if (!DOB_OK) {
  console.error("FATAL: DOB is invalid or missing in .env. Expected ddmmyyyy (8 digits).");
  process.exit(1);
}
if (!EMAIL) {
  console.warn("Warning: EMAIL not set in .env (response will include empty email).");
}
if (!ROLL_NUMBER) {
  console.warn("Warning: ROLL_NUMBER not set in .env (response will include empty roll_number).");
}

const USER_ID = `${FULL_NAME}_${RAW_DOB}`;

function isIntegerString(s) {
  return /^-?\d+$/.test(s);
}
function isAlphabetString(s) {
  return /^[a-zA-Z]+$/.test(s);
}
function alternateCaps(str) {
  let result = "";
  let upper = true;
  for (const ch of str) {
    result += upper ? ch.toUpperCase() : ch.toLowerCase();
    upper = !upper;
  }
  return result;
}

app.post("/bfhl", (req, res) => {
  try {
    const rawData = req.body && req.body.data;

    if (!Array.isArray(rawData)) {
      return res.status(400).json({
        is_success: false,
        message: "Invalid input. 'data' must be an array.",
      });
    }

    const inputArray = rawData.map((it) => {
      if (it === null || it === undefined) return "";
      if (typeof it === "object") {
        try {
          return JSON.stringify(it);
        } catch {
          return String(it);
        }
      }
      return String(it).trim();
    });

    const oddNumbers = [];
    const evenNumbers = [];
    const alphabets = [];
    const specialChars = [];
    let sum = 0;

    for (const item of inputArray) {
      if (isIntegerString(item)) {
        const num = parseInt(item, 10);
        if (num % 2 === 0) evenNumbers.push(item);
        else oddNumbers.push(item);
        sum += num;
      } else if (isAlphabetString(item)) {
        alphabets.push(item.toUpperCase());
      } else {
        specialChars.push(item);
      }
    }

    const concatRaw = alphabets.join("").split("").reverse().join("");
    const concat_string = alternateCaps(concatRaw);

    return res.status(200).json({
      is_success: true,
      user_id: USER_ID,
      email: EMAIL,
      roll_number: ROLL_NUMBER,
      odd_numbers: oddNumbers,
      even_numbers: evenNumbers,
      alphabets,
      special_characters: specialChars,
      sum: String(sum),
      concat_string,
    });
  } catch (err) {
    console.error("Unhandled error in /bfhl:", err);
    return res.status(500).json({
      is_success: false,
      message: "Server error",
      error: String(err && err.message ? err.message : err),
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`User id: ${USER_ID}`);
});
