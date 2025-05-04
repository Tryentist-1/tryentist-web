// keypad.js

let currentlyFocusedInput = null;
let scoreKeypad = null;
let blurTimeout = null;

function getScoreKeypad() {
  return document.getElementById('score-keypad');
}

// Handle score input blur
function handleScoreInputBlur(inputElement) {
  console.log(`Blur from: ${inputElement.value}`);
  if (blurTimeout) clearTimeout(blurTimeout);

  blurTimeout = setTimeout(() => {
    const activeElement = document.activeElement;
    const isKeypadButton = scoreKeypad && activeElement &&
                          scoreKeypad.contains(activeElement) &&
                          activeElement.tagName === 'BUTTON';
    const isScoreInput = activeElement &&
                        activeElement.tagName === 'INPUT' &&
                        activeElement.classList.contains('score-input');

    if (!isKeypadButton && !isScoreInput) {
      console.log('Focus moved outside keypad/inputs, hiding keypad.');
      getScoreKeypad().style.display = 'none';
      currentlyFocusedInput = null;
    } else {
      console.log('Focus still within keypad or inputs, not hiding keypad.');
    }
    blurTimeout = null;
  }, 150);
}

// Handle keypad click
function handleKeypadClick(event, scores, handleScoreChange) {
  const button = event.target.closest('button');  

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
        scoreKeypad.style.display = 'none';
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

function attachInputListeners(inputElementId,scores,handleScoreChange) {
  const inputElement = document.getElementById(inputElementId);
  if(inputElement) {
    inputElement.addEventListener('focus', () => {      
      console.log(`Focus on: ${inputElement.value}`);
      currentlyFocusedInput = inputElement;
      if (blurTimeout) clearTimeout(blurTimeout);
      scoreKeypad.style.display = 'grid';
      inputElement.select();
    });
    inputElement.addEventListener('blur', () => handleScoreInputBlur(inputElement));
  }
}


export function initializeKeypad(scores,handleScoreChange) {
  scoreKeypad = document.getElementById('score-keypad');
  const scoreInputs = document.querySelectorAll('.score-input');
  document.querySelectorAll('.score-input').forEach(el=> attachInputListeners(el.id,scores,handleScoreChange));
  scoreKeypad.addEventListener('click', (event)=>handleKeypadClick(event, scores, handleScoreChange));
}
export {updateScoreCellColor, focusNextInput, focusPreviousInput, handleKeypadClick, handleScoreInputBlur};