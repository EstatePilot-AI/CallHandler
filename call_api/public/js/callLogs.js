let scenarios = [];
let currentIndex = 0;

// Initialize the page
document.addEventListener('DOMContentLoaded', async () => {
    await loadScenarios();
    if (scenarios.length > 0) {
        populateDropdown();
        displayScenario(currentIndex);
        updateControls();
    }
});

// Load scenarios from JSON file
async function loadScenarios() {
    try {
        const response = await fetch('../public/transcripts/transcript.json');
        const data = await response.json();
        
        scenarios = data.Scenarios.map(scenario => {
            // Store transcript as array for proper formatting
            let transcriptData = [];
            if (scenario.Transcript && scenario.Transcript.length > 0) {
                transcriptData = scenario.Transcript;
            }
            
            return {
                title: `Scenario ${scenario.scenario} - ${scenario.scenario_name}`,
                summary: scenario.transcript_summary || scenario.Summary || '[No summary available]',
                transcript: transcriptData,
                audioFile: scenario.record_path ? `../${scenario.record_path}` : ''
            };
        });
    } catch (error) {
        console.error('Error loading scenarios:', error);
        scenarios = [{
            title: 'Error Loading Data',
            summary: 'Unable to load scenarios from transcript.json',
            transcript: '',
            audioFile: ''
        }];
    }
}

// Populate dropdown with scenarios
function populateDropdown() {
    const dropdown = document.getElementById('scenario-dropdown');
    dropdown.innerHTML = '';
    scenarios.forEach((scenario, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = scenario.title;
        dropdown.appendChild(option);
    });
}

// Display selected scenario
function displayScenario(index) {
    const scenario = scenarios[index];
    document.getElementById('title').textContent = scenario.title;
    document.getElementById('summary').textContent = scenario.summary;
    
    // Format transcript with proper line breaks
    const transcriptDiv = document.getElementById('transcript');
    if (Array.isArray(scenario.transcript) && scenario.transcript.length > 0) {
        transcriptDiv.innerHTML = scenario.transcript.map(msg => {
            const role = msg.role.charAt(0).toUpperCase() + msg.role.slice(1);
            return `<div class="message"><div class="role">${role}:</div><div>${msg.message}</div></div>`;
        }).join('');
    } else {
        transcriptDiv.textContent = '[No transcript available]';
    }
    
    const audio = document.getElementById('audio');
    if (scenario.audioFile) {
        audio.src = scenario.audioFile;
        audio.style.display = 'block';
    } else {
        audio.style.display = 'none';
    }
    
    document.getElementById('scenario-dropdown').value = index;
    currentIndex = index;
    updateControls();
}

// Update navigation controls
function updateControls() {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const counter = document.getElementById('counter');
    
    // Update counter
    counter.textContent = `${currentIndex + 1} / ${scenarios.length}`;
    
    // Disable/enable buttons
    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex === scenarios.length - 1;
}

// Event listeners
document.getElementById('prev-btn').addEventListener('click', () => {
    if (currentIndex > 0) {
        displayScenario(currentIndex - 1);
    }
});

document.getElementById('next-btn').addEventListener('click', () => {
    if (currentIndex < scenarios.length - 1) {
        displayScenario(currentIndex + 1);
    }
});

document.getElementById('scenario-dropdown').addEventListener('change', (e) => {
    displayScenario(parseInt(e.target.value));
});
