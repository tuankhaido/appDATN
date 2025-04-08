// Constants and Variables
const yearMapping = {
    // Cho "Năm 1" hiển thị học kỳ 1, 2
    'nam1': { name: 'Năm 1', semesters: [1, 2] },
    // Cho "Năm 2" hiển thị học kỳ 1, 2, 3, 4
    'nam2': { name: 'Năm 2', semesters: [1, 2, 3, 4] },
    // Cho "Năm 3" hiển thị học kỳ 1, 2, 3, 4, 5, 6
    'nam3': { name: 'Năm 3', semesters: [1, 2, 3, 4, 5, 6] },
    // Cho "Năm 4" hiển thị học kỳ 1, 2, 3, 4, 5, 6, 7, 8
    'nam4': { name: 'Năm 4', semesters: [1, 2, 3, 4, 5, 6, 7, 8] }
};

let subjectsData = [];

// DOM Elements
const yearSelector = document.getElementById('year-selector');
const formTitle = document.getElementById('form-title');
const subjectForm = document.getElementById('subject-form');
const semesterTabs = document.getElementById('semester-tabs');
const semesterContent = document.getElementById('semester-content');
const resultsSection = document.getElementById('results-section');
const resultsBody = document.getElementById('results-body');
const alertContainer = document.getElementById('alert-container');

// Load subjects data from JSON file
async function loadSubjectsData() {
    try {
        const response = await fetch('/data/subjects.json');
        if (!response.ok) {
            throw new Error('Không thể tải dữ liệu môn học');
        }
        subjectsData = await response.json();
        
        // Initial display of subjects for the default year (Năm 1)
        displaySubjectsForYear('nam1');
    } catch (error) {
        showAlert('danger', `Lỗi: ${error.message}`);
    }
}

// Create semester tabs for the selected year
function createSemesterTabs(semesters) {
    // Clear existing tabs
    semesterTabs.innerHTML = '';
    semesterContent.innerHTML = '';
    
    // Create tabs and content for each semester
    semesters.forEach((semester, index) => {
        // Create tab
        const tabItem = document.createElement('li');
        tabItem.className = 'nav-item';
        tabItem.setAttribute('role', 'presentation');
        
        const tabButton = document.createElement('button');
        tabButton.className = index === 0 ? 'nav-link active' : 'nav-link';
        tabButton.id = `semester${semester}-tab`;
        tabButton.setAttribute('data-bs-toggle', 'tab');
        tabButton.setAttribute('data-bs-target', `#semester${semester}-content`);
        tabButton.setAttribute('type', 'button');
        tabButton.setAttribute('role', 'tab');
        tabButton.setAttribute('aria-controls', `semester${semester}-content`);
        tabButton.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
        tabButton.textContent = `Học kỳ ${semester}`;
        
        tabItem.appendChild(tabButton);
        semesterTabs.appendChild(tabItem);
        
        // Create tab content
        const tabPane = document.createElement('div');
        tabPane.className = index === 0 ? 'tab-pane fade show active' : 'tab-pane fade';
        tabPane.id = `semester${semester}-content`;
        tabPane.setAttribute('role', 'tabpanel');
        tabPane.setAttribute('aria-labelledby', `semester${semester}-tab`);
        
        const subjectsContainer = document.createElement('div');
        subjectsContainer.className = 'row';
        subjectsContainer.id = `semester${semester}-subjects`;
        
        tabPane.appendChild(subjectsContainer);
        semesterContent.appendChild(tabPane);
        
        // Filter and display subjects for this semester
        const semesterSubjectsData = subjectsData.filter(subject => subject.hocKy === semester);
        displaySubjectsForSemester(semesterSubjectsData, subjectsContainer, semester);
    });
}

// Display subjects for the selected year
function displaySubjectsForYear(yearValue) {
    const yearInfo = yearMapping[yearValue];
    formTitle.textContent = `Nhập điểm cho ${yearInfo.name}`;
    
    // Create tabs and display subjects for each semester
    createSemesterTabs(yearInfo.semesters);
}

// Display subjects for a semester
function displaySubjectsForSemester(semesterSubjects, container, semesterNumber) {
    // Create subject input cards
    semesterSubjects.forEach(subject => {
        const colDiv = document.createElement('div');
        colDiv.className = 'col-md-6 col-lg-4 mb-3';
        
        colDiv.innerHTML = `
            <div class="card subject-card">
                <div class="card-header bg-light">
                    <span class="subject-code">${subject.maHocPhan}</span>
                    ${subject.tenHocPhan}
                </div>
                <div class="card-body">
                    <div class="form-floating">
                        <input type="number" class="form-control subject-score" 
                            id="subject-${subject.maHocPhan}-${semesterNumber}" 
                            name="subject-${subject.maHocPhan}-${semesterNumber}"
                            placeholder="Điểm" min="0" max="10" step="0.1" required
                            data-subject-code="${subject.maHocPhan}"
                            data-subject-name="${subject.tenHocPhan}"
                            data-semester="${semesterNumber}">
                        <label for="subject-${subject.maHocPhan}-${semesterNumber}">Điểm (0-10)</label>
                    </div>
                </div>
            </div>
        `;
        
        container.appendChild(colDiv);
    });
}

// Show alert message
function showAlert(type, message, duration = 5000) {
    const alertId = `alert-${Date.now()}`;
    const alertHtml = `
        <div id="${alertId}" class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
    
    alertContainer.insertAdjacentHTML('beforeend', alertHtml);
    
    // Auto-dismiss the alert after the duration
    if (duration > 0) {
        setTimeout(() => {
            const alertElement = document.getElementById(alertId);
            if (alertElement) {
                const bsAlert = bootstrap.Alert.getOrCreateInstance(alertElement);
                bsAlert.close();
            }
        }, duration);
    }
    
    // Scroll to alert
    window.scrollTo({ top: alertContainer.offsetTop, behavior: 'smooth' });
}

// Validate scores
function validateScores() {
    const activeTab = document.querySelector('.tab-pane.active');
    const scoreInputs = activeTab.querySelectorAll('.subject-score');
    let isValid = true;
    let errorMessages = [];
    
    scoreInputs.forEach(input => {
        // Reset validation visual state
        input.classList.remove('is-invalid');
        
        const value = input.value.trim();
        const score = parseFloat(value);
        const subjectName = input.dataset.subjectName;
        
        if (value === '') {
            input.classList.add('is-invalid');
            errorMessages.push(`Vui lòng nhập điểm cho môn ${subjectName}`);
            isValid = false;
        } else if (isNaN(score) || score < 0 || score > 10) {
            input.classList.add('is-invalid');
            errorMessages.push(`Điểm của môn ${subjectName} phải từ 0 đến 10`);
            isValid = false;
        }
    });
    
    return { isValid, errorMessages };
}

// Process form submission
function processForm(event) {
    event.preventDefault();
    
    const { isValid, errorMessages } = validateScores();
    
    if (!isValid) {
        showAlert('danger', `<strong>Lỗi:</strong><ul>${errorMessages.map(msg => `<li>${msg}</li>`).join('')}</ul>`);
        return;
    }
    
    // Collect all subject scores from the active tab
    const activeTab = document.querySelector('.tab-pane.active');
    const subjectScores = [];
    const scoreInputs = activeTab.querySelectorAll('.subject-score');
    
    scoreInputs.forEach(input => {
        if (input.value.trim() !== '') {
            subjectScores.push({
                subjectCode: input.dataset.subjectCode,
                subjectName: input.dataset.subjectName,
                semester: parseInt(input.dataset.semester),
                score: parseFloat(input.value)
            });
        }
    });
    
    // Send data to server
    submitScores(subjectScores);
}

// Submit scores to server
async function submitScores(subjectScores) {
    try {
        const response = await fetch('/api/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(subjectScores)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            // Display results
            displayResults(subjectScores);
            
            // Show success message
            showAlert('success', '<strong>Thành công!</strong> Dữ liệu đã được gửi thành công.');
        } else {
            throw new Error(result.message || 'Lỗi khi gửi dữ liệu');
        }
    } catch (error) {
        showAlert('danger', `<strong>Lỗi:</strong> ${error.message}`);
    }
}

// Display results
function displayResults(subjectScores) {
    // Clear existing results
    resultsBody.innerHTML = '';
    
    // Sort by semester
    subjectScores.sort((a, b) => a.semester - b.semester);
    
    // Populate results table
    subjectScores.forEach(subject => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>Học kỳ ${subject.semester}</td>
            <td>${subject.subjectCode}</td>
            <td>${subject.subjectName}</td>
            <td>${subject.score.toFixed(1)}</td>
        `;
        resultsBody.appendChild(row);
    });
    
    // Show results section
    resultsSection.classList.remove('d-none');
    
    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Load subjects data
    loadSubjectsData();
    
    // Year selection change
    yearSelector.addEventListener('change', (event) => {
        displaySubjectsForYear(event.target.value);
    });
    
    // Form submission
    subjectForm.addEventListener('submit', processForm);
});
