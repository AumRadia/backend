import sys
import os
import soundfile as sf

# --- 1. SETUP PATHS ---
current_dir = os.path.dirname(os.path.abspath(__file__))

# Define Code Path (src/CosyVoice_Code)
code_root = os.path.abspath(os.path.join(current_dir, '../CosyVoice_Code'))
sys.path.insert(0, code_root)

# Add Matcha-TTS (Required Dependency)
matcha_path = os.path.join(code_root, 'third_party', 'Matcha-TTS')
if os.path.exists(matcha_path):
    sys.path.insert(0, matcha_path)

# Import Model
try:
    from cosyvoice.cli.cosyvoice import CosyVoice, CosyVoice2
except ImportError as e:
    sys.stderr.write(f"❌ Python Import Error: {e}\n")
    sys.exit(1)

def ensure_yaml_exists(model_dir):
    """Ensure cosyvoice2.yaml exists, create from cosyvoice.yaml if needed"""
    yaml_v2 = os.path.join(model_dir, 'cosyvoice2.yaml')
    yaml_v1 = os.path.join(model_dir, 'cosyvoice.yaml')
    
    # If cosyvoice2.yaml doesn't exist but cosyvoice.yaml does, copy it
    if not os.path.exists(yaml_v2) and os.path.exists(yaml_v1):
        sys.stderr.write("Creating cosyvoice2.yaml from cosyvoice.yaml...\n")
        import shutil
        shutil.copy(yaml_v1, yaml_v2)
        sys.stderr.write("✓ Created cosyvoice2.yaml\n")
    
    if os.path.exists(yaml_v2):
        return yaml_v2, True
    elif os.path.exists(yaml_v1):
        return yaml_v1, False
    else:
        return None, False

def main():
    try:
        if len(sys.argv) < 2:
            sys.stderr.write("Usage: python cosyvoice_cli.py <text> <voice>\n")
            sys.exit(1)

        text = sys.argv[1]
        voice = sys.argv[2] if len(sys.argv) > 2 else "中文女"
        
        # Path to local model
        model_dir = os.path.abspath(os.path.join(current_dir, '../speechtts'))
        
        # Verify directory exists
        if not os.path.exists(model_dir):
            sys.stderr.write(f"❌ Error: Model directory not found at {model_dir}\n")
            sys.exit(1)
        
        # Verify required model files exist
        required_files = ['flow.pt', 'hift.pt', 'llm.pt', 'campplus.onnx', 'speech_tokenizer_v2.onnx']
        missing = [f for f in required_files if not os.path.exists(os.path.join(model_dir, f))]
        if missing:
            sys.stderr.write(f"❌ Missing model files: {', '.join(missing)}\n")
            sys.exit(1)
        
        # Ensure proper YAML exists
        yaml_path, use_v2 = ensure_yaml_exists(model_dir)
        if not yaml_path:
            sys.stderr.write(f"❌ Error: No cosyvoice.yaml or cosyvoice2.yaml found\n")
            sys.exit(1)
        
        sys.stderr.write(f"Loading CosyVoice2-0.5B from {model_dir}...\n")
        
        # Initialize Model
        try:
            # For CosyVoice2-0.5B, always use CosyVoice2
            model = CosyVoice2(model_dir, load_jit=False, load_trt=False)
            sys.stderr.write("✓ Model loaded successfully\n")
            
            # Try to list available voices (different method names in different versions)
            try:
                if hasattr(model, 'list_avaliable_spks'):
                    available_voices = list(model.list_avaliable_spks())
                elif hasattr(model, 'list_available_spks'):
                    available_voices = list(model.list_available_spks())
                else:
                    # Access the spk2info dictionary directly
                    available_voices = list(model.frontend.spk2info.keys())
                
                if not available_voices:
                    sys.stderr.write("⚠️  No pre-trained voices found in model\n")
                    sys.stderr.write("This model requires voice prompt for zero-shot TTS\n")
                    sys.stderr.write("Trying zero-shot synthesis instead...\n")
                    # For zero-shot, we don't need a voice ID
                    voice = None
                else:
                    sys.stderr.write(f"Available voices: {', '.join(available_voices)}\n")
                    
                    # If requested voice not available, use first available
                    if voice not in available_voices:
                        old_voice = voice
                        voice = available_voices[0] if available_voices else None
                        if voice:
                            sys.stderr.write(f"⚠️  Voice '{old_voice}' not found, using '{voice}'\n")
                        
            except Exception as e:
                sys.stderr.write(f"⚠️  Could not list voices: {e}\n")
                sys.stderr.write(f"Attempting to use voice: '{voice}'\n")
                
        except Exception as e:
            sys.stderr.write(f"❌ Failed to load model: {e}\n")
            import traceback
            sys.stderr.write(traceback.format_exc())
            sys.exit(1)

        # Generate Audio
        sys.stderr.write(f"Generating audio: '{text}' (voice: {voice})\n")
        
        # CosyVoice2-0.5B may not have pre-trained voices, use zero-shot or instruct mode
        if voice is None:
            # Try instruct mode (text-to-speech without specific voice)
            sys.stderr.write("Using instruct mode (no specific voice)...\n")
            output = model.inference_instruct(text, "A clear and natural voice", "")
        else:
            # Use SFT mode with voice ID
            output = model.inference_sft(text, voice)
        
        audio_data = None
        sample_rate = 22050  # default
        
        for result in output:
            if 'tts_speech' in result:
                audio_data = result['tts_speech'].cpu().numpy()
                if 'sr' in result:
                    sample_rate = result['sr']
                break
        
        if audio_data is None:
            sys.stderr.write("❌ Error: No audio generated\n")
            sys.exit(1)

        sys.stderr.write(f"✓ Generated {len(audio_data)} samples at {sample_rate}Hz\n")
        
        # Send Audio Bytes to Node.js stdout
        sf.write(sys.stdout.buffer, audio_data, sample_rate, format='wav')
        
        sys.stderr.write("✓ Audio sent\n")

    except Exception as e:
        sys.stderr.write(f"❌ Error: {str(e)}\n")
        import traceback
        sys.stderr.write(traceback.format_exc())
        sys.exit(1)

if __name__ == "__main__":
    main()