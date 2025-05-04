// score.js
// Full logic script for WDV scorecard apps (300, 360, etc.)
// Handles tabs, UI, score calculations, localStorage, and session management

(function () {
  const dayAbbr = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthAbbr = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  let scores = [];
  let archerNames = [];
  let currentTab = 0;
  const tabColors = ['#007BFF', '#FF5733', '#28A745', '#FFC300'];

  const TOTAL_ROUNDS = initConfig.round === '360' ? 12 : 10;
  const TOTAL_ARCHERS = initConfig.archerCount || 4;
  const sessionKey = `archeryScores_${initConfig.round}_${initConfig.school}_${getTodayStamp()}`;

  function getTodayStamp() {
    const today = new Date();
    return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  }

  function initializeDefaultScores() {
    return Array.from({ length: TOTAL_ARCHERS }, () =>
      Array.from({ length: TOTAL_ROUNDS }, () => ({ arrow1: '', arrow2: '', arrow3: '' }))
    );
  }

  function initializeDefaultNames() {
    return Array.from({ length: TOTAL_ARCHERS }, (_, i) => `Archer ${i + 1}`);
  }

  function loadData() {
    const stored = localStorage.getItem(sessionKey);
    if (stored) {
      const parsed = JSON.parse(stored);
      scores = parsed.scores;
      archerNames = parsed.archerNames;
    } else {
      scores = initializeDefaultScores();
      archerNames = initConfig.defaultArcherNames.length === TOTAL_ARCHERS
        ? initConfig.defaultArcherNames
        : initializeDefaultNames();
    }
  }

  function saveData() {
    localStorage.setItem(sessionKey, JSON.stringify({ scores, archerNames }));
  }

  function buildTabs() {
    const tabContainer = document.getElementById('tabs');
    tabContainer.innerHTML = '';
    for (let i = 0; i < TOTAL_ARCHERS; i++) {
      const btn = document.createElement('button');
      btn.className = `tab tab-${(i % 4) + 1} ${i === 0 ? 'active-tab' : ''}`;
      btn.textContent = archerNames[i];
      btn.dataset.archer = i;
      btn.addEventListener('click', () => {
        currentTab = i;
        document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active-tab'));
        btn.classList.add('active-tab');
        document.querySelectorAll('.tab-content').forEach((el, index) => {
          el.style.display = index === currentTab ? 'block' : 'none';
        });
        updateScores();
      });
      tabContainer.appendChild(btn);
    }
  }

  function buildArcherTables() {
    const container = document.getElementById('tabs-container');
    container.innerHTML = '';
    for (let i = 0; i < TOTAL_ARCHERS; i++) {
      const div = document.createElement('div');
      div.className = 'tab-content';
      div.style.display = i === 0 ? 'block' : 'none';
      div.innerHTML = `
        <div class="scores-header" style="background-color: ${tabColors[i % 4]};">
          <h2>Scores for <span id="archer${i + 1}-name-display">${archerNames[i]}</span></h2>
          <button class="edit-name-button" data-index="${i}">Edit Name</button>
        </div>
        <table>
          <thead>
            <tr>
              <th class="round-header r-column">R</th>
              <th>Arrow 1</th>
              <th>Arrow 2</th>
              <th>Arrow 3</th>
              <th>10s</th>
              <th>Xs</th>
              <th>END</th>
              <th>TOT</th>
              <th>AVG</th>
            </tr>
          </thead>
          <tbody id="archer${i + 1}-scores"></tbody>
        </table>
      `;
      container.appendChild(div);
    }
  }

  function updateScores() {
    const archerScores = scores[currentTab];
    const tbody = document.getElementById(`archer${currentTab + 1}-scores`);
    tbody.innerHTML = '';
    let runningTotal = 0;
    let totalTens = 0;
    let totalXs = 0;

    archerScores.forEach((score, index) => {
      const { roundTotal, roundTens, roundXs } = calculateRound(score);
      runningTotal += roundTotal;
      totalTens += roundTens;
      totalXs += roundXs;

      const avg = (roundTotal / 3).toFixed(1);
      const avgClass = getAvgClass(avg);

      const row = document.createElement('tr');
      row.className = 'score-row';
      row.dataset.index = index;
      row.innerHTML = `
        <td class="r-column">${index + 1}</td>
        <td>${dropdown(currentTab, index, 'arrow1', score.arrow1)}</td>
        <td>${dropdown(currentTab, index, 'arrow2', score.arrow2)}</td>
        <td>${dropdown(currentTab, index, 'arrow3', score.arrow3)}</td>
        <td class="calculated-cell">${roundTens}</td>
        <td class="calculated-cell">${roundXs}</td>
        <td class="calculated-cell">${roundTotal}</td>
        <td class="calculated-cell">${runningTotal}</td>
        <td class="calculated-cell ${avgClass}">${avg}</td>
      `;
      tbody.appendChild(row);
    });

    tbody.innerHTML += `
      <tr class="total-row">
        <td class="r-column"><strong>Total</strong></td>
        <td colspan="3"></td>
        <td class="calculated-cell"><strong>${totalTens}</strong></td>
        <td class="calculated-cell"><strong>${totalXs}</strong></td>
        <td></td>
        <td class="calculated-cell"><strong>${runningTotal}</strong></td>
        <td></td>
      </tr>
    `;

    saveData();
    updateTotals();
    highlightCurrentRow();
  }

  function calculateRound(score) {
    let total = 0, tens = 0, xs = 0;
    for (const val of [score.arrow1, score.arrow2, score.arrow3]) {
      if (val === 'X') {
        total += 10; xs++; tens++;
      } else if (val === 'M' || val === '' || val === '--') {
        total += 0;
      } else {
        const num = parseInt(val);
        total += num;
        if (num === 10) tens++;
      }
    }
    return { roundTotal: total, roundTens: tens, roundXs: xs };
  }

  function calculateTotalScores(archerScores) {
    let runningTotal = 0, totalTens = 0, totalXs = 0;
    archerScores.forEach(score => {
      [score.arrow1, score.arrow2, score.arrow3].forEach(val => {
        if (val === 'X') {
          runningTotal += 10; totalXs++; totalTens++;
        } else if (val === 'M' || val === '' || val === '--') {
          runningTotal += 0;
        } else {
          const num = parseInt(val);
          runningTotal += num;
          if (num === 10) totalTens++;
        }
      });
    });
    return { runningTotal, totalTens, totalXs };
  }

  function updateTotals() {
    const table = document.getElementById('total-scores');
    if (!table) return;
    const today = new Date();
    const formattedDate = `${dayAbbr[today.getDay()]} ${monthAbbr[today.getMonth()]} ${today.getDate().toString().padStart(2, '0')} ${today.getFullYear()}`;
    table.innerHTML = scores.map((archerScores, i) => {
      const { runningTotal, totalTens, totalXs } = calculateTotalScores(archerScores);
      const avg = (runningTotal / (TOTAL_ROUNDS * 3)).toFixed(1);
      const avgClass = getAvgClass(avg);
      return `
        <tr>
          <td>${archerNames[i]}</td>
          <td>${totalTens}</td>
          <td>${totalXs}</td>
          <td>${runningTotal}</td>
          <td class="calculated-cell ${avgClass}">${avg}</td>
          <td>${formattedDate}</td>
        </tr>
      `;
    }).join('');
  }

  function dropdown(archerIndex, roundIndex, arrowKey, selectedValue) {
    const options = ['--', 'M', ...Array.from({ length: 10 }, (_, i) => i + 1), 'X'];
    return `<select data-archer="${archerIndex}" data-round="${roundIndex}" data-arrow="${arrowKey}">
      ${options.map(opt => `<option value="${opt}" ${opt.toString() === selectedValue.toString() ? 'selected' : ''}>${opt}</option>`).join('')}
    </select>`;
  }

  function getAvgClass(avg) {
    const v = parseFloat(avg);
    if (v >= 1 && v < 3) return 'avg-1-2';
    if (v >= 3 && v < 5) return 'avg-3-4';
    if (v >= 5 && v < 7) return 'avg-5-6';
    if (v >= 7 && v < 9) return 'avg-7-8';
    if (v >= 9) return 'avg-9-up';
    return '';
  }

  function highlightCurrentRow() {
    const tbody = document.getElementById(`archer${currentTab + 1}-scores`);
    if (!tbody) return;
    const selects = tbody.querySelectorAll('select');
    selects.forEach(sel => sel.closest('tr').classList.remove('current-row'));

    if (document.activeElement && document.activeElement.tagName === 'SELECT') {
      const row = document.activeElement.closest('tr');
      if (row) row.classList.add('current-row');
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    loadData();
    buildTabs();
    buildArcherTables();
    updateScores();

    document.getElementById('copy-totals-button')?.addEventListener('click', () => {
      const today = getTodayStamp();
      const msg = scores.map((archerScores, i) => {
        const { runningTotal, totalTens, totalXs } = calculateTotalScores(archerScores);
        const avg = (runningTotal / (TOTAL_ROUNDS * 3)).toFixed(1);
        return `${archerNames[i]}\t${totalTens}\t${totalXs}\t${runningTotal}\t${avg}\t${today}`;
      }).join("\r\n");
      navigator.clipboard.writeText(msg).then(() => alert("Totals copied!"));
    });

    document.getElementById('reset-button')?.addEventListener('click', () => {
      document.getElementById('reset-modal').style.display = 'block';
    });

    document.getElementById('modal-cancel')?.addEventListener('click', () => {
      document.getElementById('reset-modal').style.display = 'none';
    });

    document.getElementById('modal-reset')?.addEventListener('click', () => {
      if (confirm("Are you sure you want to reset all scores?")) {
        scores = initializeDefaultScores();
        archerNames = initializeDefaultNames();
        saveData();
        updateScores();
        buildTabs();
        document.getElementById('reset-modal').style.display = 'none';
      }
    });

    document.getElementById('modal-sample')?.addEventListener('click', () => {
      scores = initializeDefaultScores();
      archerNames = ["Bobby", "Mary", "Sam", "Fred"];
      saveData();
      updateScores();
      buildTabs();
      document.getElementById('reset-modal').style.display = 'none';
    });

    document.getElementById('sms-button')?.addEventListener('click', () => {
      const today = getTodayStamp();
      const msg = scores.map((archerScores, i) => {
        const { runningTotal, totalTens, totalXs } = calculateTotalScores(archerScores);
        const avg = (runningTotal / (TOTAL_ROUNDS * 3)).toFixed(1);
        return `${archerNames[i]}: ${totalTens}/${totalXs}/${runningTotal}/${avg}`;
      }).join("\n");
      window.location.href = `sms:14244439811?body=${encodeURIComponent(msg)}`;
    });

    document.getElementById('mail-button')?.addEventListener('click', () => {
      const today = getTodayStamp();
      const msg = scores.map((archerScores, i) => {
        const { runningTotal, totalTens, totalXs } = calculateTotalScores(archerScores);
        const avg = (runningTotal / (TOTAL_ROUNDS * 3)).toFixed(1);
        return `${archerNames[i]}\t${totalTens}\t${totalXs}\t${runningTotal}\t${avg}\t${today}`;
      }).join("\r\n");
      window.location.href = `mailto:davinciarchers@gmail.com?subject=WDV Scores ${today}&body=${encodeURIComponent(msg)}`;
    });
  });

  document.addEventListener('change', e => {
    if (e.target.tagName === 'SELECT') {
      const s = e.target;
      const a = parseInt(s.dataset.archer);
      const r = parseInt(s.dataset.round);
      const k = s.dataset.arrow;
      scores[a][r][k] = s.value === '--' ? '' : s.value;
      updateScores();
    }
  });

  document.addEventListener('focusin', e => {
    if (e.target.tagName === 'SELECT') {
      highlightCurrentRow();
    }
  });

  document.addEventListener('click', e => {
    if (e.target.classList.contains('edit-name-button')) {
      const i = parseInt(e.target.dataset.index);
      const newName = prompt('Enter name for archer:', archerNames[i]);
      if (newName) {
        archerNames[i] = newName;
        saveData();
        buildTabs();
        updateScores();
      }
    }
  });
})();
