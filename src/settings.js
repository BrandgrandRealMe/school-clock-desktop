document.addEventListener('DOMContentLoaded', async () => {
    const periodsContainer = document.getElementById('periods-container');
    const addPeriodBtn = document.getElementById('add-period');
    const saveScheduleBtn = document.getElementById('save-schedule');
    const cancelBtn = document.getElementById('cancel');

    // Initialize arrays to store schedule data
    let starts = [];
    let names = [];
    let times = [];

    // Load existing schedule
    let schedule = await window.electronAPI.loadSchedule();

    if (!schedule) {
        // Default empty schedule
        addPeriodRow();
    } else {
        // Populate with existing periods
        for (let i = 0; i < schedule.times.length; i++) {
            addPeriodRow(schedule.times[i], schedule.names[i]);
        }
    }

    // Add period button
    addPeriodBtn.addEventListener('click', addPeriodRow);

    // Save schedule button
    saveScheduleBtn.addEventListener('click', async (e) => {  // Added 'e' parameter
        e.preventDefault();

        const timeInputs = document.querySelectorAll('.period-time');
        const nameInputs = document.querySelectorAll('.period-name');

        // Reset arrays
        starts = [];
        names = [];
        times = [];

        let isValid = true;

        // Validate and collect data
        for (let i = 0; i < timeInputs.length; i++) {
            const timeValue = timeInputs[i].value.trim();
            const nameValue = nameInputs[i].value.trim();

            if (!timeValue || !nameValue) {
                alert('Please fill in all time and name fields');
                isValid = false;
                break;
            }

            // Validate time format (HH:MM)
            if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeValue)) {
                alert(`Invalid time format in period ${i + 1}. Please use HH:MM format (24-hour).`);
                isValid = false;
                break;
            }

            const [hours, minutes] = timeValue.split(':').map(Number);
            const totalSeconds = (hours * 3600) + (minutes * 60);

            // Check if times are in order
            if (i > 0 && totalSeconds <= starts[i - 1]) {
                alert(`Time for period ${i + 1} must be after period ${i}`);
                isValid = false;
                break;
            }

            times.push(timeValue);
            names.push(nameValue);
            starts.push(totalSeconds);
        }

        if (isValid) {
            try {
                const newSchedule = { starts, names, times };
                const result = await window.electronAPI.saveSchedule(newSchedule);
                
                if (result && result.success) {
                    window.close(); // Close settings window on success
                } else {
                    alert('Save failed: ' + (result.error || 'Unknown error'));
                }
            } catch (error) {
                console.error('Save error:', error);
                alert('Error saving schedule: ' + error.message);
            }
        }
    });

    // Cancel button - this should work as is
    cancelBtn.addEventListener('click', () => {
        window.close();
    });

    // Helper function to add a new period row (unchanged)
    function addPeriodRow(time = '', name = '') {
        const periodDiv = document.createElement('div');
        periodDiv.className = 'period-row';  // Fixed: was 'period.className'
    
        periodDiv.innerHTML = `
            <div class="period-controls">
                <input type="time" class="period-time" value="${time}" required>
                <input type="text" class="period-name" value="${name}" placeholder="Period name" required>
                <button class="remove-period">×</button>
            </div>
        `;
    
        periodsContainer.appendChild(periodDiv);
    
        // Add remove button event
        const removeBtn = periodDiv.querySelector('.remove-period');
        removeBtn.addEventListener('click', () => {
            if (document.querySelectorAll('.period-row').length > 1) {
                periodsContainer.removeChild(periodDiv);
            } else {
                alert('You must have at least one period');
            }
        });
    }
});