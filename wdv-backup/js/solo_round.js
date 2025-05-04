// JavaScript logic for the Solo Olympic Round Scorecard (solo_round.html)
// Based on team_round.js but adapted for individual matches

(function () { // Wrap in an IIFE
    console.log("Solo Olympic Round Scorecard JS loaded");

    // --- Configuration ---
    const config = { round: 'SoloOlympic' };

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
    let archer1Data = { first: "", last: "" }; 
    let archer2Data = { first: "", last: "" }; 

    // --- Get Element References ---
    // Declare these variables at module level but initialize them later
    let setupModal, setupForm, setupSubmitButton;
    let setupA1School, setupA1Gender, setupA1Level;
    let setupA2School, setupA2Gender, setupA2Level;
    let scorecardMain, matchInfoInputsDiv, matchInfoDisplayDiv;
    let a1SummarySpan, a2SummarySpan, editSetupButton;
    let a1HeaderName, a2HeaderName;
    let a1SchoolInput, a1GenderInput, a1LevelInput;
    let a2SchoolInput, a2GenderInput, a2LevelInput;
    let scoreTable, calculateButton, resetButton, shootOffRow;
    let matchResultElement, soWinnerText, tieBreakerControls;
    let a1SoWinButton, a2SoWinButton;
    let scoreKeypad, dateDisplayElement;

    // Function to initialize all DOM references - call this after DOM is ready
    function initDOMReferences() {
        // Setup Modal Elements
        setupModal = document.getElementById('archer-setup-modal'); 
        setupForm = document.getElementById('archer-setup-form'); 
        setupSubmitButton = document.getElementById('setup-start-scoring-button');
        
        setupA1School = document.getElementById('setup-a1-school'); 
        setupA1Gender = document.getElementById('setup-a1-gender'); 
        setupA1Level = document.getElementById('setup-a1-level'); 
        
        setupA2School = document.getElementById('setup-a2-school'); 
        setupA2Gender = document.getElementById('setup-a2-gender'); 
        setupA2Level = document.getElementById('setup-a2-level'); 
        
        // Main Scorecard Elements
        scorecardMain = document.getElementById('scorecard-main'); 
        matchInfoInputsDiv = document.querySelector('.match-info'); 
        matchInfoDisplayDiv = document.querySelector('.match-info-display'); 
        a1SummarySpan = document.getElementById('a1-summary'); 
        a2SummarySpan = document.getElementById('a2-summary'); 
        editSetupButton = document.getElementById('edit-setup-button'); 
        a1HeaderName = document.getElementById('a1-header-name'); 
        a2HeaderName = document.getElementById('a2-header-name');

        // Original hidden input references (for archer info)
        a1SchoolInput = document.getElementById('a1-school'); 
        a1GenderInput = document.getElementById('a1-gender'); 
        a1LevelInput = document.getElementById('a1-level'); 
        a2SchoolInput = document.getElementById('a2-school'); 
        a2GenderInput = document.getElementById('a2-gender'); 
        a2LevelInput = document.getElementById('a2-level');

        // Other elements
        scoreTable = document.getElementById('solo_round_table'); 
        calculateButton = document.getElementById('calculate-button'); 
        resetButton = document.getElementById('reset-button'); 
        shootOffRow = document.getElementById('shoot-off');
        matchResultElement = document.getElementById('match-result'); 
        soWinnerText = document.getElementById('so-winner-text'); 
        tieBreakerControls = document.querySelector('.tie-breaker-controls'); 
        a1SoWinButton = document.getElementById('a1-so-win-button'); 
        a2SoWinButton = document.getElementById('a2-so-win-button');
        scoreKeypad = document.getElementById('score-keypad');
        dateDisplayElement = document.getElementById('current-date-display');
    }

    // --- Helper Function: Generate Session Key ---
    function getSessionKey() { 
        const schoolAbbr = (a1SchoolInput?.value?.trim().toUpperCase() || "NOSCHOOL").substring(0, 3); 
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
            setupA1School: !!setupA1School,
            setupA2School: !!setupA2School
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
        console.log("Is archer info valid:", loadedData && isArcherInfoValid(loadedData));
        
        if (loadedData && isArcherInfoValid(loadedData)) { 
            console.log("Valid archer info found."); 
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
            console.log("No valid archer info. Showing setup modal."); 
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
        [a1SchoolInput, a1GenderInput, a1LevelInput, a2SchoolInput, a2GenderInput, a2LevelInput].forEach(input => { 
            if(input) input.addEventListener('change', saveDataToLocalStorage); 
        });
        
        if (a1SoWinButton) a1SoWinButton.addEventListener('click', () => handleTieBreakerWin('a1')); 
        if (a2SoWinButton) a2SoWinButton.addEventListener('click', () => handleTieBreakerWin('a2'));
        
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
                a1School: setupA1School ? setupA1School.value : '',
                a1Gender: setupA1Gender ? setupA1Gender.value : 'M',
                a1Level: setupA1Level ? setupA1Level.value : 'JV',
                a2School: setupA2School ? setupA2School.value : '',
                a2Gender: setupA2Gender ? setupA2Gender.value : 'M',
                a2Level: setupA2Level ? setupA2Level.value : 'JV',
                
                // Process split name fields for Archers
                a1Data: { 
                    first: document.getElementById('setup-a1-first')?.value.trim() || '', 
                    last: document.getElementById('setup-a1-last')?.value.trim() || ''
                },
                a2Data: { 
                    first: document.getElementById('setup-a2-first')?.value.trim() || '', 
                    last: document.getElementById('setup-a2-last')?.value.trim() || ''
                },
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
            alert("Error submitting archer setup: " + error.message);
        }
    }
    
    function handleEditSetup() { 
        console.log("Edit setup clicked."); 
        
        // Handle archer info fields
        if(setupA1School && a1SchoolInput) setupA1School.value = a1SchoolInput.value; 
        if(setupA1Gender && a1GenderInput) setupA1Gender.value = a1GenderInput.value; 
        if(setupA1Level && a1LevelInput) setupA1Level.value = a1LevelInput.value; 
        
        if(setupA2School && a2SchoolInput) setupA2School.value = a2SchoolInput.value; 
        if(setupA2Gender && a2GenderInput) setupA2Gender.value = a2GenderInput.value; 
        if(setupA2Level && a2LevelInput) setupA2Level.value = a2LevelInput.value; 
        
        // Handle split name fields for archers
        const firstNameField1 = document.getElementById('setup-a1-first');
        const lastNameField1 = document.getElementById('setup-a1-last');
        
        if (firstNameField1 && lastNameField1 && archer1Data) {
            firstNameField1.value = archer1Data.first || '';
            lastNameField1.value = archer1Data.last || '';
        }
        
        const firstNameField2 = document.getElementById('setup-a2-first');
        const lastNameField2 = document.getElementById('setup-a2-last');
        
        if (firstNameField2 && lastNameField2 && archer2Data) {
            firstNameField2.value = archer2Data.first || '';
            lastNameField2.value = archer2Data.last || '';
        }
        
        if (setupModal) setupModal.style.display = 'block'; 
        if (matchInfoDisplayDiv) matchInfoDisplayDiv.style.display = 'none'; 
        if (scorecardMain) scorecardMain.style.display = 'none'; 
    }
    
    function populateHiddenInputs(data) { 
        if(a1SchoolInput) a1SchoolInput.value = data.a1School || ''; 
        if(a1GenderInput) a1GenderInput.value = data.a1Gender || 'M'; 
        if(a1LevelInput) a1LevelInput.value = data.a1Level || 'JV'; 
        if(a2SchoolInput) a2SchoolInput.value = data.a2School || ''; 
        if(a2GenderInput) a2GenderInput.value = data.a2Gender || 'M'; 
        if(a2LevelInput) a2LevelInput.value = data.a2Level || 'JV'; 
        
        shootOffWinnerOverride = data.shootOffWinnerOverride || null; 
        archer1Data = data.a1Data || {first:'', last:''}; 
        archer2Data = data.a2Data || {first:'', last:''}; 
    }
    
    function displaySummaryInfo() { 
        // Create archer summary strings
        const archer1Str = `${a1SchoolInput?.value || ''}-${a1GenderInput?.value || ''}-${a1LevelInput?.value || ''}`; 
        const archer2Str = `${a2SchoolInput?.value || ''}-${a2GenderInput?.value || ''}-${a2LevelInput?.value || ''}`; 
        
        // Update display elements
        if (a1SummarySpan) a1SummarySpan.textContent = archer1Str; 
        if (a2SummarySpan) a2SummarySpan.textContent = archer2Str; 
        if (a1HeaderName) a1HeaderName.textContent = archer1Str; 
        if (a2HeaderName) a2HeaderName.textContent = archer2Str; 
        
        // Add archer names to header titles
        if (a1HeaderName && archer1Data) {
            const firstName = archer1Data.first || '';
            const lastName = archer1Data.last || '';
            if (firstName || lastName) {
                a1HeaderName.textContent += `: ${firstName} ${lastName}`;
            }
        }
        
        if (a2HeaderName && archer2Data) {
            const firstName = archer2Data.first || '';
            const lastName = archer2Data.last || '';
            if (firstName || lastName) {
                a2HeaderName.textContent += `: ${firstName} ${lastName}`;
            }
        }
        
        // Add New Round button if it doesn't exist
        if (matchInfoDisplayDiv) {
            // Check if New Round button already exists
            if (!document.getElementById('new-round-button')) {
                const newRoundButton = document.createElement('button');
                newRoundButton.id = 'new-round-button';
                newRoundButton.textContent = 'New Match';
                newRoundButton.addEventListener('click', resetFormAndStorage);
                
                // Insert button at the beginning of the match info display
                matchInfoDisplayDiv.insertBefore(newRoundButton, matchInfoDisplayDiv.firstChild);
            }
            
            matchInfoDisplayDiv.style.display = 'flex';
        }
        
        if (matchInfoInputsDiv) matchInfoInputsDiv.style.display = 'none'; 
    }
    
    function isArcherInfoValid(data) { 
        return data && data.a1School && data.a2School; 
    }
    
    function setDefaultSetupModalValues() { 
        if(setupA1School) setupA1School.value = 'WDV'; 
        if(setupA1Gender) setupA1Gender.value = 'M'; 
        if(setupA1Level) setupA1Level.value = 'JV'; 
        
        // Clear archer 1 name fields
        const firstNameField1 = document.getElementById('setup-a1-first');
        const lastNameField1 = document.getElementById('setup-a1-last');
        
        if(firstNameField1) firstNameField1.value = '';
        if(lastNameField1) lastNameField1.value = '';
        
        if(setupA2School) setupA2School.value = 'OPP'; 
        if(setupA2Gender) setupA2Gender.value = 'M'; 
        if(setupA2Level) setupA2Level.value = 'JV'; 
        
        // Clear archer 2 name fields 
        const firstNameField2 = document.getElementById('setup-a2-first');
        const lastNameField2 = document.getElementById('setup-a2-last');
        
        if(firstNameField2) firstNameField2.value = '';
        if(lastNameField2) lastNameField2.value = '';
    }
    
    function isEndComplete(endNum) { 
        for (let a=1; a<=2; a++) { 
            for (let arrow=1; arrow<=3; arrow++) { 
                const i = document.getElementById(`a${a}-e${endNum}-a${arrow}`); 
                if (!i || i.value.trim()==='') return false; 
            } 
        } 
        return true; 
    }
    
    function isShootOffComplete() { 
        const a1Input = document.getElementById('a1-so-a1');
        const a2Input = document.getElementById('a2-so-a1');
        
        return a1Input && a2Input && 
               a1Input.value.trim() !== '' && 
               a2Input.value.trim() !== '';
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
        let a1MatchScore = 0; 
        let a2MatchScore = 0; 
        let matchOver = false; 
        let winner = null; 
        let overallInputsValid = true; 
        clearHighlights(); 
        
        if (tieBreakerControls) tieBreakerControls.style.display = 'none'; 
        
        // Calculate scores for each end (1-5 for Olympic Round)
        for (let end = 1; end <= 5; end++) { 
            let a1EndTotal = 0, a2EndTotal = 0; 
            
            // Calculate end totals for Archer 1
            for (let arrow = 1; arrow <= 3; arrow++) { 
                const i = document.getElementById(`a1-e${end}-a${arrow}`); 
                const s = i ? parseScore(i.value) : NaN; 
                updateScoreCellColor(i); 
                if (isNaN(s)) { 
                    a1EndTotal += 0; 
                    if(i) i.style.backgroundColor = '#ffdddd'; 
                    overallInputsValid = false; 
                } else { 
                    a1EndTotal += s; 
                } 
            } 
            
            // Calculate end totals for Archer 2
            for (let arrow = 1; arrow <= 3; arrow++) { 
                const i = document.getElementById(`a2-e${end}-a${arrow}`); 
                const s = i ? parseScore(i.value) : NaN; 
                updateScoreCellColor(i); 
                if (isNaN(s)) { 
                    a2EndTotal += 0; 
                    if(i) i.style.backgroundColor = '#ffdddd'; 
                    overallInputsValid = false; 
                } else { 
                    a2EndTotal += s; 
                } 
            } 
            
            // Update end total displays
            const a1TotalEl = document.getElementById(`a1-e${end}-total`); 
            if (a1TotalEl) a1TotalEl.textContent = a1EndTotal; 
            const a2TotalEl = document.getElementById(`a2-e${end}-total`); 
            if (a2TotalEl) a2TotalEl.textContent = a2EndTotal; 
            
            // Calculate set points
            let a1SetPoints = 0, a2SetPoints = 0; 
            const endComplete = isEndComplete(end); 
            
            if (!matchOver && endComplete) { 
                if (a1EndTotal > a2EndTotal) { 
                    a1SetPoints = 2; 
                    a2SetPoints = 0; 
                } else if (a2EndTotal > a1EndTotal) { 
                    a1SetPoints = 0; 
                    a2SetPoints = 2; 
                } else { 
                    a1SetPoints = 1; 
                    a2SetPoints = 1; 
                } 
                
                a1MatchScore += a1SetPoints; 
                a2MatchScore += a2SetPoints; 
                
                // Check if match is over (someone reached 6 or more set points)
                if (a1MatchScore >= 6 || a2MatchScore >= 6) { 
                    matchOver = true; 
                    winner = (a1MatchScore > a2MatchScore) ? 'a1' : 'a2'; 
                } 
            } else { 
                a1SetPoints = '-'; 
                a2SetPoints = '-'; 
            } 
            
            // Update set points displays
            const a1SetPtsEl = document.getElementById(`a1-e${end}-setpts`); 
            if (a1SetPtsEl) a1SetPtsEl.textContent = a1SetPoints; 
            const a2SetPtsEl = document.getElementById(`a2-e${end}-setpts`); 
            if (a2SetPtsEl) a2SetPtsEl.textContent = a2SetPoints; 
        } 
        
        // Handle shoot-off if needed
        let shootOffOccurred = false; 
        let shootOffComplete = false; 
        
        if (!matchOver && a1MatchScore === 5 && a2MatchScore === 5) { 
            shootOffOccurred = true; 
            if (shootOffRow) shootOffRow.style.display = 'table-row'; 
            
            let a1SO = 0, a2SO = 0, soValid = true; 
            
            // Get shoot-off arrow values
            const i1 = document.getElementById('a1-so-a1'); 
            const s1 = i1 ? parseScore(i1.value) : NaN; 
            updateScoreCellColor(i1); 
            if (isNaN(s1)) { 
                a1SO = 0; 
                if(i1) i1.style.backgroundColor = '#ffdddd'; 
                soValid = false; 
                overallInputsValid = false; 
            } else { 
                a1SO = s1; 
            } 
            
            const i2 = document.getElementById('a2-so-a1'); 
            const s2 = i2 ? parseScore(i2.value) : NaN; 
            updateScoreCellColor(i2); 
            if (isNaN(s2)) { 
                a2SO = 0; 
                if(i2) i2.style.backgroundColor = '#ffdddd'; 
                soValid = false; 
                overallInputsValid = false; 
            } else { 
                a2SO = s2; 
            } 
            
            // Update shoot-off total displays
            const a1SoTotalEl = document.getElementById('a1-so-total'); 
            if(a1SoTotalEl) a1SoTotalEl.textContent = a1SO; 
            const a2SoTotalEl = document.getElementById('a2-so-total'); 
            if(a2SoTotalEl) a2SoTotalEl.textContent = a2SO; 
            
            shootOffComplete = isShootOffComplete(); 
            let soWinnerTextMsg = "-"; 
            
            if (shootOffComplete && soValid) { 
                if (a1SO > a2SO) { 
                    winner = 'a1'; 
                    soWinnerTextMsg = "A1 Wins SO"; 
                    matchOver = true; 
                    if (shootOffWinnerOverride) shootOffWinnerOverride = null; 
                } else if (a2SO > a1SO) { 
                    winner = 'a2'; 
                    soWinnerTextMsg = "A2 Wins SO"; 
                    matchOver = true; 
                    if (shootOffWinnerOverride) shootOffWinnerOverride = null; 
                } else { 
                    soWinnerTextMsg = "SO Tied!"; 
                    if (shootOffWinnerOverride === 'a1') { 
                        winner = 'a1'; 
                        soWinnerTextMsg += " A1 Wins (Closest)"; 
                        matchOver = true; 
                    } else if (shootOffWinnerOverride === 'a2') { 
                        winner = 'a2'; 
                        soWinnerTextMsg += " A2 Wins (Closest)"; 
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
        
        // Update match score displays
        const a1MatchScoreEl = document.getElementById('a1-match-score'); 
        if(a1MatchScoreEl) a1MatchScoreEl.textContent = a1MatchScore; 
        const a2MatchScoreEl = document.getElementById('a2-match-score'); 
        if(a2MatchScoreEl) a2MatchScoreEl.textContent = a2MatchScore; 
        
        // Update match result
        if(matchOver) { 
            updateMatchResult(winner, a1MatchScore, a2MatchScore); 
        } else if (shootOffOccurred && !shootOffComplete) { 
            matchResultElement.textContent = "Shoot-Off Required - Enter SO Scores"; 
            matchResultElement.style.color = 'orange'; 
        } else if (shootOffOccurred && winner === null && shootOffWinnerOverride === null) { 
            matchResultElement.textContent = "Shoot-Off Tied - Awaiting Judge Call"; 
            matchResultElement.style.color = 'orange'; 
        } else { 
            updateMatchResult(null, a1MatchScore, a2MatchScore); 
        } 
        
        saveDataToLocalStorage(); 
    }

    // --- Other Functions ---
    function handleTieBreakerWin(winningArcher) { 
        console.log(`Tie breaker: ${winningArcher} Wins`); 
        shootOffWinnerOverride = winningArcher; 
        if (tieBreakerControls) tieBreakerControls.style.display = 'none'; 
        let a1 = parseInt(document.getElementById('a1-match-score').textContent, 10); 
        let a2 = parseInt(document.getElementById('a2-match-score').textContent, 10); 
        if (soWinnerText) { 
            soWinnerText.textContent = `SO Tied! ${winningArcher === 'a1' ? 'A1' : 'A2'} Wins (Closest)`; 
        } 
        updateMatchResult(winningArcher, a1, a2); 
        saveDataToLocalStorage(); 
    }
    
    function updateMatchResult(winner, a1Score, a2Score) { 
        // Get archer names for display
        let archer1Name = a1SchoolInput?.value || "Archer 1";
        if (archer1Data && (archer1Data.first || archer1Data.last)) {
            archer1Name = `${archer1Data.first} ${archer1Data.last}`.trim();
        }
        
        let archer2Name = a2SchoolInput?.value || "Archer 2";
        if (archer2Data && (archer2Data.first || archer2Data.last)) {
            archer2Name = `${archer2Data.first} ${archer2Data.last}`.trim();
        }
        
        let message = ""; 
        let color = "black"; 
        
        if (winner === 'a1') { 
            message = `${archer1Name} Wins! (${a1Score} - ${a2Score})`; 
            color = 'green'; 
        } else if (winner === 'a2') { 
            message = `${archer2Name} Wins! (${a2Score} - ${a1Score})`; 
            color = 'red'; 
        } else if (winner === 'tie') { 
            message = `Match Tied after Shoot-Off Tie! (${a1Score} - ${a2Score})`; 
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
            a1School: a1SchoolInput?.value, 
            a1Gender: a1GenderInput?.value, 
            a1Level: a1LevelInput?.value, 
            a2School: a2SchoolInput?.value, 
            a2Gender: a2GenderInput?.value, 
            a2Level: a2LevelInput?.value, 
            a1Data: archer1Data, 
            a2Data: archer2Data, 
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
        if (confirm(`Are you sure you want to start a new match? All current scores will be lost.`)) { 
            // Clear all inputs
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
            
            // Reset archer data
            archer1Data = {first:'', last:''}; 
            archer2Data = {first:'', last:''}; 
            
            // Clear highlighting
            clearHighlights(); 
            
            // Reset score displays
            const displays = document.querySelectorAll('.score-display'); 
            displays.forEach(display => { 
                if(display) { 
                    if (display.id.includes('-setpts') || display.id.includes('-total')) display.textContent = '0'; 
                    else display.textContent = ''; 
                } 
            }); 
            
            if(document.getElementById('a1-match-score')) document.getElementById('a1-match-score').textContent = '0'; 
            if(document.getElementById('a2-match-score')) document.getElementById('a2-match-score').textContent = '0'; 
            
            if(matchResultElement) { 
                matchResultElement.textContent = 'Enter Scores Above'; 
                matchResultElement.style.color = 'black'; 
            } 
            
            // Hide shoot-off row
            if (shootOffRow) shootOffRow.style.display = 'none'; 
            shootOffWinnerOverride = null; 
            if (tieBreakerControls) tieBreakerControls.style.display = 'none'; 
            if (soWinnerText) soWinnerText.textContent = '-'; 
            
            // Clear localStorage
            try { 
                localStorage.removeItem(key); 
                console.log("localStorage cleared."); 
            } catch (e) { 
                console.error("Error clearing localStorage:", e); 
            } 
            
            // Show setup modal
            setDefaultSetupModalValues(); 
            if (setupModal) setupModal.style.display = 'block'; 
            if (scorecardMain) scorecardMain.style.display = 'none'; 
            if (matchInfoDisplayDiv) matchInfoDisplayDiv.style.display = 'none'; 
        } 
    }

    // --- Run Initialization ---
    initializeApp();

})(); // --- End IIFE ---