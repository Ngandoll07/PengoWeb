import { exec } from "child_process";
import fs from "fs";
import path from "path";

export function transcribeAudio(filePath, expectedText = "") {
    return new Promise((resolve, reject) => {
        const pythonScriptPath = path.resolve("ai/analyze_audio.py");
        const fullAudioPath = path.resolve(filePath);

        // Escape dấu " trong expectedText
        const safeExpected = expectedText.replace(/"/g, '\\"');

        // Dòng lệnh gọi Python
        const command = `venv\\Scripts\\python.exe "${pythonScriptPath}" "${fullAudioPath}" "${safeExpected}"`;

        exec(command, { cwd: path.resolve("ai") }, (err, stdout, stderr) => {
            if (err) {
                console.error("❌ Whisper Python error:", err);
                return reject("❌ Whisper failed: " + err.message);
            }

            try {
                const output = JSON.parse(stdout);
                resolve(output);
            } catch (parseErr) {
                console.error("❌ Lỗi parse JSON:", parseErr);
                console.error("❓ Output trả về:", stdout);
                reject("❌ Không phân tích được transcript.");
            }
        });
    });
}
