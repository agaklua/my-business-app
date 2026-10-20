# HAGAKON HOTEL admin setup

The admin page is deployed at `/admin`. The site is connected to its Supabase project, and the database tables, access policies, and photo storage bucket have been installed. The hotel owner can manage their password from **Forgot password?** on the sign-in screen, and change their sign-in email from the **Account** dashboard tab. Supabase sends confirmation links for these changes.

## Finish admin access

1. In Supabase **Authentication → Users**, add the hotel owner's account. Keep public sign-ups disabled; only accounts you add should access the dashboard.
2. Visit [the HAGAKON HOTEL admin page](https://the-amani-house.vercel.app/admin) and sign in with that account. Use **Forgot password?** if you need to set or reset its password.
3. In the dashboard, add the hotel's real room names and rates, then upload actual hotel photos. Until then, the public site uses illustrative room details and photos.

The database and site connection are already set up. The public browser key is safe to expose; never put a `service_role` or secret key in the site, GitHub, or a message. The booking form now saves enquiries in Supabase after the guest agrees to the consent notice.

## Current details to confirm

The contact number was read from the message as `+254 792 405 550` (the final character looked like a zero). The map is set to Mombasa city because no street address or map pin was supplied. Please correct the number or send the precise location before relying on these details for guests.

The booking form asks for consent before sending guest contact details. Once Supabase is connected, enquiries are stored in the private dashboard; before that, submission opens an email draft addressed to the hotel.
