import os
import json
import pandas as pd
from flask import Flask, jsonify, request, send_from_directory

app = Flask(__name__, static_folder='.')

# Đường dẫn tới file Excel
EXCEL_FILE_PATH = '../attached_assets/Integrated_KhungChuongTrinh.xlsx'

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
        # Đọc file Excel
        df = pd.read_excel(EXCEL_FILE_PATH)
        
        # Chuyển thành định dạng JSON
        subjects_data = []
        for _, row in df.iterrows():
            subjects_data.append({
                'tenHocPhan': row['Tên Học Phần'],
                'maHocPhan': row['Mã Học Phần'],
                'soTinChi': int(row['Số Tín Chỉ']),
                'hocKy': int(row['Học Kỳ'])
            })
        
        return jsonify(subjects_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/submit', methods=['POST'])
def submit_scores():
    try:
        data = request.json
        
        # Lưu dữ liệu (trong ứng dụng thực tế, bạn sẽ lưu vào database)
        # Ví dụ: lưu vào file JSON
        with open('data/submissions.json', 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        return jsonify({'status': 'success', 'message': 'Dữ liệu đã được gửi thành công'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

if __name__ == '__main__':
    # Tạo thư mục data nếu chưa tồn tại
    os.makedirs('data', exist_ok=True)
    
    # Đảm bảo file JSON cho submissions tồn tại
    if not os.path.exists('data/submissions.json'):
        with open('data/submissions.json', 'w', encoding='utf-8') as f:
            json.dump([], f)
    
    app.run(host='0.0.0.0', port=5000)