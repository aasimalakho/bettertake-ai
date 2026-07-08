FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Hugging Face Spaces (Docker SDK) requires the app to listen on port 7860.
# Render/Railway/Fly all inject their own $PORT at runtime, which the CMD
# below respects via shell expansion — so this same image works unmodified
# on any of them.
ENV PORT=7860
EXPOSE 7860

CMD gunicorn app:app --bind 0.0.0.0:${PORT} --workers 2 --timeout 180
