# EstateX — Knowledge Base

This document is the evergreen knowledge for the EstateX voice assistant. Upload it to the
ElevenLabs agent's Knowledge Base. (Live listings and prices are NOT here — those come from the
`search_listings` tool, because they change. Keep this file to things that rarely change.)

## About EstateX
EstateX is a real estate platform for browsing, buying, and renting curated properties across
Europe's major cities. Visitors can search listings, view photos and details, send inquiries to
the listing agent, and save favorites. All prices are in Euros (EUR, €).

## Browsing listings
- Anyone can browse listings without an account.
- Listings can be filtered by **category** (Buy or Rent), **type** (House, Apartment, Villa,
  Townhouse, Loft, Cabin), and **city**.
- Each listing shows price, bedrooms, bathrooms, area in square feet, city/location, photos, and a
  description, plus the listing agent's name and phone.
- To see live listings and prices, the assistant uses the listings search tool — it should call
  that tool whenever a visitor asks what's available, prices, or anything about specific properties.

## Buy vs Rent
- **Buy**: properties listed for sale. The price shown is the sale price in euros (€).
- **Rent**: properties available to rent. The price shown is the monthly rent in euros (€).
- A visitor chooses Buy or Rent using the category filter, or just tells the assistant which they want.

## How buying works on EstateX (important)
EstateX is a discovery and lead platform — you do **not** purchase, pay, or complete a
transaction on the website. "Buying" means connecting with the listing agent: you send a **Buy**
inquiry (or call the agent directly) and the agent contacts you to arrange the sale offline. There
is no online checkout, payment, or "buy now" button anywhere on the site.

## How to buy a property
1. Find a property you like (browse or ask the assistant).
2. Open the property's detail page.
3. Send an **inquiry** of type **Buy** to the listing agent using the inquiry form (you provide your
   phone number and an optional message). A signed-in visitor can also ask the voice assistant to
   send the inquiry for them ("I want to buy this", "send a buy inquiry") — it will confirm Buy,
   Rent, or Viewing and ask for a phone number before sending.
4. The agent receives your inquiry and contacts you to proceed.
Note: sending an inquiry requires being signed in with a free account.
Alternatively, you can contact the listing agent directly using the **Call Agent** button on the
property page (it shows the agent's phone number). The sale itself is always arranged offline
between you and the agent — never paid through EstateX.

## How to rent a property
Same as buying, but choose inquiry type **Rent**. The listing agent then contacts you about
availability, rent terms, and next steps.

## How to book a viewing
On a property's detail page, send an inquiry of type **Viewing** to request an in-person tour. The
agent coordinates a time with you.

## Pricing
- All prices are displayed in euros (€) and spoken as "euros".
- For a sale (Buy), the number is the total purchase price. For Rent, it's the monthly rental price.
- There are no platform fees shown to buyers for browsing or inquiring. Any commissions or charges
  are arranged directly between the buyer/renter and the listing agent.

## Saving favorites
Signed-in users can save (favorite) properties with the heart icon and find them later under
"Saved" in their dashboard. The voice assistant can also save, remove, or list saved properties by
voice for a signed-in visitor — just ask ("save this one", "what have I saved?", "remove it from my
favorites"). If the visitor isn't signed in, the assistant will ask them to sign up (free) first.

## Accounts
- **Sign up** is free: provide your full name, email, and a password (minimum 6 characters).
- **Sign in** with your email and password.
- Forgot your password? Use the "Forgot password" link to get a reset email.
- You can browse without an account, but you need one to send inquiries or save properties.

## Listing your own property (for agents/owners)
1. Sign in and open your **Dashboard**.
2. Go to **Add Property**, fill in the details (title, description, price, type, category, bedrooms,
   bathrooms, area, city, location), and upload photos.
3. Your listing goes live and appears in search results.
4. Manage your listings, see buyer inquiries, and update their status from the dashboard.

## Cities
EstateX features properties across major European cities including Paris, Amsterdam, Lisbon, Berlin,
London, Barcelona, Rome, and more. Ask the assistant to search a specific city to see current
availability.

## What the assistant should do
- For "what's available / prices / specific properties" → call the listings search tool and
  summarize the results, offering the property links.
- For "how do I buy/rent/save/sign up" → answer from this knowledge base.
- To proceed with a property, guide the visitor to sign up (free) and send an inquiry on the
  property's page, or to provide contact details so an agent can follow up.
- For signed-in visitors, the assistant can act on their behalf: save/remove/list favorites and
  send a Buy/Rent/Viewing inquiry. If a visitor isn't signed in when they ask for one of these,
  invite them to sign up (free) first. These actions are available while browsing the public pages,
  not inside the dashboard.
- Always be concise, friendly, and specific. Prices are in euros (€).
