let currentDate = new Date();
const timeSlots = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
let currentViewFilter = 'all';
let selectedDateForDetails = null;
let selectedWorkerForDetails = null;
let selectedLocations = new Set(['tallinn', 'tartu', 'haapsalu', 'narva']);
let searchQuery = '';

const demoCredentials = {
    username: 'boss',
    password: '1234'
};

const monthAvailabilityCache = new Map();

function generateRandomWorkerDates(workerId, year, month) {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const random = createSeededRandom((year * 100) + month + 1000 + workerId);
    const monthAvailability = getMonthAvailability(year, month);

    const availableDays = [];
    for (let day = 1; day <= daysInMonth; day++) {
        if (monthAvailability[day]) {
            availableDays.push(day);
        }
    }

    const numDates = Math.floor(random() * 3) + 2; // 2-4 dates
    const selectedDates = [];

    for (let i = 0; i < numDates && availableDays.length > 0; i++) {
        const idx = Math.floor(random() * availableDays.length);
        const day = availableDays[idx];
        selectedDates.push(formatDateString(year, month, day));
        availableDays.splice(idx, 1);
    }

    return selectedDates.sort();
}

// Mock worker requests data with base structure
const workerRequestsBase = [
    { id: 1, name: 'Martin Sepp', location: 'Tallinn', status: 'pending' },
    { id: 2, name: 'Kristi Tamme', location: 'Tartu', status: 'pending' },
    { id: 3, name: 'Juhan Kivi', location: 'Narva', status: 'pending' },
    { id: 4, name: 'Anne Mets', location: 'Haapsalu', status: 'approved' },
    { id: 5, name: 'Kerje Saar', location: 'Tallinn', status: 'rejected' }
];

// Generate random dates for each worker for a specific month
function getWorkerRequestsForMonth(year, month) {
    return workerRequestsBase.map(req => ({
        ...req,
        dates: generateRandomWorkerDates(req.id, year, month)
    }));
}

// Get initial requests (will be regenerated when month changes)
let workerRequests = getWorkerRequestsForMonth(2026, 4);

// Store approved/rejected decisions (keyed by workerId-dateString)
const decisions = {};
workerRequests.forEach(req => {
    req.dates.forEach(dateString => {
        decisions[`${req.id}-${dateString}`] = req.status;
    });
});

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
        days[day] = !unavailableDays.has(day);
    }

    monthAvailabilityCache.set(cacheKey, days);
    return days;
}

function getRequestsForDay(dateString) {
    return workerRequests.filter(req => req.dates.includes(dateString));
}

function getFilteredRequestsForDay(dateString) {
    return getRequestsForDay(dateString).filter(req => {
        const locationMatch = selectedLocations.has(req.location.toLowerCase());
        const searchMatch = req.name.toLowerCase().includes(searchQuery);
        return locationMatch && searchMatch;
    });
}

function getFilteredRequestStatusForDay(dateString) {
    const requests = getFilteredRequestsForDay(dateString);
    if (requests.length === 0) return null;

    const statuses = requests.map(r => decisions[`${r.id}-${dateString}`]);
    if (statuses.includes('pending')) return 'pending';
    if (statuses.some(s => s === 'approved')) return 'approved';
    return 'rejected';
}

function getRequestStatusForDay(dateString) {
    const requests = getRequestsForDay(dateString);
    if (requests.length === 0) return null;

    const statuses = requests.map(r => decisions[`${r.id}-${dateString}`]);
    if (statuses.includes('pending')) return 'pending';
    if (statuses.some(s => s === 'approved')) return 'approved';
    return 'rejected';
}

function setViewFilter(filter) {
    currentViewFilter = filter;
    document.querySelectorAll('.view-item').forEach(item => item.classList.remove('active'));
    event.target.closest('.view-item').classList.add('active');
    renderCalendar();
}

function showApp() {
    document.getElementById('loginScreen').style.display = 'none';
    document.querySelector('.app-container').style.display = 'flex';
    renderCalendar();
}

function showLogin() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.querySelector('.app-container').style.display = 'none';
}

function isLoggedIn() {
    return sessionStorage.getItem('bossLoggedIn') === 'true';
}

function login(event) {
    event.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const loginMessage = document.getElementById('loginMessage');

    if (username === demoCredentials.username && password === demoCredentials.password) {
        sessionStorage.setItem('bossLoggedIn', 'true');
        loginMessage.className = 'message success';
        loginMessage.textContent = 'Sisselogimine õnnestus.';
        showApp();
        return;
    }

    loginMessage.className = 'message error';
    loginMessage.textContent = 'Vale kasutajanimi või parool.';
}

function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Regenerate worker requests for the current viewing month
    workerRequests = getWorkerRequestsForMonth(year, month);

    const monthNames = ['Jaanuar', 'Veebruar', 'Märts', 'Aprill', 'Mai', 'Juuni',
        'Juuli', 'August', 'September', 'Oktoober', 'November', 'Detsember'];
    document.getElementById('monthYear').textContent = `${monthNames[month]} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    const startDay = firstDay === 0 ? 6 : firstDay - 1;

    const calendar = document.getElementById('calendar');
    calendar.innerHTML = '';

    const dayHeaders = ['E', 'T', 'K', 'N', 'R', 'L', 'P'];
    for (let i = 0; i < 7; i++) {
        const header = document.createElement('div');
        header.className = 'calendar-day-header';
        header.textContent = dayHeaders[i];
        calendar.appendChild(header);
    }

    // Previous month's days
    for (let i = startDay - 1; i >= 0; i--) {
        const day = document.createElement('div');
        day.className = 'calendar-day other-month';
        day.innerHTML = `<div class="calendar-day-number">${daysInPrevMonth - i}</div>`;
        calendar.appendChild(day);
    }

    // Current month's days
    for (let i = 1; i <= daysInMonth; i++) {
        const dateObj = new Date(year, month, i);
        const dateString = formatDateString(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
        const status = getFilteredRequestStatusForDay(dateString);
        const requests = getFilteredRequestsForDay(dateString);

        const day = document.createElement('div');
        day.className = 'calendar-day';

        if (requests.length > 0) {
            day.classList.add(`status-${status}`);
            day.innerHTML = `<div class="calendar-day-number">${i}</div><div class="request-indicator">${requests.length}</div>`;
        } else {
            day.innerHTML = `<div class="calendar-day-number">${i}</div>`;
        }

        day.addEventListener('click', () => {
            selectedDateForDetails = dateString;
            renderDayDetails(dateString);
            document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
            day.classList.add('selected');
        });

        calendar.appendChild(day);
    }

    // Next month's days
    const totalCells = calendar.children.length - 7;
    const remainingCells = 42 - totalCells;
    for (let i = 1; i <= remainingCells; i++) {
        const day = document.createElement('div');
        day.className = 'calendar-day other-month';
        day.innerHTML = `<div class="calendar-day-number">${i}</div>`;
        calendar.appendChild(day);
    }
}

function renderDayDetails(dateString) {
    const allRequests = getRequestsForDay(dateString);
    const filteredRequests = getFilteredRequestsForDay(dateString);
    const container = document.getElementById('dayDetailsContainer');

    if (allRequests.length === 0) {
        container.innerHTML = '<p style="color: #999; text-align: center; margin-top: 24px;">Sel päeval pole taotlusi</p>';
        return;
    }

    if (filteredRequests.length === 0) {
        container.innerHTML = '<p style="color: #999; text-align: center; margin-top: 24px;">Valitud filtritele taotlusi ei leidnud</p>';
        return;
    }

    const date = new Date(dateString + 'T00:00:00');
    const formatter = new Intl.DateTimeFormat('et-EE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const dateDisplay = formatter.format(date);

    let html = `<div class="day-details-header">
    <p style="font-size: 12px; color: #666;">KUUPÄEV</p>
    <p style="font-size: 16px; font-weight: 600;">${dateDisplay}</p>
</div>`;

    html += '<div class="requests-list">';
    filteredRequests.forEach(req => {
        const decision = decisions[`${req.id}-${dateString}`];
        const statusLabel = decision === 'pending' ? 'Ootel' : decision === 'approved' ? 'Kinnitatud' : 'Keeldutud';
        const statusClass = `status-${decision}`;

        html += `
        <div class="request-card">
            <div class="request-header">
                <div class="request-name">${req.name}</div>
                <div class="request-location">${req.location}</div>
            </div>
            <div class="request-body">
                <div class="request-time">09:00-17:00</div>
            </div>
            <div class="request-footer">
                ${decision === 'pending' ? `
                    <button class="btn btn-approve" onclick="approveRequest(${req.id}, '${dateString}')">Kinnita</button>
                    <button class="btn btn-reject" onclick="rejectRequest(${req.id}, '${dateString}')">Keeldu</button>
                ` : `
                    <button class="btn btn-change" onclick="changeDecision(${req.id}, '${dateString}')">Muuda</button>
                `}
            </div>
        </div>
    `;
    });

    html += '</div>';
    container.innerHTML = html;
}

function approveRequest(workerId, dateString) {
    decisions[`${workerId}-${dateString}`] = 'approved';
    if (selectedDateForDetails) {
        renderDayDetails(selectedDateForDetails);
    }
    renderCalendar();
}

function rejectRequest(workerId, dateString) {
    decisions[`${workerId}-${dateString}`] = 'rejected';
    if (selectedDateForDetails) {
        renderDayDetails(selectedDateForDetails);
    }
    renderCalendar();
}

function changeDecision(workerId, dateString) {
    const currentDecision = decisions[`${workerId}-${dateString}`];
    if (currentDecision === 'approved') {
        decisions[`${workerId}-${dateString}`] = 'pending';
    } else if (currentDecision === 'rejected') {
        decisions[`${workerId}-${dateString}`] = 'pending';
    }
    if (selectedDateForDetails) {
        renderDayDetails(selectedDateForDetails);
    }
    renderCalendar();
}

function previousMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
}

function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
}

// Event listeners
document.getElementById('loginForm').addEventListener('submit', login);
document.getElementById('logoutBtn').addEventListener('click', () => {
    sessionStorage.removeItem('bossLoggedIn');
    document.getElementById('loginForm').reset();
    document.getElementById('loginMessage').className = 'message';
    document.getElementById('loginMessage').textContent = '';
    showLogin();
});

// Location filter listeners
document.querySelectorAll('.location-filter').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
        const location = e.target.value;
        if (e.target.checked) {
            selectedLocations.add(location);
        } else {
            selectedLocations.delete(location);
        }
        renderCalendar();
        if (selectedDateForDetails) {
            renderDayDetails(selectedDateForDetails);
        }
    });
});

// Search input listener
const searchInput = document.getElementById('searchWorker');
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase();
        renderCalendar();
        if (selectedDateForDetails) {
            renderDayDetails(selectedDateForDetails);
        }
    });
}

// Initial render
if (isLoggedIn()) {
    showApp();
} else {
    showLogin();
}
