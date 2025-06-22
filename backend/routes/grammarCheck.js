import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
router.post('/', async (req, res) => {
  const { sentence } = req.body;

  if (!sentence) {
    return res.status(400).json({ error: 'Thiếu nội dung câu cần kiểm tra.' });
  }

  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama3-8b-8192',
        messages: [
          { role: 'system', content: 'Bạn là trợ lý AI chuyên sửa câu tiếng Việt.' },
          { role: 'user', content: `Viết lại câu sau hay hơn: ${sentence}` }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const suggestion = response.data.choices[0].message.content;
    res.json({ suggestion });
  } catch (error) {
    console.error('GROQ lỗi:', error.response?.data || error.message);
    res.status(500).json({ error: 'Lỗi từ GROQ API' });
  }
});

export default router;

