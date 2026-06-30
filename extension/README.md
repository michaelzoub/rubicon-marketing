# Rubicon (browser extension)

1. Run the Rubicon app and apply `supabase/import-fields.sql` and `supabase/extension-import.sql`.
2. Open `chrome://extensions`, enable Developer mode, and choose **Load unpacked**.
3. Select this `extension` directory.
4. Choose **Open Rubicon settings** in the popup. Rubicon Settings opens at
   `https://www.rubiconpay.xyz/dashboard/settings`; generate a token and paste
   it into the popup, then **Save & connect**.
5. Open a Substack post (including a custom-domain publication such as a16z) or an X post, click the extension, and choose **Send to Rubicon**.

For local development, set the popup's Rubicon app URL to `http://localhost:3000`.
