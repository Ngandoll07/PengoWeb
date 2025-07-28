import path from "path";
import { exec } from "child_process";
import { fileURLToPath } from "url";
import fs from "fs";

// Khắc phục __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function describeImage(imagePath) {
    return new Promise((resolve, reject) => {
        const absoluteImagePath = path.resolve(__dirname, "..", "..", "reactbassic", "public", imagePath);

        if (!fs.existsSync(absoluteImagePath)) {
            console.error("❌ Ảnh không tồn tại:", absoluteImagePath);
            return reject(`Ảnh không tồn tại: ${absoluteImagePath}`);
        }

        const pythonScriptPath = path.resolve(__dirname, "blip_image.py");
        const command = `venv\\Scripts\\python.exe "${pythonScriptPath}" "${absoluteImagePath}"`;

        exec(command, { cwd: __dirname }, (err, stdout, stderr) => {
            if (err) {
                console.error("❌ Lỗi BLIP:", err);
                return reject(err.message);
            }

            try {
                const result = JSON.parse(stdout);
                resolve(result.description || "");
            } catch (parseErr) {
                console.error("❌ Lỗi parse BLIP JSON:", parseErr);
                reject("Không phân tích được ảnh.");
            }
        });
    });
}

