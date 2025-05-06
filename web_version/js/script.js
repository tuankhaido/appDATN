// Constants and Variables
const yearMapping = {
    'nam1': { name: 'Năm 1', semesters: [1, 2] },
    'nam2': { name: 'Năm 2', semesters: [1, 2, 3, 4] },
    'nam3': { name: 'Năm 3', semesters: [1, 2, 3, 4, 5, 6] },
    'nam4': { name: 'Năm 4', semesters: [1, 2, 3, 4, 5, 6, 7, 8] }
};

let subjectsData = [];
let currentYear = 'nam1';
let isViewBySemester = false;
let currentActiveSemester = 'all';

// DOM Elements
const yearSelector = document.getElementById('year-selector');
const formTitle = document.getElementById('form-title');
const subjectForm = document.getElementById('subject-form');
const semesterContent = document.getElementById('semester-content');
const resultsSection = document.getElementById('results-section');
const resultsBody = document.getElementById('results-body');
const predictionSection = document.getElementById('prediction-section');
const predictionResult = document.getElementById('prediction-result');
const averageScore = document.getElementById('average-score');
const alertContainer = document.getElementById('alert-container');
const searchSubject = document.getElementById('search-subject');
const viewSemester = document.getElementById('view-semester');
const fillAllBtn = document.getElementById('fill-all-btn');
const confirmFillAll = document.getElementById('confirm-fill-all');
const semesterTabs = document.getElementById('semester-tabs');
const subjectCount = document.getElementById('subject-count');
const subjectTools = document.getElementById('subject-tools');
const exportResultsBtn = document.getElementById('export-results');

// Quick Fill Modal
const quickFillModal = new bootstrap.Modal(document.getElementById('quick-fill-modal'));

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

// Display subjects for the selected year
function displaySubjectsForYear(yearValue) {
    currentYear = yearValue;
    const yearInfo = yearMapping[yearValue];
    formTitle.textContent = `Nhập điểm cho ${yearInfo.name}`;
    
    // Reset active semester
    currentActiveSemester = 'all';
    
    // Clear existing subjects
    semesterContent.innerHTML = '';
    
    // Clear semester buttons
    const semesterButtonsContainer = semesterTabs.querySelector('.semester-buttons');
    if (semesterButtonsContainer) {
        semesterButtonsContainer.innerHTML = '';
    }
    
    // Filter and display subjects for the selected year
    const allSubjectsForSelectedYear = subjectsData.filter(subject => 
        yearInfo.semesters.includes(subject.hocKy)
    );
    
    // Update subject count
    subjectCount.textContent = `${allSubjectsForSelectedYear.length} môn học`;
    
    // Show tools if there are subjects
    if (allSubjectsForSelectedYear.length > 0) {
        subjectTools.classList.remove('d-none');
    } else {
        subjectTools.classList.add('d-none');
    }
    
    // Get unique semesters for this year
    const semesters = [...new Set(allSubjectsForSelectedYear.map(subject => subject.hocKy))].sort((a, b) => a - b);
    
    // Setup semester buttons
    if (semesters.length > 1) {
        semesterTabs.classList.remove('d-none');
        const buttonsContainer = semesterTabs.querySelector('.semester-buttons');
        
        // Add "All" button
        const allButton = document.createElement('button');
        allButton.type = 'button';
        allButton.className = 'semester-button active';
        allButton.setAttribute('data-semester', 'all');
        allButton.innerHTML = `Tất cả <span class="badge">${allSubjectsForSelectedYear.length}</span>`;
        buttonsContainer.appendChild(allButton);
        
        // Add buttons for each semester
        semesters.forEach(semester => {
            const semesterSubjects = allSubjectsForSelectedYear.filter(subject => subject.hocKy === semester);
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'semester-button';
            button.setAttribute('data-semester', semester);
            button.innerHTML = `Học kỳ ${semester} <span class="badge">${semesterSubjects.length}</span>`;
            buttonsContainer.appendChild(button);
        });
        
        // Add click event for buttons
        document.querySelectorAll('.semester-button').forEach(button => {
            button.addEventListener('click', function() {
                document.querySelectorAll('.semester-button').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                currentActiveSemester = this.getAttribute('data-semester');
                filterAndDisplaySubjects();
            });
        });
    } else {
        semesterTabs.classList.add('d-none');
    }
    
    // Display all subjects initially
    if (isViewBySemester) {
        displaySubjectsBySemester(allSubjectsForSelectedYear);
    } else {
        displaySubjectsGrid(allSubjectsForSelectedYear);
    }
    
    // Hide prediction section when changing year
    predictionSection.classList.add('d-none');
    resultsSection.classList.add('d-none');
}

// Display subjects in a grid layout
function displaySubjectsGrid(subjects) {
    // Clear existing subjects
    semesterContent.innerHTML = '';
    
    // Create container for all subjects
    const subjectsContainer = document.createElement('div');
    subjectsContainer.className = 'row';
    semesterContent.appendChild(subjectsContainer);
    
    // Display subjects
    subjects.forEach(subject => {
        const colDiv = document.createElement('div');
        colDiv.className = 'col-md-6 col-lg-4 mb-3';
        colDiv.setAttribute('data-semester', subject.hocKy);
        colDiv.setAttribute('data-subject-code', subject.maHocPhan);
        colDiv.setAttribute('data-subject-name', subject.tenHocPhan.toLowerCase());
        
        colDiv.innerHTML = `
            <div class="card subject-card">
                <div class="card-header bg-light">
                    <span class="subject-code">${subject.maHocPhan}</span>
                    <span class="subject-name">${subject.tenHocPhan}</span>
                </div>
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <span class="text-muted">Số tín chỉ: ${subject.soTinChi}</span>
                        <span class="badge bg-secondary">Học kỳ ${subject.hocKy}</span>
                    </div>
                    <div class="form-floating">
                        <input type="number" class="form-control subject-score" 
                            id="subject-${subject.maHocPhan}" 
                            name="subject-${subject.maHocPhan}"
                            placeholder="Điểm" min="0" max="10" step="0.1" required
                            data-subject-code="${subject.maHocPhan}"
                            data-subject-name="${subject.tenHocPhan}"
                            data-subject-credits="${subject.soTinChi}"
                            data-semester="${subject.hocKy}">
                        <label for="subject-${subject.maHocPhan}">Điểm (0-10)</label>
                    </div>
                </div>
            </div>
        `;
        
        subjectsContainer.appendChild(colDiv);
    });
    
    // Add input event listeners for validation
    addScoreInputListeners();
}

// Display subjects grouped by semester
function displaySubjectsBySemester(subjects) {
    // Clear existing subjects
    semesterContent.innerHTML = '';
    
    // Group subjects by semester
    const semesterGroups = {};
    subjects.forEach(subject => {
        if (!semesterGroups[subject.hocKy]) {
            semesterGroups[subject.hocKy] = [];
        }
        semesterGroups[subject.hocKy].push(subject);
    });
    
    // Sort semesters
    const sortedSemesters = Object.keys(semesterGroups).sort((a, b) => parseInt(a) - parseInt(b));
    
    // Create containers for each semester
    sortedSemesters.forEach(semester => {
        const semesterSubjects = semesterGroups[semester];
        
        // Create semester header
        const semesterDiv = document.createElement('div');
        semesterDiv.className = 'semester-container';
        semesterDiv.setAttribute('data-semester', semester);
        
        const semesterHeader = document.createElement('h4');
        semesterHeader.className = 'semester-heading';
        semesterHeader.textContent = `Học kỳ ${semester}`;
        
        semesterDiv.appendChild(semesterHeader);
        
        // Create row for subjects
        const subjectsRow = document.createElement('div');
        subjectsRow.className = 'row';
        
        // Add subjects for this semester
        semesterSubjects.forEach(subject => {
            const colDiv = document.createElement('div');
            colDiv.className = 'col-md-6 col-lg-4 mb-3';
            colDiv.setAttribute('data-semester', subject.hocKy);
            colDiv.setAttribute('data-subject-code', subject.maHocPhan);
            colDiv.setAttribute('data-subject-name', subject.tenHocPhan.toLowerCase());
            
            colDiv.innerHTML = `
                <div class="card subject-card">
                    <div class="card-header bg-light">
                        <span class="subject-code">${subject.maHocPhan}</span>
                        <span class="subject-name">${subject.tenHocPhan}</span>
                    </div>
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <span class="text-muted">Số tín chỉ: ${subject.soTinChi}</span>
                        </div>
                        <div class="form-floating">
                            <input type="number" class="form-control subject-score" 
                                id="subject-${subject.maHocPhan}" 
                                name="subject-${subject.maHocPhan}"
                                placeholder="Điểm" min="0" max="10" step="0.1" required
                                data-subject-code="${subject.maHocPhan}"
                                data-subject-name="${subject.tenHocPhan}"
                                data-subject-credits="${subject.soTinChi}"
                                data-semester="${subject.hocKy}">
                            <label for="subject-${subject.maHocPhan}">Điểm (0-10)</label>
                        </div>
                    </div>
                </div>
            `;
            
            subjectsRow.appendChild(colDiv);
        });
        
        semesterDiv.appendChild(subjectsRow);
        semesterContent.appendChild(semesterDiv);
    });
    
    // Add input event listeners for validation
    addScoreInputListeners();
}

// Add event listeners to score inputs for validation
function addScoreInputListeners() {
    document.querySelectorAll('.subject-score').forEach(input => {
        input.addEventListener('input', function() {
            const value = this.value.trim();
            const score = parseFloat(value);
            const card = this.closest('.subject-card');
            
            card.classList.remove('valid', 'invalid');
            
            if (value === '') {
                // Empty value - neutral state
                return;
            }
            
            if (isNaN(score) || score < 0 || score > 10) {
                card.classList.add('invalid');
            } else {
                card.classList.add('valid');
            }
        });
    });
}

// Filter subjects based on search and semester
function filterAndDisplaySubjects() {
    const searchValue = searchSubject ? searchSubject.value.toLowerCase() : '';
    const yearInfo = yearMapping[currentYear];
    
    // Get all subjects for this year
    const allSubjectsForYear = subjectsData.filter(subject => 
        yearInfo.semesters.includes(subject.hocKy)
    );
    
    // Filter based on search and semester
    let filteredSubjects = allSubjectsForYear;
    
    // Apply semester filter
    if (currentActiveSemester !== 'all') {
        filteredSubjects = filteredSubjects.filter(subject => 
            subject.hocKy === parseInt(currentActiveSemester)
        );
    }
    
    // Apply search filter
    if (searchValue) {
        filteredSubjects = filteredSubjects.filter(subject => 
            subject.maHocPhan.toLowerCase().includes(searchValue) || 
            subject.tenHocPhan.toLowerCase().includes(searchValue)
        );
    }
    
    // Display filtered subjects
    if (isViewBySemester && currentActiveSemester === 'all') {
        displaySubjectsBySemester(filteredSubjects);
    } else {
        displaySubjectsGrid(filteredSubjects);
    }
    
    // Highlight search matches
    if (searchValue) {
        highlightSearchMatches(searchValue);
    }
    
    // Show message if no results
    if (filteredSubjects.length === 0) {
        semesterContent.innerHTML = `
            <div class="alert alert-info">
                Không tìm thấy môn học nào phù hợp với tiêu chí tìm kiếm.
            </div>
        `;
    }
}

// Highlight search matches
function highlightSearchMatches(searchValue) {
    document.querySelectorAll('.subject-name').forEach(element => {
        const originalText = element.textContent;
        const lowerText = originalText.toLowerCase();
        const index = lowerText.indexOf(searchValue);
        
        if (index !== -1) {
            const before = originalText.substring(0, index);
            const match = originalText.substring(index, index + searchValue.length);
            const after = originalText.substring(index + searchValue.length);
            
            element.innerHTML = `${before}<span class="search-highlight">${match}</span>${after}`;
        }
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
    const scoreInputs = document.querySelectorAll('.subject-score');
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
    
    // Collect all subject scores
    const subjectScores = [];
    const scoreInputs = document.querySelectorAll('.subject-score');
    
    scoreInputs.forEach(input => {
        if (input.value.trim() !== '') {
            subjectScores.push({
                subjectCode: input.dataset.subjectCode,
                subjectName: input.dataset.subjectName,
                credits: parseInt(input.dataset.subjectCredits) || 0,
                semester: parseInt(input.dataset.semester),
                score: parseFloat(input.value)  // Đảm bảo là kiểu float
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
            body: JSON.stringify({
                scores: subjectScores,
                year: currentYear
            })
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            // Cập nhật điểm trung bình
            averageScore.textContent = result.average_score.toFixed(2);
            
            // Display results
            displayResults(subjectScores);
            
            // Display prediction
            displayPrediction(result);
            
            // Show success message
            showAlert('success', '<strong>Thành công!</strong> Dữ liệu đã được gửi và dự đoán thành công.');
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
            <td>${subject.credits}</td>
            <td>${subject.score.toFixed(1)}</td>
        `;
        resultsBody.appendChild(row);
    });
    
    // Show results section
    resultsSection.classList.remove('d-none');
}

// Display prediction
function displayPrediction(predictionData) {
    // Hiển thị kết quả
    predictionResult.textContent = predictionData.message;
    predictionResult.className = predictionData.prediction === 1 ? 'text-success' : 'text-danger';
    
    // Hiện section dự đoán
    predictionSection.classList.remove('d-none');
    
    // Cuộn đến bảng kết quả
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

// Fill all scores with a value
function fillAllScores(value) {
    document.querySelectorAll('.subject-score').forEach(input => {
        input.value = value;
        
        // Trigger input event to update validation
        const inputEvent = new Event('input', {
            bubbles: true,
            cancelable: true,
        });
        input.dispatchEvent(inputEvent);
    });
}

// Toggle view mode between grid and semester grouping
function toggleViewMode() {
    isViewBySemester = !isViewBySemester;
    
    if (isViewBySemester) {
        viewSemester.innerHTML = '<i class="fas fa-grip-horizontal me-1"></i> Xem dạng lưới';
    } else {
        viewSemester.innerHTML = '<i class="fas fa-th-list me-1"></i> Xem theo học kỳ';
    }
    
    // Update view
    filterAndDisplaySubjects();
}

// Export results to CSV file
function exportResultsToCSV() {
    try {
        // Get data from table
        const table = document.getElementById('results-table');
        const rows = table.querySelectorAll('tr');
        
        // Create CSV content
        let csvContent = "data:text/csv;charset=utf-8,";
        
        // Add header
        const headerRow = rows[0];
        const headers = headerRow.querySelectorAll('th');
        const headerValues = [];
        
        headers.forEach(header => {
            headerValues.push(`"${header.textContent}"`);
        });
        
        csvContent += headerValues.join(',') + '\n';
        
        // Add data rows
        const dataRows = table.querySelectorAll('tbody tr');
        dataRows.forEach(row => {
            const cells = row.querySelectorAll('td');
            const rowValues = [];
            
            cells.forEach(cell => {
                rowValues.push(`"${cell.textContent}"`);
            });
            
            csvContent += rowValues.join(',') + '\n';
        });
        
        // Add average score
        csvContent += `\n"Điểm trung bình tích lũy:","${averageScore.textContent}"`;
        
        // Create download link
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `ket-qua-diem-${currentYear}.csv`);
        document.body.appendChild(link);
        
        // Trigger download
        link.click();
        
        // Clean up
        document.body.removeChild(link);
    } catch (error) {
        showAlert('danger', `<strong>Lỗi xuất file:</strong> ${error.message}`);
    }
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
    
    // Search input
    if (searchSubject) {
        searchSubject.addEventListener('input', filterAndDisplaySubjects);
    }
    
    // View mode toggle
    if (viewSemester) {
        viewSemester.addEventListener('click', toggleViewMode);
    }
    
    // Fill all button
    if (fillAllBtn) {
        fillAllBtn.addEventListener('click', () => {
            quickFillModal.show();
        });
    }
    
    // Confirm fill all
    if (confirmFillAll) {
        confirmFillAll.addEventListener('click', () => {
            const value = document.getElementById('fill-all-value').value;
            fillAllScores(value);
            quickFillModal.hide();
            showAlert('success', `Đã điền giá trị ${value} cho tất cả các môn học.`);
        });
    }
    
    // Export results
    if (exportResultsBtn) {
        exportResultsBtn.addEventListener('click', exportResultsToCSV);
    }
});
