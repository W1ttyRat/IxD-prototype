const vehicleDatabase = {
    '123ABC': {
        makeModel: 'TOYOTA, RAV4',
        category: 'M1',
        firstRegistration: '14/04/2020',
        inspectionValidUntil: '21/11/2026',
        plate: '123ABC',
        daysLeft: 198
    },
    '456DEF': {
        makeModel: 'VOLKSWAGEN, GOLF',
        category: 'M1',
        firstRegistration: '02/09/2019',
        inspectionValidUntil: '08/08/2026',
        plate: '456DEF',
        daysLeft: 173
    }
};

const inspectionPoints = {
    Tallinn: [
        { name: 'Tallinn - Liivalaia 8', address: 'Liivalaia 8, 10118 Tallinn' },
        { name: 'Tallinn - Mustamäe tee 46', address: 'Mustamäe tee 46, 10621 Tallinn' },
        { name: 'Tallinn - Peterburi tee 69', address: 'Peterburi tee 69, 10415 Tallinn' }
    ],
    Tartu: [
        { name: 'Tartu - Riia 170', address: 'Riia 170, 51013 Tartu' },
        { name: 'Tartu - Võru 45', address: 'Võru 45, 51014 Tartu' }
    ],
    Narva: [
        { name: 'Narva - Puškini 37', address: 'Puškini 37, 20307 Narva' }
    ],
    Pärnu: [
        { name: 'Pärnu - Väike-Seminarist 1', address: 'Väike-Seminarist 1, 80038 Pärnu' }
    ]
};

let activeStep = 'plate';
let currentVehicle = {
    makeModel: 'TOYOTA, RAV4',
    category: 'M1',
    firstRegistration: '14/04/2020',
    inspectionValidUntil: '21/11/2026',
    plate: '',
    daysLeft: 198
};

// Calendar state
let calendarMonth = 5; // May (0-indexed: 0=Jan, 5=May)
let calendarYear = 2026;
let selectedDate = null;
let selectedTime = null;

// Available time slots (hardcoded for demo)
const availableTimeSlots = [
    { time: '08:00', price: 53.95, available: true },
    { time: '09:00', price: 53.95, available: true },
    { time: '10:00', price: 53.95, available: false },
    { time: '11:00', price: 53.95, available: true },
    { time: '12:00', price: 53.95, available: true },
    { time: '13:00', price: 53.95, available: true },
    { time: '14:00', price: 53.95, available: true },
    { time: '15:00', price: 53.95, available: true },
    { time: '16:00', price: 53.95, available: true }
];

function normalizePlate(value) {
    return value.toUpperCase().replace(/\s+/g, '').replace(/-/g, '');
}

function showStep(stepName) {
    activeStep = stepName;
    document.querySelectorAll('.step-panel').forEach((panel) => panel.classList.remove('is-active'));
    document.getElementById(stepName).classList.add('is-active');
}

function setVehicleSummary(vehicle) {
    document.getElementById('summaryVehicle').textContent = vehicle.makeModel;
    document.getElementById('summaryFirstReg').textContent = vehicle.firstRegistration;
    document.getElementById('summaryValidUntil').textContent = vehicle.inspectionValidUntil;
    document.getElementById('summaryDaysLeft').textContent = String(vehicle.daysLeft);
}

function setCalendarSummary() {
    const city = document.getElementById('citySelect').value;
    const point = document.getElementById('pointSelect').value;
    const service = document.getElementById('serviceSelect').value;

    document.getElementById('calendarCity').textContent = city;
    document.getElementById('calendarPoint').textContent = point || '-';
    document.getElementById('calendarService').textContent = service;
    document.getElementById('calendarVehicle').textContent = currentVehicle.makeModel || currentVehicle.plate || '-';
}

function fillVehicleForm(vehicle, plateValue) {
    document.getElementById('makeModel').value = vehicle.makeModel;
    document.getElementById('category').value = vehicle.category;
    document.getElementById('firstRegistration').value = vehicle.firstRegistration;
    document.getElementById('inspectionValidUntil').value = vehicle.inspectionValidUntil;
    document.getElementById('plateReadonly').value = plateValue;
    setVehicleSummary(vehicle);
}

function clearDateError(fieldId) {
    const field = document.getElementById(fieldId);
    field.classList.remove('error');
    const errorElement = document.getElementById(`${fieldId}-error`);
    if (errorElement) {
        errorElement.remove();
    }
}

function showDateError(fieldId, errorMessage) {
    const field = document.getElementById(fieldId);
    field.classList.add('error');

    const oldError = document.getElementById(`${fieldId}-error`);
    if (oldError) {
        oldError.remove();
    }

    const errorDiv = document.createElement('div');
    errorDiv.id = `${fieldId}-error`;
    errorDiv.className = 'error-message';
    errorDiv.textContent = errorMessage;
    field.insertAdjacentElement('afterend', errorDiv);
}

function validateDate(dateString) {
    const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = dateString.match(regex);

    if (!match) {
        return { valid: false, error: 'Kuupäev peab olema formaadis DD/MM/YYYY' };
    }

    const day = Number.parseInt(match[1], 10);
    const month = Number.parseInt(match[2], 10);
    const year = Number.parseInt(match[3], 10);

    if (month < 1 || month > 12) {
        return { valid: false, error: 'Kuu peab olema vahemikus 01-12' };
    }

    if (year < 1900 || year > 2200) {
        return { valid: false, error: 'Aasta peab olema vahemikus 1900-2200' };
    }

    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);

    if (isLeapYear) {
        daysInMonth[1] = 29;
    }

    if (day < 1 || day > daysInMonth[month - 1]) {
        return { valid: false, error: `Päev peab olema vahemikus 01-${daysInMonth[month - 1]} kuule ${month}` };
    }

    return { valid: true };
}

function handlePlateSubmit(event) {
    event.preventDefault();

    const input = document.getElementById('plateInput');
    const status = document.getElementById('plateStatus');
    const plateValue = normalizePlate(input.value);

    status.textContent = '';
    status.style.color = '';

    if (plateValue.length < 3 || plateValue.length > 10) {
        status.textContent = 'Palun sisesta kehtiv numbrimärk.';
        status.style.color = '#b00020';
        return;
    }

    const foundVehicle = vehicleDatabase[plateValue];

    currentVehicle = foundVehicle || {
        makeModel: '',
        category: '',
        firstRegistration: '',
        inspectionValidUntil: '',
        plate: plateValue,
        daysLeft: 0
    };

    fillVehicleForm(currentVehicle, plateValue);

    const lookupBanner = document.getElementById('lookupBanner');

    if (foundVehicle) {
        lookupBanner.classList.remove('warning');
        lookupBanner.classList.add('success');
        lookupBanner.textContent = 'Numbrimärk leiti andmebaasist. Andmed on täidetud automaatselt.';
        showStep('stepService');
        return;
    }

    lookupBanner.classList.remove('success');
    lookupBanner.classList.add('warning');
    lookupBanner.textContent = 'Numbrimärgi põhjal andmeid ei leitud. Palun sisesta sõiduki andmed käsitsi.';
    showStep('stepVehicle');
}

function goToServiceStep() {
    const makeModel = document.getElementById('makeModel').value.trim();
    const category = document.getElementById('category').value.trim();
    const firstRegistration = document.getElementById('firstRegistration').value.trim();
    const inspectionValidUntil = document.getElementById('inspectionValidUntil').value.trim();

    clearDateError('firstRegistration');
    clearDateError('inspectionValidUntil');

    let hasError = false;

    if (firstRegistration) {
        const firstRegValidation = validateDate(firstRegistration);
        if (!firstRegValidation.valid) {
            showDateError('firstRegistration', firstRegValidation.error);
            hasError = true;
        }
    }

    if (inspectionValidUntil) {
        const validUntilValidation = validateDate(inspectionValidUntil);
        if (!validUntilValidation.valid) {
            showDateError('inspectionValidUntil', validUntilValidation.error);
            hasError = true;
        }
    }

    if (hasError) {
        return;
    }

    currentVehicle.makeModel = makeModel || currentVehicle.makeModel;
    currentVehicle.category = category || currentVehicle.category;
    currentVehicle.firstRegistration = firstRegistration || currentVehicle.firstRegistration;
    currentVehicle.inspectionValidUntil = inspectionValidUntil || currentVehicle.inspectionValidUntil;
    currentVehicle.plate = document.getElementById('plateReadonly').value.trim() || currentVehicle.plate;

    setVehicleSummary(currentVehicle);
    document.getElementById('lookupBanner').classList.remove('warning');
    document.getElementById('lookupBanner').classList.add('success');
    document.getElementById('lookupBanner').textContent = 'Andmed on kontrollitud.';
    showStep('stepService');
}

function goBackToPlate() {
    showStep('stepPlate');
}

function goBackToVehicle() {
    showStep('stepVehicle');
}

function updateInspectionPoints() {
    const selectedCity = document.getElementById('citySelect').value;
    const pointSelect = document.getElementById('pointSelect');

    pointSelect.innerHTML = '<option value="">Vali kontrollipunkt</option>';

    const points = inspectionPoints[selectedCity] || [];
    points.forEach((point) => {
        const option = document.createElement('option');
        option.value = point.name;
        option.textContent = point.name;
        pointSelect.appendChild(option);
    });
}

function continueToCalendar() {
    const city = document.getElementById('citySelect').value;
    const point = document.getElementById('pointSelect').value;
    if (!point) {
        document.getElementById('pointSelect').focus();
        return;
    }

    setCalendarSummary();

    // Initialize calendar with today's date
    const today = new Date();
    calendarMonth = today.getMonth();
    calendarYear = today.getFullYear();
    selectedDate = new Date(today);
    selectedTime = null;

    // Render calendar and time slots
    renderCalendar(calendarYear, calendarMonth);
    renderTimeSlots();
    updateSelectedDateDisplay();

    showStep('stepCalendar');
}

function goBackToService() {
    showStep('stepService');
}

// Calendar functions
function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
    return new Date(year, month, 1).getDay();
}

function formatMonthYear(month, year) {
    const months = ['jaanuar', 'veebruar', 'märts', 'aprill', 'mai', 'juuni', 'juuli', 'august', 'september', 'oktoober', 'november', 'detsember'];
    return `${months[month]} ${year}`;
}

function formatDateDisplay(date) {
    const days = ['E', 'T', 'K', 'N', 'R', 'L', 'P'];
    const months = ['jaanuar', 'veebruar', 'märts', 'aprill', 'mai', 'juuni', 'juuli', 'august', 'september', 'oktoober', 'november', 'detsember'];
    const dayIndex = date.getDay();
    const dayAbbr = days[dayIndex];
    const monthName = months[date.getMonth()];
    return `${dayAbbr}. ${monthName} ${date.getDate()}`;
}

function renderCalendar(year, month) {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    // Update month/year header
    document.getElementById('monthYear').textContent = formatMonthYear(month, year);

    // Clear calendar grid
    const grid = document.getElementById('calendarGrid');
    grid.innerHTML = '';

    // Add empty cells for days before the month starts
    for (let i = 0; i < firstDay; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'calendar-day empty';
        grid.appendChild(emptyCell);
    }

    // Add date cells
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        const cell = document.createElement('button');
        cell.className = 'calendar-day';
        cell.textContent = day;

        const cellDate = new Date(year, month, day);

        // Highlight today
        if (cellDate.toDateString() === today.toDateString()) {
            cell.classList.add('today');
        }

        // Highlight selected date
        if (selectedDate && cellDate.toDateString() === selectedDate.toDateString()) {
            cell.classList.add('selected');
        }

        // Disable past dates
        if (cellDate < today) {
            cell.disabled = true;
            cell.classList.add('disabled');
        }

        cell.addEventListener('click', () => {
            selectedDate = new Date(year, month, day);
            renderCalendar(year, month);
            renderTimeSlots();
            updateSelectedDateDisplay();
        });

        grid.appendChild(cell);
    }
}

function renderTimeSlots() {
    const container = document.getElementById('timeSlotsContainer');
    container.innerHTML = '';

    availableTimeSlots.forEach(slot => {
        const button = document.createElement('button');
        button.className = 'time-slot';

        if (slot.available) {
            button.classList.add('available');
        } else {
            button.classList.add('unavailable');
            button.disabled = true;
        }

        if (selectedTime === slot.time) {
            button.classList.add('selected');
        }

        button.innerHTML = `
            <div class="slot-time">${slot.time}</div>
            <div class="slot-price">${slot.price.toFixed(2)}€</div>
        `;

        if (slot.available) {
            button.addEventListener('click', () => {
                selectedTime = slot.time;
                renderTimeSlots();
            });
        }

        container.appendChild(button);
    });
}

function updateSelectedDateDisplay() {
    if (selectedDate) {
        document.getElementById('selectedDateDisplay').textContent = formatDateDisplay(selectedDate);
    }
}

function confirmAppointment() {
    if (!selectedDate || !selectedTime) {
        alert('Palun vali kuupäev ja kellaaeg.');
        return;
    }

    const dateStr = `${selectedDate.getDate()}/${selectedDate.getMonth() + 1}/${selectedDate.getFullYear()}`;
    alert(`Broneering: ${document.getElementById('calendarCity').textContent}, ${document.getElementById('calendarPoint').textContent}, ${document.getElementById('calendarService').textContent} - ${dateStr} kell ${selectedTime}`);
}

function init() {
    document.getElementById('plateForm').addEventListener('submit', handlePlateSubmit);
    document.getElementById('backToPlate').addEventListener('click', goBackToPlate);
    document.getElementById('goToService').addEventListener('click', goToServiceStep);
    document.getElementById('backToVehicle').addEventListener('click', goBackToVehicle);
    document.getElementById('continueToCalendar').addEventListener('click', continueToCalendar);
    document.getElementById('backToService').addEventListener('click', goBackToService);
    document.getElementById('confirmAppointment').addEventListener('click', confirmAppointment);
    document.getElementById('citySelect').addEventListener('change', updateInspectionPoints);

    // Calendar navigation
    document.getElementById('prevMonth').addEventListener('click', () => {
        calendarMonth--;
        if (calendarMonth < 0) {
            calendarMonth = 11;
            calendarYear--;
        }
        renderCalendar(calendarYear, calendarMonth);
    });

    document.getElementById('nextMonth').addEventListener('click', () => {
        calendarMonth++;
        if (calendarMonth > 11) {
            calendarMonth = 0;
            calendarYear++;
        }
        renderCalendar(calendarYear, calendarMonth);
    });

    document.getElementById('plateInput').addEventListener('input', (event) => {
        event.target.value = event.target.value.toUpperCase();
    });

    fillVehicleForm(currentVehicle, '');
    updateInspectionPoints();
    showStep('stepPlate');
}

document.addEventListener('DOMContentLoaded', init);
