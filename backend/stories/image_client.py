import os
import logging
import base64

from google import genai
from google.genai import types
from django.core.files.base import ContentFile

logger = logging.getLogger(__name__)

STYLE_PROMPT = (
    "Children's book watercolor illustration, warm and friendly, "
    "soft pastel colors, cute cartoon style, safe for kids, "
    "no text or words in the image"
)


def generate_illustration(scene_description, order, scene_index):
    """Generate a single illustration for a story scene using Gemini."""
    client = genai.Client(api_key=os.getenv('GOOGLE_GEMINI_API_KEY'))

    prompt = f"{STYLE_PROMPT}. Scene: {scene_description}"

    response = client.models.generate_content(
        model="gemini-2.5-flash-image",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_modalities=["IMAGE"],
        ),
    )

    # Extract the image from the response
    for part in response.candidates[0].content.parts:
        if part.inline_data is not None:
            image_data = part.inline_data.data
            mime_type = part.inline_data.mime_type
            ext = 'png' if 'png' in mime_type else 'jpg'
            filename = f"story_{order.id}_scene_{scene_index}.{ext}"
            return filename, ContentFile(image_data)

    raise RuntimeError("No image returned from Gemini API")


def generate_story_illustrations(order, scene_descriptions):
    """Generate illustrations for all scenes and save them.

    scene_descriptions: list of (paragraph_index, description) tuples
    """
    from .models import StoryIllustration

    illustrations = []
    for i, (para_index, scene) in enumerate(scene_descriptions):
        try:
            filename, content = generate_illustration(scene, order, i)
            illustration = StoryIllustration(
                story=order,
                scene_index=i,
                paragraph_index=para_index,
                scene_description=scene,
            )
            illustration.image.save(filename, content, save=False)
            illustration.save()
            illustrations.append(illustration)
        except Exception as e:
            logger.error(f"Failed to generate illustration {i} for order {order.id}: {e}")

    return illustrations
