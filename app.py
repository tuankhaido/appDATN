import streamlit as st
import pandas as pd

# Set page title
st.set_page_config(
    page_title="Academic Subject Input",
    page_icon="📚",
    layout="wide"
)

# Title and description
st.title("Hệ thống nhập điểm môn học")
st.markdown("Chọn năm học và nhập điểm cho từng môn học")

# Define years and subject structure
# Since we don't have the actual data, creating a generic structure
academic_years = ["2021-2022", "2022-2023", "2023-2024"]

# Create a dictionary with generic subjects for each year
# In a real application, this would be loaded from the Excel file or database
subjects_by_year = {
    "2021-2022": [f"Môn học {i+1} (2021-2022)" for i in range(10)],
    "2022-2023": [f"Môn học {i+1} (2022-2023)" for i in range(10)],
    "2023-2024": [f"Môn học {i+1} (2023-2024)" for i in range(10)]
}

# Initialize session state for storing input values if not already set
if 'subject_inputs' not in st.session_state:
    st.session_state.subject_inputs = {}
    for year in academic_years:
        st.session_state.subject_inputs[year] = [0.0] * 10

if 'submission_status' not in st.session_state:
    st.session_state.submission_status = None

# Year selection dropdown
selected_year = st.selectbox(
    "Chọn năm học:",
    options=academic_years,
    key="year_selector"
)

# Function to handle form submission
def submit_form():
    # Validate inputs
    valid = True
    for i, value in enumerate(st.session_state.subject_inputs[selected_year]):
        try:
            # Convert to float and validate range (assuming scores between 0 and 10)
            float_value = float(value)
            if float_value < 0 or float_value > 10:
                valid = False
                st.session_state.submission_status = f"Lỗi: Điểm của {subjects_by_year[selected_year][i]} phải nằm trong khoảng từ 0 đến 10"
                break
        except ValueError:
            valid = False
            st.session_state.submission_status = f"Lỗi: Điểm của {subjects_by_year[selected_year][i]} phải là số"
            break
    
    if valid:
        # Here you would typically save the data to a database or file
        # For now, we'll just set a success message
        st.session_state.submission_status = "Đã gửi thành công điểm cho năm học " + selected_year
        
        # Print the submitted data to the console for debugging
        print(f"Submitted data for {selected_year}: {st.session_state.subject_inputs[selected_year]}")
        
        # Create a DataFrame for display
        results_df = pd.DataFrame({
            'Môn học': subjects_by_year[selected_year],
            'Điểm': st.session_state.subject_inputs[selected_year]
        })
        
        # Save to session state for display
        st.session_state.results = results_df

# Create a form for subject inputs
with st.form(key='subject_form'):
    st.subheader(f"Nhập điểm cho năm học {selected_year}")
    
    # Create columns for a more compact layout
    col1, col2 = st.columns(2)
    
    # Display input fields for each subject
    for i, subject in enumerate(subjects_by_year[selected_year]):
        # Alternate between columns for better layout
        with col1 if i < 5 else col2:
            # Create a unique key for each input based on year and subject index
            input_key = f"{selected_year}_{i}"
            
            # Display input field with current value from session state
            value = st.number_input(
                subject,
                min_value=0.0,
                max_value=10.0,
                step=0.1,
                key=input_key,
                help="Nhập điểm từ 0 đến 10"
            )
            
            # Update session state when input changes
            st.session_state.subject_inputs[selected_year][i] = value
    
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
            st.dataframe(st.session_state.results)

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
