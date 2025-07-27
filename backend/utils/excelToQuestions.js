import xlsx from "xlsx";
import path from "path";
import fs from "fs";
import { describeImage } from "../ai/imageDescription.js";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function parseSpeakingExcel(filePath) {
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const raw = xlsx.utils.sheet_to_json(sheet);

    const results = [];

    for (const item of raw) {
        let imageDescription = "";
        const relativeImagePath = item.Image || "";

        // ✅ Chỉ xử lý nếu có ảnh
        if (relativeImagePath.trim() !== "") {
            const absoluteImagePath = path.join(__dirname, "..", "..", "reactbassic", "public", relativeImagePath);

            if (fs.existsSync(absoluteImagePath)) {
                try {
                    imageDescription = await describeImage(absoluteImagePath);
                } catch (err) {
                    console.error("❌ Lỗi mô tả ảnh:", err);
                }
            } else {
                console.warn("⚠️ Ảnh không tồn tại:", absoluteImagePath);
            }
        }

        const questionsArray = [item.Q1, item.Q2, item.Q3].filter(q => typeof q === "string" && q.trim() !== "");

        const questionObj = {
            part: item.Part,
            id: item.ID,
            text: item.Text || "",
            image: relativeImagePath,
            imageDescription,
        };

        if (questionsArray.length > 0) {
            questionObj.questions = questionsArray;
        }

        if (item["Context/Question/Situation"]) {
            questionObj.context = item["Context/Question/Situation"];
        }

        console.log("✅ Đang thêm câu hỏi:", questionObj);
        results.push(questionObj);
    }

    return results;
}
