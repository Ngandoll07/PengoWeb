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
expected_text = sys.argv[2] if len(sys.argv) > 2 else None

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

# So sánh độ khớp nếu có text mẫu
similarity = None
if expected_text:
    similarity = fuzz.partial_ratio(transcript.lower(), expected_text.lower())

# Trả kết quả
output = {
    "transcript": transcript,
    "duration_sec": round(duration_sec, 2),
    "word_count": word_count,
    "wpm": round(wpm, 2),
    "score": score,
    "level": level,
}

if similarity is not None:
    output["similarity"] = similarity

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
print(json.dumps(output, ensure_ascii=False, indent=2))
