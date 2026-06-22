# Send to Rubicon

1. Run the Rubicon app and apply `supabase/import-fields.sql` and `supabase/extension-import.sql`.
2. Open `chrome://extensions`, enable Developer mode, and choose **Load unpacked**.
3. Select this `extension` directory.
4. In Rubicon Settings, generate an extension token. Paste it into the popup.
5. Open a Substack or X post, click the extension, and choose **Send to Rubicon**.

For local development, set the popup's Rubicon app URL to `http://localhost:3000`.
