import { init, handleScoreChange, scores, getFriendlyDate, calculateTotalScores, initializeDefaultScores, saveData, buildTabs, buildArcherTables, updateTotalsTable, highlightCurrentRow } from './score-core.js';
import { initializeKeypad } from './keypad.js';
import { attachButtonListeners } from './common.js';
import { showSetupModal } from './modal.js';

const initConfig = {
  archerCount: 4,
  round: '360',
  school: 'WDV',
  defaultArcherNames: ['Archer 1', 'Archer 2', 'Archer 3', 'Archer 4'],
  totalEnds:10
};

const {sessionKey, TOTAL_ARCHERS, TOTAL_ROUNDS} = init(initConfig);

initializeKeypad(scores, () => handleScoreChange(TOTAL_ARCHERS, TOTAL_ROUNDS));
attachButtonListeners(calculateTotalScores, getFriendlyDate, TOTAL_ARCHERS, TOTAL_ROUNDS, saveData, buildTabs, buildArcherTables, updateTotalsTable, highlightCurrentRow, sessionKey, initializeDefaultScores, showSetupModal);