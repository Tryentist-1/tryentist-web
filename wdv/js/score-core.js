// score-core.js
// Core logic for the archery scoring system.
// This file contains functions for data management, UI manipulation, and score calculations.
import { showSetupModal } from './modal.js';

// Data arrays to store scores and archer information
let scores = [];
let archerNames = [];
let archerSchools = [];
let archerGenders = [];
let archerTeams = [];
let currentTab = 0;

// Function to get the current date in YYYY-MM-DD format
function getTodayStamp() {
  const today = new Date();
  return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
}

// Function to get the current date in a user-friendly format (e.g., "Sun Jan 01 2024")
function getFriendlyDate() {
  const dayAbbr = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthAbbr = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const date = new Date();
  return `${dayAbbr[date.getDay()]} ${monthAbbr[date.getMonth()]} ${date.getDate()} ${date.getFullYear()}`;
}

// Function to initialize the scores array with default values
function initializeDefaultScores(TOTAL_ARCHERS, TOTAL_ROUNDS) {
  return Array.from({ length: TOTAL_ARCHERS }, () =>
    Array.from({ length: TOTAL_ROUNDS }, () => ({ arrow1: '', arrow2: '', arrow3: '' }))
  );
}

// Function to load data from localStorage
function loadData(sessionKey, TOTAL_ARCHERS, TOTAL_ROUNDS, safeInitConfig) {
  const stored = localStorage.getItem(sessionKey);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      scores = (Array.isArray(parsed.scores) && parsed.scores.length === TOTAL_ARCHERS) ? parsed.scores : initializeDefaultScores(TOTAL_ARCHERS, TOTAL_ROUNDS);
      archerNames = (Array.isArray(parsed.archerNames) && parsed.archerNames.length === TOTAL_ARCHERS) ? parsed.archerNames : new Array(TOTAL_ARCHERS).fill("Archer");
      archerSchools = (Array.isArray(parsed.archerSchools) && parsed.archerSchools.length === TOTAL_ARCHERS) ? parsed.archerSchools : new Array(TOTAL_ARCHERS).fill("");
      archerGenders = (Array.isArray(parsed.archerGenders) && parsed.archerGenders.length === TOTAL_ARCHERS) ? parsed.archerGenders : new Array(TOTAL_ARCHERS).fill("M");
      archerTeams = (Array.isArray(parsed.archerTeams) && parsed.archerTeams.length === TOTAL_ARCHERS) ? parsed.archerTeams : new Array(TOTAL_ARCHERS).fill("JV");
      scores.forEach((archerScoreData, index) => {
        if (!Array.isArray(archerScoreData) || archerScoreData.length !== TOTAL_ROUNDS) {
          console.warn(`Invalid score structure for archer ${index}. Resetting.`);
          scores[index] = Array.from({ length: TOTAL_ROUNDS }, () => ({ arrow1: '', arrow2: '', arrow3: '' }));
        } else {
          archerScoreData.forEach((roundScore, roundIndex) => {
            if (typeof roundScore !== 'object' || roundScore === null || !roundScore.hasOwnProperty('arrow1') || !roundScore.hasOwnProperty('arrow2') || !roundScore.hasOwnProperty('arrow3')) {
              console.warn(`Invalid round score object at archer ${index}, round ${roundIndex}. Resetting.`);
              scores[index][roundIndex] = { arrow1: '', arrow2: '', arrow3: '' };
            }
          });
        }
      });
    } catch (e) {
      console.error("Error parsing localStorage data:", e);
      scores = initializeDefaultScores(TOTAL_ARCHERS, TOTAL_ROUNDS);
      archerNames = (safeInitConfig.defaultArcherNames.length === TOTAL_ARCHERS) ? safeInitConfig.defaultArcherNames.slice() : new Array(TOTAL_ARCHERS).fill("Archer");
      archerSchools = new Array(TOTAL_ARCHERS).fill("");
      archerGenders = new Array(TOTAL_ARCHERS).fill("M");
      archerTeams = new Array(TOTAL_ARCHERS).fill("JV");
      localStorage.removeItem(sessionKey);
    }
  } else {
    scores = initializeDefaultScores(TOTAL_ARCHERS, TOTAL_ROUNDS);
    archerNames = (safeInitConfig.defaultArcherNames.length === TOTAL_ARCHERS) ? safeInitConfig.defaultArcherNames.slice() : new Array(TOTAL_ARCHERS).fill("Archer");
    archerSchools = new Array(TOTAL_ARCHERS).fill("");
    archerGenders = new Array(TOTAL_ARCHERS).fill("M");
    archerTeams = new Array(TOTAL_ARCHERS).fill("JV");
  }
}

// Function to save data to localStorage
function saveData(sessionKey) {
  try {
    localStorage.setItem(sessionKey, JSON.stringify({ scores, archerNames, archerSchools, archerGenders, archerTeams }));
  } catch (e) {
    console.error("Error saving data:", e);
    alert("Could not save scores.");
  }
}

// Function to build the tabs for each archer
function buildTabs(TOTAL_ARCHERS) {
  const tabContainer = document.getElementById('tabs');
  if (!tabContainer) return;
  tabContainer.innerHTML = '';
  for (let i = 0; i < TOTAL_ARCHERS; i++) {
    const btn = document.createElement('button');
    btn.className = `tab tab-${(i % 4) + 1} ${i === currentTab ? 'active-tab' : ''}`;
    btn.textContent = archerNames[i] || `Archer ${i + 1}`;
    btn.dataset.archer = i;
    btn.addEventListener('click', () => {
      currentTab = i;
      document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active-tab'));
      btn.classList.add('active-tab');
      document.querySelectorAll('.tab-content').forEach((el, index) => {
        el.style.display = (index === currentTab) ? 'block' : 'none';
      });
      highlightCurrentRow();
    });
    tabContainer.appendChild(btn);
  }
}

// Function to build the score tables for each archer
function buildArcherTables(TOTAL_ARCHERS) {
  const container = document.getElementById('tabs-container');
  if (!container) return;
  container.innerHTML = '';
  for (let i = 0; i < TOTAL_ARCHERS; i++) {
    const div = document.createElement('div');
    div.className = 'tab-content';
    div.style.display = (i === currentTab) ? 'block' : 'none';
    div.innerHTML = `
        <table>
          <thead>
            <tr>
              <th class="round-header r-column">R</th>
              <th>Arrow 1</th><th>Arrow 2</th><th>Arrow 3</th>
              <th>10s</th><th>Xs</th><th>END</th><th>TOT</th><th>AVG</th>
            </tr>
          </thead>
          <tbody id="archer${i + 1}-scores"></tbody>
        </table>
      `;
    container.appendChild(div);
    updateArcherScoreTable(i, TOTAL_ARCHERS);
  }
}

// Function to update an archer's score table
function updateArcherScoreTable(archerIndex, TOTAL_ARCHERS, TOTAL_ROUNDS) {
  if (archerIndex < 0 || archerIndex >= TOTAL_ARCHERS) return;
  const archerScores = scores[archerIndex];
  const tbody = document.getElementById(`archer${archerIndex + 1}-scores`);
  if (!tbody || !archerScores) return;
  tbody.innerHTML = '';
  let runningTotal = 0;
  let totalTensOverall = 0;
  let totalXsOverall = 0;

  archerScores.forEach((score, index) => {
    const { roundTotal, roundTens, roundXs, isComplete } = calculateRound(score);
    if (isComplete) {
      runningTotal += roundTotal;
      totalTensOverall += roundTens;
      totalXsOverall += roundXs;
    }
    const displayRoundTens = isComplete ? roundTens : '';
    const displayRoundXs = isComplete ? roundXs : '';
    const displayRoundTotal = isComplete ? roundTotal : '';
    const displayAvg = isComplete ? (roundTotal / 3).toFixed(1) : '';
    const avgClass = isComplete ? getAvgClass(displayAvg) : '';

    const row = document.createElement('tr');
    row.className = 'score-row';
    row.dataset.index = index;
    row.dataset.archer = archerIndex;
    row.innerHTML = `
        <td class="r-column">${index + 1}</td>
        <td>${dropdown(archerIndex, index, 'arrow1', score.arrow1)}</td>
        <td>${dropdown(archerIndex, index, 'arrow2', score.arrow2)}</td>
        <td>${dropdown(archerIndex, index, 'arrow3', score.arrow3)}</td>
        <td class="calculated-cell tens-cell">${displayRoundTens}</td>
        <td class="calculated-cell xs-cell">${displayRoundXs}</td>
        <td class="calculated-cell end-total-cell">${displayRoundTotal}</td>
        <td class="calculated-cell running-total-cell">${isComplete ? runningTotal : ''}</td>
        <td class="calculated-cell avg-cell ${avgClass}">${displayAvg}</td>
      `;
    tbody.appendChild(row);
  });
}

// Function to update the totals table
function updateTotalsTable(TOTAL_ARCHERS) {
  const totalsTbody = document.getElementById('total-scores');
  if (!totalsTbody) return;
  totalsTbody.innerHTML = '';
  const today = getFriendlyDate();
  scores.forEach((archerScoreData, i) => {
    const { runningTotal, totalTens, totalXs } = calculateTotalScores(archerScoreData);
    const completedRounds = archerScoreData.filter(s => s.arrow1 && s.arrow2 && s.arrow3).length;
    const avg = completedRounds > 0 ? (runningTotal / (completedRounds * 3)).toFixed(1) : (0).toFixed(1);
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${archerNames[i] || `Archer ${i + 1}`}</td>
        <td>${archerSchools[i] || '-'}</td>
        <td>${archerGenders[i] || '-'}</td>
        <td>${archerTeams[i] || '-'}</td>
        <td>${totalTens}</td>
        <td>${totalXs}</td>
        <td>${runningTotal}</td>
        <td>${avg}</td>
        <td>${today}</td>`;
    totalsTbody.appendChild(row);
  });
}

// Function to handle score changes and update the UI
function handleScoreChange(TOTAL_ARCHERS, TOTAL_ROUNDS) {
  updateArcherScoreTable(currentTab, TOTAL_ARCHERS, TOTAL_ROUNDS);
  updateTotalsTable(TOTAL_ARCHERS);
  highlightCurrentRow();
}

// Function to calculate the total score for a round
function calculateRound(score) {
  let total = 0, tens = 0, xs = 0;
  for (const val of [score.arrow1, score.arrow2, score.arrow3]) {
    if (val === 'X') {
      total += 10;
      xs++;
      tens++;
    } else if (val === 'M') {
      total += 0;
    } else if (val === '' || val === '--') {
      total += 0;
    } else {
      const num = parseInt(val);
      if (!isNaN(num)) {
        total += num;
        if (num === 10) tens++;
      }
    }
  }
  const isComplete = (score.arrow1 !== '' && score.arrow1 !== '--') &&
    (score.arrow2 !== '' && score.arrow2 !== '--') &&
    (score.arrow3 !== '' && score.arrow3 !== '--');
  return { roundTotal: total, roundTens: tens, roundXs: xs, isComplete };
}

// Function to create a dropdown for score input
function dropdown(archer, round, arrow, selectedValue) {
  const options = ['--', 'M', ...Array.from({ length: 10 }, (_, i) => (i + 1).toString()), 'X'];
  const currentVal = options.includes(String(selectedValue)) ? selectedValue : '--';
  return `<select data-archer="${archer}" data-round="${round}" data-arrow="${arrow}"> ${options.map(val => `<option value="${val}" ${String(val) === String(currentVal) ? 'selected' : ''}>${val}</option>`).join('')} </select>`;
}

// Function to determine the CSS class for the average
function getAvgClass(avg) {
  const v = parseFloat(avg);
  if (v >= 1 && v < 3) return 'avg-1-2';
  if (v >= 3 && v < 5) return 'avg-3-4';
  if (v >= 5 && v < 7) return 'avg-5-6';
  if (v >= 7 && v < 9) return 'avg-7-8';
  if (v >= 9) return 'avg-9-up';
  return '';
}

// Function to calculate the total scores for an archer
function calculateTotalScores(archerScoreData) {
  let runningTotal = 0, totalTens = 0, totalXs = 0;
  archerScoreData.forEach(score => {
    const { roundTotal, roundTens, roundXs, isComplete } = calculateRound(score);
    if (isComplete) {
      runningTotal += roundTotal;
      totalTens += roundTens;
      totalXs += roundXs;
    }
  });
  return { runningTotal, totalTens, totalXs };
}

// Function to highlight the current row for scoring
function highlightCurrentRow() {
  document.querySelectorAll('.score-row').forEach(row => row.classList.remove('highlight'));
  const currentTabContent = document.querySelector(`.tab-content[style*="display: block"]`);
  if (!currentTabContent) return;
  const archerScores = scores[currentTab];
  if (!archerScores) return;
  for (let i = 0; i < archerScores.length; i++) {
    const score = archerScores[i];
    if (score.arrow1 === '' || score.arrow1 === '--' ||
      score.arrow2 === '' || score.arrow2 === '--' ||
      score.arrow3 === '' || score.arrow3 === '--') {
      const row = currentTabContent.querySelector(`.score-row[data-index="${i}"]`);
      if (row) {
        row.classList.add('highlight');
      }
      break;
    }
  }
}

// Function to initialize the scorecard
function init(initConfig) {
  console.log("Initializing scorecard...");
  const TOTAL_ROUNDS = initConfig.totalEnds || (initConfig.round === '360' ? 12 : 10);
  const TOTAL_ARCHERS = initConfig.archerCount || 4;
  const sessionKey = `archeryScores_${initConfig.round}_${initConfig.school}_${getTodayStamp()}`;
  loadData(sessionKey, TOTAL_ARCHERS, TOTAL_ROUNDS, initConfig);
  buildTabs(TOTAL_ARCHERS);
  buildArcherTables(TOTAL_ARCHERS);
  updateTotalsTable(TOTAL_ARCHERS);
  highlightCurrentRow();
  return {sessionKey:sessionKey, TOTAL_ARCHERS:TOTAL_ARCHERS, TOTAL_ROUNDS:TOTAL_ROUNDS};

  const needSetup = archerNames.every(name => /^Archer\\s*\\d*$/.test(name || ''));
  if (needSetup && TOTAL_ARCHERS > 0) {
    console.log("Showing setup modal...");
    showSetupModal(TOTAL_ARCHERS, saveData.bind(null, sessionKey), buildTabs.bind(null, TOTAL_ARCHERS), updateTotalsTable.bind(null, TOTAL_ARCHERS), highlightCurrentRow);
  }
}

export { getTodayStamp, getFriendlyDate, initializeDefaultScores, loadData, saveData, buildTabs, buildArcherTables, updateArcherScoreTable, updateTotalsTable, handleScoreChange, calculateRound, dropdown, getAvgClass, calculateTotalScores, highlightCurrentRow, init, scores, archerNames, archerSchools, archerGenders, archerTeams, currentTab};
