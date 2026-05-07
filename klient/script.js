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
    'Tallinn': [
        { name: 'Tallinn - Liivalaia 8', address: 'Liivalaia 8, 10118 Tallinn' },
        { name: 'Tallinn - Mustamäe tee 46', address: 'Mustamäe tee 46, 10621 Tallinn' },
        { name: 'Tallinn - Peterburi tee 69', address: 'Peterburi tee 69, 10415 Tallinn' }
    ],
    'Tartu': [
        { name: 'Tartu - Riia 170', address: 'Riia 170, 51013 Tartu' },
        { name: 'Tartu - Võru 45', address: 'Võru 45, 51014 Tartu' }
    ],
    'Narva': [
        { name: 'Narva - Puškini 37', address: 'Puškini 37, 20307 Narva' }
    ],
    'Pärnu': [
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

function normalizePlate(value) {
    return value.toUpperCase().replace(/\s+/g, '').replace(/-/g, '');
}

function showStep(stepName) {
    activeStep = stepName;
    document.querySelectorAll('.step-panel').forEach(panel => panel.classList.remove('is-active'));
    document.getElementById(stepName).classList.add('is-active');
}

function setVehicleSummary(vehicle) {
    document.getElementById('summaryVehicle').textContent = vehicle.makeModel;
    document.getElementById('summaryFirstReg').textContent = vehicle.firstRegistration;
    document.getElementById('summaryValidUntil').textContent = vehicle.inspectionValidUntil;
    document.getElementById('summaryDaysLeft').textContent = String(vehicle.daysLeft);
}

function fillVehicleForm(vehicle, plateValue) {
    document.getElementById('makeModel').value = vehicle.makeModel;
    document.getElementById('category').value = vehicle.category;
    document.getElementById('firstRegistration').value = vehicle.firstRegistration;
    document.getElementById('inspectionValidUntil').value = vehicle.inspectionValidUntil;
    document.getElementById('plateReadonly').value = plateValue;
    setVehicleSummary(vehicle);
}

function handlePlateSubmit(event) {
    event.preventDefault();

    const input = document.getElementById('plateInput');
    const status = document.getElementById('plateStatus');
    const plateValue = normalizePlate(input.value);

    if (plateValue.length < 3 || plateValue.length > 10) {
        status.textContent = 'Palun sisesta kehtiv numbrimärk.';
        status.style.color = '#b00020';
        return;
    }

    const isFound = vehicleDatabase[plateValue];

    currentVehicle = isFound || {
        makeModel: '',
        category: '',
        firstRegistration: '',
        inspectionValidUntil: '',
        plate: plateValue,
        daysLeft: 0
    };

    if (isFound) {
        setVehicleSummary(currentVehicle);
        showStep('stepService');
    } else {
        fillVehicleForm(currentVehicle, plateValue);
        document.getElementById('lookupBanner').textContent = 'Numbrimärgi põhjal andmeid ei leitud. Palun sisesta sõiduki andmed käsitsi.';
        document.getElementById('lookupBanner').classList.add('warning');
        document.getElementById('lookupBanner').classList.remove('success');
        showStep('stepVehicle');
    }
}

function showDateError(fieldId, errorMessage) {
    const field = document.getElementById(fieldId);
    field.classList.add('error');

    const oldError = document.getElementById(fieldId + '-error');
    if (oldError) oldError.remove();

    const errorDiv = document.createElement('div');
    errorDiv.id = fieldId + '-error';
    errorDiv.className = 'error-message';
    errorDiv.textContent = errorMessage;
    field.parentNode.insertBefore(errorDiv, field.nextSibling);
}

function clearDateError(fieldId) {
    const field = document.getElementById(fieldId);
    field.classList.remove('error');
    const errorDiv = document.getElementById(fieldId + '-error');
    if (errorDiv) errorDiv.remove();
}

function validateDate(dateString) {
    // Format: DD/MM/YYYY
    const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = dateString.match(regex);

    if (!match) {
        return { valid: false, error: 'Kuupäev peab olema formaadis DD/MM/YYYY' };
    }

    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);

    // Check month
    if (month < 1 || month > 12) {
        return { valid: false, error: 'Kuu peab olema vahemikus 01-12' };
    }

    // Days in each month
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    // Check for leap year
    if ((year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0)) {
        daysInMonth[1] = 29;
    }

    // Check day
    if (day < 1 || day > daysInMonth[month - 1]) {
        return { valid: false, error: `Päev peab olema vahemikus 01-${daysInMonth[month - 1]} kuule ${month}` };
    }

    // Check year
    if (year < 1900 || year > 2200) {
        return { valid: false, error: 'Aasta peab olema vahemikus 1900-2200' };
    }

    return { valid: true };
}

function goToServiceStep() {
    const makeModel = document.getElementById('makeModel').value.trim();
    const category = document.getElementById('category').value.trim();
    const firstRegistration = document.getElementById('firstRegistration').value.trim();
    const inspectionValidUntil = document.getElementById('inspectionValidUntil').value.trim();

    // Clear previous errors
    clearDateError('firstRegistration');
    clearDateError('inspectionValidUntil');

    let hasError = false;

    // Validate dates if they are provided
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
    points.forEach(point => {
        const option = document.createElement('option');
        option.value = point.name;
        option.textContent = point.name;
        pointSelect.appendChild(option);
    });
}

function continueToCalendar() {
    const city = document.getElementById('citySelect').value;
    const point = document.getElementById('pointSelect').value;
    const service = document.getElementById('serviceSelect').value;

    if (!point) {
        alert('Palun vali kontrollipunkt.');
        return;
    }

    alert(`Valitud: ${city} - ${point}, ${service}. Järgmine samm võiks olla kuupäeva ja kellaaja valik.`);
}

function init() {
    document.getElementById('plateForm').addEventListener('submit', handlePlateSubmit);
    document.getElementById('backToPlate').addEventListener('click', goBackToPlate);
    document.getElementById('goToService').addEventListener('click', goToServiceStep);
    document.getElementById('backToVehicle').addEventListener('click', goBackToVehicle);
    document.getElementById('continueToCalendar').addEventListener('click', continueToCalendar);
    document.getElementById('citySelect').addEventListener('change', updateInspectionPoints);

    document.getElementById('plateInput').addEventListener('input', (event) => {
        event.target.value = event.target.value.toUpperCase();
    });

    fillVehicleForm(currentVehicle, '');
    updateInspectionPoints();
    showStep('stepPlate');
}

document.addEventListener('DOMContentLoaded', init);

function showDateError(fieldId, errorMessage) {
    const field = document.getElementById(fieldId);
    field.classList.add('error');

    const oldError = document.getElementById(fieldId + '-error');
    if (oldError) oldError.remove();

    const errorDiv = document.createElement('div');
    errorDiv.id = fieldId + '-error';
    errorDiv.className = 'error-message';
    errorDiv.textContent = errorMessage;
    field.parentNode.insertBefore(errorDiv, field.nextSibling);
}

function clearDateError(fieldId) {
    const field = document.getElementById(fieldId);
    field.classList.remove('error');
    const errorDiv = document.getElementById(fieldId + '-error');
    if (errorDiv) errorDiv.remove();
}

function validateDate(dateString) {
    // Format: DD/MM/YYYY
    const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = dateString.match(regex);

    if (!match) {
        return { valid: false, error: 'Kuupäev peab olema formaadis DD/MM/YYYY' };
    }

    function showDateError(fieldId, errorMessage) {
        const field = document.getElementById(fieldId);
        field.classList.add('error');

        const oldError = document.getElementById(fieldId + '-error');
        if (oldError) oldError.remove();

        const errorDiv = document.createElement('div');
        errorDiv.id = fieldId + '-error';
        errorDiv.className = 'error-message';
        errorDiv.textContent = errorMessage;
        field.parentNode.insertBefore(errorDiv, field.nextSibling);
    }

    function clearDateError(fieldId) {
        const field = document.getElementById(fieldId);
        field.classList.remove('error');
        const errorDiv = document.getElementById(fieldId + '-error');
        if (errorDiv) errorDiv.remove();
    }

    function validateDate(dateString) {
        // Format: DD/MM/YYYY
        const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
        const match = dateString.match(regex);

        if (!match) {
            return { valid: false, error: 'Kuupäev peab olema formaadis DD/MM/YYYY' };
        }

        const day = parseInt(match[1], 10);
        const month = parseInt(match[2], 10);
        const year = parseInt(match[3], 10);

        // Check month
        if (month < 1 || month > 12) {
            return { valid: false, error: 'Kuu peab olema vahemikus 01-12' };
        }

        // Days in each month
        const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

        // Check for leap year
        if ((year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0)) {
            daysInMonth[1] = 29;
        }

        // Check day
        if (day < 1 || day > daysInMonth[month - 1]) {
            return { valid: false, error: `Päev peab olema vahemikus 01-${daysInMonth[month - 1]} kuule ${month}` };
        }

        // Check year
        if (year < 1900 || year > 2200) {
            return { valid: false, error: 'Aasta peab olema vahemikus 1900-2200' };
        }

        return { valid: true };
    }

    function goToServiceStep() {
        const makeModel = document.getElementById('makeModel').value.trim();
        const category = document.getElementById('category').value.trim();
        const firstRegistration = document.getElementById('firstRegistration').value.trim();
        const inspectionValidUntil = document.getElementById('inspectionValidUntil').value.trim();

        // Clear previous errors
        clearDateError('firstRegistration');
        clearDateError('inspectionValidUntil');

        let hasError = false;

        // Validate dates if they are provided
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
        points.forEach(point => {
            const option = document.createElement('option');
            option.value = point.name;
            option.textContent = point.name;
            pointSelect.appendChild(option);
        });
    }

    function continueToCalendar() {
        const city = document.getElementById('citySelect').value;
        const point = document.getElementById('pointSelect').value;
        const service = document.getElementById('serviceSelect').value;

        if (!point) {
            alert('Palun vali kontrollipunkt.');
            return;
        }

        alert(`Valitud: ${city} - ${point}, ${service}. Järgmine samm võiks olla kuupäeva ja kellaaja valik.`);
    }

    function init() {
        document.getElementById('plateForm').addEventListener('submit', handlePlateSubmit);
        document.getElementById('backToPlate').addEventListener('click', goBackToPlate);
        document.getElementById('goToService').addEventListener('click', goToServiceStep);
        document.getElementById('backToVehicle').addEventListener('click', goBackToVehicle);
        document.getElementById('continueToCalendar').addEventListener('click', continueToCalendar);
        document.getElementById('citySelect').addEventListener('change', updateInspectionPoints);

        document.getElementById('plateInput').addEventListener('input', (event) => {
            event.target.value = event.target.value.toUpperCase();
        });

        fillVehicleForm(currentVehicle, '');
        updateInspectionPoints();
        showStep('stepPlate');
    }

    document.addEventListener('DOMContentLoaded', init);
}
