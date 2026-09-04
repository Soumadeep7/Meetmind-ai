import sys
import json
from faster_whisper import WhisperModel

if len(sys.argv) < 2:
    print(json.dumps({
        "success": False,
        "error": "Audio file path is required"
    }))
    sys.exit(1)

audio_file = sys.argv[1]

try:
    print("Loading Whisper model...", file=sys.stderr)

    model = WhisperModel(
        "small",
        device="cpu",
        compute_type="int8"
    )

    print("Transcribing audio...", file=sys.stderr)

    segments, info = model.transcribe(audio_file)

    transcript = " ".join(
        segment.text.strip()
        for segment in segments
    )

    print(json.dumps({
        "success": True,
        "language": info.language,
        "transcript": transcript
    }))

except Exception as e:
    print(json.dumps({
        "success": False,
        "error": str(e)
    }))
    sys.exit(1)