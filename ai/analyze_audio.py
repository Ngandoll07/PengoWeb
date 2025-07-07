# -*- coding: utf-8 -*-
import whisper
import sys
import json
from thefuzz import fuzz
import io

# Load Whisper model
model = whisper.load_model("base")

# Nhận tham số từ dòng lệnh
audio_path = sys.argv[1]
questions_path = sys.argv[2]

# Load câu hỏi
with open(questions_path, "r", encoding="utf-8") as f:
    questions = json.load(f)

# Phân tích bằng Whisper
result = model.transcribe(audio_path)
transcript = result["text"].strip()

# Tính tốc độ nói (wpm)
word_count = len(transcript.split())
duration_sec = result["segments"][-1]["end"] if result["segments"] else 1
wpm = word_count / (duration_sec / 60)

# Hàm đoán đáp án
def guess_answer(transcript, options):
    best_score = 0
    best_choice = "A"
    for key, text in options.items():
        if isinstance(text, str):
            score = fuzz.partial_ratio(transcript.lower(), text.lower())
            if score > best_score:
                best_score = score
                best_choice = key
    return best_choice

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

# Xử lý từng câu
output = {
    "transcript": transcript,
    "duration_sec": round(duration_sec, 2),
    "word_count": word_count,
    "wpm": round(wpm, 2),
    "score": score,
    "level": level,
    "results": []
}

for q in questions:
    guess = guess_answer(transcript, q["options"])
    is_correct = guess == q["answer"]
    output["results"].append({
        "id": q["id"],
        "question": q["question"],
        "guess": guess,
        "correct": q["answer"],
        "is_correct": is_correct,
        "requires_image": q.get("part") == 1,
        "image": q.get("image")
    })

# In kết quả
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
print(json.dumps(output, ensure_ascii=False, indent=2))
