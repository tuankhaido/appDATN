// Constants and Variables
const yearMapping = {
    'nam1': { name: 'Năm 1', semesters: [1, 2] },
    'nam2': { name: 'Năm 2', semesters: [1, 2, 3, 4] },
    'nam3': { name: 'Năm 3', semesters: [1, 2, 3, 4, 5, 6] },
    'nam4': { name: 'Năm 4', semesters: [1, 2, 3, 4, 5, 6, 7, 8] }
};

let subjectsData = [];
let currentYear = 'nam1';

// DOM Elements
const yearSelector = document.getElementById('year-selector');
const formTitle = document.getElementById('form-title');
const subjectForm = document.getElementById('subject-form');
const semesterContent = document.getElementById('semester-content');
const resultsSection = document.getElementById('results-section');
const resultsBody = document.getElementById('results-body');
const predictionSection = document.getElementById('prediction-section');
const predictionResult = document.getElementById('prediction-result');
const predictionProbability = document.getElementById('prediction-probability');
const predictionMessage = document.getElementById('prediction-message');
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

// Display subjects for the selected year
function displaySubjectsForYear(yearValue) {
    currentYear = yearValue;
    const yearInfo = yearMapping[yearValue];
    formTitle.textContent = `Nhập điểm cho ${yearInfo.name}`;
    
    // Clear existing subjects
    semesterContent.innerHTML = '';
    
    // Create container for all subjects
    const subjectsContainer = document.createElement('div');
    subjectsContainer.className = 'row';
    semesterContent.appendChild(subjectsContainer);
    
    // Filter and display subjects for each year up to the selected year
    const allSubjectsForSelectedYear = subjectsData.filter(subject => 
        yearInfo.semesters.includes(subject.hocKy)
    );
    
    // Group subjects by year for display
    const subjectsByYear = {
        'Năm 1': allSubjectsForSelectedYear.filter(subject => subject.hocKy <= 2),
        'Năm 2': allSubjectsForSelectedYear.filter(subject => subject.hocKy >= 3 && subject.hocKy <= 4),
        'Năm 3': allSubjectsForSelectedYear.filter(subject => subject.hocKy >= 5 && subject.hocKy <= 6),
        'Năm 4': allSubjectsForSelectedYear.filter(subject => subject.hocKy >= 7 && subject.hocKy <= 8)
    };
    
    // Display subjects by year
    Object.entries(subjectsByYear).forEach(([yearLabel, yearSubjects]) => {
        // Only display years that have subjects
        if (yearSubjects.length > 0) {
            // Display year header
            const yearHeaderDiv = document.createElement('div');
            yearHeaderDiv.className = 'col-12 mb-3 mt-4';
            yearHeaderDiv.innerHTML = `<h4 class="border-bottom pb-2">${yearLabel}</h4>`;
            subjectsContainer.appendChild(yearHeaderDiv);
            
            // Display subjects for this year
            yearSubjects.forEach(subject => {
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
                                    id="subject-${subject.maHocPhan}" 
                                    name="subject-${subject.maHocPhan}"
                                    placeholder="Điểm" min="0" max="10" step="0.1" required
                                    data-subject-code="${subject.maHocPhan}"
                                    data-subject-name="${subject.tenHocPhan}"
                                    data-semester="${subject.hocKy}">
                                <label for="subject-${subject.maHocPhan}">Điểm (0-10)</label>
                            </div>
                        </div>
                    </div>
                `;
                
                subjectsContainer.appendChild(colDiv);
            });
        }
    });
    
    // Hide prediction section when changing year
    predictionSection.classList.add('d-none');
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
            body: JSON.stringify({
                scores: subjectScores,
                year: currentYear
            })
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
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
            <td>${subject.score.toFixed(1)}</td>
        `;
        resultsBody.appendChild(row);
    });
    
    // Show results section
    resultsSection.classList.remove('d-none');
}

// Display prediction
function displayPrediction(predictionData) {
    // Lấy kết quả dự đoán
    const prediction = predictionData.prediction;
    const probability = predictionData.probability;
    
    // Hiển thị kết quả
    if (prediction === 1) {
        predictionResult.textContent = 'Tốt nghiệp';
        predictionResult.className = 'text-success';
    } else {
        predictionResult.textContent = 'Không tốt nghiệp';
        predictionResult.className = 'text-danger';
    }
    
    // Hiển thị xác suất
    const probabilityPercent = (probability * 100).toFixed(2);
    predictionProbability.textContent = `${probabilityPercent}%`;
    
    // Hiển thị thông điệp
    if (prediction === 1) {
        if (probability >= 0.9) {
            predictionMessage.textContent = 'Khả năng tốt nghiệp rất cao!';
        } else if (probability >= 0.7) {
            predictionMessage.textContent = 'Khả năng tốt nghiệp cao.';
        } else {
            predictionMessage.textContent = 'Có khả năng tốt nghiệp, nhưng cần cố gắng hơn.';
        }
    } else {
        if (probability < 0.3) {
            predictionMessage.textContent = 'Khả năng không tốt nghiệp rất cao, cần nỗ lực nhiều hơn.';
        } else {
            predictionMessage.textContent = 'Có khả năng không tốt nghiệp, cần cải thiện điểm số.';
        }
    }
    
    // Hiện section dự đoán
    predictionSection.classList.remove('d-none');
    
    // Cuộn đến kết quả dự đoán
    predictionSection.scrollIntoView({ behavior: 'smooth' });
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
