FROM nvidia/cuda:12.4.1-cudnn-runtime-ubuntu22.04

# System deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-pip ffmpeg curl \
    && rm -rf /var/lib/apt/lists/*

# Python deps (with CUDA support)
RUN pip install --no-cache-dir \
    faster-whisper httpx yt-dlp

# Download model at build time (baked into image)
RUN python3 -c "\
from huggingface_hub import snapshot_download; \
snapshot_download('Systran/faster-whisper-medium.en', local_dir='/models/faster-whisper-medium.en')"

COPY worker.py /app/worker.py

EXPOSE 8080
CMD ["python3", "/app/worker.py"]
