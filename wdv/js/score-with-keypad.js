import { attachButtonListeners } from './common.js';
import { handleScoreInputFocus, handleScoreInputBlur, handleKeypadClick, focusNextInput, focusPreviousInput, updateScoreCellColor } from './keypad.js';
import { getTodayStamp, getFriendlyDate, initializeDefaultScores, loadData, saveData, buildTabs, buildArcherTables, updateArcherScoreTable, updateTotalsTable, handleScoreChange, calculateRound, getAvgClass, calculateTotalScores, highlightCurrentRow, } from './score-core.js';

// score-with-keypad.js
// Enhanced version of score.js with keypad functionality
// Based on WDV archery scorecard code

(function () {
  // Ensure initConfig exists or provide defaults
  const safeInitConfig = typeof initConfig !== 'undefined' ? initConfig : { round: '360', school: 'WDV', archerCount: 4, totalEnds: 12, defaultArcherNames: [] };
  const TOTAL_ROUNDS = safeInitConfig.totalEnds || (safeInitConfig.round === '360' ? 12 : 10);
  const TOTAL_ARCHERS = safeInitConfig.archerCount || 4;
  const sessionKey = `archeryScores_${safeInitConfig.round}_${safeInitConfig.school}_${getTodayStamp()}`;


  function updateArcherScoreTable(archerIndex) {
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
      
      // Modified to use text inputs for keypad functionality
      row.innerHTML = ` 
        <td class="r-column">${index + 1}</td> 
        <td><input type="text" class="score-input" data-archer="${archerIndex}" data-round="${index}" data-arrow="arrow1" value="${score.arrow1}" readonly></td> 
        <td><input type="text" class="score-input" data-archer="${archerIndex}" data-round="${index}" data-arrow="arrow2" value="${score.arrow2}" readonly></td> 
        <td><input type="text" class="score-input" data-archer="${archerIndex}" data-round="${index}" data-arrow="arrow3" value="${score.arrow3}" readonly></td> 
        <td class="calculated-cell tens-cell">${displayRoundTens}</td> 
        <td class="calculated-cell xs-cell">${displayRoundXs}</td> 
        <td class="calculated-cell end-total-cell">${displayRoundTotal}</td> 
        <td class="calculated-cell running-total-cell">${isComplete ? runningTotal : ''}</td> 
        <td class="calculated-cell avg-cell ${avgClass}">${displayAvg}</td> 
      `; 
      tbody.appendChild(row);
      
      // Update cell colors
      const inputs = row.querySelectorAll('.score-input');
      inputs.forEach(input => {
        updateScoreCellColor(input);
      });
    });
  }
  
  
import { showSetupModal } from './modal.js';
  
  // Initialize function
  function init() {
    console.log("Initializing scorecard with keypad...");
    loadData(safeInitConfig, sessionKey, scores, archerNames, archerSchools, archerGenders, archerTeams, initializeDefaultScores);
    buildTabs();
    buildArcherTables();
    updateTotalsTable();
    highlightCurrentRow();

    const needSetup = archerNames.every(name => /^Archer\s*\d*$/.test(name || ''));
    if (needSetup && TOTAL_ARCHERS > 0) {
        console.log("Showing setup modal...");
        showSetupModal(scores, archerNames, archerSchools, archerGenders, archerTeams, TOTAL_ARCHERS, TOTAL_ROUNDS, saveData, buildTabs, updateTotalsTable, highlightCurrentRow);
    }

    // --- Set up event listeners ---

    // Score input focus/blur listeners
    document.addEventListener('focusin', (e) => {
      if (e.target.classList && e.target.classList.contains('score-input')) {
        handleScoreInputFocus(e.target);
      }
    });

    document.addEventListener('focusout', (e) => {
      if (e.target.classList && e.target.classList.contains('score-input')) {
        handleScoreInputBlur(e.target);
      }
    });

    // Keypad listeners
    const scoreKeypad = document.getElementById('score-keypad');
    if (scoreKeypad) {
      scoreKeypad.addEventListener('click', (e) => handleKeypadClick(e, scores, handleScoreChange));
      scoreKeypad.addEventListener('mousedown', (e) => e.preventDefault()); // Prevent focus loss
    } else {
      console.error("Score keypad element not found!");
    }
    attachButtonListeners(scores, archerNames, archerSchools, archerGenders, archerTeams, calculateTotalScores, getFriendlyDate, TOTAL_ARCHERS, TOTAL_ROUNDS, saveData, buildTabs, buildArcherTables, updateTotalsTable, highlightCurrentRow, sessionKey, initializeDefaultScores, showSetupModal)

    console.log("Scorecard with keypad initialized.");
  }

  // Add CSS styles for score inputs
  function addCustomStyles() {    
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .score-input {
        width: 100%;
        height: 100%;
        padding: 3px;
        margin: 0;
        border: none;
        background-color: transparent;
        text-align: center;
        font-size: 1em;
        font-weight: bold;
        cursor: pointer;
        box-sizing: border-box;
      }
      
      .score-input:focus {
        outline: 2px solid #007bff;
      }
      
      /* Make table cells that contain inputs square and fixed width */
      table td:nth-child(2),
      table td:nth-child(3),
      table td:nth-child(4) {
        width: 45px;
        height: 45px;
        padding: 0;
      }
      
      @media (max-width: 600px) {
        table td:nth-child(2),
        table td:nth-child(3),
        table td:nth-child(4) {
          width: 40px;
          height: 40px;
        }
        
        .score-input {
          font-size: 0.9em;
        }
      }
    `;
    document.head.appendChild(styleElement);
  }
  
  // Call the function to add custom styles
  addCustomStyles();

  // --- Run Initialization ---
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // DOMContentLoaded has already fired
    init();
  }

})(); // --- End IIFE ---