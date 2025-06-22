import whisper
import sys
import json
from thefuzz import fuzz
import io

# ======= Load model =======
model = whisper.load_model("base")

# ======= Nhận tham số từ dòng lệnh =======
audio_path = sys.argv[1]              # Đường dẫn file .mp3
questions_path = sys.argv[2]          # Đường dẫn file .json tạm chứa câu hỏi

# ======= Load dữ liệu câu hỏi =======
with open(questions_path, "r", encoding="utf-8") as f:
    questions = json.load(f)

# ======= Whisper: chuyển âm thanh thành văn bản =======
result = model.transcribe(audio_path)
transcript = result["text"]

# ======= Hàm đoán đáp án gần đúng =======
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
    "transcript": transcript.strip(),
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

# ======= Xuất kết quả dưới dạng JSON =======
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
print(json.dumps(output, ensure_ascii=False, indent=2))
