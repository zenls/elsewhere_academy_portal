// Shared pricing and a local, rolling schedule for the booking prototype.
const bookingExtras = {'60': 'Airport pickup', '90': 'Extra night', '45': 'Personal gear'};
const confirmedStatuses = ['confirmed', 'accepted', 'completed'];
const tripLabels = {
  confirmed: 'Confirmed', accepted: 'Confirmed', pending: 'Awaiting host reply',
  completed: 'Completed', declined: 'Declined', cancelled: 'Cancelled'
};

function isoDay(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function bookingWindow() {
  const first = new Date();
  first.setHours(12, 0, 0, 0);
  first.setDate(first.getDate() + 1);
  const last = new Date(first.getFullYear(), first.getMonth() + 12, 0, 12);
  return {first, last};
}

function perGuest(e, length) {
  return Math.round(e.price * length / 7);
}

function quote(e, length, guests, addOns = []) {
  const unit = perGuest(e, length);
  const base = unit * guests;
  const items = addOns.filter(id => Object.hasOwn(bookingExtras, id))
    .map(id => ({name: bookingExtras[id], price: Number(id) * guests}));
  return {unit, base, items, total: base + items.reduce((sum, item) => sum + item.price, 0)};
}

function availableCatalogLength(e, f) {
  const guests = Number(f.guests || 1);
  if (guests > maxBookingGuests(e)) return undefined;
  const lengths = e.days.filter(n => !f.duration || n === Number(f.duration)).sort((a, b) => a - b);
  return f.month || guests > 1
    ? lengths.find(n => firstBookingDay(e, n, guests, f.month))
    : lengths[0];
}

function catalogLength(e, f = filters) {
  return availableCatalogLength(e, f) ?? Math.min(...e.days);
}

function maxBookingGuests(e) {
  const sizes = e.group.match(/\d+/g) || ['1'];
  return Number(sizes.at(-1));
}

function guestLabel(count) {
  return `${count} ${count === 1 ? 'guest' : 'guests'}`;
}

function bookingSlot(e, day, length, guests, window = bookingWindow()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !e.days.includes(length)) return 'unavailable';
  const date = new Date(`${day}T12:00:00`);
  if (date < window.first || date > window.last || isoDay(date) !== day ||
      !e.months.includes(monthOptions[date.getMonth()])) return 'unavailable';
  const weekday = date.getDay();
  if (weekday !== 6 && (length === 2 || weekday !== 2)) return 'unavailable';
  const weekInMonth = Math.floor((date.getDate() - 1) / 7);
  if ((weekInMonth + e.id + (weekday === 2 ? 1 : 0)) % 4 === 0) return 'sold-out';
  const booked = state.requests.filter(r => r.id === e.id && r.date === day && r.duration === length &&
      confirmedStatuses.includes(r.status)).reduce((sum, r) => sum + (r.guests || 1), 0);
  return Number.isInteger(guests) && guests > 0 && guests + booked <= maxBookingGuests(e) ? 'available' : 'sold-out';
}

function firstBookingDay(e, length, guests, month = '') {
  if (guests > maxBookingGuests(e) || (month && !e.months.includes(month))) return null;
  const window = bookingWindow();
  for (const day = new Date(window.first); day <= window.last; day.setDate(day.getDate() + 1)) {
    if ((!month || monthOptions[day.getMonth()] === month) &&
        bookingSlot(e, isoDay(day), length, guests, window) === 'available') return day;
  }
  return null;
}

function initBooking(e) {
  if (activeBookingId === e.id) return;
  activeBookingId = e.id;
  selectedDuration = catalogLength(e);
  selectedDate = '';
  guestCount = Math.min(Number(filters.guests || 1), maxBookingGuests(e));
  extras = [];
  bookingNote = '';
  calendarMonth = null;
}

function dateLabel(day) {
  return new Date(`${day}T12:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
}

function bookingRange(day, length) {
  return day ? `${dateLabel(day)} – ${endDate(day, length)}` : 'Choose a start date';
}

function bookingDateField() {
  return `<div class="booking-field date-field">
    <span class="booking-field-label" id="start-label">Start date</span>
    <button id="date-trigger" type="button" aria-labelledby="start-label date-trigger" aria-controls="calendar-popover" aria-expanded="false">Choose a start date</button>
    <div id="calendar-popover" class="calendar-popover" role="group" aria-label="Available start dates" hidden></div>
  </div>`;
}

function bookingFields(e) {
  return `<div class="booking-fields">
    ${bookingDateField()}
    <div class="booking-field"><label for="detail-duration">Duration</label>
      <select id="detail-duration">${e.days.map(n => `<option value="${n}" ${n === selectedDuration ? 'selected' : ''}>${duration(n)}</option>`).join('')}</select></div>
    <div class="booking-field"><label for="detail-guests">Guests</label>
      <select id="detail-guests">${Array.from({length: maxBookingGuests(e)}, (_, i) => `<option value="${i + 1}" ${i + 1 === guestCount ? 'selected' : ''}>${guestLabel(i + 1)}</option>`).join('')}</select></div>
  </div>`;
}

function detailBookingCard(e) {
  return `<aside class="detail-booking" id="booking-card">
    <div class="booking-head"><strong id="detail-price"></strong> <span>per person</span></div>
    ${bookingFields(e)}
    <div class="booking-breakdown" id="booking-price" aria-live="polite"></div>
    <button class="btn detail-cta" data-detail-book="${e.id}">Book instantly</button>
    <a class="booking-secondary" href="#/request/${e.id}">Request to book instead</a>
    <p class="booking-trust">Instant demo confirmation · no payment</p>
    <p class="cancellation-note">Free cancellation until 30 days before (sample policy)</p>
  </aside>`;
}

function bookingMobileBar(e) {
  return `<div class="mobile-booking-bar">
    <div><strong id="mobile-price"></strong><small id="mobile-price-caption"></small></div>
    <button class="btn" data-detail-book="${e.id}">Book instantly</button>
  </div>`;
}

function checkout(e, mode) {
  initBooking(e);
  const instant = mode === 'instant';
  return `<main class="narrow checkout-page">
    <div class="page-head">
      <a class="back" href="#/experience/${e.id}">← Back to experience</a>
      <div class="eyebrow">Sample checkout</div>
      <h1>${instant ? 'Review and book' : 'Request to book'}</h1>
      <p class="sub">${instant ? 'Choose a start date and confirm your trip instantly.' : 'Choose a start date and let the host review your request.'}</p>
    </div>
    <form class="form-layout" id="checkout-form" data-id="${e.id}" data-mode="${mode}">
      <div>
        <div class="form-card">
          <h2>Your trip</h2>
          ${bookingFields(e)}
          <p class="muted checkout-range" id="checkout-range"></p>
          <p class="checkout-error" id="booking-error" role="status"></p>
          <div class="form-group">
            <label for="booking-note">Note to your host <span class="muted">· optional</span></label>
            <textarea id="booking-note" name="message" rows="2" maxlength="500" placeholder="Anything you’d like your host to know?">${esc(bookingNote)}</textarea>
          </div>
          <p class="muted checkout-note">Booking as Alex Morgan (demo guest).</p>
        </div>
        <details class="form-card" ${extras.length ? 'open' : ''}>
          <summary>Optional extras</summary>
          ${Object.entries(bookingExtras).map(([value, name]) => `<label class="extra-option"><span class="extra-name"><input type="checkbox" data-extra="${value}" ${extras.includes(value) ? 'checked' : ''}><span>${name}</span></span><span class="extra-price">+${euro(Number(value))}<small>per guest</small></span></label>`).join('')}
        </details>
        <details class="form-card">
          <summary>What’s included and cancellation</summary>
          <p>Guided learning, shared materials, accommodation, breakfast and one shared meal each day. Flights and insurance are not included.</p>
          <p>Sample refund policy: 100% at least 30 days before the start, 50% at 15–29 days, and no refund within 14 days.</p>
        </details>
      </div>
      <aside class="panel booking checkout-summary">
        <h2>${esc(e.title)}</h2>
        <p class="muted">${esc(e.place)} · ${esc(e.host)}</p>
        <div class="booking-breakdown" id="booking-price" aria-live="polite"></div>
        <button class="btn" type="submit">${instant ? 'Confirm demo booking' : 'Send sample request'}</button>
        <p class="muted checkout-note">${instant ? 'Confirmed immediately in this browser. No payment is taken.' : 'No real request or payment is sent. You can simulate the host’s reply in Host view.'}</p>
        <button class="text-button" type="button" data-booking-mode="${instant ? 'request' : 'instant'}">${instant ? 'Request to book instead' : 'Book instantly instead'}</button>
      </aside>
    </form>
  </main>`;
}

function bookingError(message = '') {
  const error = $('#booking-error');
  if (error) error.textContent = message;
}

function updateBookingSummary(e) {
  const {unit, base, items, total} = quote(e, selectedDuration, guestCount, extras);
  const setText = (id, value) => {
    const node = document.getElementById(id);
    if (node) node.textContent = value;
  };
  const price = $('#booking-price');
  if (price) price.innerHTML = `<div><span>${euro(unit)} × ${guestLabel(guestCount)}</span><span>${euro(base)}</span></div>
    ${items.map(({name, price}) => `<div><span>${name}</span><span>${euro(price)}</span></div>`).join('')}
    <div><span>Taxes and fees</span><span>Included</span></div>
    <div class="booking-total"><strong>Total</strong><strong>${euro(total)}</strong></div>`;
  setText('detail-price', euro(unit));
  setText('mobile-price', euro(total));
  setText('mobile-price-caption', `Total · ${guestLabel(guestCount)} · ${duration(selectedDuration)}`);
  setText('date-trigger', selectedDate ? dateLabel(selectedDate) : 'Choose a start date');
  setText('checkout-range', selectedDate ? bookingRange(selectedDate, selectedDuration) : '');
}

function completeCheckout(form, data) {
  const e = find(form.dataset.id);
  if (!e || activeBookingId !== e.id || bookingSlot(e, selectedDate, selectedDuration, guestCount) !== 'available') {
    bookingError(selectedDate ? 'That date is no longer available. Choose another start date.' : 'Choose an available start date to continue.');
    $('#date-trigger')?.focus();
    return;
  }
  const {total} = quote(e, selectedDuration, guestCount, extras);
  const instant = form.dataset.mode === 'instant';
  const index = state.requests.push({
    id: e.id, name: 'Alex Morgan', message: String(data.get('message') || '').trim().slice(0, 500),
    date: selectedDate, duration: selectedDuration, guests: guestCount, extras: [...extras], total,
    status: instant ? 'confirmed' : 'pending', mode: form.dataset.mode
  }) - 1;
  save();
  activeBookingId = 0;
  bookingNote = '';
  to(`journey/${index}`);
}

function renderBookingCalendar() {
  const pane = $('#calendar-popover');
  const e = find(activeBookingId);
  if (!pane || !e) return;
  const window = bookingWindow();
  if (!calendarMonth) {
    const date = selectedDate ? new Date(`${selectedDate}T12:00:00`) :
      (firstBookingDay(e, selectedDuration, guestCount, filters.month) || firstBookingDay(e, selectedDuration, guestCount) || window.first);
    calendarMonth = new Date(date.getFullYear(), date.getMonth(), 1, 12);
  }
  const year = calendarMonth.getFullYear(), month = calendarMonth.getMonth();
  const first = (calendarMonth.getDay() + 6) % 7;
  const days = new Date(year, month + 1, 0).getDate();
  const price = euro(perGuest(e, selectedDuration));
  const cells = Array.from({length: days}, (_, i) => {
    const date = new Date(year, month, i + 1, 12), day = isoDay(date);
    const status = bookingSlot(e, day, selectedDuration, guestCount, window);
    const available = status === 'available';
    const label = available ? `${price} per person` : status === 'sold-out' ? 'Booked' : 'No start';
    return `<button type="button" class="${day === selectedDate ? 'selected' : ''} ${status}" data-cal-date="${day}"
      aria-label="${dateLabel(day)}, ${label}" aria-pressed="${day === selectedDate}" ${available ? '' : 'disabled'}>
      <span>${i + 1}</span><small>${available ? price : status === 'sold-out' ? 'Full' : '–'}</small>
    </button>`;
  }).join('');
  pane.innerHTML = `<div class="calendar-head">
    <button type="button" data-cal-nav="-1" aria-label="Previous month" ${new Date(year, month, 0, 12) < window.first ? 'disabled' : ''}>‹</button>
    <strong aria-live="polite">${calendarMonth.toLocaleDateString('en-GB', {month: 'long', year: 'numeric'})}</strong>
    <button type="button" data-cal-nav="1" aria-label="Next month" ${new Date(year, month + 1, 1, 12) > window.last ? 'disabled' : ''}>›</button>
  </div>
  <div class="calendar-grid">${['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(d => `<span aria-hidden="true">${d}</span>`).join('')}${'<span></span>'.repeat(first)}${cells}</div>
  <p class="calendar-legend">Demo schedule · prices per person · Full = booked.</p>`;
}

function tripIndex() {
  const raw = location.hash.split('/')[2] ?? '';
  return /^\d+$/.test(raw) ? Number(raw) : -1;
}

function tripAmount(r, e) {
  return r.total ?? quote(e, r.duration, r.guests || 1, r.extras).total;
}

function tripStatus(r) {
  return tripLabels[r.status] || 'Unknown';
}

function tripList() {
  return `<main class="narrow trips-page">
    <div class="page-head"><div class="eyebrow">Your journey</div><h1>Your trips</h1>
      <p class="sub">All demo bookings and requests saved in this browser.</p></div>
    ${state.requests.length ? `<div class="trip-list">${state.requests.map((r, i) => {
      const e = find(r.id);
      return `<article class="panel trip-list-item">
        <div><span class="status trip-status-${esc(r.status)}">${tripStatus(r)}</span>
          <h2><a href="#/journey/${i}">${esc(e.title)}</a></h2>
          <p class="muted">${esc(e.place)} · ${r.date ? dateLabel(r.date) : 'No date'} · ${duration(r.duration)} · ${guestLabel(r.guests || 1)}</p>
        </div>
        <div class="trip-list-actions"><strong>${euro(tripAmount(r, e))} total</strong>
          <a class="btn outline small" href="#/journey/${i}">View trip</a>
          ${canCancelTrip(r) ? `<button type="button" class="text-button" data-cancel-trip="${i}">${r.status === 'pending' ? 'Withdraw' : 'Cancel'}</button>` : ''}
        </div>
      </article>`;
    }).reverse().join('')}</div><a class="btn outline" href="#/discover">Find another experience</a>` :
      `<div class="panel"><h2>No trips yet</h2><p>Book an experience or send a sample request to see it here.</p>
        <div class="button-row"><a class="btn" href="#/discover">Discover experiences</a>
        <button class="btn outline" data-action="sample-journey">Explore a sample confirmed trip</button></div></div>`}
  </main>`;
}

function canCancelTrip(r) {
  return ['pending', 'confirmed', 'accepted'].includes(r.status);
}

function tripHeader(r, e, index) {
  return `<div class="page-head">
    <a class="back" href="#/journey">← All trips</a>
    <div class="eyebrow">Demo trip · #${index + 1}</div>
    <h1>${esc(e.title)}</h1>
    <p class="sub">${esc(e.place)} · ${bookingRange(r.date, r.duration)} · ${guestLabel(r.guests || 1)}</p>
    <span class="status trip-status-${esc(r.status)}">${tripStatus(r)}</span>
  </div>
  <div class="panel trip-receipt">
    <h2>${r.status === 'pending' ? 'Request summary' : 'Trip summary'}</h2>
    <p><strong>${euro(tripAmount(r, e))} total</strong> · Hosted by ${esc(e.host)}</p>
    <p class="muted">This is a simulation. No payment, refund or host notification was sent.</p>
    ${r.message ? `<p><strong>Note to host:</strong> ${esc(r.message)}</p>` : ''}
    ${canCancelTrip(r) ? `<button type="button" class="btn outline small" data-cancel-trip="${index}">${r.status === 'pending' ? 'Withdraw request' : 'Cancel demo booking'}</button>` : ''}
  </div>`;
}

function cancelTrip(index) {
  const r = state.requests[index];
  if (!r || !canCancelTrip(r)) return;
  const pending = r.status === 'pending';
  const title = pending ? 'Withdraw this request?' : 'Cancel this demo booking?';
  modal(title, '<p>This only updates the trip in this browser. No payment or refund is processed.</p>',
    `<button class="btn small" data-confirm-cancel="${index}">${pending ? 'Withdraw request' : 'Cancel booking'}</button>
     <button class="btn outline small" data-close>Keep trip</button>`);
}
