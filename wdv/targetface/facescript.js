// <script> tag content starts here
    // --- Configuration ---
    let arrowsPerEnd = 3;
    let numEnds = 6;
    let targetX, targetY;
    let targetRadius;
    const ringColors = [ // Colors remain the same
      [255, 255, 255], [255, 255, 255], [0, 0, 0], [0, 0, 0],
      [100, 150, 255], [100, 150, 255], [255, 80, 80], [255, 80, 80],
      [255, 255, 100], [255, 255, 100],
    ];
    const ringScores = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    let ringRadii = [];
    let xRingRadius;
    const xRingInputFactor = 0.65;

    // --- Match State ---
    let matchData = [];
    let currentEnd = 1;
    let currentArrowInEnd = 1;
    let matchOver = false;

    // --- Correction State ---
    let isCorrectionMode = false;
    let correctionEndIndex = -1; // 0-based
    let correctionArrowIndex = -1; // 0-based
    let correctionEndNumber = -1; // 1-based (for display)
    let correctionArrowNumber = -1; // 1-based (for display)

    // --- End of Match Stats & Analysis ---
    let totalScore = 0;
    let numXs = 0;
    let numTens = 0;
    let avgX = 0;
    let avgY = 0;
    let totalArrowsShot = 0;
    let biasDescription = "";

    // --- UI Elements ---
    let resetButton;
    let correctButton; // New button
    let saveButton;
    let statusTextY = 25;
    let buttonY = statusTextY + 25;

    // =================== SETUP ===================
    function setup() {
      let canvasHeight = windowHeight * 0.90;
      createCanvas(windowWidth, canvasHeight);
      targetX = width / 2;
      let availableHeightForTargetAndScores = height - buttonY - 50;
      targetRadius = min(availableHeightForTargetAndScores * 0.35, width * 0.3);
      targetY = buttonY + targetRadius + 20;

      calculateRadii();

      // --- Create Buttons (Positioned at Top) ---
      resetButton = createButton('Reset / Config'); // Shortened text
      correctButton = createButton('Correct Arrow'); // New button
      saveButton = createButton('Save Results');

      // Position buttons dynamically based on their width
      positionButtons(); // Call function to set initial positions

      resetButton.mousePressed(configureAndResetMatch);
      correctButton.mousePressed(startCorrection); // Link to correction function
      saveButton.mousePressed(saveScorecard);
      saveButton.hide();

      textAlign(LEFT, TOP);
      textSize(16);
      noStroke();

      initializeMatchData(false);
    }

    // Helper function to position buttons (used in setup and windowResized)
    function positionButtons() {
        let centerButtonX = width / 2;
        let buttonSpacing = 10; // Space between buttons

        // Ensure buttons are created before accessing width
        if (!correctButton || !resetButton || !saveButton) return;

        correctButton.position(centerButtonX - correctButton.width / 2, buttonY);
        resetButton.position(centerButtonX - correctButton.width / 2 - buttonSpacing - resetButton.width, buttonY);
        saveButton.position(centerButtonX + correctButton.width / 2 + buttonSpacing, buttonY);
    }


    // =================== CONFIG, RESET, CORRECTION ===================
    function configureAndResetMatch() {
        // Prompt for configuration (same as before)
        let inputArrows = prompt(`Enter number of arrows per end:`, arrowsPerEnd);
        let inputEnds = prompt(`Enter number of ends:`, numEnds);
        let newArrowsPerEnd = parseInt(inputArrows);
        if (!isNaN(newArrowsPerEnd) && newArrowsPerEnd > 0) arrowsPerEnd = newArrowsPerEnd;
        let newNumEnds = parseInt(inputEnds);
        if (!isNaN(newNumEnds) && newNumEnds > 0) numEnds = newNumEnds;

        // Exit correction mode if active
        isCorrectionMode = false;
        correctionEndIndex = -1;
        correctionArrowIndex = -1;

        // Reset the match state
        initializeMatchData(true);
    }

    function initializeMatchData(logReset = true) {
      // Reset state variables (same as before)
      matchData = [];
      for (let i = 0; i < numEnds; i++) matchData.push([]);
      currentEnd = 1; currentArrowInEnd = 1; matchOver = false;
      isCorrectionMode = false; // Ensure correction mode is off
      totalScore = 0; numXs = 0; numTens = 0; avgX = 0; avgY = 0;
      totalArrowsShot = 0; biasDescription = "";
      if(saveButton) saveButton.hide();
      if (logReset) console.log(`Match Reset: ${numEnds} ends, ${arrowsPerEnd} arrows per end.`);
      if (typeof draw === 'function' && typeof width !== 'undefined' && width > 0) { loop(); redraw(); }
    }

    // --- New: Start Correction Process ---
    function startCorrection() {
        if (isCorrectionMode) { // Allow cancelling correction mode
            isCorrectionMode = false;
            correctionEndIndex = -1;
            correctionArrowIndex = -1;
            redraw(); // Update status display
            alert("Correction mode cancelled.");
            return;
        }

        let endNumStr = prompt(`Enter End # to correct (1-${numEnds}):`);
        if (endNumStr === null) return; // User cancelled
        let endNum = parseInt(endNumStr);

        let arrowNumStr = prompt(`Enter Arrow # in End to correct (1-${arrowsPerEnd}):`);
        if (arrowNumStr === null) return; // User cancelled
        let arrowNum = parseInt(arrowNumStr);

        // Validate Input
        let tempEndIndex = endNum - 1;
        let tempArrowIndex = arrowNum - 1;

        if (isNaN(endNum) || tempEndIndex < 0 || tempEndIndex >= numEnds ||
            isNaN(arrowNum) || tempArrowIndex < 0 || tempArrowIndex >= arrowsPerEnd) {
            alert("Invalid End or Arrow number.");
            return;
        }

        // Check if the arrow actually exists to be corrected
        if (!matchData[tempEndIndex] || tempArrowIndex >= matchData[tempEndIndex].length) {
             alert(`Arrow ${arrowNum} in End ${endNum} has not been shot yet.`);
             return;
        }


        // Enter Correction Mode
        isCorrectionMode = true;
        correctionEndIndex = tempEndIndex;
        correctionArrowIndex = tempArrowIndex;
        correctionEndNumber = endNum; // Store 1-based for display
        correctionArrowNumber = arrowNum; // Store 1-based for display

        console.log(`Correction Mode: Ready to correct E${endNum} A${arrowNum}`);
        alert(`Click on the target to enter the new score and position for End ${endNum}, Arrow ${arrowNum}.`);

        loop(); // Ensure loop is running for the correction click
        redraw(); // Update status