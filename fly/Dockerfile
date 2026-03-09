FROM nvidia/cuda:12.4.1-cudnn-runtime-ubuntu22.04

# System deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-pip ffmpeg curl \
    && rm -rf /var/lib/apt/lists/*

# Python deps (with CUDA support)
RUN pip install --no-cache-dir \
    faster-whisper httpx yt-dlp \
    torch==2.5.1 torchaudio==2.5.1 \
    "huggingface_hub<1" \
    "pyannote.audio>=3.3,<4"

# Download faster-whisper model at build time
RUN python3 -c "\
from huggingface_hub import snapshot_download; \
snapshot_download('Systran/faster-whisper-medium.en', local_dir='/models/faster-whisper-medium.en')"

# pyannote models are downloaded at runtime using HF_TOKEN env var
# (gated repo requires auth that's hard to pass at build time on remote builders)

COPY worker.py /app/worker.py

EXPOSE 8080
CMD ["python3", "/app/worker.py"]
