# analyze_audio.py
import whisper
import sys
import json
from thefuzz import fuzz

# ======= Load model =======
model = whisper.load_model("base")

# ======= Nhận tham số từ dòng lệnh =======
# audio_path [0], questions_path [1]
audio_path = sys.argv[1]
questions_path = sys.argv[2]

# ======= Load dữ liệu câu hỏi =======
with open(questions_path, "r", encoding="utf-8") as f:
    questions = json.load(f)

# ======= Whisper: chuyển âm thanh thành văn bản =======
result = model.transcribe(audio_path)
transcript = result["text"]

# ======= Hàm đoán đáp án =======
def guess_answer(transcript, options):
    best_score = 0
    best_choice = "A"
    for key, text in options.items():
        score = fuzz.partial_ratio(transcript.lower(), text.lower())
        if score > best_score:
            best_score = score
            best_choice = key
    return best_choice

# ======= Chấm điểm từng câu hỏi =======
output = {
    "transcript": transcript,
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
        "requires_image": q["part"] == 1,
        "image": q.get("image", None)
    })

# ======= In kết quả dưới dạng JSON =======
print(json.dumps(output, ensure_ascii=False, indent=2))
