// common.js
// common.js
import { scores, archerNames, archerSchools, archerGenders, archerTeams, currentTab } from './score-core.js';

export function attachButtonListeners(calculateTotalScores, getFriendlyDate, TOTAL_ARCHERS, TOTAL_ROUNDS, saveData, buildTabs, buildArcherTables, updateTotalsTable, highlightCurrentRow, sessionKey, initializeDefaultScores, showSetupModal) {
  // Export buttons
  document.getElementById('copy-totals-button')?.addEventListener('click', () => {
      const today = getFriendlyDate();
    const msg = scores.map((d, i) => {      
      const { runningTotal, totalTens, totalXs } = calculateTotalScores(d);
      const c = d.filter(s => s.arrow1 && s.arrow2 && s.arrow3).length;
      const avg = c > 0 ? (runningTotal / (c * 3)).toFixed(1) : (0).toFixed(1);
      return `${archerNames[i]}\t${archerSchools[i]}\t${archerGenders[i]}\t${archerTeams[i]}\t${totalTens}\t${totalXs}\t${runningTotal}\t${avg}\t${today}`;
    }).join("\r\n");
    navigator.clipboard.writeText(msg).then(() => alert("Copied!"));
  });

  document.getElementById('sms-button')?.addEventListener('click', () => {
      const today = getFriendlyDate();
    const msg = scores.map((d, i) => {      
      const { runningTotal, totalTens, totalXs } = calculateTotalScores(d);
      const c = d.filter(s => s.arrow1 && s.arrow2 && s.arrow3).length;
      const avg = c > 0 ? (runningTotal / (c * 3)).toFixed(1) : (0).toFixed(1);
      return `${archerNames[i]}, ${archerSchools[i]}, ${archerGenders[i]}, ${archerTeams[i]}: ${totalTens}/${totalXs}/${runningTotal}/${avg}/${today}`;
    }).join("\n");
    window.location.href = `sms:14244439811?body=${encodeURIComponent(msg)}`;
  });

  document.getElementById('mail-button')?.addEventListener('click', () => {
      const today = getFriendlyDate();
    const msg = scores.map((d, i) => {      
      const { runningTotal, totalTens, totalXs } = calculateTotalScores(d);
      const c = d.filter(s => s.arrow1 && s.arrow2 && s.arrow3).length;
      const avg = c > 0 ? (runningTotal / (c * 3)).toFixed(1) : (0).toFixed(1);
      return `${archerNames[i]}\t${archerSchools[i]}\t${archerGenders[i]}\t${archerTeams[i]}\t${totalTens}\t${totalXs}\t${runningTotal}\t${avg}\t${today}`;
    }).join("\r\n");
    window.location.href = `mailto:davinciarchers@gmail.com?subject=WDV Scores ${today}&body=${encodeURIComponent(msg)}`;
  });

  // Reset Modal Event Listeners
    console.log("Attaching reset button listener...");
    const resetButton = document.getElementById('reset-button');
    if (resetButton) {
        resetButton.addEventListener('click', () => {
            console.log("Reset button clicked!");
            const modal = document.getElementById('reset-modal');
            if (modal) {
                console.log("Modal found, setting display to block.");
                modal.style.display = 'block';
      } else {
        console.error("Reset modal element (#reset-modal) not found!");
      }
    });
  } else {
    console.error("Reset button element (#reset-button) not found!");
  }

  console.log("Attaching modal button listeners...");
  document.getElementById('modal-reset')?.addEventListener('click', () => {
    console.log("Modal Reset button clicked!");
    if (confirm("Reset all scores and re-enter archer info?")) {
      initializeDefaultScores(TOTAL_ARCHERS, TOTAL_ROUNDS);
      saveData(sessionKey);
      buildTabs(TOTAL_ARCHERS);
      buildArcherTables(TOTAL_ARCHERS);
      updateTotalsTable(TOTAL_ARCHERS);
      highlightCurrentRow();
      const modal = document.getElementById('reset-modal');
      if (modal) modal.style.display = 'none';
      showSetupModal(scores, archerNames, archerSchools, archerGenders, archerTeams, TOTAL_ARCHERS, TOTAL_ROUNDS, saveData, buildTabs, updateTotalsTable, highlightCurrentRow);
    }
  });

  document.getElementById('modal-cancel')?.addEventListener('click', () => {
    console.log("Modal Cancel button clicked!");
    const modal = document.getElementById('reset-modal');
    if (modal) modal.style.display = 'none';
  });

  document.getElementById('modal-sample')?.addEventListener('click', () => {
    console.log("Modal Sample button clicked!");
    initializeDefaultScores(TOTAL_ARCHERS, TOTAL_ROUNDS);
    archerNames.splice(0, archerNames.length, "Bobby", "Mary", "Sam", "Fred");
    archerSchools.splice(0, archerSchools.length, "ABC", "DEF", "GHI", "JKL");
    archerGenders.splice(0, archerGenders.length, "M", "F", "M", "F");
    archerTeams.splice(0, archerTeams.length, "JV", "V", "JV", "V");
    for (let i = 0; i < TOTAL_ARCHERS; i++) {
      for (let j = 0; j < TOTAL_ROUNDS; j++) {        
        scores[i][j] = {
          arrow1: ['8', '9', '10', 'X'][j % 4],
          arrow2: ['7', '10', 'M', 'X'][j % 4],
          arrow3: ['9', 'X', '8', '10'][j % 4],
        };
      }
    }
    saveData(sessionKey);
    buildTabs(TOTAL_ARCHERS);
    buildArcherTables(TOTAL_ARCHERS);
    updateTotalsTable(TOTAL_ARCHERS);
    highlightCurrentRow();
    const modal = document.getElementById('reset-modal');
    if (modal) modal.style.display = 'none';
  });
}