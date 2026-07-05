/** UK job estimate — pricing engine + optional AI classification (never fake numbers). */
async function fetchAiEstimate(payload) {
  const res = await fetch('/api/estimate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Estimate failed');
  return data;
}

function formatEstimateHtml(data) {
  const lines = [
    `<strong>${escapeHtml(data.category || 'Job estimate')}</strong>`,
    `<strong>Suggested budget:</strong> ${data.suggested_budget_gbp || '—'}`,
    `<strong>Total (labour + materials):</strong> ${data.total_range_gbp || '—'}`,
    `<strong>Labour:</strong> ${data.labour_range_gbp || '—'} · <strong>Materials:</strong> ${data.materials_range_gbp || '—'}`
  ];
  if (data.verdict && data.verdict !== 'not_provided') {
    const labels = { too_low: 'Too low', reasonable: 'Reasonable', generous: 'Generous' };
    lines.push(`<strong>Your budget:</strong> ${labels[data.verdict] || data.verdict}`);
  }
  if (data.summary) lines.push(`<p style="margin:0.5rem 0 0;">${escapeHtml(data.summary)}</p>`);
  lines.push(`<p style="margin:0.5rem 0 0;font-size:0.9em;opacity:0.85;">${escapeHtml(data.disclaimer || 'Guide only — get written quotes from contractors.')}</p>`);
  return lines.join('<br>');
}

function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function initAiEstimateUI(options) {
  const {
    statusEl,
    btnEl,
    resultEl,
    getJobType,
    getDescription,
    getLocation,
    getBudget,
    budgetInput
  } = options;

  let mode = 'engine';
  try {
    const st = await fetch('/api/ai/status').then((r) => r.json());
    mode = st.ai_enhanced ? 'ai+engine' : 'engine';
  } catch {
    mode = 'engine';
  }

  if (statusEl) {
    statusEl.style.display = 'block';
    statusEl.textContent = mode === 'ai+engine'
      ? 'Smart estimate: AI reads your job, UK trade rates calculate the price.'
      : 'UK trade rate calculator — add OPENAI_API_KEY to .env for smarter job reading.';
  }

  if (!btnEl) return;

  btnEl.style.display = 'inline-block';
  btnEl.textContent = 'Get price estimate';

  btnEl.addEventListener('click', async () => {
    const jobType = getJobType();
    const description = getDescription();
    if (!jobType && !description) {
      alert('Choose a work type or add a description first.');
      return;
    }
    btnEl.disabled = true;
    btnEl.textContent = 'Calculating…';
    resultEl.style.display = 'block';
    resultEl.innerHTML = 'Calculating UK price from trade rates…';
    try {
      const data = await fetchAiEstimate({
        job_type: jobType,
        description,
        location: getLocation(),
        budget: getBudget()
      });
      resultEl.innerHTML = formatEstimateHtml(data) +
        (data.suggested_budget_gbp
          ? `<p style="margin-top:0.75rem;"><button type="button" class="btn btn-outline" id="use-ai-budget">Use ${escapeHtml(data.suggested_budget_gbp)} as budget</button></p>`
          : '');
      const useBtn = document.getElementById('use-ai-budget');
      if (useBtn && budgetInput && data.suggested_budget_gbp) {
        useBtn.addEventListener('click', () => {
          budgetInput.value = String(data.suggested_budget_gbp).replace(/^£/, '');
          budgetInput.dispatchEvent(new Event('input', { bubbles: true }));
        });
      }
    } catch (err) {
      resultEl.textContent = err.message;
    }
    btnEl.disabled = false;
    btnEl.textContent = 'Get price estimate';
  });
}
