// score-with-keypad.js
// Enhanced version of score.js with keypad functionality
// Based on WDV archery scorecard code

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

  // Keypad variables
  let currentlyFocusedInput = null;
  let blurTimeout = null;

  // Arrays for friendly date formatting
  const dayAbbr = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthAbbr = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  function getTodayStamp() {
    const today = new Date(); 
    return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  }
  
  function getFriendlyDate() {
    const date = new Date();
    return `${dayAbbr[date.getDay()]} ${monthAbbr[date.getMonth()]} ${date.getDate()} ${date.getFullYear()}`;
  }
  
  function initializeDefaultScores() {
    return Array.from({ length: TOTAL_ARCHERS }, () => 
      Array.from({ length: TOTAL_ROUNDS }, () => ({ arrow1: '', arrow2: '', arrow3: '' }))
    );
  }
  
  function loadData() {
    const stored = localStorage.getItem(sessionKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        scores = (Array.isArray(parsed.scores) && parsed.scores.length === TOTAL_ARCHERS) ? parsed.scores : initializeDefaultScores();
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
        scores = initializeDefaultScores(); 
        archerNames = (safeInitConfig.defaultArcherNames.length === TOTAL_ARCHERS) ? safeInitConfig.defaultArcherNames.slice() : new Array(TOTAL_ARCHERS).fill("Archer"); 
        archerSchools = new Array(TOTAL_ARCHERS).fill(""); 
        archerGenders = new Array(TOTAL_ARCHERS).fill("M"); 
        archerTeams = new Array(TOTAL_ARCHERS).fill("JV"); 
        localStorage.removeItem(sessionKey); 
      }
    } else { 
      scores = initializeDefaultScores(); 
      archerNames = (safeInitConfig.defaultArcherNames.length === TOTAL_ARCHERS) ? safeInitConfig.defaultArcherNames.slice() : new Array(TOTAL_ARCHERS).fill("Archer"); 
      archerSchools = new Array(TOTAL_ARCHERS).fill(""); 
      archerGenders = new Array(TOTAL_ARCHERS).fill("M"); 
      archerTeams = new Array(TOTAL_ARCHERS).fill("JV"); 
    }
  }
  
  function saveData() {
    try { 
      localStorage.setItem(sessionKey, JSON.stringify({ scores, archerNames, archerSchools, archerGenders, archerTeams })); 
    } catch (e) { 
      console.error("Error saving data:", e); 
      alert("Could not save scores."); 
    }
  }
  
  function buildTabs() {
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
  
  function buildArcherTables() {
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
      updateArcherScoreTable(i); 
    }
  }
  
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
  
  function updateTotalsTable() {
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
        <td>${archerNames[i] || `Archer ${i+1}`}</td> 
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
  
  function handleScoreChange() {
    updateArcherScoreTable(currentTab); 
    updateTotalsTable(); 
    highlightCurrentRow(); 
    saveData();
  }
  
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
  
  function dropdown(archer, round, arrow, selectedValue) {
    const options = ['--', 'M', ...Array.from({ length: 10 }, (_, i) => (i + 1).toString()), 'X']; 
    const currentVal = options.includes(String(selectedValue)) ? selectedValue : '--'; 
    return `<select data-archer="${archer}" data-round="${round}" data-arrow="${arrow}"> ${options.map(val => `<option value="${val}" ${String(val) === String(currentVal) ? 'selected' : ''}>${val}</option>`).join('')} </select>`;
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
  
  function showSetupModal() {
    if (document.getElementById('setup-modal')) return; 
    
    // Create the modal HTML with improved design
    let modalHtml = ` 
      <div class="modal" id="setup-modal" style="display:block;"> 
        <div class="modal-content setup-modal-content"> 
          <h2>Enter Archer Information</h2>
          <p class="setup-instructions">Please enter information for all archers in your team</p>
          <form id="setup-form"> 
            <div class="archer-grid">
    `; 
    
    // Create archer cards
    for (let i = 0; i < TOTAL_ARCHERS; i++) { 
      modalHtml += ` 
        <div class="archer-card">
          <div class="archer-card-header">Archer ${i + 1}</div>
          <div class="archer-card-body">
            <div class="archer-field">
              <label for="archer-name-${i}">Name:</label> 
              <input type="text" id="archer-name-${i}" value="${archerNames[i] || ''}" placeholder="Archer Name" required> 
            </div>
            
            <div class="archer-field">
              <label for="archer-school-${i}">School:</label> 
              <input type="text" id="archer-school-${i}" value="${archerSchools[i] || ''}" placeholder="SCH" maxlength="3"> 
            </div>
            
            <div class="archer-field-group">
              <div class="archer-field">
                <label for="archer-gender-${i}">Gender:</label> 
                <select id="archer-gender-${i}"> 
                  <option value="M" ${archerGenders[i] === 'M' ? 'selected' : ''}>M</option> 
                  <option value="F" ${archerGenders[i] === 'F' ? 'selected' : ''}>F</option> 
                </select> 
              </div>
              
              <div class="archer-field">
                <label for="archer-team-${i}">Team:</label> 
                <select id="archer-team-${i}"> 
                  <option value="JV" ${archerTeams[i] === 'JV' ? 'selected' : ''}>JV</option> 
                  <option value="V" ${archerTeams[i] === 'V' ? 'selected' : ''}>V</option> 
                </select> 
              </div>
            </div>
          </div>
        </div>
      `; 
    } 
    
    modalHtml += ` 
            </div>
            <div class="setup-buttons"> 
              <button type="submit" id="setup-save">Save & Start Scoring</button> 
            </div> 
          </form> 
        </div> 
      </div> 
    `; 
    
    // Inject the modal into the DOM
    document.body.insertAdjacentHTML('beforeend', modalHtml); 
    
    // Add setup modal-specific CSS
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .setup-modal-content {
        max-width: 800px;
      }
      
      .setup-instructions {
        text-align: center;
        margin-bottom: 20px;
        color: #555;
      }
      
      .archer-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 15px;
        margin-bottom: 25px;
      }
      
      .archer-card {
        border: 1px solid #ddd;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      
      .archer-card-header {
        background-color: #007BFF;
        color: white;
        padding: 10px;
        font-weight: bold;
        text-align: center;
      }
      
      .archer-card:nth-child(2) .archer-card-header {
        background-color: #FF5733;
      }
      
      .archer-card:nth-child(3) .archer-card-header {
        background-color: #28A745;
      }
      
      .archer-card:nth-child(4) .archer-card-header {
        background-color: #FFC300;
      }
      
      .archer-card-body {
        padding: 15px;
      }
      
      .archer-field {
        margin-bottom: 12px;
      }
      
      .archer-field label {
        display: block;
        margin-bottom: 5px;
        font-weight: bold;
        color: #444;
      }
      
      .archer-field input,
      .archer-field select {
        width: 100%;
        padding: 8px;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 1em;
      }
      
      .archer-field-group {
        display: flex;
        gap: 10px;
      }
      
      .archer-field-group .archer-field {
        flex: 1;
      }
      
      .setup-buttons {
        text-align: center;
      }
      
      #setup-save {
        background-color: #28A745;
        color: white;
        border: none;
        padding: 12px 25px;
        font-size: 1.1em;
        border-radius: 5px;
        cursor: pointer;
        transition: background-color 0.2s;
      }
      
      #setup-save:hover {
        background-color: #218838;
      }
      
      /* Responsive adjustments */
      @media (max-width: 768px) {
        .archer-grid {
          grid-template-columns: 1fr;
        }
        
        .setup-modal-content {
          width: 95%;
        }
      }
    `;
    document.head.appendChild(styleElement);
    
    // Add event listener to the setup form
    const setupForm = document.getElementById('setup-form'); 
    if(setupForm) { 
      setupForm.addEventListener('submit', function (e) { 
        e.preventDefault(); 
        for (let i = 0; i < TOTAL_ARCHERS; i++) { 
          archerNames[i] = document.getElementById(`archer-name-${i}`).value.trim() || `Archer ${i+1}`; 
          archerSchools[i] = document.getElementById(`archer-school-${i}`).value.trim().toUpperCase(); 
          archerGenders[i] = document.getElementById(`archer-gender-${i}`).value; 
          archerTeams[i] = document.getElementById(`archer-team-${i}`).value; 
        } 
        const modalElement = document.getElementById('setup-modal'); 
        if (modalElement) modalElement.remove(); 
        saveData(); 
        buildTabs(); 
        updateTotalsTable(); 
        highlightCurrentRow(); 
      }); 
    }
  }

  // --- KEYPAD FUNCTIONS ---
  
  // Handle score input focus
  function handleScoreInputFocus(inputElement) {
    console.log(`Focus on: ${inputElement.value}`);
    currentlyFocusedInput = inputElement;
    if (blurTimeout) {
      clearTimeout(blurTimeout);
      blurTimeout = null;
    }
    const scoreKeypad = document.getElementById('score-keypad');
    if (scoreKeypad) scoreKeypad.style.display = 'grid';
    inputElement.select();
  }
  
  // Handle score input blur
  function handleScoreInputBlur(inputElement) {
    console.log(`Blur from: ${inputElement.value}`);
    if (blurTimeout) clearTimeout(blurTimeout);
    
    blurTimeout = setTimeout(() => {
      const activeElement = document.activeElement;
      const scoreKeypad = document.getElementById('score-keypad');
      const isKeypadButton = scoreKeypad && activeElement && 
                            scoreKeypad.contains(activeElement) && 
                            activeElement.tagName === 'BUTTON';
      const isScoreInput = activeElement && 
                          activeElement.tagName === 'INPUT' && 
                          activeElement.classList.contains('score-input');
      
      if (!isKeypadButton && !isScoreInput) {
        console.log("Focus moved outside keypad/inputs, hiding keypad.");
        if (scoreKeypad) scoreKeypad.style.display = 'none';
        currentlyFocusedInput = null;
      } else {
        console.log("Focus still within keypad or inputs, not hiding keypad.");
      }
      blurTimeout = null;
    }, 150);
  }
  
  // Handle keypad click
  function handleKeypadClick(event) {
    const button = event.target.closest('button');
    const scoreKeypad = document.getElementById('score-keypad');
    
    if (!button || !scoreKeypad || !scoreKeypad.contains(button)) return;
    
    const value = button.dataset.value;
    const action = button.dataset.action;
    console.log(`Keypad clicked: value=${value}, action=${action}`);
    
    if (value !== undefined && currentlyFocusedInput) {
      currentlyFocusedInput.value = value;
      
      // Update the scores array
      const archer = parseInt(currentlyFocusedInput.dataset.archer);
      const round = parseInt(currentlyFocusedInput.dataset.round);
      const arrow = currentlyFocusedInput.dataset.arrow;
      
      if (!isNaN(archer) && !isNaN(round) && arrow) {
        scores[archer][round][arrow] = value;
        updateScoreCellColor(currentlyFocusedInput);
        handleScoreChange();
      }
      
      focusNextInput(currentlyFocusedInput);
    } else if (action && currentlyFocusedInput) {
      switch (action) {
        case 'next':
          focusNextInput(currentlyFocusedInput);
          break;
        case 'back':
          focusPreviousInput(currentlyFocusedInput);
          break;
        case 'clear':
          currentlyFocusedInput.value = '';
          
          // Update the scores array
          const archer = parseInt(currentlyFocusedInput.dataset.archer);
          const round = parseInt(currentlyFocusedInput.dataset.round);
          const arrow = currentlyFocusedInput.dataset.arrow;
          
          if (!isNaN(archer) && !isNaN(round) && arrow) {
            scores[archer][round][arrow] = '';
            updateScoreCellColor(currentlyFocusedInput);
            handleScoreChange();
          }
          
          currentlyFocusedInput.focus();
          break;
        case 'close':
          if (scoreKeypad) scoreKeypad.style.display = 'none';
          if (currentlyFocusedInput) currentlyFocusedInput.blur();
          currentlyFocusedInput = null;
          break;
      }
    } else if (action === 'close') {
      if (scoreKeypad) scoreKeypad.style.display = 'none';
      currentlyFocusedInput = null;
    }
  }
  
  // Focus next input
  function focusNextInput(currentInput) {
    const inputs = Array.from(document.querySelectorAll('.score-input'));
    const currentIndex = inputs.findIndex(input => input === currentInput);
    
    if (currentIndex !== -1 && currentIndex < inputs.length - 1) {
      const nextInput = inputs[currentIndex + 1];
      if (nextInput) nextInput.focus();
    } else {
      const scoreKeypad = document.getElementById('score-keypad');
      if (scoreKeypad) scoreKeypad.style.display = 'none';
      if (currentInput) currentInput.blur();
      currentlyFocusedInput = null;
      console.log("Reached last input field.");
    }
  }
  
  // Focus previous input
  function focusPreviousInput(currentInput) {
    const inputs = Array.from(document.querySelectorAll('.score-input'));
    const currentIndex = inputs.findIndex(input => input === currentInput);
    
    if (currentIndex > 0) {
      const prevInput = inputs[currentIndex - 1];
      if (prevInput) prevInput.focus();
    }
  }
  
  // Update cell color based on score value
  function updateScoreCellColor(inputElement) {
    if (!inputElement) return;
    
    const cell = inputElement.parentElement;
    if (!cell || cell.tagName !== 'TD') return;
    
    const scoreValue = inputElement.value.trim().toUpperCase();
    let scoreClass = 'score-empty';
    
    if (scoreValue === 'X' || scoreValue === '10') {
      scoreClass = 'score-x';
    } else if (scoreValue === '9') {
      scoreClass = 'score-9';
    } else if (scoreValue === '8') {
      scoreClass = 'score-8';
    } else if (scoreValue === '7') {
      scoreClass = 'score-7';
    } else if (scoreValue === '6') {
      scoreClass = 'score-6';
    } else if (scoreValue === '5') {
      scoreClass = 'score-5';
    } else if (scoreValue === '4') {
      scoreClass = 'score-4';
    } else if (scoreValue === '3') {
      scoreClass = 'score-3';
    } else if (scoreValue === '2') {
      scoreClass = 'score-2';
    } else if (scoreValue === '1') {
      scoreClass = 'score-1';
    } else if (scoreValue === 'M') {
      scoreClass = 'score-m';
    }
    
    cell.className = cell.className.replace(/score-\S+/g, '').trim();
    if (scoreClass !== 'score-empty') {
      cell.classList.add(scoreClass);
    }
  }
  
  // Initialize function
  function init() {
    console.log("Initializing scorecard with keypad...");
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
      scoreKeypad.addEventListener('click', handleKeypadClick);
      scoreKeypad.addEventListener('mousedown', (e) => e.preventDefault()); // Prevent focus loss
    } else {
      console.error("Score keypad element not found!");
    }

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
        scores = initializeDefaultScores();
        archerNames = new Array(TOTAL_ARCHERS).fill("Archer");
        archerSchools = new Array(TOTAL_ARCHERS).fill("");
        archerGenders = new Array(TOTAL_ARCHERS).fill("M");
        archerTeams = new Array(TOTAL_ARCHERS).fill("JV");
        saveData();
        buildTabs();
        buildArcherTables();
        updateTotalsTable();
        highlightCurrentRow();
        const modal = document.getElementById('reset-modal');
        if (modal) modal.style.display = 'none';
        showSetupModal();
      }
    });

    document.getElementById('modal-cancel')?.addEventListener('click', () => {
      console.log("Modal Cancel button clicked!");
      const modal = document.getElementById('reset-modal');
      if (modal) modal.style.display = 'none';
    });

    document.getElementById('modal-sample')?.addEventListener('click', () => {
      console.log("Modal Sample button clicked!");
      scores = initializeDefaultScores();
      archerNames = ["Bobby", "Mary", "Sam", "Fred"];
      archerSchools = ["ABC", "DEF", "GHI", "JKL"];
      archerGenders = ["M", "F", "M", "F"];
      archerTeams = ["JV", "V", "JV", "V"];
      for (let i = 0; i < TOTAL_ARCHERS; i++) {
        for (let j = 0; j < TOTAL_ROUNDS; j++) {
          scores[i][j] = {
            arrow1: ['8', '9', '10', 'X'][j % 4],
            arrow2: ['7', '10', 'M', 'X'][j % 4],
            arrow3: ['9', 'X', '8', '10'][j % 4],
          };
        }
      }
      saveData();
      buildTabs();
      buildArcherTables();
      updateTotalsTable();
      highlightCurrentRow();
      const modal = document.getElementById('reset-modal');
      if (modal) modal.style.display = 'none';
    });

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