"use strict";

require('dotenv').config();

if(!process.env.MAYTAG_ACCOUNT_NAME) {
    console.error("Missing environment variable `MAYTAG_ACCOUNT_NAME`.");
    console.error("This is the email address used to setup your account.");
    console.error("Make sure this variable is configured in your `.env` file.");
    console.error("Have you renamed the `.env-sample` file to `.env`?");

    process.exit(1);
}

if(!process.env.MAYTAG_PASSWORD) {
    console.error("Missing environment variable `MAYTAG_PASSWORD`.");
    console.error("This is the email address used to setup your account.");
    console.error("Make sure this variable is configured in your `.env` file.");
    console.error("Have you renamed the `.env-sample` file to `.env`?");

    process.exit(1);
}