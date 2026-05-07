let currentDate = new Date();
let selectedDates = [];
const timeSlots = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
const defaultStartTime = '09:00';
const defaultEndTime = '10:00';
const demoCredentials = {
    username: 'töötaja',
    password: '1234'
};
const monthAvailabilityCache = new Map();

function formatDateString(year, month, day) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function createSeededRandom(seed) {
    let state = seed >>> 0;

    return function () {
        state += 0x6D2B79F5;
        let value = state;
        value = Math.imul(value ^ (value >>> 15), value | 1);
        value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
        return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
}

function getMonthAvailability(year, month) {
    const cacheKey = `${year}-${month}`;
    if (monthAvailabilityCache.has(cacheKey)) {
        return monthAvailabilityCache.get(cacheKey);
    }

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const random = createSeededRandom((year * 100) + month + 1);
    const unavailableDays = new Set();

    while (unavailableDays.size < 8 && unavailableDays.size < daysInMonth) {
        const candidateDay = Math.floor(random() * daysInMonth) + 1;
        unavailableDays.add(candidateDay);
    }

    const days = {};
    for (let day = 1; day <= daysInMonth; day++) {
        const available = !unavailableDays.has(day);
        days[day] = {
            available: available,
            slots: available ? timeSlots.slice() : []
        };
    }

    const availability = { unavailableDays: unavailableDays, days: days };
    monthAvailabilityCache.set(cacheKey, availability);
    return availability;
}

function renderTimePickers() {
    const startPicker = document.getElementById('startTimePicker');
    const endPicker = document.getElementById('endTimePicker');
    const startTime = document.getElementById('startTime').value || defaultStartTime;
    const endTime = document.getElementById('endTime').value || defaultEndTime;

    startPicker.innerHTML = timeSlots.map(time => `
        <button type="button" class="time-chip ${time === startTime ? 'active' : ''}" data-time="${time}" data-field="startTime">${time}</button>
    `).join('');

    endPicker.innerHTML = timeSlots
        .filter(time => time > startTime)
        .map(time => `
            <button type="button" class="time-chip ${time === endTime ? 'active' : ''}" data-time="${time}" data-field="endTime">${time}</button>
        `).join('');

    if (endTime <= startTime) {
        const nextValidEnd = timeSlots.find(time => time > startTime);
        document.getElementById('endTime').value = nextValidEnd || '';
    }

    startPicker.querySelectorAll('.time-chip').forEach(button => {
        button.addEventListener('click', () => {
            document.getElementById('startTime').value = button.dataset.time;
            const nextValidEnd = timeSlots.find(time => time > button.dataset.time);
            if (document.getElementById('endTime').value <= button.dataset.time) {
                document.getElementById('endTime').value = nextValidEnd || '';
            }
            renderTimePickers();
            updateConfirmButton();
        });
    });

    endPicker.querySelectorAll('.time-chip').forEach(button => {
        button.addEventListener('click', () => {
            document.getElementById('endTime').value = button.dataset.time;
            renderTimePickers();
            updateConfirmButton();
        });
    });
}

function showApp() {
    document.getElementById('loginScreen').style.display = 'none';
    document.querySelector('.container').style.display = 'block';
    renderTimePickers();
    renderCalendar();
    updateConfirmButton();
}

function showLogin() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.querySelector('.container').style.display = 'none';
}

function isLoggedIn() {
    return sessionStorage.getItem('tootajaLoggedIn') === 'true';
}

function login(event) {
    event.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const loginMessage = document.getElementById('loginMessage');

    if (username === demoCredentials.username && password === demoCredentials.password) {
        sessionStorage.setItem('tootajaLoggedIn', 'true');
        loginMessage.className = 'message success';
        loginMessage.textContent = 'Sisselogimine õnnestus.';
        showApp();
        return;
    }

    loginMessage.className = 'message error';
    loginMessage.textContent = 'Vale kasutajanimi või parool.';
}

// Sample data: which dates have available slots
const availableDates = {
    14: { available: true, slots: ['09:00', '10:00', '14:00', '15:00'] },
    15: { available: false, slots: [] },
    16: { available: true, slots: ['10:00', '11:00', '13:00', '15:00', '16:00'] },
    17: { available: true, slots: ['09:00', '11:00', '14:00'] },
    18: { available: false, slots: [] },
    21: { available: true, slots: ['10:00', '11:00', '13:00', '14:00'] },
    22: { available: true, slots: ['09:00', '10:00', '15:00', '16:00', '17:00'] }
};

function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthAvailability = getMonthAvailability(year, month);

    // Update month/year display
    const monthNames = ['Jaanuar', 'Veebruar', 'Märts', 'Aprill', 'Mai', 'Juuni',
        'Juuli', 'August', 'September', 'Oktoober', 'November', 'Detsember'];
    document.getElementById('monthYear').textContent = `${monthNames[month]} ${year}`;

    // Get first day and number of days in month
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    // Calculate starting point (adjust for Sunday being 0)
    const startDay = firstDay === 0 ? 6 : firstDay - 1;

    const calendar = document.getElementById('calendar');
    calendar.innerHTML = '';

    // Add day headers
    const dayHeaders = ['E', 'T', 'K', 'N', 'R', 'L', 'P'];
    for (let i = 0; i < 7; i++) {
        const header = document.createElement('div');
        header.className = 'calendar-day-header';
        header.textContent = dayHeaders[i];
        header.style.cssText = 'font-weight: bold; text-align: center; padding: 10px; background-color: #f0f0f0; border-bottom: 1px solid #ddd;';
        calendar.appendChild(header);
    }

    // Add previous month's days
    for (let i = startDay - 1; i >= 0; i--) {
        const day = document.createElement('div');
        day.className = 'calendar-day other-month';
        const dateObj = new Date(year, month, daysInPrevMonth - i);
        const dateString = formatDateString(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());

        day.innerHTML = `<div class="calendar-day-number">${daysInPrevMonth - i}</div>`;
        day.addEventListener('click', () => {
            currentDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), 1);
            selectDate(dateString);
        });
        calendar.appendChild(day);
    }

    // Add current month's days
    for (let i = 1; i <= daysInMonth; i++) {
        const day = document.createElement('div');
        day.className = 'calendar-day';

        const dateObj = new Date(year, month, i);
        const dateString = formatDateString(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
        const isSelected = selectedDates.includes(dateString);
        const dayData = monthAvailability.days[i];

        day.classList.add(dayData.available ? 'available' : 'unavailable');

        day.innerHTML = `
            <div class="calendar-day-number">${i}</div>
            ${dayData.available ? '' : '<div class="calendar-unavailable">Pole saadaval</div>'}
        `;

        if (dayData.available) {
            day.addEventListener('click', () => selectDate(dateString));
        } else {
            day.classList.add('unavailable');
            day.setAttribute('aria-disabled', 'true');
        }

        if (isSelected) {
            day.style.backgroundColor = '#e8f4f8';
            day.style.borderLeft = '4px solid #4a90e2';
        }

        calendar.appendChild(day);
    }

    // Add next month's days
    const totalCells = calendar.children.length - 7; // subtract header row
    const remainingCells = 42 - totalCells; // 6 rows * 7 days
    for (let i = 1; i <= remainingCells; i++) {
        const day = document.createElement('div');
        day.className = 'calendar-day other-month';
        const dateObj = new Date(year, month + 1, i);
        const dateString = formatDateString(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());

        day.innerHTML = `<div class="calendar-day-number">${i}</div>`;
        day.addEventListener('click', () => {
            currentDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), 1);
            selectDate(dateString);
        });
        calendar.appendChild(day);
    }
}

function previousMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
}

function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
}

function selectDate(dateString) {
    const existingIndex = selectedDates.indexOf(dateString);
    if (existingIndex >= 0) {
        selectedDates.splice(existingIndex, 1);
    } else {
        selectedDates.push(dateString);
    }

    document.getElementById('selectedInfo').style.display = selectedDates.length ? 'block' : 'none';

    const formatter = new Intl.DateTimeFormat('et-EE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    document.getElementById('selectedDate').textContent = selectedDates
        .slice()
        .sort()
        .map(date => formatter.format(new Date(date + 'T00:00:00')))
        .join('\n');
    updateConfirmButton();
    renderCalendar();
}

function resetSelection() {
    selectedDates = [];
    document.getElementById('selectedInfo').style.display = 'none';
    document.getElementById('locationSelect').value = '';
    document.getElementById('startTime').value = defaultStartTime;
    document.getElementById('endTime').value = defaultEndTime;
    document.getElementById('message').className = 'message';
    document.getElementById('message').textContent = '';
    updateConfirmButton();
    renderTimePickers();
    renderCalendar();
}

function updateConfirmButton() {
    const isValid = selectedDates.length > 0 &&
        document.getElementById('locationSelect').value &&
        document.getElementById('startTime').value &&
        document.getElementById('endTime').value;
    document.getElementById('confirmBtn').disabled = !isValid;
}

function confirmSelection() {
    const location = document.getElementById('locationSelect').value;
    const startTime = document.getElementById('startTime').value;
    const endTime = document.getElementById('endTime').value;
    const message = document.getElementById('message');

    if (!selectedDates.length || !location || !startTime || !endTime) {
        message.className = 'message error';
        message.textContent = 'Palun täida kõik väljad!';
        return;
    }

    if (startTime >= endTime) {
        message.className = 'message error';
        message.textContent = 'Lõpp peab olema algsest ajast hilisem!';
        return;
    }

    message.className = 'message success';
    message.textContent = `✓ Tööaeg kinnitatud: ${selectedDates.join(', ')}, ${startTime} - ${endTime}, ${location}`;

    console.log({
        dates: selectedDates,
        startTime: startTime,
        endTime: endTime,
        location: location
    });
}

// Event listeners for form changes
document.getElementById('locationSelect').addEventListener('change', updateConfirmButton);

document.getElementById('startTime').addEventListener('change', () => {
    renderTimePickers();
    updateConfirmButton();
});

document.getElementById('endTime').addEventListener('change', () => {
    renderTimePickers();
    updateConfirmButton();
});

document.getElementById('loginForm').addEventListener('submit', login);
document.getElementById('logoutBtn').addEventListener('click', () => {
    sessionStorage.removeItem('tootajaLoggedIn');
    document.getElementById('loginForm').reset();
    document.getElementById('loginMessage').className = 'message';
    document.getElementById('loginMessage').textContent = '';
    showLogin();
});

// Initial render
renderTimePickers();
if (isLoggedIn()) {
    showApp();
    renderCalendar();
} else {
    showLogin();
}
