document.addEventListener('DOMContentLoaded', async () => {
    const periodsContainer = document.getElementById('periods-container');
    const addPeriodBtn = document.getElementById('add-period');
    const saveScheduleBtn = document.getElementById('save-schedule');
    const cancelBtn = document.getElementById('cancel');

    // Load existing schedule
    let schedule = await window.electronAPI.loadSchedule();

    if (!schedule) {
        // Default empty schedule
        schedule = {
            starts: [],
            names: [],
            times: []
        };
        // Add one empty period to start with
        addPeriodRow();
    } else {
        // Populate with existing periods
        for (let i = 0; i < schedule.starts.length; i++) {
            addPeriodRow(schedule.times[i], schedule.names[i]);
        }
    }

    // Add period button
    addPeriodBtn.addEventListener('click', addPeriodRow);

    // Save schedule button
    saveScheduleBtn.addEventListener('click', async () => {
        const timeInputs = document.querySelectorAll('.period-time');
        const nameInputs = document.querySelectorAll('.period-name');

        const newSchedule = {
            starts: [],
            names: [],
            times: []
        };


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
            const newSchedule = { starts, names, times };
            await window.electronAPI.saveSchedule(newSchedule);
            window.close(); // Close settings window
        }

        try {
            const result = await window.electronAPI.saveSchedule(newSchedule);
            if (result.success) {
                alert('Schedule saved successfully!');
                window.close(); // Close settings window after save
            }
        } catch (error) {
            console.error('Error saving schedule:', error);
            alert('Failed to save schedule: ' + error.message);
        }
    });

    // Cancel button
    cancelBtn.addEventListener('click', () => {
        window.close();
    });

    // Helper function to add a new period row
    function addPeriodRow(time = '', name = '') {
        const periodDiv = document.createElement('div');
        periodDiv.className = 'period-row';

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