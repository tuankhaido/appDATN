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

# Hàm đọc dữ liệu từ Excel và chuyển thành JSON
def read_excel_to_json():
    try:
        # Đọc file Excel
        df = pd.read_excel(EXCEL_FILE_PATH)
        
        # Chuyển thành định dạng JSON
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

# Hàm dự đoán kết quả tốt nghiệp
def predict_graduation(year, scores):
    try:
        # Tải mô hình tương ứng với năm học
        model = load_model(year)
        if not model:
            return {
                'status': 'error',
                'message': f'Không thể tải mô hình cho năm {year}'
            }
        
        # Chuẩn bị dữ liệu đầu vào cho mô hình
        # Giả sử mô hình chấp nhận danh sách điểm các môn học
        X = [float(score['score']) for score in scores]
        
        # Kiểm tra độ dài của vector đặc trưng
        required_feature_count = model.n_features_in_ if hasattr(model, 'n_features_in_') else len(X)
        if len(X) < required_feature_count:
            # Nếu thiếu điểm, bổ sung bằng giá trị 0
            X = X + [0] * (required_feature_count - len(X))
        elif len(X) > required_feature_count:
            # Nếu thừa điểm, cắt bớt
            X = X[:required_feature_count]
        
        # Chuyển đổi thành mảng numpy
        X_array = np.array([X])
        
        # Dự đoán
        prediction = model.predict(X_array)
        probability = model.predict_proba(X_array)
        
        # Lấy xác suất của lớp dương (tốt nghiệp)
        graduation_probability = float(probability[0][1]) if probability.shape[1] > 1 else float(probability[0][0])
        
        return {
            'status': 'success',
            'prediction': int(prediction[0]),
            'probability': graduation_probability,
            'message': 'Dự đoán thành công'
        }
    except Exception as e:
        print(f"Lỗi khi dự đoán: {str(e)}")
        return {
            'status': 'error',
            'message': f'Lỗi khi dự đoán: {str(e)}'
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
