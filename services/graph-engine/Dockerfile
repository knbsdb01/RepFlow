FROM python:3.12-slim

WORKDIR /app

# Install system deps for tree-sitter
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install core Python deps (all hedwig-cg deps EXCEPT heavy ML)
COPY services/graph-engine/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy hedwig-cg package directly (no pip install needed - deps already met)
COPY repos/hedwig-code-graph/hedwig_cg /usr/local/lib/python3.12/site-packages/hedwig_cg

# Copy graph engine app code
COPY services/graph-engine/*.py /app/

# Expose port
ENV GRAPH_ENGINE_PORT=8001
EXPOSE ${GRAPH_ENGINE_PORT}

CMD uvicorn app:app --host 0.0.0.0 --port ${GRAPH_ENGINE_PORT}
