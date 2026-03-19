import os
import time
import logging

from google import genai
from google.genai import types
from django.core.files.base import ContentFile

logger = logging.getLogger(__name__)

VEO_MODEL = 'veo-3.0-generate-preview'
POLL_INTERVAL = 20  # seconds
MAX_POLL_TIME = 600  # 10 minutes max wait per clip


def generate_video_clip(client, illustration, paragraph_text):
    """Generate a single animated video clip from an illustration using Veo."""
    # Read the illustration image
    image = types.Image.from_file(location=illustration.image.path)

    # Build a cinematic prompt from the scene description
    prompt = (
        f"Gently animate this children's book illustration. "
        f"Soft, slow, dreamy motion like a bedtime story. "
        f"Subtle movements: characters breathing, leaves swaying, stars twinkling. "
        f"Keep the watercolor art style intact. "
        f"Scene: {illustration.scene_description}"
    )

    operation = client.models.generate_videos(
        model=VEO_MODEL,
        prompt=prompt,
        image=image,
        config=types.GenerateVideosConfig(
            number_of_videos=1,
            duration_seconds=8,
            aspect_ratio='9:16',
            person_generation='allow_adult',
        ),
    )

    # Poll until complete
    elapsed = 0
    while not operation.done:
        if elapsed >= MAX_POLL_TIME:
            raise TimeoutError(f"Video generation timed out after {MAX_POLL_TIME}s")
        time.sleep(POLL_INTERVAL)
        elapsed += POLL_INTERVAL
        operation = client.operations.get(operation)

    # Download the generated video
    generated_video = operation.response.generated_videos[0]
    client.files.download(file=generated_video.video)
    generated_video.video.save('temp_clip.mp4')

    # Read the saved file
    with open('temp_clip.mp4', 'rb') as f:
        video_data = f.read()

    # Clean up temp file
    if os.path.exists('temp_clip.mp4'):
        os.remove('temp_clip.mp4')

    return video_data


def generate_story_video(order):
    """Generate animated video clips for each illustrated paragraph."""
    from .models import StoryVideoClip

    client = genai.Client(api_key=os.getenv('GOOGLE_GEMINI_API_KEY'))

    # Get the illustrations ordered by paragraph
    illustrations = order.illustrations.all().order_by('paragraph_index', 'scene_index')

    if not illustrations.exists():
        raise RuntimeError("No illustrations available to animate")

    # Group by paragraph — take first illustration per paragraph
    seen_paragraphs = set()
    unique_illustrations = []
    for ill in illustrations:
        if ill.paragraph_index not in seen_paragraphs:
            seen_paragraphs.add(ill.paragraph_index)
            unique_illustrations.append(ill)

    # Get paragraph texts
    paragraphs = [p.strip() for p in order.story_text.split('\n\n') if p.strip()]

    clips = []
    for ill in unique_illustrations:
        para_text = paragraphs[ill.paragraph_index] if ill.paragraph_index < len(paragraphs) else ''

        try:
            logger.info(f"Generating video clip for paragraph {ill.paragraph_index} of order {order.id}")
            video_data = generate_video_clip(client, ill, para_text)

            clip = StoryVideoClip(
                story=order,
                paragraph_index=ill.paragraph_index,
                scene_description=ill.scene_description,
            )
            filename = f"story_{order.id}_clip_{ill.paragraph_index}.mp4"
            clip.video.save(filename, ContentFile(video_data), save=False)
            clip.save()
            clips.append(clip)

        except Exception as e:
            logger.error(f"Failed to generate video clip for paragraph {ill.paragraph_index}, order {order.id}: {e}")
            raise

    return clips
