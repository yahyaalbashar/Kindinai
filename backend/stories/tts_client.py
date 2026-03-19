import os
import logging
from django.conf import settings
from django.core.files.base import ContentFile
from google.cloud import texttospeech

logger = logging.getLogger(__name__)


def generate_audio(order):
    """Generate Arabic audio narration for a story using Google Cloud TTS."""
    client = texttospeech.TextToSpeechClient()

    # Google TTS has a 5000 byte limit per request for plain text.
    # Split long stories into chunks and concatenate the audio.
    text = order.story_text
    max_chars = 4500  # stay under the byte limit for Arabic (multi-byte)
    chunks = []
    while text:
        if len(text) <= max_chars:
            chunks.append(text)
            break
        # Find a good split point (paragraph or sentence break)
        split_at = text.rfind('\n', 0, max_chars)
        if split_at == -1:
            split_at = text.rfind('。', 0, max_chars)
        if split_at == -1:
            split_at = text.rfind('.', 0, max_chars)
        if split_at == -1:
            split_at = max_chars
        chunks.append(text[:split_at + 1])
        text = text[split_at + 1:].lstrip()

    audio_parts = []
    for chunk in chunks:
        synthesis_input = texttospeech.SynthesisInput(text=chunk)

        voice = texttospeech.VoiceSelectionParams(
            language_code="ar-XA",
            name="ar-XA-Wavenet-A",
            ssml_gender=texttospeech.SsmlVoiceGender.FEMALE,
        )

        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3,
            speaking_rate=0.9,  # slightly slower for bedtime stories
            pitch=-1.0,  # slightly lower pitch for warmth
        )

        response = client.synthesize_speech(
            input=synthesis_input,
            voice=voice,
            audio_config=audio_config,
        )
        audio_parts.append(response.audio_content)

    audio_content = b''.join(audio_parts)

    filename = f"story_{order.id}.mp3"
    order.audio_file.save(filename, ContentFile(audio_content), save=False)
    order.audio_status = 'completed'
    order.save()

    return order.audio_file.url
