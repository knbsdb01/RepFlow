FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV BASIL_BRIDGE_PORT=8002
EXPOSE ${BASIL_BRIDGE_PORT}

CMD uvicorn bridge:app --host 0.0.0.0 --port ${BASIL_BRIDGE_PORT}
