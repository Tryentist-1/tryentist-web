import { scores, archerNames, archerSchools, archerGenders, archerTeams } from './score-core.js';

// modal.js
export function showSetupModal(TOTAL_ARCHERS, saveData, buildTabs, updateTotalsTable, highlightCurrentRow) {
  if (document.getElementById('setup-modal')) return;
  // Create the modal HTML with improved design
  let modalHtml = `
    <div class="modal" id="setup-modal" style="display:block;"> 
      <div class="modal-content setup-modal-content">
        <h2>Enter Team Information</h2>
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
        archerNames[i] = document.getElementById(`archer-name-${i}`).value.trim() || `Archer ${i + 1}`;
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