# Elsewhere Academy — Prototype Changes

The prototype now demonstrates the full guest journey: **find an experience by destination, month, and group size → see the total price → book → view the trip**.

| Area | Before | After |
| --- | --- | --- |
| Home page search | Search was only available in the catalogue. | The home page now has **Where / When / Guests** fields. Results are filtered by demo availability, and the guest count carries over to checkout. |
| Map | Markers were placed roughly by continent. | Markers use approximate city or region coordinates. A single marker opens the experience; a numbered cluster shows nearby options and their prices. |
| Reviews | Only one listing showed reviews, and its count said 12 even though only two were displayed. | Six listings now have clearly labelled sample reviews. The average rating and count are calculated from the reviews shown. |
| Host status | All hosts appeared to be verified. | The catalogue and listing pages make clear that the profiles are fictional. Completion of demo onboarding is shown only in Host view. |
| Booking | Guests could only send a request and wait for the host to respond. | **Book instantly** confirms a demo booking right away. Guests can still choose to send a request for the host to review. |
| Checkout | Guests went through several screens and had to fill out a questionnaire. | Checkout is a single screen with a start date, duration, guest count, and an optional note. On mobile, the booking button goes straight to checkout. |
| Pricing | The catalogue showed a weekly rate, while the listing showed a price for the selected duration. | The catalogue shows the per-person price for a specific duration. Checkout shows the total for all guests, including any selected extras. |
| Calendar | Guests could select almost any future date. | The calendar distinguishes available and fully booked dates. Confirmed bookings take up places; cancellations release them. |
| Your trips | Only the most recent request was shown. | **Your trips** lists all bookings and requests with their statuses. Guests can view trip details, cancel a booking, or withdraw a request. |

Search, map navigation, instant booking, host responses, and cancellation were tested in Chromium on desktop and mobile viewports. This is still a demo: data is stored in the browser, and no payments or notifications are sent.
