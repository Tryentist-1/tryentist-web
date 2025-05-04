// score.js
// Full logic script for WDV scorecard apps (300, 360, etc.)
// Handles tabs, UI, score calculations, localStorage, and session management
// V3: Added console logging for reset button debugging.

(function () {
  // Data arrays including new fields
  let scores = [];
  let archerNames = [];
  let archerSchools = [];
  let archerGenders = [];
  let archerTeams = [];
  let currentTab = 0;
  const tabColors = ['#007BFF', '#FF5733', '#28A745', '#FFC300'];
  // Use totalEnds if provided, otherwise default based on round type
  // Ensure initConfig exists or provide defaults
  const safeInitConfig = typeof initConfig !== 'undefined' ? initConfig : { round: '360', school: 'WDV', archerCount: 4, totalEnds: 12, defaultArcherNames: [] };
  const TOTAL_ROUNDS = safeInitConfig.totalEnds || (safeInitConfig.round === '360' ? 12 : 10);
  const TOTAL_ARCHERS = safeInitConfig.archerCount || 4;
  const sessionKey = `archeryScores_${safeInitConfig.round}_${safeInitConfig.school}_${getTodayStamp()}`;

  // Arrays for friendly date formatting
  const dayAbbr = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthAbbr = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  function getTodayStamp() { /* ... (same) ... */
    const today = new Date(); return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
   }
  function getFriendlyDate() { /* ... (same) ... */
    const date = new Date(); return `${dayAbbr[date.getDay()]} ${monthAbbr[date.getMonth()]} ${date.getDate()} ${date.getFullYear()}`;
   }
  function initializeDefaultScores() { /* ... (same) ... */
    return Array.from({ length: TOTAL_ARCHERS }, () => Array.from({ length: TOTAL_ROUNDS }, () => ({ arrow1: '', arrow2: '', arrow3: '' })));
   }
  function loadData() { /* ... (same validation logic) ... */
    const stored = localStorage.getItem(sessionKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        scores = (Array.isArray(parsed.scores) && parsed.scores.length === TOTAL_ARCHERS) ? parsed.scores : initializeDefaultScores();
        archerNames = (Array.isArray(parsed.archerNames) && parsed.archerNames.length === TOTAL_ARCHERS) ? parsed.archerNames : new Array(TOTAL_ARCHERS).fill("Archer");
        archerSchools = (Array.isArray(parsed.archerSchools) && parsed.archerSchools.length === TOTAL_ARCHERS) ? parsed.archerSchools : new Array(TOTAL_ARCHERS).fill("");
        archerGenders = (Array.isArray(parsed.archerGenders) && parsed.archerGenders.length === TOTAL_ARCHERS) ? parsed.archerGenders : new Array(TOTAL_ARCHERS).fill("M");
        archerTeams = (Array.isArray(parsed.archerTeams) && parsed.archerTeams.length === TOTAL_ARCHERS) ? parsed.archerTeams : new Array(TOTAL_ARCHERS).fill("JV");
        scores.forEach((archerScoreData, index) => { if (!Array.isArray(archerScoreData) || archerScoreData.length !== TOTAL_ROUNDS) { console.warn(`Invalid score structure for archer ${index}. Resetting.`); scores[index] = Array.from({ length: TOTAL_ROUNDS }, () => ({ arrow1: '', arrow2: '', arrow3: '' })); } else { archerScoreData.forEach((roundScore, roundIndex) => { if (typeof roundScore !== 'object' || roundScore === null || !roundScore.hasOwnProperty('arrow1') || !roundScore.hasOwnProperty('arrow2') || !roundScore.hasOwnProperty('arrow3')) { console.warn(`Invalid round score object at archer ${index}, round ${roundIndex}. Resetting.`); scores[index][roundIndex] = { arrow1: '', arrow2: '', arrow3: '' }; } }); } });
      } catch (e) { console.error("Error parsing localStorage data:", e); scores = initializeDefaultScores(); archerNames = (safeInitConfig.defaultArcherNames.length === TOTAL_ARCHERS) ? safeInitConfig.defaultArcherNames.slice() : new Array(TOTAL_ARCHERS).fill("Archer"); archerSchools = new Array(TOTAL_ARCHERS).fill(""); archerGenders = new Array(TOTAL_ARCHERS).fill("M"); archerTeams = new Array(TOTAL_ARCHERS).fill("JV"); localStorage.removeItem(sessionKey); }
    } else { scores = initializeDefaultScores(); archerNames = (safeInitConfig.defaultArcherNames.length === TOTAL_ARCHERS) ? safeInitConfig.defaultArcherNames.slice() : new Array(TOTAL_ARCHERS).fill("Archer"); archerSchools = new Array(TOTAL_ARCHERS).fill(""); archerGenders = new Array(TOTAL_ARCHERS).fill("M"); archerTeams = new Array(TOTAL_ARCHERS).fill("JV"); }
   }
  function saveData() { /* ... (same) ... */
     try { localStorage.setItem(sessionKey, JSON.stringify({ scores, archerNames, archerSchools, archerGenders, archerTeams })); } catch (e) { console.error("Error saving data:", e); alert("Could not save scores."); }
   }
  function buildTabs() { /* ... (same) ... */
    const tabContainer = document.getElementById('tabs'); if (!tabContainer) return; tabContainer.innerHTML = ''; for (let i = 0; i < TOTAL_ARCHERS; i++) { const btn = document.createElement('button'); btn.className = `tab tab-${(i % 4) + 1} ${i === currentTab ? 'active-tab' : ''}`; btn.textContent = archerNames[i] || `Archer ${i + 1}`; btn.dataset.archer = i; btn.addEventListener('click', () => { currentTab = i; document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active-tab')); btn.classList.add('active-tab'); document.querySelectorAll('.tab-content').forEach((el, index) => { el.style.display = (index === currentTab) ? 'block' : 'none'; }); highlightCurrentRow(); }); tabContainer.appendChild(btn); }
   }
  function buildArcherTables() { /* ... (same) ... */
    const container = document.getElementById('tabs-container'); if (!container) return; container.innerHTML = ''; for (let i = 0; i < TOTAL_ARCHERS; i++) { const div = document.createElement('div'); div.className = 'tab-content'; div.style.display = (i === currentTab) ? 'block' : 'none'; div.innerHTML = ` <table> <thead> <tr> <th class="round-header r-column">R</th> <th>Arrow 1</th><th>Arrow 2</th><th>Arrow 3</th> <th>10s</th><th>Xs</th><th>END</th><th>TOT</th><th>AVG</th> </tr> </thead> <tbody id="archer${i + 1}-scores"></tbody> </table> `; container.appendChild(div); updateArcherScoreTable(i); }
   }
  function updateArcherScoreTable(archerIndex) { /* ... (same) ... */
      if (archerIndex < 0 || archerIndex >= TOTAL_ARCHERS) return; const archerScores = scores[archerIndex]; const tbody = document.getElementById(`archer${archerIndex + 1}-scores`); if (!tbody || !archerScores) return; tbody.innerHTML = ''; let runningTotal = 0; let totalTensOverall = 0; let totalXsOverall = 0; archerScores.forEach((score, index) => { const { roundTotal, roundTens, roundXs, isComplete } = calculateRound(score); if (isComplete) { runningTotal += roundTotal; totalTensOverall += roundTens; totalXsOverall += roundXs; } const displayRoundTens = isComplete ? roundTens : ''; const displayRoundXs = isComplete ? roundXs : ''; const displayRoundTotal = isComplete ? roundTotal : ''; const displayAvg = isComplete ? (roundTotal / 3).toFixed(1) : ''; const avgClass = isComplete ? getAvgClass(displayAvg) : ''; const row = document.createElement('tr'); row.className = 'score-row'; row.dataset.index = index; row.dataset.archer = archerIndex; row.innerHTML = ` <td class="r-column">${index + 1}</td> <td>${dropdown(archerIndex, index, 'arrow1', score.arrow1)}</td> <td>${dropdown(archerIndex, index, 'arrow2', score.arrow2)}</td> <td>${dropdown(archerIndex, index, 'arrow3', score.arrow3)}</td> <td class="calculated-cell tens-cell">${displayRoundTens}</td> <td class="calculated-cell xs-cell">${displayRoundXs}</td> <td class="calculated-cell end-total-cell">${displayRoundTotal}</td> <td class="calculated-cell running-total-cell">${isComplete ? runningTotal : ''}</td> <td class="calculated-cell avg-cell ${avgClass}">${displayAvg}</td> `; tbody.appendChild(row); });
   }
  function updateTotalsTable() { /* ... (same) ... */
    const totalsTbody = document.getElementById('total-scores'); if (!totalsTbody) return; totalsTbody.innerHTML = ''; const today = getFriendlyDate(); scores.forEach((archerScoreData, i) => { const { runningTotal, totalTens, totalXs } = calculateTotalScores(archerScoreData); const completedRounds = archerScoreData.filter(s => s.arrow1 && s.arrow2 && s.arrow3).length; const avg = completedRounds > 0 ? (runningTotal / (completedRounds * 3)).toFixed(1) : (0).toFixed(1); const row = document.createElement('tr'); row.innerHTML = `<td>${archerNames[i] || `Archer ${i+1}`}</td> <td>${archerSchools[i] || '-'}</td> <td>${archerGenders[i] || '-'}</td> <td>${archerTeams[i] || '-'}</td> <td>${totalTens}</td> <td>${totalXs}</td> <td>${runningTotal}</td> <td>${avg}</td> <td>${today}</td>`; totalsTbody.appendChild(row); });
   }
   function handleScoreChange() { /* ... (same) ... */
       updateArcherScoreTable(currentTab); updateTotalsTable(); highlightCurrentRow(); saveData();
   }
  function calculateRound(score) { /* ... (same) ... */
    let total = 0, tens = 0, xs = 0; for (const val of [score.arrow1, score.arrow2, score.arrow3]) { if (val === 'X') { total += 10; xs++; tens++; } else if (val === 'M') { total += 0; } else if (val === '' || val === '--') { total += 0; } else { const num = parseInt(val); if (!isNaN(num)) { total += num; if (num === 10) tens++; } } } const isComplete = (score.arrow1 !== '' && score.arrow1 !== '--') && (score.arrow2 !== '' && score.arrow2 !== '--') && (score.arrow3 !== '' && score.arrow3 !== '--'); return { roundTotal: total, roundTens: tens, roundXs: xs, isComplete };
   }
  function dropdown(archer, round, arrow, selectedValue) { /* ... (same) ... */
    const options = ['--', 'M', ...Array.from({ length: 10 }, (_, i) => (i + 1).toString()), 'X']; const currentVal = options.includes(String(selectedValue)) ? selectedValue : '--'; return `<select data-archer="${archer}" data-round="${round}" data-arrow="${arrow}"> ${options.map(val => `<option value="${val}" ${String(val) === String(currentVal) ? 'selected' : ''}>${val}</option>`).join('')} </select>`;
   }
  function getAvgClass(avg) { /* ... (same) ... */
    const v = parseFloat(avg); if (v >= 1 && v < 3) return 'avg-1-2'; if (v >= 3 && v < 5) return 'avg-3-4'; if (v >= 5 && v < 7) return 'avg-5-6'; if (v >= 7 && v < 9) return 'avg-7-8'; if (v >= 9) return 'avg-9-up'; return '';
   }
  function calculateTotalScores(archerScoreData) { /* ... (same) ... */
    let runningTotal = 0, totalTens = 0, totalXs = 0; archerScoreData.forEach(score => { const { roundTotal, roundTens, roundXs, isComplete } = calculateRound(score); if (isComplete) { runningTotal += roundTotal; totalTens += roundTens; totalXs += roundXs; } }); return { runningTotal, totalTens, totalXs };
   }
  function highlightCurrentRow() { /* ... (same) ... */
    document.querySelectorAll('.score-row').forEach(row => row.classList.remove('highlight')); const currentTabContent = document.querySelector(`.tab-content[style*="display: block"]`); if (!currentTabContent) return; const archerScores = scores[currentTab]; if (!archerScores) return; for (let i = 0; i < archerScores.length; i++) { const score = archerScores[i]; if (score.arrow1 === '' || score.arrow1 === '--' || score.arrow2 === '' || score.arrow2 === '--' || score.arrow3 === '' || score.arrow3 === '--') { const row = currentTabContent.querySelector(`.score-row[data-index="${i}"]`); if (row) { row.classList.add('highlight'); } break; } }
   }
  function showSetupModal() { /* ... (same) ... */
    if (document.getElementById('setup-modal')) return; let modalHtml = ` <div class="modal" id="setup-modal" style="display:block;"> <div class="modal-content"> <h2>Enter Archer Information</h2> <form id="setup-form"> `; for (let i = 0; i < TOTAL_ARCHERS; i++) { modalHtml += ` <fieldset> <legend>Archer ${i + 1}</legend> <label for="archer-name-${i}">Name:</label> <input type="text" id="archer-name-${i}" value="${archerNames[i] || ''}" placeholder="Name" required> <div class="row"> <div class="small-field"> <label for="archer-school-${i}">School:</label> <input type="text" id="archer-school-${i}" value="${archerSchools[i] || ''}" placeholder="SCH" maxlength="3"> </div> <div class="row-field"> <label for="archer-gender-${i}">Gender:</label> <select id="archer-gender-${i}"> <option value="M" ${archerGenders[i] === 'M' ? 'selected' : ''}>M</option> <option value="F" ${archerGenders[i] === 'F' ? 'selected' : ''}>F</option> </select> </div> <div class="row-field"> <label for="archer-team-${i}">Team:</label> <select id="archer-team-${i}"> <option value="JV" ${archerTeams[i] === 'JV' ? 'selected' : ''}>JV</option> <option value="V" ${archerTeams[i] === 'V' ? 'selected' : ''}>V</option> </select> </div> </div> </fieldset> `; } modalHtml += ` <div class="modal-buttons"> <button type="submit" id="setup-save">Save</button> </div> </form> </div> </div> `; document.body.insertAdjacentHTML('beforeend', modalHtml); const setupForm = document.getElementById('setup-form'); if(setupForm) { setupForm.addEventListener('submit', function (e) { e.preventDefault(); for (let i = 0; i < TOTAL_ARCHERS; i++) { archerNames[i] = document.getElementById(`archer-name-${i}`).value.trim() || `Archer ${i+1}`; archerSchools[i] = document.getElementById(`archer-school-${i}`).value.trim().toUpperCase(); archerGenders[i] = document.getElementById(`archer-gender-${i}`).value; archerTeams[i] = document.getElementById(`archer-team-${i}`).value; } const modalElement = document.getElementById('setup-modal'); if (modalElement) modalElement.remove(); saveData(); buildTabs(); updateTotalsTable(); highlightCurrentRow(); }); }
   }

  // Initialization function
  function init() {
    console.log("Initializing scorecard..."); // Log start
    loadData();
    buildTabs();
    buildArcherTables();
    updateTotalsTable();
    highlightCurrentRow();

    const needSetup = archerNames.every(name => /^Archer\s*\d*$/.test(name || ''));
    if (needSetup && TOTAL_ARCHERS > 0) {
        console.log("Showing setup modal...");
        showSetupModal();
    }

    // --- Moved Event Listeners Here ---
    // Dropdown change listener
    console.log("Attaching dropdown listener..."); // Log listener attachment
    document.getElementById('tabs-container')?.addEventListener('change', e => {
      if (e.target.tagName === 'SELECT' && e.target.dataset.archer !== undefined) {
        // console.log("Dropdown changed:", e.target.dataset); // Log dropdown change
        const s = e.target; const a = parseInt(s.dataset.archer); const r = parseInt(s.dataset.round); const k = s.dataset.arrow;
        if (isNaN(a) || isNaN(r) || !k || a < 0 || a >= TOTAL_ARCHERS || r < 0 || r >= TOTAL_ROUNDS) { console.error("Invalid data attributes:", s.dataset); return; }
        if (!scores[a] || !scores[a][r]) { console.error(`Score data missing: a=${a}, r=${r}`); return; }
        scores[a][r][k] = s.value;
        handleScoreChange();
      }
    });

    // Export buttons
    console.log("Attaching export button listeners..."); // Log listener attachment
    document.getElementById('copy-totals-button')?.addEventListener('click', () => { /* ... (same) ... */
        const today = getFriendlyDate(); const msg = scores.map((d, i) => { const { runningTotal, totalTens, totalXs } = calculateTotalScores(d); const c = d.filter(s => s.arrow1 && s.arrow2 && s.arrow3).length; const avg = c > 0 ? (runningTotal / (c * 3)).toFixed(1) : (0).toFixed(1); return `${archerNames[i]}\t${archerSchools[i]}\t${archerGenders[i]}\t${archerTeams[i]}\t${totalTens}\t${totalXs}\t${runningTotal}\t${avg}\t${today}`; }).join("\r\n"); navigator.clipboard.writeText(msg).then(() => alert("Copied!"));
    });
    document.getElementById('sms-button')?.addEventListener('click', () => { /* ... (same) ... */
        const today = getFriendlyDate(); const msg = scores.map((d, i) => { const { runningTotal, totalTens, totalXs } = calculateTotalScores(d); const c = d.filter(s => s.arrow1 && s.arrow2 && s.arrow3).length; const avg = c > 0 ? (runningTotal / (c * 3)).toFixed(1) : (0).toFixed(1); return `${archerNames[i]}, ${archerSchools[i]}, ${archerGenders[i]}, ${archerTeams[i]}: ${totalTens}/${totalXs}/${runningTotal}/${avg}/${today}`; }).join("\n"); window.location.href = `sms:14244439811?body=${encodeURIComponent(msg)}`;
    });
    document.getElementById('mail-button')?.addEventListener('click', () => { /* ... (same) ... */
        const today = getFriendlyDate(); const msg = scores.map((d, i) => { const { runningTotal, totalTens, totalXs } = calculateTotalScores(d); const c = d.filter(s => s.arrow1 && s.arrow2 && s.arrow3).length; const avg = c > 0 ? (runningTotal / (c * 3)).toFixed(1) : (0).toFixed(1); return `${archerNames[i]}\t${archerSchools[i]}\t${archerGenders[i]}\t${archerTeams[i]}\t${totalTens}\t${totalXs}\t${runningTotal}\t${avg}\t${today}`; }).join("\r\n"); window.location.href = `mailto:davinciarchers@gmail.com?subject=WDV Scores ${today}&body=${encodeURIComponent(msg)}`;
    });

    // Reset Modal Event Listeners
    console.log("Attaching reset button listener..."); // Log listener attachment
    const resetButton = document.getElementById('reset-button');
    if (resetButton) {
        resetButton.addEventListener('click', () => {
            console.log("Reset button clicked!"); // Log click
            const modal = document.getElementById('reset-modal');
            if (modal) {
                console.log("Modal found, setting display to block."); // Log modal found
                modal.style.display = 'block';
            } else {
                console.error("Reset modal element (#reset-modal) not found!"); // Log if modal missing
            }
        });
    } else {
        console.error("Reset button element (#reset-button) not found!"); // Log if button missing
    }

    console.log("Attaching modal button listeners..."); // Log listener attachment
    document.getElementById('modal-reset')?.addEventListener('click', () => { /* ... (reset logic same) ... */
        console.log("Modal Reset button clicked!"); if (confirm("Reset all scores and re-enter archer info?")) { scores = initializeDefaultScores(); archerNames = new Array(TOTAL_ARCHERS).fill("Archer"); archerSchools = new Array(TOTAL_ARCHERS).fill(""); archerGenders = new Array(TOTAL_ARCHERS).fill("M"); archerTeams = new Array(TOTAL_ARCHERS).fill("JV"); saveData(); buildTabs(); buildArcherTables(); updateTotalsTable(); highlightCurrentRow(); const modal = document.getElementById('reset-modal'); if (modal) modal.style.display = 'none'; showSetupModal(); }
    });
    document.getElementById('modal-cancel')?.addEventListener('click', () => { /* ... (cancel logic same) ... */
         console.log("Modal Cancel button clicked!"); const modal = document.getElementById('reset-modal'); if (modal) modal.style.display = 'none';
    });
    document.getElementById('modal-sample')?.addEventListener('click', () => { /* ... (sample logic same) ... */
         console.log("Modal Sample button clicked!"); scores = initializeDefaultScores(); archerNames = ["Bobby", "Mary", "Sam", "Fred"]; archerSchools = ["ABC", "DEF", "GHI", "JKL"]; archerGenders = ["M", "F", "M", "F"]; archerTeams = ["JV", "V", "JV", "V"]; for (let i = 0; i < TOTAL_ARCHERS; i++) { for (let j = 0; j < TOTAL_ROUNDS; j++) { scores[i][j] = { arrow1: ['8', '9', '10', 'X'][j % 4], arrow2: ['7', '10', 'M', 'X'][j % 4], arrow3: ['9', 'X', '8', '10'][j % 4], }; } } saveData(); buildTabs(); buildArcherTables(); updateTotalsTable(); highlightCurrentRow(); const modal = document.getElementById('reset-modal'); if (modal) modal.style.display = 'none';
    });

    console.log("Scorecard Initialized."); // Log end
  } // --- End init ---

  // Make sure init runs after the DOM is loaded
  if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
  } else {
      // DOMContentLoaded has already fired
      init();
  }

})(); // --- End IIFE ---
