# -*- coding: utf-8 -*-
import whisper
import sys
import json
from thefuzz import fuzz
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

# Tính tốc độ nói (wpm)
word_count = len(transcript.split())
duration_sec = result["segments"][-1]["end"] if result["segments"] else 1
wpm = word_count / (duration_sec / 60)

# Tính điểm độ khó
score = 0
if word_count >= 50:
    score += 1
if duration_sec > 10:
    score += 1
if wpm > 135:
    score += 2
elif wpm > 110:
    score += 1

# Đánh giá độ khó
if score <= 2:
    level = "easy"
elif score == 3:
    level = "medium"
else:
    level = "hard"

# Nếu có file JSON câu hỏi → xử lý từng câu
results = []
if question_file and os.path.exists(question_file):
    try:
        with open(question_file, "r", encoding="utf-8") as f:
            questions = json.load(f)

        for q in questions:
            if "id" in q and "question" in q:
                results.append({
                    "id": q["id"],
                    "question": q["question"],
                    "correct": q.get("correctAnswer", q.get("answer")),
                    "requires_image": "image" in q,
                    "image": q.get("image", "")
                })
            # Nếu thiếu id hoặc question thì bỏ qua không lỗi
    except Exception as e:
        # Nếu có lỗi đọc file thì không thêm results
        pass

# Kết quả trả về
output = {
    "transcript": transcript,
    "duration_sec": round(duration_sec, 2),
    "word_count": word_count,
    "wpm": round(wpm, 2),
    "score": score,
    "level": level,
}

if results:
    output["results"] = results

# Đảm bảo UTF-8 output cho Node.js
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
print(json.dumps(output, ensure_ascii=False, indent=2))
