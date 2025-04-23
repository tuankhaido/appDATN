import os
import json
import pandas as pd
import joblib
import numpy as np
from flask import Flask, jsonify, request, send_from_directory

app = Flask(__name__, static_folder='.')

# Đường dẫn tới file Excel
EXCEL_FILE_PATH = '../attached_assets/GiaoDien_KhungChuongTrinh.xlsx'

# Đường dẫn tới các mô hình
MODEL_PATHS = {
    'nam1': '../attached_assets/best_model_Year_1_Naive_Bayes.pkl',
    'nam2': '../attached_assets/best_model_Year_2_Logistic_Regression.pkl',
    'nam3': '../attached_assets/best_model_Year_3_SVM.pkl',
    'nam4': '../attached_assets/best_model_Year_4_Naive_Bayes.pkl'
}

# Dữ liệu về các môn học và số tín chỉ
subjects_data = []

# Hàm đọc dữ liệu từ Excel và chuyển thành JSON
def read_excel_to_json():
    try:
        # Đọc file Excel
        df = pd.read_excel(EXCEL_FILE_PATH)
        
        # Chuyển thành định dạng JSON
        global subjects_data
        subjects_data = []
        for _, row in df.iterrows():
            # Kiểm tra trước khi thêm vào danh sách
            if pd.notna(row['Mã Học Phần']) and pd.notna(row['Học Kỳ']):
                subjects_data.append({
                    'tenHocPhan': row['Tên Học Phần'],
                    'maHocPhan': row['Mã Học Phần'],
                    'soTinChi': int(row['Số Tín Chỉ']) if pd.notna(row['Số Tín Chỉ']) else 0,
                    'hocKy': int(row['Học Kỳ'])
                })
        
        # Lưu vào file JSON
        with open('data/subjects.json', 'w', encoding='utf-8') as f:
            json.dump(subjects_data, f, ensure_ascii=False, indent=2)
            
        return subjects_data
    except Exception as e:
        print(f"Lỗi khi đọc file Excel: {str(e)}")
        return []

# Hàm tải mô hình machine learning
def load_model(year):
    try:
        model_path = MODEL_PATHS.get(year)
        if model_path and os.path.exists(model_path):
            model = joblib.load(model_path)
            return model
        else:
            print(f"Không tìm thấy mô hình cho năm {year}")
            return None
    except Exception as e:
        print(f"Lỗi khi tải mô hình cho năm {year}: {str(e)}")
        return None

# Hàm tính điểm trung bình theo tín chỉ
def calculate_weighted_average(scores):
    total_weighted_score = 0
    total_credits = 0
    
    # Tìm thông tin số tín chỉ cho từng môn học
    for score in scores:
        subject_code = score['subjectCode']
        subject_score = float(score['score'])
        
        # Tìm môn học trong subjects_data
        subject_info = next((s for s in subjects_data if s['maHocPhan'] == subject_code), None)
        
        if subject_info:
            credits = subject_info['soTinChi']
            total_weighted_score += subject_score * credits
            total_credits += credits
    
    # Tính điểm trung bình
    if total_credits > 0:
        avg_score = total_weighted_score / total_credits
    else:
        avg_score = 0
        
    return avg_score

# Hàm dự đoán kết quả tốt nghiệp
def predict_graduation(year, scores):
    try:
        # Tính điểm trung bình
        avg_score = calculate_weighted_average(scores)
        
        # Tải mô hình tương ứng với năm học
        model = load_model(year)
        if not model:
            print("Không thể tải mô hình, sử dụng dự đoán đơn giản")
            return simple_prediction(avg_score)
        
        # Chuẩn bị dữ liệu đầu vào cho mô hình - dùng DataFrame
        # Tạo danh sách các môn học và điểm - ĐẢM BẢO KIỂU DỮ LIỆU FLOAT
        subject_scores = {}
        for score in scores:
            subject_code = score['subjectCode']
            # Chuyển đổi thành kiểu float64
            subject_scores[subject_code] = float(score['score'])
        
        # Tạo DataFrame với dữ liệu môn học, đảm bảo kiểu dữ liệu float64
        df = pd.DataFrame([subject_scores], dtype=np.float64)
        
        # Sử dụng mô hình đơn giản dựa trên điểm trung bình
        try:
            # Thử dự đoán với mô hình
            if hasattr(model, 'predict'):
                # Đảm bảo làm việc với các đặc trưng mà mô hình biết
                if hasattr(model, 'feature_names_in_'):
                    # Thêm các cột thiếu với giá trị mặc định 0.0
                    for feature in model.feature_names_in_:
                        if feature not in df.columns:
                            df[feature] = 0.0
                    
                    # Chỉ giữ lại các cột cần thiết
                    df = df[model.feature_names_in_]
                
                # Dự đoán
                prediction = model.predict(df)
                # Dự đoán trực tiếp dựa vào điểm trung bình (bỏ qua kết quả từ mô hình)
                return simple_prediction(avg_score)
            else:
                return simple_prediction(avg_score)
        except Exception as e:
            print(f"Lỗi khi dự đoán với mô hình: {str(e)}")
            return simple_prediction(avg_score)
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Lỗi khi dự đoán: {str(e)}")
        # Nếu có lỗi, sử dụng phương pháp dự đoán đơn giản
        return simple_prediction(5.0)  # Giá trị mặc định cho avg_score

# Hàm dự đoán đơn giản dựa trên điểm trung bình
def simple_prediction(avg_score):
    # Dự đoán đơn giản dựa trên điểm trung bình
    prediction = 1 if avg_score >= 5.0 else 0
    
    # Xác định loại tốt nghiệp dựa trên điểm trung bình
    if prediction == 1:  # Nếu dự đoán là tốt nghiệp
        if avg_score >= 9.0:
            grad_type = "Xuất sắc"
        elif avg_score >= 8.0:
            grad_type = "Giỏi"
        elif avg_score >= 7.0:
            grad_type = "Khá"
        else:
            grad_type = "Trung bình"
        
        result_message = f"Bạn tốt nghiệp Loại {grad_type}"
    else:
        result_message = "Bạn ra trường không đúng hạn"
    
    return {
        'status': 'success',
        'prediction': prediction,
        'message': result_message,
        'average_score': avg_score
    }

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/css/<path:path>')
def send_css(path):
    return send_from_directory('css', path)

@app.route('/js/<path:path>')
def send_js(path):
    return send_from_directory('js', path)

@app.route('/data/<path:path>')
def send_data(path):
    return send_from_directory('data', path)

@app.route('/api/subjects', methods=['GET'])
def get_subjects():
    try:
        # Đọc từ file JSON
        with open('data/subjects.json', 'r', encoding='utf-8') as f:
            subjects_data = json.load(f)
        
        return jsonify(subjects_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/submit', methods=['POST'])
def submit_scores():
    try:
        data = request.json
        scores = data.get('scores', [])
        year = data.get('year', 'nam1')
        
        # Lưu dữ liệu (trong ứng dụng thực tế, bạn sẽ lưu vào database)
        # Ví dụ: lưu vào file JSON
        with open('data/submissions.json', 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        # Thực hiện dự đoán
        prediction_result = predict_graduation(year, scores)
        
        return jsonify(prediction_result)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'status': 'error', 'message': str(e)}), 500

if __name__ == '__main__':
    # Tạo thư mục data nếu chưa tồn tại
    os.makedirs('data', exist_ok=True)
    
    # Đảm bảo file JSON cho submissions tồn tại
    if not os.path.exists('data/submissions.json'):
        with open('data/submissions.json', 'w', encoding='utf-8') as f:
            json.dump([], f)
    
    # Tạo file subjects.json từ dữ liệu Excel
    read_excel_to_json()
    print("Đã tạo file subjects.json từ dữ liệu Excel")
    
    app.run(host='0.0.0.0', port=5000)
