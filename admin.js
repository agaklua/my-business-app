(() => {
  const config = window.HAGAKON_CONFIG || {};
  const ready = Boolean(config.supabaseUrl && config.supabaseAnonKey && window.supabase);
  const loginView = document.querySelector('#login-view');
  const forgotView = document.querySelector('#forgot-view');
  const resetView = document.querySelector('#reset-view');
  const dashboardView = document.querySelector('#dashboard-view');
  const setupNote = document.querySelector('#setup-note');
  const loginForm = document.querySelector('#login-form');
  const loginMessage = document.querySelector('#login-message');
  const dashboardMessage = document.querySelector('#dashboard-message');
  let client = null;
  let rooms = [];
  let enquiries = [];
  let photos = [];
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const views = [loginView, forgotView, resetView, dashboardView];
  const showView = view => views.forEach(item => { item.hidden = item !== view; });
  const showLogin = () => showView(loginView);
  const showForgot = () => { document.querySelector('#recovery-email').value = document.querySelector('#admin-email').value; showView(forgotView); };
  const showReset = () => showView(resetView);
  const showDashboard = () => showView(dashboardView);
  const report = (message, target = dashboardMessage) => { target.textContent = message; };

  if (!ready) {
    showLogin(); setupNote.hidden = false;
    loginForm.querySelectorAll('input,button').forEach(item => item.disabled = true);
    return;
  }
  client = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);

  document.querySelector('#show-forgot-password').addEventListener('click', showForgot);
  document.querySelector('#back-to-login').addEventListener('click', showLogin);
  document.querySelector('#forgot-form').addEventListener('submit', async event => {
    event.preventDefault();
    const message = document.querySelector('#forgot-message');
    message.textContent = 'Sending reset link…';
    const {error} = await client.auth.resetPasswordForEmail(document.querySelector('#recovery-email').value.trim(), {
      redirectTo: `${window.location.origin}/admin.html?recovery=1`
    });
    message.textContent = error ? `Could not send the reset link: ${error.message}` : 'If an admin account uses this email, a password reset link is on its way. Check your inbox and spam folder.';
  });
  document.querySelector('#reset-form').addEventListener('submit', async event => {
    event.preventDefault();
    const password = document.querySelector('#new-password').value;
    const confirm = document.querySelector('#confirm-password').value;
    const message = document.querySelector('#reset-message');
    if (password !== confirm) { message.textContent = 'Those passwords do not match.'; return; }
    message.textContent = 'Updating password…';
    const {error} = await client.auth.updateUser({password});
    if (error) { message.textContent = error.message; return; }
    document.querySelector('#reset-form').reset();
    message.textContent = 'Password updated. You can now sign in with your new password.';
    setTimeout(showLogin, 1800);
  });

  async function loadData() {
    report('Loading dashboard…');
    const [bookingResult, roomResult, photoResult] = await Promise.all([
      client.from('booking_enquiries').select('*').order('created_at', {ascending:false}),
      client.from('rooms').select('*').order('sort_order', {ascending:true}),
      client.from('gallery_items').select('*').order('sort_order', {ascending:true})
    ]);
    if (bookingResult.error || roomResult.error || photoResult.error) {
      report(bookingResult.error?.message || roomResult.error?.message || photoResult.error?.message || 'Could not load dashboard data.'); return;
    }
    enquiries = bookingResult.data || []; rooms = roomResult.data || []; photos = photoResult.data || [];
    renderEnquiries(); renderRooms(); renderPhotos(); report('');
  }
  function renderEnquiries() {
    document.querySelector('#enquiry-count').textContent = enquiries.filter(item => item.status === 'new').length;
    const root = document.querySelector('#enquiries-list');
    if (!enquiries.length) { root.innerHTML = '<div class="empty-state">No booking enquiries yet. New guest enquiries will appear here.</div>'; return; }
    root.innerHTML = enquiries.map(item => `<article class="enquiry-card" data-id="${esc(item.id)}"><div class="enquiry-top"><h3>${esc(item.name)}</h3><span class="enquiry-date">${esc(new Date(item.created_at).toLocaleString())}</span></div><div class="enquiry-meta">${esc(item.checkin)} → ${esc(item.checkout)} · ${esc(item.guests)} guest(s) · ${esc(item.room_name || 'Any room')}<br><a href="mailto:${encodeURIComponent(item.email)}">${esc(item.email)}</a>${item.phone ? ` · ${esc(item.phone)}` : ''}</div>${item.message ? `<p class="enquiry-message">${esc(item.message)}</p>` : ''}<div class="enquiry-actions"><label>Status <select data-status><option value="new" ${item.status==='new'?'selected':''}>New</option><option value="contacted" ${item.status==='contacted'?'selected':''}>Contacted</option><option value="closed" ${item.status==='closed'?'selected':''}>Closed</option></select></label><a href="mailto:${encodeURIComponent(item.email)}?subject=${encodeURIComponent('Your HAGAKON HOTELL enquiry')}">Reply by email ↗</a></div></article>`).join('');
  }
  function renderRooms() {
    const root = document.querySelector('#rooms-list');
    root.innerHTML = rooms.length ? rooms.map(room => `<form class="room-edit" data-id="${esc(room.id)}"><input name="name" maxlength="80" required value="${esc(room.name)}" aria-label="Room name"><input name="description" maxlength="500" value="${esc(room.description)}" aria-label="Room description" placeholder="Description"><input name="price" type="number" min="0" step="1" value="${room.price ?? ''}" aria-label="Rate per night in KES" placeholder="Rate (KES)"><label class="room-active"><input name="active" type="checkbox" ${room.active?'checked':''}> Show on site</label><button class="save-room" type="submit">Save</button><button class="delete-room" type="button" data-delete-room>Delete</button></form>`).join('') : '<div class="empty-state">No rooms yet. Add one above to publish it on the website.</div>';
  }
  function renderPhotos() {
    const root = document.querySelector('#gallery-list');
    root.innerHTML = photos.length ? photos.map(photo => `<article class="admin-photo" data-id="${esc(photo.id)}"><img src="${esc(photo.image_url)}" alt="${esc(photo.alt_text)}"><p>${esc(photo.alt_text)}</p><button class="remove-photo" type="button" data-remove-photo>Remove photo</button></article>`).join('') : '<div class="empty-state">No gallery photos yet. Add a photo above to publish it on the website.</div>';
  }
  loginForm.addEventListener('submit', async event => {
    event.preventDefault(); loginMessage.textContent = 'Signing in…';
    const {data,error} = await client.auth.signInWithPassword({email:document.querySelector('#admin-email').value,password:document.querySelector('#admin-password').value});
    if (error) { loginMessage.textContent = error.message; return; }
    document.querySelector('#current-admin-email').textContent = data.user?.email || '';
    showDashboard(); await loadData();
  });
  document.querySelector('#change-email-form').addEventListener('submit', async event => {
    event.preventDefault();
    const email = document.querySelector('#new-email').value.trim();
    const message = document.querySelector('#email-message');
    message.textContent = 'Requesting email change…';
    const {error} = await client.auth.updateUser({email});
    message.textContent = error ? `Could not change email: ${error.message}` : 'Confirmation links have been sent. Follow the instructions in your email to finish changing the sign-in address.';
  });
  document.querySelector('#signout-button').addEventListener('click', async () => { await client.auth.signOut(); showLogin(); });
  document.querySelector('.admin-tabs').addEventListener('click', event => {
    const button = event.target.closest('[data-panel]'); if (!button) return;
    document.querySelectorAll('.admin-tabs button').forEach(item => item.classList.toggle('active', item === button));
    document.querySelectorAll('.admin-panel').forEach(panel => panel.hidden = panel.id !== button.dataset.panel);
  });
  document.querySelector('[data-refresh="enquiries"]').addEventListener('click', loadData);
  document.querySelector('#enquiries-list').addEventListener('change', async event => {
    if (!event.target.matches('[data-status]')) return;
    const id = event.target.closest('[data-id]').dataset.id;
    const {error} = await client.from('booking_enquiries').update({status:event.target.value}).eq('id',id);
    if (error) { report(error.message); return; }
    enquiries = enquiries.map(item => item.id === id ? {...item,status:event.target.value} : item); renderEnquiries();
  });
  document.querySelector('#rooms-list').addEventListener('submit', async event => {
    if (!event.target.matches('.room-edit')) return;
    event.preventDefault(); const form = event.target; const data = new FormData(form);
    const {error} = await client.from('rooms').update({name:data.get('name').trim(),description:data.get('description').trim(),price:data.get('price') ? Number(data.get('price')) : null,active:data.get('active') === 'on'}).eq('id',form.dataset.id);
    if (error) { report(error.message); return; }
    report('Room updated.'); await loadData();
  });
  document.querySelector('#rooms-list').addEventListener('click', async event => {
    if (!event.target.matches('[data-delete-room]')) return;
    const form = event.target.closest('[data-id]'); const {error} = await client.from('rooms').delete().eq('id',form.dataset.id);
    if (error) { report(error.message); return; } await loadData();
  });
  document.querySelector('#new-room-form').addEventListener('submit', async event => {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    const {error} = await client.from('rooms').insert({name:data.get('name').trim(),price:data.get('price') ? Number(data.get('price')) : null,description:'',active:true,sort_order:rooms.length});
    if (error) { report(error.message); return; } event.currentTarget.reset(); report('Room added.'); await loadData();
  });
  document.querySelector('#gallery-upload-form').addEventListener('submit', async event => {
    event.preventDefault(); const form=event.currentTarget, file=document.querySelector('#gallery-file').files[0], message=document.querySelector('#gallery-message');
    if (!file) return;
    if (file.size > 8*1024*1024) { message.textContent='Please choose an image under 8 MB.'; return; }
    message.textContent='Uploading…';
    const objectPath=`${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g,'-')}`;
    const upload=await client.storage.from('hotel-gallery').upload(objectPath,file,{upsert:false,contentType:file.type});
    if (upload.error) { message.textContent=upload.error.message; return; }
    const imageUrl=client.storage.from('hotel-gallery').getPublicUrl(objectPath).data.publicUrl;
    const saved=await client.from('gallery_items').insert({image_url:imageUrl,storage_path:objectPath,alt_text:new FormData(form).get('alt').trim(),sort_order:photos.length});
    if (saved.error) { await client.storage.from('hotel-gallery').remove([objectPath]); message.textContent=saved.error.message; return; }
    message.textContent='Photo uploaded.'; form.reset(); await loadData();
  });
  document.querySelector('#gallery-list').addEventListener('click', async event => {
    if (!event.target.matches('[data-remove-photo]')) return;
    const photo=photos.find(item=>item.id===event.target.closest('[data-id]').dataset.id);
    if (photo?.storage_path) { const removed=await client.storage.from('hotel-gallery').remove([photo.storage_path]); if (removed.error) { report(removed.error.message); return; } }
    const {error}=await client.from('gallery_items').delete().eq('id',photo.id);
    if (error) { report(error.message); return; } await loadData();
  });
  client.auth.onAuthStateChange((event, session) => {
    if (event === 'PASSWORD_RECOVERY') showReset();
    else if (event === 'SIGNED_OUT') showLogin();
  });
  client.auth.getSession().then(({data}) => {
    if (new URLSearchParams(window.location.search).has('recovery')) showReset();
    else if (data.session) { document.querySelector('#current-admin-email').textContent = data.session.user?.email || ''; showDashboard(); loadData(); }
    else showLogin();
  });
})();
