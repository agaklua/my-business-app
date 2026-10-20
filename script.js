const menu = document.querySelector('.menu');
const links = document.querySelector('.navlinks');
if (menu && links) {
  menu.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    menu.setAttribute('aria-expanded', open);
    menu.textContent = open ? '×' : '☰';
  });
  links.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    links.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); menu.textContent = '☰';
  }));
}

const year = document.querySelector('#year');
if (year) year.textContent = new Date().getFullYear();
const bookingForm = document.querySelector('#booking-form');
const checkin = document.querySelector('#checkin');
const checkout = document.querySelector('#checkout');
const config = window.HAGAKON_CONFIG || {};
const supabaseReady = Boolean(config.supabaseUrl && config.supabaseAnonKey && window.supabase);
const supabaseClient = supabaseReady ? window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey) : null;
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

if (checkin && checkout) {
  const localIso = date => new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const today = new Date(); checkin.min = localIso(today);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1); checkout.min = localIso(tomorrow);
  checkin.addEventListener('change', () => {
    const next = new Date(`${checkin.value}T12:00:00`); next.setDate(next.getDate() + 1); checkout.min = localIso(next);
    if (checkout.value && checkout.value <= checkin.value) checkout.value = checkout.min;
  });
}

async function loadPublicContent() {
  if (!supabaseClient) return;
  const roomGrid = document.querySelector('.room-grid');
  const roomSelect = document.querySelector('#room');
  const galleryGrid = document.querySelector('.gallery-grid');
  const [roomResult, galleryResult] = await Promise.all([
    supabaseClient.from('rooms').select('id,name,description,price,capacity,size,sort_order').eq('active', true).order('sort_order'),
    supabaseClient.from('gallery_items').select('id,image_url,alt_text,sort_order').eq('active', true).order('sort_order')
  ]);
  if (!roomResult.error && roomResult.data?.length && roomGrid) {
    roomGrid.innerHTML = roomResult.data.map(room => `<article class="room-card"><div class="room-copy"><div class="room-meta">${room.capacity ? `${escapeHtml(room.capacity)} guests` : 'Room details on enquiry'}${room.size ? ` &nbsp;·&nbsp; ${escapeHtml(room.size)}` : ''}</div><h3>${escapeHtml(room.name)}</h3><p>${escapeHtml(room.description || 'Contact us for room details.')}</p><div class="room-foot"><span class="price"><b>${room.price ? `KES ${Number(room.price).toLocaleString()}` : 'Rates on request'}</b>${room.price ? ' / night' : ''}</span><a href="#enquire">Enquire ↗</a></div></div></article>`).join('');
    if (roomSelect) roomSelect.innerHTML = '<option value="Any room">Any room</option>' + roomResult.data.map(room => `<option value="${escapeHtml(room.name)}">${escapeHtml(room.name)}</option>`).join('');
  }
  if (!galleryResult.error && galleryResult.data?.length && galleryGrid) {
    galleryGrid.innerHTML = galleryResult.data.map(photo => `<img src="${escapeHtml(photo.image_url)}" alt="${escapeHtml(photo.alt_text)}" loading="lazy">`).join('');
  }
}
loadPublicContent();

if (bookingForm) bookingForm.addEventListener('submit', async event => {
  event.preventDefault();
  const data = new FormData(bookingForm);
  if (data.get('website')) return; // Honeypot for basic automated spam.
  const result = document.querySelector('.form-success');
  const setResult = (message, error = false) => { result.textContent = message; result.style.display = 'block'; result.style.background = error ? '#f1dddd' : '#dce8dc'; };
  if (supabaseClient) {
    setResult('Sending your enquiry…');
    const guests = Number(String(data.get('guests')).split(' ')[0]) || 1;
    const { error } = await supabaseClient.from('booking_enquiries').insert({
      name: String(data.get('name')).trim(), email: String(data.get('email')).trim(), phone: String(data.get('phone') || '').trim(),
      checkin: data.get('checkin'), checkout: data.get('checkout'), guests, room_name: data.get('room') || 'Any room', message: String(data.get('message') || '').trim()
    });
    if (error) { setResult('We could not submit this just now. Please contact us by email or WhatsApp.', true); return; }
    bookingForm.reset();
    setResult('Thank you. Your enquiry has been sent to HAGAKON HOTELL. We’ll be in touch soon.');
    return;
  }
  const subject = encodeURIComponent('Stay enquiry — HAGAKON HOTELL');
  const body = encodeURIComponent(`Hello HAGAKON HOTELL,\n\nI’d like to enquire about a stay.\n\nName: ${data.get('name')}\nEmail: ${data.get('email')}\nPhone: ${data.get('phone') || '—'}\nCheck-in: ${data.get('checkin')}\nCheck-out: ${data.get('checkout')}\nGuests: ${data.get('guests')}\nRoom preference: ${data.get('room')}\n\nNote: ${data.get('message') || '—'}\n\nThank you!`);
  setResult('Your enquiry is ready. Your email app will open so you can send it directly to our team.');
  window.location.href = `mailto:lualagak90@gmail.com?subject=${subject}&body=${body}`;
});
