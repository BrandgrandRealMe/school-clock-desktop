// Global variables
let starts = [];
let names = [];
let times = [];
let adjustseconds = 0;
let randm = false;

// DOM elements
const currentdt = document.getElementById('currentdt');
const wearenowintro = document.getElementById('wearenowintro');
const wearenowlabel = document.getElementById('wearenowlabel');
const wearenowtimerange = document.getElementById('wearenowtimerange');
const wearenow = document.getElementById('wearenow');
const countdowntointro = document.getElementById('countdowntointro');
const countdowntolabel = document.getElementById('countdowntolabel');
const countdown = document.getElementById('countdown');
const schedule = document.getElementById('schedule');
const settingsButton = document.getElementById('settings-button');
const setColorsButton = document.getElementById('set-colors');
const foreground = document.getElementById('foreground');
const background = document.getElementById('background');
const timeadj = document.getElementById('timeadj');
const setTimeadj = document.getElementById('set-timeadj');

// Days and months
const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];


async function displayVersionAndFooter() {
  try {
    // Display app version
    const version = await window.electronAPI.getAppVersion();
    document.getElementById('app-version').textContent = version;

    // Optional: Make footer adapt to color scheme
    const footer = document.querySelector('footer');
    document.getElementById('background').addEventListener('change', (e) => {
      footer.style.backgroundColor = e.target.value === '#ffffff'
        ? 'rgba(255,255,255,0.8)'
        : 'rgba(0,0,0,0.5)';
    });
  } catch (error) {
    console.error('Failed to load version:', error);
  }
}




// Function to update the schedule in the renderer
function updateSchedule(newSchedule) {
  starts = newSchedule.starts || [];
  names = newSchedule.names || [];
  times = newSchedule.times || [];
  console.log('Schedule updated:', { starts, names, times });
}

// Load initial schedule
window.electronAPI.loadSchedule().then(updateSchedule);

// Listen for schedule updates
window.electronAPI.onScheduleUpdate(updateSchedule);

// Clean up listener when window closes
window.addEventListener('beforeunload', () => {
  window.electronAPI.removeScheduleListener();
});
// Initialize the app
async function init() {

  displayVersionAndFooter();

  // Load saved schedule
  const savedSchedule = await window.electronAPI.loadSchedule();
  if (savedSchedule) {
    starts = savedSchedule.starts;
    names = savedSchedule.names;
    times = savedSchedule.times;
  } else {
    // Default schedule if none saved
    setDefaultSchedule();
  }

  // Load saved colors
  const savedColors = localStorage.getItem('clockColors');
  if (savedColors) {
    const colors = JSON.parse(savedColors);
    document.body.style.color = colors.foreground;
    document.body.style.backgroundColor = colors.background;
    foreground.value = colors.foreground;
    background.value = colors.background;
  }

  // Load saved time adjustment
  const savedTimeAdj = localStorage.getItem('timeAdjustment');
  if (savedTimeAdj) {
    timeadj.value = savedTimeAdj;
    adjustseconds = parseInt(savedTimeAdj);
  }

  // Set up event listeners
  if (settingsButton) {
    settingsButton.addEventListener('click', () => {
      try {
        if (window.electronAPI && window.electronAPI.openSettings) {
          window.electronAPI.openSettings();
        } else {
          console.error('Electron API not available');
        }
      } catch (error) {
        console.error('Error opening settings:', error);
      }
    });
  } else {
    console.error('Settings button not found');
  }


  setColorsButton.addEventListener('click', () => {
    document.body.style.color = foreground.value;
    document.body.style.backgroundColor = background.value;
    localStorage.setItem('clockColors', JSON.stringify({
      foreground: foreground.value,
      background: background.value
    }));
  });

  setTimeadj.addEventListener('click', () => {
    const adj = parseInt(timeadj.value);
    if (!isNaN(adj)) {
      adjustseconds = adj;
      localStorage.setItem('timeAdjustment', adj.toString());
    }
  });

  // Start the clock
  setInterval(showclock, 1000);
  showclock();
}

function setDefaultSchedule() {
  // Default schedule (same as original)
  starts = [29700, 32400, 32700, 35400, 35700, 38400, 38700, 40500, 42300, 44100, 45900, 46200, 48900, 49200, 51900, 52200, 54900, 55200, 57900];
  names = ['1st Period', 'Passing Period', '2nd Period', 'Passing Period', '3rd Period', 'Passing Period', '4th Period - A Lunch', '4th Period - B Lunch', '4th Period', '4th Period - C Lunch', 'Passing Period', '5th Period', 'Passing Period', '6th Period', 'Passing Period', '7th Period', 'Passing Period', '8th Period', 'End of the Day'];
  times = ['08:15', '09:00', '09:05', '09:50', '09:55', '10:40', '10:45', '11:15', '11:45', '12:15', '12:45', '12:50', '13:35', '13:40', '14:25', '14:30', '15:15', '15:20', '16:05'];
}

// Clock functions
function showclock() {
  let curperiod = -1;
  const og = new Date();
  const d = new Date(og.getTime() + (adjustseconds * 1000));

  const fdate = d.getDate();
  let fhours = d.getHours();
  const ampm = fhours >= 12 ? 'PM' : 'AM';
  fhours = fhours % 12;
  if (fhours === 0) fhours = 12;
  let fminutes = d.getMinutes();
  if (fminutes < 10) fminutes = '0' + fminutes;
  let fseconds = d.getSeconds();
  if (fseconds < 10) fseconds = '0' + fseconds;

  const dd = `${days[d.getDay()]} ${months[d.getMonth()]} ${fdate} ${d.getFullYear()} ${fhours}:${fminutes}:${fseconds} ${ampm}`;
  currentdt.textContent = dd;

  const cursecs = (d.getHours() * 3600) + (d.getMinutes() * 60) + d.getSeconds();

  if (starts && starts.length > 0) {
    const perc = starts.length;

    if (cursecs < starts[0]) {
      wearenowintro.textContent = "Countdown to";
      wearenowlabel.textContent = names[0];
      wearenow.textContent = secondstohhmmss(Math.abs(cursecs - starts[0]));
    } else if (cursecs > starts[perc - 1]) {
      wearenowintro.textContent = "Time past:";
      wearenowlabel.textContent = names[perc - 1];
      wearenowtimerange.textContent = '';
      wearenow.textContent = secondstohhmmss(cursecs - starts[perc - 1]);
      countdowntointro.textContent = '';
      countdowntolabel.textContent = '';
      countdown.textContent = '';
    } else {
      for (let x = 0; x < perc - 1; x++) {
        if (starts[x] < cursecs && starts[x + 1] > cursecs) {
          curperiod = x;
          wearenowintro.textContent = `We are now ${secondstohhmmss(cursecs - starts[x])} into:`;
          wearenowlabel.textContent = names[x];
          wearenow.textContent = '';
          countdowntointro.textContent = "Countdown to:";
          countdowntolabel.textContent = names[x + 1];
          countdown.textContent = secondstohhmmss(Math.abs(cursecs - starts[x + 1]));
        }
      }
    }

    let ts = `<div style='margin-top:30px;display:block;width:100%;text-align:center'>
              <div style='display:inline-block;margin-left:auto;margin-right:auto;text-align:left;width:auto'>
              Today's Schedule:<br />`;

    for (let x = 0; x < perc - 1; x++) {
      if (x === curperiod) ts += '<strong>';

      let disptime = times[x];
      let disptimex = times[x + 1];
      let disptimez = times[perc - 1];

      // Format times with AM/PM
      disptime = formatTimeWithAmPm(disptime);
      disptimex = formatTimeWithAmPm(disptimex);
      disptimez = formatTimeWithAmPm(disptimez);

      ts += `${disptime}-${disptimex} ${names[x]}<br>`;

      if (x === curperiod) {
        ts += '</strong>';
        const watt = `${disptime} &ndash; ${disptimex}`;
        wearenowtimerange.innerHTML = watt.replace(/0(.)\:/g, '$1:');
      }
    }

    ts += `${disptimez}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${names[perc - 1]}</div></div>`;
    schedule.innerHTML = ts;
  }
}

function formatTimeWithAmPm(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  let displayHours = hours % 12;
  if (displayHours === 0) displayHours = 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}

function secondstohhmmss(secs) {
  const h = Math.floor(secs / 3600);
  const displayH = h.toString().padStart(2, '0');

  const remainingSecs = secs - (h * 3600);
  const m = Math.floor(remainingSecs / 60);
  const displayM = m.toString().padStart(2, '0');

  const s = remainingSecs - (m * 60);
  const displayS = s.toString().padStart(2, '0');

  if (h > 0) {
    return `${displayH}:${displayM}:${displayS}`;
  } else if (m > 0) {
    return `${displayM}:${displayS}`;
  } else {
    return displayS;
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);