import { malwareSamples } from './data.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[character]);
const byId = id => malwareSamples.find(sample => sample.id === id) || malwareSamples[0];
const uniqueTypes = [...new Set(malwareSamples.map(sample => sample.type))].sort((a, b) => a.localeCompare(b));
const uniqueYears = [...new Set(malwareSamples.map(sample => sample.year))].sort((a, b) => b - a);

function badgeFor(sample) {
  if (sample.isEstimate) return '<span class="figure-tag">ESTIMATE / APPROX.</span>';
  if (sample.isQualitative) return '<span class="figure-tag qualitative">QUALITATIVE</span>';
  return '<span class="figure-tag qualitative">SOURCE FIGURE</span>';
}

function profilePressure(sample) {
  const type = sample.type.toLocaleLowerCase();
  if (type.includes('worm') || type.includes('botnet') || type.includes('ransomware') || type.includes('wiper')) return 7.5;
  if (type.includes('virus')) return 5;
  if (type.includes('trojan') || type.includes('spyware') || type.includes('spy')) return 4.5;
  return 5.5;
}

function fillSelect(select, entries, allLabel) {
  for (const entry of entries) {
    const option = document.createElement('option');
    option.value = String(entry.value ?? entry);
    option.textContent = String(entry.label ?? entry);
    select.append(option);
  }
  if (allLabel) select.insertAdjacentHTML('afterbegin', `<option value="all">${escapeHTML(allLabel)}</option>`);
}

function initializeArchive() {
  const typeFilter = $('#type-filter');
  const yearFilter = $('#year-filter');
  const sandboxThreat = $('#sandbox-threat');
  const defenseThreat = $('#defense-threat');
  fillSelect(typeFilter, uniqueTypes, null);
  fillSelect(yearFilter, uniqueYears, null);
  typeFilter.insertAdjacentHTML('afterbegin', '<option value="all">All types</option>');
  yearFilter.insertAdjacentHTML('afterbegin', '<option value="all">All years</option>');

  for (const sample of malwareSamples) {
    const optionLabel = `${sample.name} (${sample.year})`;
    sandboxThreat.add(new Option(optionLabel, sample.id));
    defenseThreat.add(new Option(optionLabel, sample.id));
  }
  sandboxThreat.value = 'wannacry';
  defenseThreat.value = 'wannacry';

  $('#sample-total').textContent = String(malwareSamples.length);
  $('#type-total').textContent = String(uniqueTypes.length);
  $('#year-span').textContent = String(Math.max(...uniqueYears) - Math.min(...uniqueYears));

  const search = $('#sample-search');
  const sortOrder = $('#sort-order');
  const grid = $('#sample-grid');
  const resultCount = $('#results-count');

  function render() {
    const query = search.value.trim().toLocaleLowerCase();
    const selectedType = typeFilter.value;
    const selectedYear = yearFilter.value;
    const sort = sortOrder.value;
    const visible = malwareSamples.filter(sample => {
      const searchContent = `${sample.name} ${sample.year} ${sample.type} ${sample.infected}`.toLocaleLowerCase();
      return (!query || searchContent.includes(query))
        && (selectedType === 'all' || sample.type === selectedType)
        && (selectedYear === 'all' || String(sample.year) === selectedYear);
    });

    visible.sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      return sort === 'oldest' ? a.year - b.year || a.name.localeCompare(b.name) : b.year - a.year || a.name.localeCompare(b.name);
    });
    resultCount.textContent = `Showing ${visible.length} of ${malwareSamples.length} records`;
    if (!visible.length) {
      grid.innerHTML = '<p class="no-results">No records match those filters. Try a broader search or clear the filters.</p>';
      return;
    }
    grid.innerHTML = visible.map(sample => `
      <button class="sample-card" type="button" data-sample="${escapeHTML(sample.id)}" aria-label="Open ${escapeHTML(sample.name)}, ${sample.year}, ${escapeHTML(sample.type)}">
        <span class="sample-card-top"><span class="sample-year">${sample.year} / ${escapeHTML(sample.type)}</span><span class="type-pill">ARCHIVE</span></span>
        <span class="sample-name">${escapeHTML(sample.name)}</span>
        <span class="sample-card-bottom"><span><span class="figure-label">SOURCE INFECTION FIGURE</span><span class="infection-figure">${escapeHTML(sample.infected)}</span>${badgeFor(sample)}</span><span class="open-record" aria-hidden="true">↗</span></span>
      </button>`).join('');
  }

  search.addEventListener('input', render);
  typeFilter.addEventListener('change', render);
  yearFilter.addEventListener('change', render);
  sortOrder.addEventListener('change', render);
  $('#clear-filters').addEventListener('click', () => {
    search.value = '';
    typeFilter.value = 'all';
    yearFilter.value = 'all';
    sortOrder.value = 'newest';
    render();
  });
  grid.addEventListener('click', event => {
    const button = event.target.closest('[data-sample]');
    if (button) showSample(button.dataset.sample);
  });
  render();
}

function showSample(id) {
  const sample = byId(id);
  const dialog = $('#sample-dialog');
  $('#sample-detail').innerHTML = `
    <span class="detail-kicker">${sample.year} / ${escapeHTML(sample.type)} / HISTORICAL NOTE</span>
    <h2 id="dialog-title">${escapeHTML(sample.name)}</h2>
    <div class="detail-figure"><div><span class="figure-label">HISTORICAL INFECTION FIGURE</span><strong>${escapeHTML(sample.infected)}</strong></div>${badgeFor(sample)}</div>
    <h3>How to read this figure</h3>
    <p>This is a historical reference value, not live intelligence. Units may count machines, organizations, targets, or another measure; different rows are not directly comparable.</p>
    <p class="small-caveat">For educational context only. The figures are not CyberGuard telemetry or current threat intelligence.</p>`;
  if (typeof dialog.showModal === 'function') dialog.showModal();
}

function initializeNavigation() {
  const toggle = $('#menu-toggle');
  const nav = $('#main-nav');
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
  });
  nav.addEventListener('click', event => {
    if (event.target.closest('a')) {
      toggle.setAttribute('aria-expanded', 'false');
      nav.classList.remove('is-open');
    }
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && nav.classList.contains('is-open')) {
      toggle.setAttribute('aria-expanded', 'false');
      nav.classList.remove('is-open');
      toggle.focus();
    }
  });
}

function initializeNumberRain() {
  const canvas = $('#signal-rain');
  const context = canvas.getContext('2d');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let streams = [];
  let frame = 0;
  let width = 0;
  let height = 0;
  let lastFrame = 0;

  function resize() {
    const bounds = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    width = bounds.width;
    height = bounds.height;
    canvas.width = Math.max(1, Math.floor(width * ratio));
    canvas.height = Math.max(1, Math.floor(height * ratio));
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    streams = Array.from({ length: Math.ceil(width / 21) }, () => ({
      y: Math.random() * height,
      direction: Math.random() > 0.48 ? 1 : -1,
      speed: 0.18 + Math.random() * 0.62,
      glyph: Math.random() > 0.4 ? '0' : '1',
      opacity: 0.12 + Math.random() * 0.32
    }));
  }

  function draw(time) {
    if (reducedMotion.matches || document.hidden) {
      frame = 0;
      return;
    }
    if (time - lastFrame > 65) {
      lastFrame = time;
      context.clearRect(0, 0, width, height);
      context.font = '11px monospace';
      streams.forEach((stream, index) => {
        const x = index * 21 + 2;
        context.fillStyle = `rgba(137, 255, 190, ${stream.opacity})`;
        context.fillText(stream.glyph, x, stream.y);
        stream.y += stream.speed * stream.direction;
        if (stream.direction > 0 && stream.y > height + 12) stream.y = -8;
        if (stream.direction < 0 && stream.y < -8) stream.y = height + 12;
        if (Math.random() < 0.016) stream.glyph = stream.glyph === '0' ? '1' : '0';
      });
    }
    frame = window.requestAnimationFrame(draw);
  }

  function syncMotion() {
    if (reducedMotion.matches || document.hidden) {
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
      context.clearRect(0, 0, width, height);
    } else if (!frame) {
      frame = window.requestAnimationFrame(draw);
    }
  }

  resize();
  syncMotion();
  window.addEventListener('resize', resize, { passive: true });
  document.addEventListener('visibilitychange', syncMotion);
  reducedMotion.addEventListener?.('change', syncMotion);
}

function initializeSandbox() {
  const canvas = $('#network-canvas');
  const context = canvas.getContext('2d');
  const networkSize = $('#network-size');
  const patchedSlider = $('#patched-percent');
  const firewall = $('#firewall-toggle');
  const status = $('#simulation-message');
  const networkStatus = $('#network-status');
  const bar = $('#spread-progress');
  const progress = $('.progress-track');
  let nodes = [];
  let history = [];
  let timer = 0;
  let step = 0;
  let radius = 55;
  let dpr = 1;
  let width = 900;
  let height = 360;

  function fitCanvas() {
    const bounds = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 1.6);
    width = Math.max(1, bounds.width);
    height = Math.max(170, bounds.height);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  function createNodes() {
    const total = Number(networkSize.value);
    nodes = Array.from({ length: total }, (_, index) => ({
      x: 14 + Math.random() * Math.max(1, width - 28),
      y: 14 + Math.random() * Math.max(1, height - 28),
      state: 'healthy',
      index
    }));
    history = [];
    step = 0;
    radius = 58 * Math.sqrt(80 / total);
  }

  function draw() {
    context.clearRect(0, 0, width, height);
    const connectionRadius = radius * (width / 900);
    for (let left = 0; left < nodes.length; left += 1) {
      for (let right = left + 1; right < nodes.length; right += 1) {
        const a = nodes[left];
        const b = nodes[right];
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        if (distance < connectionRadius) {
          const bothAffected = a.state === 'infected' && b.state === 'infected';
          context.strokeStyle = bothAffected ? 'rgba(255,127,129,.37)' : 'rgba(93,230,210,.105)';
          context.lineWidth = bothAffected ? 1.1 : .7;
          context.beginPath();
          context.moveTo(a.x, a.y);
          context.lineTo(b.x, b.y);
          context.stroke();
        }
      }
    }
    nodes.forEach(node => {
      const color = node.state === 'infected' ? '#ff7f81' : node.state === 'patched' ? '#c9ff75' : '#5de6d2';
      context.fillStyle = color;
      context.globalAlpha = node.state === 'healthy' ? .8 : 1;
      context.beginPath();
      context.arc(node.x, node.y, node.state === 'infected' ? 4.3 : 3.2, 0, Math.PI * 2);
      context.fill();
      if (node.state === 'infected') {
        context.strokeStyle = 'rgba(255,127,129,.26)';
        context.beginPath();
        context.arc(node.x, node.y, 7.2, 0, Math.PI * 2);
        context.stroke();
      }
    });
    context.globalAlpha = 1;
  }

  function updateReadouts() {
    const healthyCount = nodes.filter(node => node.state === 'healthy').length;
    const infectedCount = nodes.filter(node => node.state === 'infected').length;
    const patchedCount = nodes.filter(node => node.state === 'patched').length;
    const total = Math.max(1, nodes.length);
    $('#healthy-count').textContent = String(healthyCount);
    $('#infected-count').textContent = String(infectedCount);
    $('#patched-count').textContent = String(patchedCount);
    $('#step-count').textContent = String(step);
    const affectedPercent = Math.round(infectedCount / total * 100);
    bar.style.width = `${affectedPercent}%`;
    progress.setAttribute('aria-valuenow', String(affectedPercent));
    networkStatus.textContent = timer ? `RUNNING / ${total} NODES` : `READY / ${total} NODES`;
    draw();
  }

  function reset(message = 'Choose a scenario and run the simulation to see the synthetic network change.') {
    window.clearInterval(timer);
    timer = 0;
    createNodes();
    updateReadouts();
    status.textContent = message;
  }

  function finishSimulation() {
    window.clearInterval(timer);
    timer = 0;
    const total = nodes.length;
    const infectedCount = nodes.filter(node => node.state === 'infected').length;
    const share = Math.round(infectedCount / Math.max(1, total) * 100);
    status.textContent = `Simulation complete: ${infectedCount} of ${total} mock machines affected (${share}%). No real system was contacted.`;
    updateReadouts();
  }

  function tick() {
    const sample = byId($('#sandbox-threat').value);
    const infected = nodes.filter(node => node.state === 'infected');
    const activeRadius = radius * (width / 900);
    const chance = profilePressure(sample) * 0.015 * (firewall.checked ? 0.4 : 1);
    const newlyInfected = [];
    nodes.forEach(target => {
      if (target.state !== 'healthy') return;
      const exposed = infected.some(source => Math.hypot(source.x - target.x, source.y - target.y) < activeRadius);
      if (exposed && Math.random() < chance) newlyInfected.push(target);
    });
    newlyInfected.forEach(node => { node.state = 'infected'; });
    step += 1;
    history.push(nodes.filter(node => node.state === 'infected').length);
    updateReadouts();
    if (step % 8 === 0) status.textContent = `Model step ${step}: ${newlyInfected.length} new mock machine${newlyInfected.length === 1 ? '' : 's'} affected. Firewall is ${firewall.checked ? 'enabled' : 'disabled'}.`;
    const notSusceptible = nodes.every(node => node.state !== 'healthy');
    if (step >= 200 || nodes.every(node => node.state !== 'infected') || notSusceptible) finishSimulation();
  }

  function runSimulation() {
    reset('Starting the local mock scenario…');
    const prePatched = Math.round(nodes.length * Number(patchedSlider.value) / 100);
    const shuffled = [...nodes].sort(() => Math.random() - .5);
    shuffled.slice(0, prePatched).forEach(node => { node.state = 'patched'; });
    const available = nodes.filter(node => node.state === 'healthy');
    if (!available.length) {
      updateReadouts();
      finishSimulation();
      return;
    }
    available[Math.floor(Math.random() * available.length)].state = 'infected';
    updateReadouts();
    status.textContent = `Simulation running in this browser. ${prePatched} mock machines start patched; no external system is contacted.`;
    timer = window.setInterval(tick, 170);
    updateReadouts();
  }

  $('#run-simulation').addEventListener('click', runSimulation);
  $('#reset-simulation').addEventListener('click', () => reset());
  networkSize.addEventListener('input', () => {
    $('#network-size-value').value = networkSize.value;
    $('#network-size-value').textContent = networkSize.value;
    reset(`Synthetic network reset to ${networkSize.value} machines.`);
  });
  patchedSlider.addEventListener('input', () => {
    $('#patched-value').value = patchedSlider.value;
    $('#patched-value').textContent = patchedSlider.value;
  });
  $('#sandbox-threat').addEventListener('change', () => reset(`Scenario profile changed to ${byId($('#sandbox-threat').value).name}.`));
  firewall.addEventListener('change', () => {
    if (timer) status.textContent = `Firewall ${firewall.checked ? 'enabled' : 'disabled'} for the next simulated spread step.`;
  });
  window.addEventListener('resize', fitCanvas, { passive: true });
  fitCanvas();
  reset();
}

function initializeDefenseGame() {
  const grid = $('#machine-grid');
  const feedback = $('#node-feedback');
  const roundResult = $('#round-result');
  const actionHelp = $('#action-help');
  const modeButtons = $$('.action-button');
  const tips = {
    patch: 'Patch: select a healthy node to make it immune to the simulation.',
    isolate: 'Isolate: select a machine to cut it off from neighboring mock nodes.',
    clean: 'Clean: select an affected node; it becomes patched and immune.'
  };
  let machines = [];
  let mode = 'patch';
  let actionsLeft = 3;
  let round = 1;
  let gameOver = false;

  function neighbors(index) {
    const row = Math.floor(index / 10);
    const column = index % 10;
    return [index - 10, index + 10, column > 0 ? index - 1 : -1, column < 9 ? index + 1 : -1]
      .filter(next => next >= 0 && next < 60 && Math.abs(Math.floor(next / 10) - row) + Math.abs(next % 10 - column) === 1);
  }

  function render() {
    const infected = machines.filter(machine => machine.state === 'infected').length;
    $('#round-number').textContent = String(Math.min(round, 12));
    $('#actions-left').textContent = String(actionsLeft);
    $('#defense-infected').textContent = String(infected);
    grid.innerHTML = machines.map(machine => {
      const labelState = machine.isolated ? 'isolated' : machine.state;
      const classState = machine.isolated ? 'isolated' : machine.state;
      return `<button class="machine-node ${classState}" type="button" data-machine="${machine.id}" aria-label="Machine ${String(machine.id + 1).padStart(2, '0')}, ${labelState}" ${gameOver ? 'disabled' : ''}>${String(machine.id + 1).padStart(2, '0')}</button>`;
    }).join('');
    modeButtons.forEach(button => {
      button.classList.toggle('is-selected', button.dataset.mode === mode);
      button.disabled = gameOver;
    });
    $('#end-round').disabled = gameOver;
    $('#end-round').textContent = gameOver ? 'Scenario complete' : 'End round →';
  }

  function startGame(message = 'Round 1 is ready. You have 3 actions.') {
    gameOver = false;
    round = 1;
    actionsLeft = 3;
    machines = Array.from({ length: 60 }, (_, id) => ({ id, state: 'healthy', isolated: false }));
    machines[7].state = 'infected';
    machines[37].state = 'infected';
    feedback.textContent = 'Choose an action, then select a machine.';
    roundResult.textContent = message;
    render();
  }

  function useAction(machineId) {
    if (gameOver) return;
    if (actionsLeft < 1) {
      feedback.textContent = 'No actions left this round. End the round to continue.';
      return;
    }
    const machine = machines[machineId];
    if (!machine) return;
    if (mode === 'patch') {
      if (machine.state !== 'healthy' || machine.isolated) {
        feedback.textContent = 'Patch works on a healthy, connected machine. Choose a healthy node.';
        return;
      }
      machine.state = 'patched';
      feedback.textContent = `Machine ${String(machine.id + 1).padStart(2, '0')} patched. It is immune in this mock scenario.`;
    } else if (mode === 'isolate') {
      if (machine.isolated) {
        feedback.textContent = 'That machine is already isolated.';
        return;
      }
      machine.isolated = true;
      feedback.textContent = `Machine ${String(machine.id + 1).padStart(2, '0')} isolated from neighboring mock nodes.`;
    } else {
      if (machine.state !== 'infected') {
        feedback.textContent = 'Clean works on an affected node. Choose a red machine.';
        return;
      }
      machine.state = 'patched';
      feedback.textContent = `Machine ${String(machine.id + 1).padStart(2, '0')} cleaned and protected.`;
    }
    actionsLeft -= 1;
    render();
  }

  function endRound() {
    if (gameOver) return;
    const infectedNow = machines.filter(machine => machine.state === 'infected' && !machine.isolated);
    const newlyAffected = new Set();
    const pressure = profilePressure(byId($('#defense-threat').value));
    const chance = pressure * 0.025;
    infectedNow.forEach(source => {
      neighbors(source.id).forEach(neighborId => {
        const target = machines[neighborId];
        if (target.state === 'healthy' && !target.isolated && Math.random() < chance) newlyAffected.add(neighborId);
      });
    });
    newlyAffected.forEach(id => { machines[id].state = 'infected'; });
    const currentInfected = machines.filter(machine => machine.state === 'infected').length;
    const roundEnded = round;
    round += 1;
    actionsLeft = 3;
    const note = newlyAffected.size
      ? `The mock scenario affected ${newlyAffected.size} additional machine${newlyAffected.size === 1 ? '' : 's'} in round ${roundEnded}.`
      : `No additional machines were affected in round ${roundEnded}.`;
    feedback.textContent = note;

    if (currentInfected === 0 || round > 12 || currentInfected >= 24) {
      gameOver = true;
      const won = currentInfected < 24;
      const result = currentInfected === 0
        ? `Network contained. All mock machines are clear after round ${roundEnded}.`
        : won
          ? `Network contained: ${currentInfected} of 60 mock machines affected. You met the fewer-than-40% objective.`
          : `Scenario lost: ${currentInfected} of 60 mock machines affected. Start a new scenario to try another response.`;
      roundResult.textContent = result;
      feedback.textContent = `${note} ${won ? 'Exercise complete: the simulated network was contained.' : 'Exercise complete: the 40% threshold was reached.'}`;
    } else {
      roundResult.textContent = `Round ${round} is ready. You have 3 actions.`;
    }
    render();
  }

  modeButtons.forEach(button => button.addEventListener('click', () => {
    mode = button.dataset.mode;
    actionHelp.textContent = tips[mode];
    modeButtons.forEach(candidate => candidate.classList.toggle('is-selected', candidate === button));
  }));
  grid.addEventListener('click', event => {
    const button = event.target.closest('[data-machine]');
    if (button) useAction(Number(button.dataset.machine));
  });
  $('#end-round').addEventListener('click', endRound);
  $('#new-defense-game').addEventListener('click', () => startGame('New mock scenario ready. Two of 60 machines are affected; you have 3 actions.'));
  $('#defense-threat').addEventListener('change', () => startGame(`Scenario profile changed to ${byId($('#defense-threat').value).name}. New round 1 is ready.`));
  startGame();
}

function initializeHealthCheck() {
  const userAgent = navigator.userAgent;
  const browser = /Edg\//.test(userAgent) ? 'Microsoft Edge' : /Firefox\//.test(userAgent) ? 'Mozilla Firefox' : /Chrome\//.test(userAgent) ? 'Chromium-based browser' : /Safari\//.test(userAgent) ? 'Apple Safari' : 'Browser not identified';
  $('#connection-result').textContent = window.isSecureContext ? 'Secure context' : location.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(location.hostname) ? 'Local preview connection' : 'Not confirmed secure';
  $('#browser-result').textContent = browser;
  $('#online-result').textContent = navigator.onLine ? 'Browser reports online' : 'Browser reports offline';

  const recommendations = {
    updates: 'Turn on automatic updates for your operating system and apps.',
    antivirus: 'Check that your device’s built-in security protection is enabled and current.',
    backup: 'Keep a separate backup and test that you can restore important files.',
    mfa: 'Enable multi-factor sign-in on email, finance, and administrator accounts.',
    links: 'Verify unexpected links and attachments through a separate trusted channel.'
  };
  $('#habits-form').addEventListener('submit', event => {
    event.preventDefault();
    const selected = new Set($$('input[name="habit"]:checked', event.currentTarget).map(input => input.value));
    const missing = Object.entries(recommendations).filter(([key]) => !selected.has(key)).map(([, recommendation]) => `<li>${escapeHTML(recommendation)}</li>`);
    const box = $('#recommendations');
    box.hidden = false;
    box.innerHTML = `<strong>${missing.length ? 'A few practical next steps' : 'Strong baseline habits — keep them current'}</strong>${missing.length ? `<ul>${missing.join('')}</ul>` : '<p>You marked every habit in this checklist. Periodically test backups and recovery access.</p>'}<p class="small-caveat">This is a self-assessment, not a risk score or an antivirus diagnosis.</p>`;
  });
}

function initializeAssessment() {
  const form = $('#assessment-form');
  const status = $('#assessment-status');
  form.addEventListener('submit', event => {
    event.preventDefault();
    const domain = $('#assessment-domain').value.trim();
    const scope = $('#assessment-scope').value;
    const authorized = $('#assessment-consent').checked;
    if (!authorized) {
      status.textContent = 'Please confirm ownership or explicit permission. No scan will be started.';
      return;
    }
    status.textContent = `Demo intake reviewed locally for ${domain} / ${scope}. No scan was run, and no information was sent or saved.`;
  });
}

initializeNavigation();
initializeNumberRain();
initializeArchive();
initializeSandbox();
initializeDefenseGame();
initializeHealthCheck();
initializeAssessment();
