import io
import os
import wave
import struct
import logging

from google import genai
from google.genai import types
from django.core.files.base import ContentFile

logger = logging.getLogger(__name__)

# Soft, gentle voice for bedtime stories
VOICE_NAME = 'Achernar'
TTS_MODEL = 'gemini-2.5-flash-preview-tts'
SAMPLE_RATE = 24000
SAMPLE_WIDTH = 2  # 16-bit
CHANNELS = 1


def _pcm_to_wav(pcm_data):
    """Wrap raw PCM data in a WAV header."""
    buf = io.BytesIO()
    with wave.open(buf, 'wb') as wf:
        wf.setnchannels(CHANNELS)
        wf.setsampwidth(SAMPLE_WIDTH)
        wf.setframerate(SAMPLE_RATE)
        wf.writeframes(pcm_data)
    return buf.getvalue()


def _generate_chunk_audio(client, text_chunk):
    """Generate audio for a single text chunk using Gemini TTS."""
    response = client.models.generate_content(
        model=TTS_MODEL,
        contents=f"اقرأ هذا النص بصوت هادئ ودافئ كقصة نوم للأطفال:\n\n{text_chunk}",
        config=types.GenerateContentConfig(
            response_modalities=["AUDIO"],
            speech_config=types.SpeechConfig(
                voice_config=types.VoiceConfig(
                    prebuilt_voice_config=types.PrebuiltVoiceConfig(
                        voice_name=VOICE_NAME,
                    )
                ),
            ),
        ),
    )

    # Extract raw PCM audio data
    for part in response.candidates[0].content.parts:
        if part.inline_data is not None:
            return part.inline_data.data

    raise RuntimeError("No audio returned from Gemini TTS")


def generate_audio(order):
    """Generate Arabic audio narration for a story using Gemini native TTS."""
    client = genai.Client(api_key=os.getenv('GOOGLE_GEMINI_API_KEY'))

    text = order.story_text

    # Split into paragraphs for natural chunking
    paragraphs = [p.strip() for p in text.split('\n\n') if p.strip()]

    # Group paragraphs into chunks to stay within token limits
    max_chars = 3000
    chunks = []
    current_chunk = []
    current_len = 0

    for para in paragraphs:
        if current_len + len(para) > max_chars and current_chunk:
            chunks.append('\n\n'.join(current_chunk))
            current_chunk = [para]
            current_len = len(para)
        else:
            current_chunk.append(para)
            current_len += len(para)

    if current_chunk:
        chunks.append('\n\n'.join(current_chunk))

    # Generate audio for each chunk and concatenate raw PCM
    all_pcm = bytearray()
    for i, chunk in enumerate(chunks):
        try:
            pcm_data = _generate_chunk_audio(client, chunk)
            all_pcm.extend(pcm_data)
            # Add a short silence between chunks (0.5s)
            if i < len(chunks) - 1:
                silence = b'\x00' * (SAMPLE_RATE * SAMPLE_WIDTH * CHANNELS // 2)
                all_pcm.extend(silence)
        except Exception as e:
            logger.error(f"TTS chunk {i} failed for order {order.id}: {e}")
            raise

    # Convert concatenated PCM to WAV
    wav_data = _pcm_to_wav(bytes(all_pcm))

    filename = f"story_{order.id}.wav"
    order.audio_file.save(filename, ContentFile(wav_data), save=False)
    order.audio_status = 'completed'
    order.save()

    return order.audio_file.url
