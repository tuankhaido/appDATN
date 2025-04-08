import streamlit as st
import pandas as pd

# Set page title
st.set_page_config(
    page_title="Hệ thống nhập điểm môn học",
    page_icon="📚",
    layout="wide"
)

# Load data from Excel file
try:
    df = pd.read_excel('attached_assets/Integrated_KhungChuongTrinh.xlsx')
except Exception as e:
    st.error(f"Không thể đọc file dữ liệu: {e}")
    df = pd.DataFrame(columns=['Tên Học Phần', 'Mã Học Phần', 'Số Tín Chỉ', 'Học Kỳ'])

# Map semester to academic year
semester_to_year = {
    1: "Năm 1 - Học kỳ 1",
    2: "Năm 1 - Học kỳ 2",
    3: "Năm 2 - Học kỳ 1",
    4: "Năm 2 - Học kỳ 2",
    5: "Năm 3 - Học kỳ 1",
    6: "Năm 3 - Học kỳ 2",
    7: "Năm 4 - Học kỳ 1",
    8: "Năm 4 - Học kỳ 2"
}

# Group semesters into academic years
academic_years = {
    "Năm 1": [1, 2],  # Semester 1 and 2
    "Năm 2": [3, 4],  # Semester 3 and 4
    "Năm 3": [5, 6],  # Semester 5 and 6
    "Năm 4": [7, 8]   # Semester 7 and 8
}

# Title and description
st.title("Hệ thống nhập điểm môn học")
st.markdown("Chọn năm học và nhập điểm cho từng môn học")

# Initialize session state for storing input values if not already set
if 'subject_inputs' not in st.session_state:
    st.session_state.subject_inputs = {}
    for year, semesters in academic_years.items():
        st.session_state.subject_inputs[year] = {}
        for sem in semesters:
            # Get subjects for this semester
            sem_subjects = df[df['Học Kỳ'] == sem]['Tên Học Phần'].tolist()
            # Initialize scores as 0.0 for each subject
            st.session_state.subject_inputs[year][sem] = {subject: 0.0 for subject in sem_subjects}

if 'submission_status' not in st.session_state:
    st.session_state.submission_status = None

# Year selection dropdown
selected_year = st.selectbox(
    "Chọn năm học:",
    options=list(academic_years.keys()),
    key="year_selector"
)

# Function to handle form submission
def submit_form():
    # Validate inputs
    valid = True
    error_message = ""
    
    # Get selected semesters for the year
    selected_semesters = academic_years[selected_year]
    
    # Check all subjects in both semesters
    for semester in selected_semesters:
        for subject, score in st.session_state.subject_inputs[selected_year][semester].items():
            try:
                # Convert to float and validate range (scores between 0 and 10)
                float_value = float(score)
                if float_value < 0 or float_value > 10:
                    valid = False
                    error_message = f"Lỗi: Điểm của {subject} (Học kỳ {semester}) phải nằm trong khoảng từ 0 đến 10"
                    break
            except ValueError:
                valid = False
                error_message = f"Lỗi: Điểm của {subject} (Học kỳ {semester}) phải là số"
                break
        if not valid:
            break
    
    if valid:
        # Set success message
        st.session_state.submission_status = "Đã gửi thành công điểm cho " + selected_year
        
        # Prepare data for display
        results = []
        
        for semester in selected_semesters:
            for subject, score in st.session_state.subject_inputs[selected_year][semester].items():
                # Find subject code from the dataframe
                subject_code = ""
                subject_df = df[(df['Tên Học Phần'] == subject) & (df['Học Kỳ'] == semester)]
                if not subject_df.empty:
                    subject_code = subject_df['Mã Học Phần'].values[0]
                
                results.append({
                    'Học kỳ': semester,
                    'Mã học phần': subject_code,
                    'Môn học': subject,
                    'Điểm': score
                })
        
        # Create a DataFrame for display
        results_df = pd.DataFrame(results)
        
        # Save to session state for display
        st.session_state.results = results_df
        
        # Print for debugging
        print(f"Submitted data for {selected_year}: {results}")
    else:
        st.session_state.submission_status = error_message

# Create a form for subject inputs
with st.form(key='subject_form'):
    st.subheader(f"Nhập điểm cho {selected_year}")
    
    # Get selected semesters for the year
    selected_semesters = academic_years[selected_year]
    
    # Display for each semester
    for semester in selected_semesters:
        st.markdown(f"### Học kỳ {semester}")
        
        # Get subjects for this semester
        semester_subjects = df[df['Học Kỳ'] == semester]['Tên Học Phần'].tolist()
        
        # Create columns for a more compact layout
        col1, col2 = st.columns(2)
        
        # Display input fields for each subject
        for i, subject in enumerate(semester_subjects):
            # Alternate between columns for better layout
            with col1 if i % 2 == 0 else col2:
                # Get subject code for display
                subject_code = ""
                subject_df = df[(df['Tên Học Phần'] == subject) & (df['Học Kỳ'] == semester)]
                if not subject_df.empty:
                    subject_code = subject_df['Mã Học Phần'].values[0]
                
                # Create a unique key for each input
                input_key = f"{selected_year}_{semester}_{i}"
                
                # Create input label with subject code
                input_label = f"{subject} ({subject_code})"
                
                # Display input field
                value = st.number_input(
                    input_label,
                    min_value=0.0,
                    max_value=10.0,
                    step=0.1,
                    key=input_key,
                    help="Nhập điểm từ 0 đến 10"
                )
                
                # Update session state
                st.session_state.subject_inputs[selected_year][semester][subject] = value
    
    # Submit button
    submit_button = st.form_submit_button(label="Gửi", on_click=submit_form)

# Display submission status if available
if st.session_state.submission_status:
    if "Lỗi" in st.session_state.submission_status:
        st.error(st.session_state.submission_status)
    else:
        st.success(st.session_state.submission_status)
        
        # Display the submitted data in a table if successful
        if 'results' in st.session_state:
            st.subheader("Điểm đã gửi:")
            st.dataframe(st.session_state.results, use_container_width=True)

# Add some information about the application
with st.expander("Thông tin về ứng dụng"):
    st.markdown("""
    ### Hướng dẫn sử dụng:
    1. Chọn năm học từ dropdown menu
    2. Nhập điểm cho từng môn học (giá trị từ 0 đến 10)
    3. Nhấn nút "Gửi" để lưu dữ liệu
    
    ### Lưu ý:
    - Điểm các môn học phải nằm trong khoảng từ 0 đến 10
    - Tất cả các môn học đều phải có điểm trước khi gửi
    """)
