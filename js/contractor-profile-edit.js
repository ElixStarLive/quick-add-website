/** Contractor public profile editor */
document.addEventListener('DOMContentLoaded', async () => {
  const authRequired = document.getElementById('profile-auth-required');
  const form = document.getElementById('profile-form');
  const statusBox = document.getElementById('profile-status');
  const viewLink = document.getElementById('pf-view');
  const saveBtn = document.getElementById('pf-save');

  const fields = {
    name: document.getElementById('pf-name'),
    company_name: document.getElementById('pf-company'),
    trade: document.getElementById('pf-trade'),
    city: document.getElementById('pf-city'),
    website: document.getElementById('pf-website'),
    bio: document.getElementById('pf-bio'),
    profile_public: document.getElementById('pf-public')
  };

  function showStatus(message, ok) {
    statusBox.style.display = 'block';
    statusBox.textContent = message;
    statusBox.style.color = ok ? '#16a34a' : '#dc2626';
  }

  function fillForm(c) {
    fields.name.value = c.name || '';
    fields.company_name.value = c.company_name || '';
    fields.trade.value = c.trade || '';
    fields.city.value = c.city || '';
    fields.website.value = c.website || '';
    fields.bio.value = c.bio || '';
    fields.profile_public.checked = !!c.profile_public;
    updateViewLink(c);
  }

  function updateViewLink(c) {
    if (c.profile_public && c.profile_slug) {
      viewLink.href = '/contractor/' + c.profile_slug;
      viewLink.style.display = 'inline-block';
    } else {
      viewLink.style.display = 'none';
    }
  }

  const contractor = await fetchContractorMe();
  if (!contractor) {
    authRequired.style.display = 'block';
    return;
  }
  form.style.display = 'block';
  fillForm(contractor);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving…';
    try {
      const payload = {
        name: fields.name.value,
        company_name: fields.company_name.value,
        trade: fields.trade.value,
        city: fields.city.value,
        website: fields.website.value,
        bio: fields.bio.value,
        profile_public: fields.profile_public.checked
      };
      const res = await contractorFetch('/api/contractors/profile', { method: 'PUT', body: payload });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not save profile');
      if (data.contractor) updateViewLink(data.contractor);
      showStatus(data.contractor && data.contractor.profile_public
        ? 'Profile saved and published.'
        : 'Profile saved. It is currently hidden from the directory.', true);
    } catch (err) {
      showStatus(err.message, false);
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save profile';
    }
  });
});
