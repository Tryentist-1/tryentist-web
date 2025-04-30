// JavaScript logic specific to the Team Round Scorecard (team_round.html)
// Complete version with all enhancements - FINAL FIX

(function () { // Wrap in an IIFE
    console.log("Team Round Scorecard JS loaded with all enhancements");

    // --- Configuration ---
    const config = { round: 'Team' };

    // --- Helper Function: Get Date Stamp / Friendly Date ---
    function getTodayStamp() { 
        const today = new Date(); 
        const month = String(today.getMonth() + 1).padStart(2, '0'); 
        const day = String(today.getDate()).padStart(2, '0'); 
        return `${today.getFullYear()}-${month}-${day}`; 
    }
    
    const dayAbbr = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]; 
    const monthAbbr = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]; 
    
    function getFriendlyDate() { 
        const date = new Date(); 
        return `${dayAbbr[date.getDay()]} ${monthAbbr[date.getMonth()]} ${date.getDate()} ${date.getFullYear()}`; 
    }

    // --- State Variables ---
    let shootOffWinnerOverride = null;
    let currentlyFocusedInput = null; // For keypad
    let blurTimeout = null; // For keypad

    // Updated archer name format with first and last name 
    let team1ArcherNames = [
        {first: "", last: ""}, 
        {first: "", last: ""}, 
        {first: "", last: ""}
    ]; 

    let team2ArcherNames = [
        {first: "", last: ""}, 
        {first: "", last: ""}, 
        {first: "", last: ""}
    ]; 

    // --- Get Element References ---
    // IMPORTANT FIX: Declare these variables at module level but initialize them later
    let setupModal, setupForm, setupSubmitButton;
    let setupT1School, setupT1Gender, setupT1Level, setupT1Group;
    let setupT2School, setupT2Gender, setupT2Level, setupT2Group;
    let scorecardMain, matchInfoInputsDiv, matchInfoDisplayDiv;
    let t1SummarySpan, t2SummarySpan, editSetupButton;
    let t1HeaderName, t2HeaderName;
    let t1ArcherNamesDisplay, t2ArcherNamesDisplay;
    let t1SchoolInput, t1GenderInput, t1LevelInput, t1GroupInput;
    let t2SchoolInput, t2GenderInput, t2LevelInput, t2GroupInput;
    let scoreTable, calculateButton, resetButton, shootOffRow;
    let matchResultElement, soWinnerText, tieBreakerControls;
    let t1SoWinButton, t2SoWinButton;
    let scoreKeypad, dateDisplayElement;

    // Function to initialize all DOM references - call this after DOM is ready
    function initDOMReferences() {
        // Setup Modal Elements
        setupModal = document.getElementById('team-setup-modal'); 
        setupForm = document.getElementById('team-setup-form'); 
        setupSubmitButton = document.getElementById('setup-start-scoring-button');
        
        setupT1School = document.getElementById('setup-t1-school'); 
        setupT1Gender = document.getElementById('setup-t1-gender'); 
        setupT1Level = document.getElementById('setup-t1-level'); 
        setupT1Group = document.getElementById('setup-t1-group');
        
        setupT2School = document.getElementById('setup-t2-school'); 
        setupT2Gender = document.getElementById('setup-t2-gender'); 
        setupT2Level = document.getElementById('setup-t2-level'); 
        setupT2Group = document.getElementById('setup-t2-group');
        
        // Main Scorecard Elements
        scorecardMain = document.getElementById('scorecard-main'); 
        matchInfoInputsDiv = document.querySelector('.match-info'); 
        matchInfoDisplayDiv = document.querySelector('.match-info-display'); 
        t1SummarySpan = document.getElementById('t1-summary'); 
        t2SummarySpan = document.getElementById('t2-summary'); 
        editSetupButton = document.getElementById('edit-setup-button'); 
        t1HeaderName = document.getElementById('t1-header-name'); 
        t2HeaderName = document.getElementById('t2-header-name');
        t1ArcherNamesDisplay = document.getElementById('t1-archer-names-display'); 
        t2ArcherNamesDisplay = document.getElementById('t2-archer-names-display');

        // Original hidden input references (for team info)
        t1SchoolInput = document.getElementById('t1-school'); 
        t1GenderInput = document.getElementById('t1-gender'); 
        t1LevelInput = document.getElementById('t1-level'); 
        t1GroupInput = document.getElementById('t1-group');
        t2SchoolInput = document.getElementById('t2-school'); 
        t2GenderInput = document.getElementById('t2-gender'); 
        t2LevelInput = document.getElementById('t2-level'); 
        t2GroupInput = document.getElementById('t2-group');

        // Other elements
        scoreTable = document.getElementById('team_round_table'); 
        calculateButton = document.getElementById('calculate-button'); 
        resetButton = document.getElementById('reset-button'); 
        shootOffRow = document.getElementById('shoot-off');
        matchResultElement = document.getElementById('match-result'); 
        soWinnerText = document.getElementById('so-winner-text'); 
        tieBreakerControls = document.querySelector('.tie-breaker-controls'); 
        t1SoWinButton = document.getElementById('t1-so-win-button'); 
        t2SoWinButton = document.getElementById('t2-so-win-button');
        scoreKeypad = document.getElementById('score-keypad');
        dateDisplayElement = document.getElementById('current-date-display');
    }

    // --- Helper Function: Generate Session Key ---
    function getSessionKey() { 
        const schoolAbbr = (t1SchoolInput?.value?.trim().toUpperCase() || "NOSCHOOL").substring(0, 3); 
        const todayStamp = getTodayStamp(); 
        return `archeryScores_${config.round}_${schoolAbbr}_${todayStamp}`; 
    }

    // --- Initial Setup ---
    function initializeApp() {
        console.log("Initializing App...");
        
        // Initialize all DOM references first
        initDOMReferences();
        
        console.log("Element check on initialization:", {
            setupModal: !!setupModal,
            scorecardMain: !!scorecardMain,
            setupForm: !!setupForm,
            setupSubmitButton: !!setupSubmitButton,
            setupT1School: !!setupT1School,
            setupT2School: !!setupT2School
        });
        
        // Hide elements
        if (shootOffRow) shootOffRow.style.display = 'none'; 
        if (tieBreakerControls) tieBreakerControls.style.display = 'none'; 
        if (matchInfoDisplayDiv) matchInfoDisplayDiv.style.display = 'none'; 
        if (matchInfoInputsDiv) matchInfoInputsDiv.style.display = 'none'; 
        if (scoreKeypad) scoreKeypad.style.display = 'none';
        
        // Display Date
        if (dateDisplayElement) {
            dateDisplayElement.textContent = getFriendlyDate();
        } else {
            console.warn("Date display element not found");
        }
        
        // Load data or show setup
        const loadedData = loadDataFromLocalStorage();
        console.log("Loaded data:", loadedData);
        console.log("Is team info valid:", loadedData && isTeamInfoValid(loadedData));
        
        if (loadedData && isTeamInfoValid(loadedData)) { 
            console.log("Valid team info found."); 
            populateHiddenInputs(loadedData); 
            displaySummaryInfo(); 
            if (scorecardMain) {
                scorecardMain.style.display = 'block'; 
                console.log("scorecardMain shown, display:", scorecardMain.style.display);
            }
            if (setupModal) {
                setupModal.style.display = 'none'; 
                console.log("setupModal hidden, display:", setupModal.style.display);
            }
            calculateAllScores(); 
        }
        else { 
            console.log("No valid team info. Showing setup modal."); 
            setDefaultSetupModalValues(); 
            if (setupModal) {
                setupModal.style.display = 'block'; 
                console.log("setupModal shown, display:", setupModal.style.display);
            }
            if (scorecardMain) {
                scorecardMain.style.display = 'none'; 
                console.log("scorecardMain hidden, display:", scorecardMain.style.display);
            }
        }
        
        // Attach Listeners
        attachEventListeners();
    }

    // --- Attach Event Listeners ---
    function attachEventListeners() {
        console.log("Attempting to attach event listeners...");
        
        // Auto-calculate on score input (no need for Calculate button)
        if (scoreTable) { 
            console.log("Attaching delegated listener to scoreTable..."); 
            scoreTable.addEventListener('focusin', (event) => { 
                if (event.target.tagName === 'INPUT' && event.target.type === 'text' && event.target.readOnly && event.target.id.includes('-a')) { 
                    handleScoreInputFocus(event.target); 
                } 
            }); 
            
            scoreTable.addEventListener('focusout', (event) => { 
                if (event.target.tagName === 'INPUT' && event.target.type === 'text' && event.target.readOnly && event.target.id.includes('-a')) { 
                    handleScoreInputBlur(event.target); 
                } 
            }); 
            
            // Auto-calculate on input
            scoreTable.addEventListener('input', (event) => { 
                if (event.target.tagName === 'INPUT' && event.target.type === 'text' && event.target.id.includes('-a')) { 
                    calculateAllScores(); 
                } 
            }); 
        } else { 
            console.error("Score table not found!"); 
        }
        
        // Keypad Listener
        if (scoreKeypad) { 
            console.log("Attaching listener to scoreKeypad..."); 
            scoreKeypad.addEventListener('click', handleKeypadClick); 
            scoreKeypad.addEventListener('mousedown', (event) => { 
                event.preventDefault(); 
            }); 
        } else { 
            console.error("Score keypad not found!"); 
        }
        
        // Other listeners
        [t1SchoolInput, t1GenderInput, t1LevelInput, t1GroupInput, t2SchoolInput, t2GenderInput, t2LevelInput, t2GroupInput].forEach(input => { 
            if(input) input.addEventListener('change', saveDataToLocalStorage); 
        });
        
        if (t1SoWinButton) t1SoWinButton.addEventListener('click', () => handleTieBreakerWin('t1')); 
        if (t2SoWinButton) t2SoWinButton.addEventListener('click', () => handleTieBreakerWin('t2'));
        
        // Setup Form Listener
        if (setupForm) { 
            console.log("Setup form found. Attaching submit listener..."); 
            setupForm.addEventListener('submit', handleSetupSubmit); 
        } else { 
            console.error("Setup form not found!"); 
        }
        
        if (editSetupButton) editSetupButton.addEventListener('click', handleEditSetup);
        console.log("attachEventListeners function finished.");
    }

    // --- Setup Modal Logic ---
    function handleSetupSubmit(event) { 
        try {
            event.preventDefault(); 
            console.log("handleSetupSubmit triggered!"); 
            
            // Process the form data with split name fields
            const setupData = { 
                t1School: setupT1School ? setupT1School.value : '',
                t1Gender: setupT1Gender ? setupT1Gender.value : 'M',
                t1Level: setupT1Level ? setupT1Level.value : 'JV',
                t1Group: setupT1Group ? setupT1Group.value : '',
                t2School: setupT2School ? setupT2School.value : '',
                t2Gender: setupT2Gender ? setupT2Gender.value : 'M',
                t2Level: setupT2Level ? setupT2Level.value : 'JV',
                t2Group: setupT2Group ? setupT2Group.value : '',
                
                // Process split name fields for Team 1
                t1ArcherNames: [ 
                    {
                        first: document.getElementById('setup-t1-archer1-first')?.value.trim() || '', 
                        last: document.getElementById('setup-t1-archer1-last')?.value.trim() || ''
                    },
                    {
                        first: document.getElementById('setup-t1-archer2-first')?.value.trim() || '', 
                        last: document.getElementById('setup-t1-archer2-last')?.value.trim() || ''
                    },
                    {
                        first: document.getElementById('setup-t1-archer3-first')?.value.trim() || '', 
                        last: document.getElementById('setup-t1-archer3-last')?.value.trim() || ''
                    }
                ], 
                
                // Process split name fields for Team 2
                t2ArcherNames: [ 
                    {
                        first: document.getElementById('setup-t2-archer1-first')?.value.trim() || '', 
                        last: document.getElementById('setup-t2-archer1-last')?.value.trim() || ''
                    },
                    {
                        first: document.getElementById('setup-t2-archer2-first')?.value.trim() || '', 
                        last: document.getElementById('setup-t2-archer2-last')?.value.trim() || ''
                    },
                    {
                        first: document.getElementById('setup-t2-archer3-first')?.value.trim() || '', 
                        last: document.getElementById('setup-t2-archer3-last')?.value.trim() || ''
                    }
                ],
                scores: {}, 
                shootOffWinnerOverride: null 
            }; 
            
            console.log("Setup data read:", setupData); 
            populateHiddenInputs(setupData); 
            console.log("Hidden inputs & state populated."); 
            saveDataToLocalStorage(); 
            console.log("Data saved."); 
            
            if (setupModal) { 
                setupModal.style.display = 'none'; 
                console.log("Setup modal hidden."); 
            } else {
                console.error("setupModal not found when trying to hide it");
            }
            
            if (scorecardMain) { 
                scorecardMain.style.display = 'block'; 
                console.log("Scorecard main shown."); 
            } else {
                console.error("scorecardMain not found when trying to show it");
            }
            
            displaySummaryInfo(); 
            console.log("Summary info displayed."); 
            calculateAllScores(); 
            console.log("Initial calculation called after setup."); 
        } catch (error) {
            console.error("Error in handleSetupSubmit:", error);
            alert("Error submitting team setup: " + error.message);
        }
    }
    
    function handleEditSetup() { 
        console.log("Edit setup clicked."); 
        
        // Handle team info fields
        if(setupT1School && t1SchoolInput) setupT1School.value = t1SchoolInput.value; 
        if(setupT1Gender && t1GenderInput) setupT1Gender.value = t1GenderInput.value; 
        if(setupT1Level && t1LevelInput) setupT1Level.value = t1LevelInput.value; 
        if(setupT1Group && t1GroupInput) setupT1Group.value = t1GroupInput.value; 
        
        if(setupT2School && t2SchoolInput) setupT2School.value = t2SchoolInput.value; 
        if(setupT2Gender && t2GenderInput) setupT2Gender.value = t2GenderInput.value; 
        if(setupT2Level && t2LevelInput) setupT2Level.value = t2LevelInput.value; 
        if(setupT2Group && t2GroupInput) setupT2Group.value = t2GroupInput.value; 
        
        // Handle split name fields for Team 1
        for (let i = 0; i < 3; i++) {
            const firstName = document.getElementById(`setup-t1-archer${i+1}-first`);
            const lastName = document.getElementById(`setup-t1-archer${i+1}-last`);
            
            if (firstName && lastName && team1ArcherNames[i]) {
                firstName.value = team1ArcherNames[i].first || '';
                lastName.value = team1ArcherNames[i].last || '';
            }
        }
        
        // Handle split name fields for Team 2
        for (let i = 0; i < 3; i++) {
            const firstName = document.getElementById(`setup-t2-archer${i+1}-first`);
            const lastName = document.getElementById(`setup-t2-archer${i+1}-last`);
            
            if (firstName && lastName && team2ArcherNames[i]) {
                firstName.value = team2ArcherNames[i].first || '';
                lastName.value = team2ArcherNames[i].last || '';
            }
        }
        
        if (setupModal) setupModal.style.display = 'block'; 
        if (matchInfoDisplayDiv) matchInfoDisplayDiv.style.display = 'none'; 
        if (scorecardMain) scorecardMain.style.display = 'none'; 
    }
    
    function populateHiddenInputs(data) { 
        if(t1SchoolInput) t1SchoolInput.value = data.t1School || ''; 
        if(t1GenderInput) t1GenderInput.value = data.t1Gender || 'M'; 
        if(t1LevelInput) t1LevelInput.value = data.t1Level || 'JV'; 
        if(t1GroupInput) t1GroupInput.value = data.t1Group || ''; 
        if(t2SchoolInput) t2SchoolInput.value = data.t2School || ''; 
        if(t2GenderInput) t2GenderInput.value = data.t2Gender || 'M'; 
        if(t2LevelInput) t2LevelInput.value = data.t2Level || 'JV'; 
        if(t2GroupInput) t2GroupInput.value = data.t2Group || ''; 
        
        shootOffWinnerOverride = data.shootOffWinnerOverride || null; 
        team1ArcherNames = data.t1ArcherNames || [{first:'', last:''}, {first:'', last:''}, {first:'', last:''}]; 
        team2ArcherNames = data.t2ArcherNames || [{first:'', last:''}, {first:'', last:''}, {first:'', last:''}]; 
    }
    
    function displaySummaryInfo() { 
        // Create team summary strings
        const team1Str = `${t1SchoolInput?.value || ''}-${t1GenderInput?.value || ''}-${t1LevelInput?.value || ''}-${t1GroupInput?.value || ''}`; 
        const team2Str = `${t2SchoolInput?.value || ''}-${t2GenderInput?.value || ''}-${t2LevelInput?.value || ''}-${t2GroupInput?.value || ''}`; 
        
        // Update display elements
        if (t1SummarySpan) t1SummarySpan.textContent = team1Str; 
        if (t2SummarySpan) t2SummarySpan.textContent = team2Str; 
        if (t1HeaderName) t1HeaderName.textContent = team1Str; 
        if (t2HeaderName) t2HeaderName.textContent = team2Str; 
        
        // Format archer names as "First Last_Initial"
        if (t1ArcherNamesDisplay) {
            const formattedNames = team1ArcherNames
                .filter(archer => archer.first || archer.last)
                .map(archer => {
                    const firstName = archer.first || '';
                    const lastInitial = archer.last ? archer.last.charAt(0) : '';
                    return `${firstName}${lastInitial ? ' ' + lastInitial : ''}`;
                })
                .join(' | ');
            
            t1ArcherNamesDisplay.textContent = formattedNames || "No Archers";
        }
        
        if (t2ArcherNamesDisplay) {
            const formattedNames = team2ArcherNames
                .filter(archer => archer.first || archer.last)
                .map(archer => {
                    const firstName = archer.first || '';
                    const lastInitial = archer.last ? archer.last.charAt(0) : '';
                    return `${firstName}${lastInitial ? ' ' + lastInitial : ''}`;
                })
                .join(' | ');
            
            t2ArcherNamesDisplay.textContent = formattedNames || "No Archers";
        }
        
        // Add New Round button if it doesn't exist
        if (matchInfoDisplayDiv) {
            // Check if New Round button already exists
            if (!document.getElementById('new-round-button')) {
                const newRoundButton = document.createElement('button');
                newRoundButton.id = 'new-round-button';
                newRoundButton.textContent = 'New Round';
                newRoundButton.addEventListener('click', resetFormAndStorage);
                
                // Insert button at the beginning of the match info display
                matchInfoDisplayDiv.insertBefore(newRoundButton, matchInfoDisplayDiv.firstChild);
            }
            
            matchInfoDisplayDiv.style.display = 'flex';
        }
        
        if (matchInfoInputsDiv) matchInfoInputsDiv.style.display = 'none'; 
    }
    
    function isTeamInfoValid(data) { 
        return data && data.t1School && data.t2School; 
    }
    
    function setDefaultSetupModalValues() { 
        if(setupT1School) setupT1School.value = 'WDV'; 
        if(setupT1Gender) setupT1Gender.value = 'M'; 
        if(setupT1Level) setupT1Level.value = 'JV'; 
        if(setupT1Group) setupT1Group.value = '01'; 
        
        // Clear all archer name fields for Team 1
        for (let i = 1; i <= 3; i++) {
            const firstNameField = document.getElementById(`setup-t1-archer${i}-first`);
            const lastNameField = document.getElementById(`setup-t1-archer${i}-last`);
            
            if(firstNameField) firstNameField.value = '';
            if(lastNameField) lastNameField.value = '';
        }
        
        if(setupT2School) setupT2School.value = 'OPP'; 
        if(setupT2Gender) setupT2Gender.value = 'M'; 
        if(setupT2Level) setupT2Level.value = 'JV'; 
        if(setupT2Group) setupT2Group.value = '01';
        
        // Clear all archer name fields for Team 2 
        for (let i = 1; i <= 3; i++) {
            const firstNameField = document.getElementById(`setup-t2-archer${i}-first`);
            const lastNameField = document.getElementById(`setup-t2-archer${i}-last`);
            
            if(firstNameField) firstNameField.value = '';
            if(lastNameField) lastNameField.value = '';
        }
    }
    
    function isEndComplete(endNum) { 
        for (let t=1; t<=2; t++) { 
            for (let a=1; a<=6; a++) { 
                const i=document.getElementById(`t${t}-e${endNum}-a${a}`); 
                if (!i || i.value.trim()==='') return false; 
            } 
        } 
        return true; 
    }
    
    function isShootOffComplete() { 
        for (let t=1; t<=2; t++) { 
            for (let a=1; a<=3; a++) { 
                const i=document.getElementById(`t${t}-so-a${a}`); 
                if (!i || i.value.trim()==='') return false; 
            } 
        } 
        return true; 
    }

    // --- Keypad Focus/Blur Handling ---
    function handleScoreInputFocus(inputElement) { 
        console.log(`Focus on: ${inputElement.id}`); 
        currentlyFocusedInput = inputElement; 
        if (blurTimeout) { 
            clearTimeout(blurTimeout); 
            blurTimeout = null; 
        } 
        if (scoreKeypad) scoreKeypad.style.display = 'grid'; 
        inputElement.select(); 
    }
    
    function handleScoreInputBlur(inputElement) { 
        console.log(`Blur from: ${inputElement.id}`); 
        if (blurTimeout) clearTimeout(blurTimeout); 
        blurTimeout = setTimeout(() => { 
            const activeElement = document.activeElement; 
            const isKeypadButton = scoreKeypad && activeElement && scoreKeypad.contains(activeElement) && activeElement.tagName === 'BUTTON'; 
            const isScoreInput = activeElement && activeElement.tagName === 'INPUT' && activeElement.id.includes('-a'); 
            if (!isKeypadButton && !isScoreInput) { 
                console.log("Focus moved outside keypad/inputs, hiding keypad."); 
                if (scoreKeypad) scoreKeypad.style.display = 'none'; 
                currentlyFocusedInput = null; 
            } else { 
                console.log("Focus potentially moved within keypad or to another score input, not hiding keypad."); 
            } 
            blurTimeout = null; 
        }, 150); 
    }

    // --- Keypad Click Handling ---
    function handleKeypadClick(event) { 
        const button = event.target.closest('button'); 
        if (!button || !scoreKeypad || !scoreKeypad.contains(button)) return; 
        const value = button.dataset.value; 
        const action = button.dataset.action; 
        console.log(`Keypad clicked: value=${value}, action=${action}`); 
        if (value !== undefined && currentlyFocusedInput) { 
            currentlyFocusedInput.value = value; 
            currentlyFocusedInput.dispatchEvent(new Event('input', { bubbles: true, cancelable: true })); 
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
                    currentlyFocusedInput.dispatchEvent(new Event('input', { bubbles: true, cancelable: true })); 
                    currentlyFocusedInput.focus(); 
                    currentlyFocusedInput.select(); 
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

    // --- Focus Navigation Helpers ---
    function focusNextInput(currentInput) { 
        const inputs = Array.from(scoreTable.querySelectorAll('input[type="text"][id*="-a"]')); 
        const currentIndex = inputs.findIndex(input => input && input.id === currentInput.id); 
        if (currentIndex !== -1 && currentIndex < inputs.length - 1) { 
            const nextInput = inputs[currentIndex + 1]; 
            if(nextInput) nextInput.focus(); 
        } else { 
            if (scoreKeypad) scoreKeypad.style.display = 'none'; 
            if(currentInput) currentInput.blur(); 
            currentlyFocusedInput = null; 
            console.log("Reached last input field."); 
        } 
    }
    
    function focusPreviousInput(currentInput) { 
        const inputs = Array.from(scoreTable.querySelectorAll('input[type="text"][id*="-a"]')); 
        const currentIndex = inputs.findIndex(input => input && input.id === currentInput.id); 
        if (currentIndex > 0) { 
            const prevInput = inputs[currentIndex - 1]; 
            if(prevInput) prevInput.focus(); 
        } 
    }

    // --- Main Calculation Function ---
    function calculateAllScores() { 
        let t1MatchScore = 0; 
        let t2MatchScore = 0; 
        let matchOver = false; 
        let winner = null; 
        let overallInputsValid = true; 
        clearHighlights(); 
        if (tieBreakerControls) tieBreakerControls.style.display = 'none'; 
        for (let end = 1; end <= 4; end++) { 
            let t1EndTotal = 0, t2EndTotal = 0; 
            for (let arrow = 1; arrow <= 6; arrow++) { 
                const i = document.getElementById(`t1-e${end}-a${arrow}`); 
                const s = i ? parseScore(i.value) : NaN; 
                updateScoreCellColor(i); 
                if (isNaN(s)) { 
                    t1EndTotal += 0; 
                    if(i) i.style.backgroundColor = '#ffdddd'; 
                    overallInputsValid = false; 
                } else { 
                    t1EndTotal += s; 
                } 
            } 
            for (let arrow = 1; arrow <= 6; arrow++) { 
                const i = document.getElementById(`t2-e${end}-a${arrow}`); 
                const s = i ? parseScore(i.value) : NaN; 
                updateScoreCellColor(i); 
                if (isNaN(s)) { 
                    t2EndTotal += 0; 
                    if(i) i.style.backgroundColor = '#ffdddd'; 
                    overallInputsValid = false; 
                } else { 
                    t2EndTotal += s; 
                } 
            } 
            const t1TotalEl = document.getElementById(`t1-e${end}-total`); 
            if (t1TotalEl) t1TotalEl.textContent = t1EndTotal; 
            const t2TotalEl = document.getElementById(`t2-e${end}-total`); 
            if (t2TotalEl) t2TotalEl.textContent = t2EndTotal; 
            let t1SetPoints = 0, t2SetPoints = 0; 
            const endComplete = isEndComplete(end); 
            if (!matchOver && endComplete) { 
                if (t1EndTotal > t2EndTotal) { 
                    t1SetPoints = 2; 
                    t2SetPoints = 0; 
                } else if (t2EndTotal > t1EndTotal) { 
                    t1SetPoints = 0; 
                    t2SetPoints = 2; 
                } else { 
                    t1SetPoints = 1; 
                    t2SetPoints = 1; 
                } 
                t1MatchScore += t1SetPoints; 
                t2MatchScore += t2SetPoints; 
                if (t1MatchScore >= 5 || t2MatchScore >= 5) { 
                    matchOver = true; 
                    winner = (t1MatchScore > t2MatchScore) ? 't1' : 't2'; 
                } 
            } else { 
                t1SetPoints = '-'; 
                t2SetPoints = '-'; 
            } 
            const t1SetPtsEl = document.getElementById(`t1-e${end}-setpts`); 
            if (t1SetPtsEl) t1SetPtsEl.textContent = t1SetPoints; 
            const t2SetPtsEl = document.getElementById(`t2-e${end}-setpts`); 
            if (t2SetPtsEl) t2SetPtsEl.textContent = t2SetPoints; 
        } 
        let shootOffOccurred = false; 
        let shootOffComplete = false; 
        if (!matchOver && t1MatchScore === 4 && t2MatchScore === 4) { 
            shootOffOccurred = true; 
            if (shootOffRow) shootOffRow.style.display = 'table-row'; 
            let t1SO = 0, t2SO = 0, soValid = true; 
            for (let a = 1; a <= 3; a++) { 
                const i1 = document.getElementById(`t1-so-a${a}`); 
                const s1 = i1 ? parseScore(i1.value) : NaN; 
                updateScoreCellColor(i1); 
                if (isNaN(s1)) { 
                    t1SO += 0; 
                    if(i1) i1.style.backgroundColor = '#ffdddd'; 
                    soValid = false; 
                    overallInputsValid = false; 
                } else { 
                    t1SO += s1; 
                } 
                const i2 = document.getElementById(`t2-so-a${a}`); 
                const s2 = i2 ? parseScore(i2.value) : NaN; 
                updateScoreCellColor(i2); 
                if (isNaN(s2)) { 
                    t2SO += 0; 
                    if(i2) i2.style.backgroundColor = '#ffdddd'; 
                    soValid = false; 
                    overallInputsValid = false; 
                } else { 
                    t2SO += s2; 
                } 
            } 
            const t1SoTotalEl = document.getElementById('t1-so-total'); 
            if(t1SoTotalEl) t1SoTotalEl.textContent = t1SO; 
            const t2SoTotalEl = document.getElementById('t2-so-total'); 
            if(t2SoTotalEl) t2SoTotalEl.textContent = t2SO; 
            shootOffComplete = isShootOffComplete(); 
            let soWinnerTextMsg = "-"; 
            if (shootOffComplete && soValid) { 
                if (t1SO > t2SO) { 
                    winner = 't1'; 
                    soWinnerTextMsg = "T1 Wins SO"; 
                    matchOver = true; 
                    if (shootOffWinnerOverride) shootOffWinnerOverride = null; 
                } else if (t2SO > t1SO) { 
                    winner = 't2'; 
                    soWinnerTextMsg = "T2 Wins SO"; 
                    matchOver = true; 
                    if (shootOffWinnerOverride) shootOffWinnerOverride = null; 
                } else { 
                    soWinnerTextMsg = "SO Tied!"; 
                    if (shootOffWinnerOverride === 't1') { 
                        winner = 't1'; 
                        soWinnerTextMsg += " T1 Wins (Closest)"; 
                        matchOver = true; 
                    } else if (shootOffWinnerOverride === 't2') { 
                        winner = 't2'; 
                        soWinnerTextMsg += " T2 Wins (Closest)"; 
                        matchOver = true; 
                    } else { 
                        soWinnerTextMsg += " Judge Call Needed:"; 
                        winner = null; 
                        matchOver = false; 
                        if (tieBreakerControls) tieBreakerControls.style.display = 'inline-block'; 
                    } 
                } 
            } else if (shootOffOccurred && !shootOffComplete) { 
                soWinnerTextMsg = "Enter SO Scores"; 
                winner = null; 
                matchOver = false; 
            } else if (shootOffOccurred && !soValid) { 
                soWinnerTextMsg = "Invalid SO Scores"; 
                winner = null; 
                matchOver = false; 
            } 
            if (soWinnerText) soWinnerText.textContent = soWinnerTextMsg; 
        } else if (!shootOffOccurred) { 
            if (shootOffRow) shootOffRow.style.display = 'none'; 
            if (shootOffWinnerOverride) shootOffWinnerOverride = null; 
        } 
        const t1MatchScoreEl = document.getElementById('t1-match-score'); 
        if(t1MatchScoreEl) t1MatchScoreEl.textContent = t1MatchScore; 
        const t2MatchScoreEl = document.getElementById('t2-match-score'); 
        if(t2MatchScoreEl) t2MatchScoreEl.textContent = t2MatchScore; 
        if(matchOver) { 
            updateMatchResult(winner, t1MatchScore, t2MatchScore); 
        } else if (shootOffOccurred && !shootOffComplete) { 
            matchResultElement.textContent = "Shoot-Off Required - Enter SO Scores"; 
            matchResultElement.style.color = 'orange'; 
        } else if (shootOffOccurred && winner === null && shootOffWinnerOverride === null) { 
            matchResultElement.textContent = "Shoot-Off Tied - Awaiting Judge Call"; 
            matchResultElement.style.color = 'orange'; 
        } else { 
            updateMatchResult(null, t1MatchScore, t2MatchScore); 
        } 
        saveDataToLocalStorage(); 
    }

    // --- Other Functions ---
    function handleTieBreakerWin(winningTeam) { 
        console.log(`Tie breaker: ${winningTeam} Wins`); 
        shootOffWinnerOverride = winningTeam; 
        if (tieBreakerControls) tieBreakerControls.style.display = 'none'; 
        let t1 = parseInt(document.getElementById('t1-match-score').textContent, 10); 
        let t2 = parseInt(document.getElementById('t2-match-score').textContent, 10); 
        if (soWinnerText) { 
            soWinnerText.textContent = `SO Tied! ${winningTeam === 't1' ? 'T1' : 'T2'} Wins (Closest)`; 
        } 
        updateMatchResult(winningTeam, t1, t2); 
        saveDataToLocalStorage(); 
    }
    
    function updateMatchResult(winner, t1Score, t2Score) { 
        const team1Name = t1SchoolInput?.value || "Team 1"; 
        const team2Name = t2SchoolInput?.value || "Team 2"; 
        let message = ""; 
        let color = "black"; 
        if (winner === 't1') { 
            message = `${team1Name} Wins! (${t1Score} - ${t2Score})`; 
            color = 'green'; 
        } else if (winner === 't2') { 
            message = `${team2Name} Wins! (${t2Score} - ${t1Score})`; 
            color = 'red'; 
        } else if (winner === 'tie') { 
            message = `Match Tied after Shoot-Off Tie! (${t1Score} - ${t2Score})`; 
            color = 'orange'; 
        } else { 
            message = "Match In Progress"; 
            color = 'black'; 
        } 
        if(matchResultElement) { 
            matchResultElement.textContent = message; 
            matchResultElement.style.color = color;
        } 
    }
    
    function parseScore(scoreInput) { 
        if (!scoreInput || scoreInput.trim() === '') return 0; 
        const score = scoreInput.trim().toUpperCase(); 
        if (score === 'X') return 10; 
        if (score === 'M') return 0; 
        const n = parseInt(score, 10); 
        if (!isNaN(n) && n >= 0 && n <= 10) return n; 
        return NaN; 
    }
    
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
    
    function clearHighlights() { 
        const inputs = document.querySelectorAll('table input[type="text"][id*="-a"]'); 
        inputs.forEach(input => { 
            if(input) { 
                input.style.backgroundColor = ''; 
                const cell = input.parentElement; 
                if(cell) cell.className = cell.className.replace(/score-\S+/g, '').trim(); 
            } 
        }); 
    }
    
    function saveDataToLocalStorage() { 
        const data = { 
            t1School: t1SchoolInput?.value, 
            t1Gender: t1GenderInput?.value, 
            t1Level: t1LevelInput?.value, 
            t1Group: t1GroupInput?.value, 
            t2School: t2SchoolInput?.value, 
            t2Gender: t2GenderInput?.value, 
            t2Level: t2LevelInput?.value, 
            t2Group: t2GroupInput?.value, 
            t1ArcherNames: team1ArcherNames, 
            t2ArcherNames: team2ArcherNames, 
            scores: {}, 
            shootOffWinnerOverride: shootOffWinnerOverride 
        }; 
        const scoreInputsForSave = document.querySelectorAll('table input[type="text"][id*="-a"]'); 
        scoreInputsForSave.forEach(input => { 
            if(input) data.scores[input.id] = input.value; 
        }); 
        try { 
            const key = getSessionKey(); 
            localStorage.setItem(key, JSON.stringify(data)); 
        } catch (e) { 
            console.error("Error saving data:", e); 
        } 
    }
    
    function loadDataFromLocalStorage() { 
        const key = getSessionKey(); 
        try { 
            const savedData = localStorage.getItem(key); 
            if (savedData) { 
                const data = JSON.parse(savedData); 
                console.log("Loading data..."); 
                
                if (data.scores) { 
                    const scoreInputsForLoad = document.querySelectorAll('table input[type="text"][id*="-a"]'); 
                    scoreInputsForLoad.forEach(input => { 
                        if (input && data.scores[input.id] !== undefined) input.value = data.scores[input.id]; 
                        else if(input) input.value = ''; 
                    }); 
                } 
                return data; 
            } else { 
                console.log("No saved data for key:", key); 
                return null; 
            } 
        } catch (e) { 
            console.error("Error loading data:", e); 
            localStorage.removeItem(key); 
            return null; 
        } 
    }
    
    function resetFormAndStorage() { 
        const key = getSessionKey(); 
        console.log("Resetting form for key:", key); 
        if (confirm(`Are you sure you want to start a new round? All current scores will be lost.`)) { 
            const inputs = document.querySelectorAll('.match-info input, .match-info select, table input'); 
            inputs.forEach(input => { 
                if(input){ 
                    if (input.tagName === 'SELECT') { 
                        input.selectedIndex = 0; 
                    } else { 
                        input.value = ''; 
                    } 
                } 
            }); 
            team1ArcherNames = [{first:'', last:''}, {first:'', last:''}, {first:'', last:''}]; 
            team2ArcherNames = [{first:'', last:''}, {first:'', last:''}, {first:'', last:''}]; 
            clearHighlights(); 
            const displays = document.querySelectorAll('.score-display'); 
            displays.forEach(display => { 
                if(display) { 
                    if (display.id.includes('-setpts') || display.id.includes('-total')) display.textContent = '0'; 
                    else display.textContent = ''; 
                } 
            }); 
            if(document.getElementById('t1-match-score')) document.getElementById('t1-match-score').textContent = '0'; 
            if(document.getElementById('t2-match-score')) document.getElementById('t2-match-score').textContent = '0'; 
            if(matchResultElement) { 
                matchResultElement.textContent = 'Enter Scores Above'; 
                matchResultElement.style.color = 'black'; 
            } 
            if (shootOffRow) shootOffRow.style.display = 'none'; 
            shootOffWinnerOverride = null; 
            if (tieBreakerControls) tieBreakerControls.style.display = 'none'; 
            if (soWinnerText) soWinnerText.textContent = '-'; 
            try { 
                localStorage.removeItem(key); 
                console.log("localStorage cleared."); 
            } catch (e) { 
                console.error("Error clearing localStorage:", e); 
            } 
            setDefaultSetupModalValues(); 
            if (setupModal) setupModal.style.display = 'block'; 
            if (scorecardMain) scorecardMain.style.display = 'none'; 
            if (matchInfoDisplayDiv) matchInfoDisplayDiv.style.display = 'none'; 
        } 
    }

    // --- Run Initialization ---
    initializeApp();

})(); // --- End IIFE ---