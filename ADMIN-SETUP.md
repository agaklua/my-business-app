# HAGAKON HOTELL admin setup

The admin page is deployed at `/admin.html`. It is intentionally disabled until a Supabase project is connected. The public site can still accept enquiries by opening an email draft.

## Connect the database

1. Create a Supabase project and wait for it to finish provisioning.
2. In **SQL Editor**, run all of `supabase/schema.sql` from this repository. It creates the rooms, gallery, and booking-enquiry tables, access policies, and the photo storage bucket.
3. In **Authentication → Users**, add the hotel owner's account. Keep public sign-ups disabled; only accounts you add should access the dashboard.
4. In **Project Settings → API**, copy the Project URL and the publishable key (or legacy `anon` key). Add them to `public-config.js`:

   ```js
   window.HAGAKON_CONFIG = {
     supabaseUrl: "https://YOUR-PROJECT.supabase.co",
     supabaseAnonKey: "YOUR-PUBLISHABLE-OR-ANON-KEY"
   };
   ```

   These browser values are public by design. Never put a `service_role` or secret key in this file, the website, GitHub, or a message.

5. Commit and push the updated `public-config.js` to GitHub. Vercel will redeploy from the connected repository. Then visit `https://the-amani-house.vercel.app/admin.html` and sign in with the owner account.
6. In the dashboard, add the hotel's real room names and rates, then upload actual hotel photos. Until then, the public site uses illustrative room details and photos.

## Current details to confirm

The contact number was read from the message as `+254 792 405 550` (the final character looked like a zero). The map is set to Mombasa city because no street address or map pin was supplied. Please correct the number or send the precise location before relying on these details for guests.

The booking form asks for consent before sending guest contact details. Once Supabase is connected, enquiries are stored in the private dashboard; before that, submission opens an email draft addressed to the hotel.
