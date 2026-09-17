```
python -m venv .venv && .venv\Scripts\activate
pip install -r requirements.txt
copy ..\..\.env.example ..\..\.env   # điền GEMINI_API_KEY
uvicorn app.main:app --reload
```
`GET /api/health` · `GET /api/llm-check` (gọi Gemini thật qua SDK OpenAI).
