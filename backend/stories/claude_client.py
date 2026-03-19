import os
import anthropic


SYSTEM_PROMPT = """
أنت كاتب قصص أطفال عربي موهوب ومتخصص. تكتب قصصًا بالعربية الفصحى البسيطة المناسبة للأطفال.
قصصك:
- دافئة وممتعة ومشوقة
- تحمل قيمة إيجابية واضحة في نهايتها
- مناسبة لعمر الطفل تمامًا
- تجعل الطفل بطلًا حقيقيًا للقصة
- تستخدم لغة عربية جميلة وبسيطة يفهمها الطفل
- لا تتجاوز 600 كلمة
- تنتهي بجملة دافئة موجهة للطفل مباشرة
""".strip()

WISH_MAP = {
    'brave': 'شجاع',
    'kind': 'طيب القلب',
    'smart': 'ذكي',
    'curious': 'فضولي ومحب للاكتشاف',
    'strong': 'قوي',
}

THEME_MAP = {
    'adventure': 'مغامرة في الغابة',
    'magic': 'عالم سحري',
    'animals': 'مملكة الحيوانات',
    'space': 'رحلة إلى الفضاء',
    'ocean': 'أعماق البحر',
}


def build_user_prompt(order):
    gender_word = "الفتى" if order.child_gender == 'boy' else "الفتاة"
    wish_ar = WISH_MAP.get(order.wish, order.wish)
    theme_ar = THEME_MAP.get(order.theme, order.theme)

    return f"""
اكتب قصة نوم شخصية لطفل اسمه {order.child_name}، عمره {order.child_age} سنوات.
الطفل {gender_word}.
حيوانه المفضل: {order.favorite_animal}.
أتمنى أن يكون طفلي: {wish_ar}.
موضوع القصة: {theme_ar}.

الطفل هو البطل الرئيسي في القصة. اذكر اسمه بشكل طبيعي خلال القصة.
اجعل الحيوان المفضل له دورًا مهمًا في القصة.
القصة يجب أن تعكس صفة {wish_ar} بشكل واضح.
""".strip()


def generate_story(order):
    client = anthropic.Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))

    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=2048,
        system=SYSTEM_PROMPT,
        messages=[
            {"role": "user", "content": build_user_prompt(order)}
        ],
    )

    return message.content[0].text


SCENE_EXTRACTION_PROMPT = """
You are given an Arabic children's bedtime story. Extract exactly 4 key visual scenes from the story.

For each scene, write a short English description (1-2 sentences) that describes the visual setting, characters, and action. These descriptions will be used to generate children's book illustrations.

Important:
- Describe the child character's appearance consistently (age, gender, clothing)
- Include the setting/environment details
- Mention the animal character if present in the scene
- Keep descriptions visual and concrete, not abstract
- Do NOT include any Arabic text

Return ONLY the 4 descriptions, one per line, numbered 1-4. No other text.
""".strip()


def extract_scene_descriptions(story_text, order):
    """Extract 4 key scene descriptions from a story for illustration."""
    client = anthropic.Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))

    gender = "boy" if order.child_gender == 'boy' else "girl"
    context = f"The main character is a {order.child_age}-year-old {gender} named {order.child_name}. Their favorite animal is a {order.favorite_animal}."

    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1024,
        system=SCENE_EXTRACTION_PROMPT,
        messages=[
            {"role": "user", "content": f"{context}\n\nStory:\n{story_text}"}
        ],
    )

    lines = message.content[0].text.strip().split('\n')
    scenes = []
    for line in lines:
        line = line.strip()
        if line and line[0].isdigit():
            # Remove numbering like "1. " or "1) "
            line = line.lstrip('0123456789').lstrip('.').lstrip(')').strip()
        if line:
            scenes.append(line)

    return scenes[:4]
