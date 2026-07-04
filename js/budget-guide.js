/**
 * Realistic UK job budget guides (labour + materials) — no AI, fixed trade rates.
 */
function getBudgetGuide(workType) {
  const t = String(workType || '').toLowerCase();
  if (!t || t === 'other') return null;

  const guides = [
    {
      test: /full bathroom|renew bathroom|bathroom renovation|bathroom fitter|wet room|full property renovation|full house refurbishment/,
      range: '£5,000–£9,000',
      example: '£6,500',
      detail: 'Full bathroom renewal (labour + materials). A new suite (toilet, bath/shower, basin, taps) is often £1,500–£3,000 on its own. Add rip-out, plumbing, tiling, electrics and fitting — total usually £5,000–£9,000 depending on size and spec. A small room (around 2m×2m) is often £5,000–£6,500. London tends to be higher.'
    },
    {
      test: /full kitchen|kitchen fitter|kitchen installation|renew kitchen/,
      range: '£8,000–£18,000',
      example: '£10,000',
      detail: 'Full kitchen supply & fit including units, worktop, appliances allowance, plumbing and electrics.'
    },
    {
      test: /shower installation|bath installation/,
      range: '£900–£2,800',
      example: '£1,500',
      detail: 'Single shower or bath install including tray, screen and basic plumbing — not a full room refit.'
    },
    {
      test: /extension|loft conversion|garage conversion/,
      range: '£25,000–£80,000+',
      example: '£35,000',
      detail: 'Major building work — always get detailed quotes. Price depends on size, spec and structure.'
    },
    {
      test: /oil change|mobile mechanic.*oil/,
      range: '£80–£180',
      example: '£120',
      detail: 'Mobile oil change including oil and filter at your address.'
    },
    {
      test: /full car service|interim|mot test|mot fail/,
      range: '£120–£350',
      example: '£180',
      detail: 'Depends on car size, parts and garage or mobile call-out.'
    },
    {
      test: /brake|tyre|battery|diagnostic|clutch|exhaust|air con regas/,
      range: '£80–£450',
      example: '£200',
      detail: 'Single repair or part replacement — not full engine rebuild.'
    },
    {
      test: /leaking tap|tap replacement|toilet repair|blocked drain|blocked sink|silicone reseal/,
      range: '£80–£280',
      example: '£150',
      detail: 'Small plumbing repair — not a full bathroom refit.'
    },
    {
      test: /boiler service|boiler breakdown|boiler installation|power flush|radiator/,
      range: '£120–£2,800',
      example: '£350',
      detail: 'Service at lower end; new boiler install £1,800–£2,800+.'
    },
    {
      test: /full house rewire|partial rewire|eicr|consumer unit|fuse box/,
      range: '£150–£8,000',
      example: '£3,500',
      detail: 'Socket or light at lower end; full flat/house rewire £3,000–£8,000+.'
    },
    {
      test: /socket|light fitting|smoke alarm|fault finding/,
      range: '£80–£350',
      example: '£120',
      detail: 'Single electrical job or small install.'
    },
    {
      test: /ev home charger|cctv installation/,
      range: '£400–£1,200',
      example: '£750',
      detail: 'Supply and install depending on cable run and unit.'
    },
    {
      test: /upvc window|double glazing|composite front door|conservatory/,
      range: '£400–£6,000',
      example: '£2,500',
      detail: 'Per window/door at lower end; full house or conservatory much more.'
    },
    {
      test: /interior painting|exterior painting|wallpaper|decorat/,
      range: '£250–£2,500',
      example: '£600',
      detail: 'Single room at lower end; whole house £1,500–£4,000+.'
    },
    {
      test: /floor tiling|wall tiling|laminate|vinyl|lvt|carpet fitting/,
      range: '£200–£1,800',
      example: '£800',
      detail: 'Depends on room size and material. Full bathroom tiling often £800–£1,500 labour.'
    },
    {
      test: /roof leak|new roof|flat roof|gutter/,
      range: '£150–£8,000',
      example: '£450',
      detail: 'Minor repair at lower end; full re-roof £5,000–£12,000+.'
    },
    {
      test: /domestic cleaning|deep clean|end of tenancy|oven clean/,
      range: '£60–£350',
      example: '£120',
      detail: 'Depends on property size and depth of clean.'
    },
    {
      test: /landscap|garden|fence|decking|driveway|artificial grass/,
      range: '£200–£5,000',
      example: '£800',
      detail: 'Small job at lower end; full garden redesign much more.'
    },
    {
      test: /handyman|flat pack|tv wall|blind fitting/,
      range: '£50–£250',
      example: '£80',
      detail: 'Per visit or small task — hourly handyman often £35–£50/hr.'
    },
    {
      test: /washing machine|dishwasher|fridge|oven repair|appliance/,
      range: '£70–£200',
      example: '£95',
      detail: 'Diagnosis and repair; new appliance extra if needed.'
    },
    {
      test: /house removal|man with van|waste clearance|rubbish removal/,
      range: '£80–£800',
      example: '£250',
      detail: 'Van load and distance; full house move £400–£1,500+.'
    },
    {
      test: /plastering|bricklayer|damp proof|insulation|demolition|general builder/,
      range: '£300–£5,000',
      example: '£1,200',
      detail: 'Varies widely — describe the job clearly in your listing.'
    }
  ];

  for (const g of guides) {
    if (g.test.test(t)) return g;
  }
  return {
    range: '£150–£600',
    example: '£300',
    detail: 'Varies by trade and job size. Check similar jobs on Find jobs or ask contractors for quotes after posting.'
  };
}

function parseBudgetNumber(text) {
  const n = parseInt(String(text || '').replace(/[^0-9]/g, ''), 10);
  return Number.isFinite(n) ? n : 0;
}

function budgetWarning(workType, budgetText) {
  const guide = getBudgetGuide(workType);
  if (!guide) return null;
  const num = parseBudgetNumber(budgetText);
  if (!num) return null;
  const low = parseInt(guide.range.replace(/[^0-9–-]/g, '').split(/[–-]/)[0], 10);
  if (num < low * 0.6) {
    return `Your budget (£${num.toLocaleString()}) looks too low for this work. Typical range is ${guide.range}. Contractors may not respond unless the budget is realistic.`;
  }
  return null;
}

function renderBudgetGuide(workType) {
  const el = document.getElementById('budget-guide');
  if (!el) return;
  const guide = getBudgetGuide(workType);
  if (!guide || !workType || workType === 'Other') {
    el.style.display = 'none';
    el.innerHTML = '';
    return;
  }
  el.style.display = 'block';
  el.innerHTML = `<strong>Typical UK budget for this work:</strong> ${guide.range} (labour + materials)<br>${guide.detail}${guide.example ? `<br><em>Suggested starting budget: ${guide.example}</em>` : ''}`;
}
