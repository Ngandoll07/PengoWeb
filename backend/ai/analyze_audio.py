# -*- coding: utf-8 -*-
import whisper
import sys
import json
import io
import os

# Load Whisper model
model = whisper.load_model("base")

# Nhận tham số từ dòng lệnh
audio_path = sys.argv[1]
question_file = sys.argv[2] if len(sys.argv) > 2 else None

# Phân tích bằng Whisper
result = model.transcribe(audio_path)
transcript = result["text"].strip()

# Xử lý từng câu hỏi nếu có
questions_output = []
if question_file and os.path.exists(question_file):
    try:
        with open(question_file, "r", encoding="utf-8") as f:
            questions = json.load(f)

        for q in questions:
            question_text = q.get("question", "")
            # Tạo giải thích đơn giản dựa trên transcript
            explanation = f"Audio này nói về: '{transcript}'. Nội dung liên quan tới câu hỏi: '{question_text}'."
            
            questions_output.append({
                "id": q.get("id"),
                "question": question_text,
                "transcript": transcript,
                "explanation": explanation,
                "part": q.get("part"),
                "options": q.get("options"),
                "answer": q.get("answer"),
                "image": q.get("image", None)
            })
    except Exception as e:
        pass

# Kết quả trả về
output = {
    "transcript": transcript,
    "questions": questions_output
}

# Đảm bảo UTF-8 output cho Node.js
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
print(json.dumps(output, ensure_ascii=False, indent=2))
