// score.js - Modified to use score-core.js
// Imports and uses the core functions for the WDV scorecard app.

// Import core functions from score-core.js
import {
  showSetupModal,
  getTodayStamp, getFriendlyDate, initializeDefaultScores, loadData, saveData,
  buildTabs, buildArcherTables, updateArcherScoreTable, updateTotalsTable,
  handleScoreChange, calculateRound, dropdown, getAvgClass, calculateTotalScores,
  highlightCurrentRow, showSetupModal, init
} from './score-core.js';

(function () {
  import { attachButtonListeners } from './common.js';
  // Data arrays (shared with core)
  let scores = [];
  let archerNames = [];
  let archerSchools = [];
  let archerGenders = [];
  let archerTeams = [];
  let currentTab = 0;

  // Configuration (shared with core)
  const safeInitConfig = typeof initConfig !== 'undefined' ? initConfig : { round: '360', school: 'WDV', archerCount: 4, totalEnds: 12, defaultArcherNames: [] };
  const TOTAL_ROUNDS = safeInitConfig.totalEnds || (safeInitConfig.round === '360' ? 12 : 10); //default total ends
  const TOTAL_ARCHERS = safeInitConfig.archerCount || 4;//default total archers
  const sessionKey = `archeryScores_${safeInitConfig.round}_${safeInitConfig.school}_${getTodayStamp()}`;//default session key
    
  // Initialize the core logic and attach event listeners
  init(scores, archerNames, archerSchools, archerGenders, archerTeams, currentTab, TOTAL_ROUNDS, TOTAL_ARCHERS, sessionKey, initializeDefaultScores, showSetupModal);
  

    // --- Moved Event Listeners Here ---
    // Dropdown change listener
    console.log("Attaching dropdown listener..."); // Log listener attachment
    document.getElementById('tabs-container')?.addEventListener('change', e => {
    if (e.target.tagName === 'SELECT' && e.target.dataset.archer !== undefined) {
      const s = e.target; const a = parseInt(s.dataset.archer); const r = parseInt(s.dataset.round); const k = s.dataset.arrow;
      if (isNaN(a) || isNaN(r) || !k || a < 0 || a >= TOTAL_ARCHERS || r < 0 || r >= TOTAL_ROUNDS) { console.error("Invalid data attributes:", s.dataset); return; }
      if (!scores[a] || !scores[a][r]) { console.error(`Score data missing: a=${a}, r=${r}`); return; }
      scores[a][r][k] = s.value;
      handleScoreChange(scores, archerNames, archerSchools, archerGenders, archerTeams, currentTab, TOTAL_ROUNDS, TOTAL_ARCHERS, sessionKey);
    }
    });

    attachButtonListeners(scores, archerNames, archerSchools, archerGenders, archerTeams, calculateTotalScores, getFriendlyDate, TOTAL_ARCHERS, TOTAL_ROUNDS, saveData, buildTabs, buildArcherTables, updateTotalsTable, highlightCurrentRow, sessionKey, initializeDefaultScores, showSetupModal)

   console.log("Scorecard Initialized."); // Log end
   
})(); // --- End IIFE ---
