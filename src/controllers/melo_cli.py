import os
import sys
import warnings
import contextlib
import tempfile

# 1. Suppress warnings to prevent stream corruption
warnings.filterwarnings("ignore")
os.environ["PYTHONWARNINGS"] = "ignore"
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"

try:
    from transformers import logging as transformers_logging
    transformers_logging.set_verbosity_error()
    from melo.api import TTS
except Exception as e:
    sys.stderr.write(f"PYTHON ERROR: Failed to import Melo or Transformers: {str(e)}\n")
    sys.exit(1)

def generate_audio():
    temp_path = None
    try:
        text = sys.argv[1] if len(sys.argv) > 1 else "Hello"
        accent_key = sys.argv[2] if len(sys.argv) > 2 else "Default" 
        speed = float(sys.argv[3]) if len(sys.argv) > 3 else 1.0
        noise_scale = float(sys.argv[4]) if len(sys.argv) > 4 else 0.4

        with contextlib.redirect_stdout(sys.stderr):
            model = TTS(language="EN", device="auto") 
            
            # FIX: Access the dictionary attribute directly or convert it
            speaker_ids = model.hps.data.spk2id
            
            # Since .get() failed, we check if target exists in the HParams keys
            target_speaker = f"EN-{accent_key.upper()}"
            
            # Melo HParams often act like dictionaries but lack some methods. 
            # We can use 'getattr' or a simple 'if' check.
            if hasattr(speaker_ids, target_speaker):
                speaker_id = getattr(speaker_ids, target_speaker)
                sys.stderr.write(f"DEBUG: Found speaker {target_speaker} (ID: {speaker_id})\n")
            else:
                # Fallback to the first speaker ID available
                first_key = list(speaker_ids.__dict__.keys())[0]
                speaker_id = getattr(speaker_ids, first_key)
                sys.stderr.write(f"DEBUG: {target_speaker} not found. Using fallback: {first_key}\n")

            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_audio:
                temp_path = temp_audio.name
            
            model.tts_to_file(
                text, 
                speaker_id, 
                temp_path, 
                speed=speed, 
                noise_scale=noise_scale, 
                quiet=True
            )

        # Stream clean binary data to stdout
        if temp_path and os.path.exists(temp_path):
            with open(temp_path, "rb") as f:
                sys.stdout.buffer.write(f.read())
                sys.stdout.buffer.flush()
        else:
            sys.stderr.write("PYTHON ERROR: Audio file was not generated.\n")

    except Exception as e:
        import traceback
        sys.stderr.write(f"CRITICAL PYTHON ERROR: {str(e)}\n")
        sys.stderr.write(traceback.format_exc())
        sys.exit(1)
    finally:
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except:
                pass

if __name__ == "__main__":
    generate_audio()