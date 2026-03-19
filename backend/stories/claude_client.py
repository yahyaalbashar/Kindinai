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

يجب أن يكون ردك بالتنسيق التالي بالضبط:
العنوان: [عنوان القصة - يعكس الدرس والعبرة من القصة بطريقة جذابة للأطفال]
العبرة: [جملة واحدة قصيرة تلخص الدرس المستفاد من القصة]

[نص القصة هنا]
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

    raw = message.content[0].text.strip()

    # Parse title, moral, and story text from the structured response
    title = ''
    moral = ''
    story_lines = []
    parsing_story = False

    for line in raw.split('\n'):
        stripped = line.strip()
        if stripped.startswith('العنوان:'):
            title = stripped.replace('العنوان:', '').strip()
        elif stripped.startswith('العبرة:'):
            moral = stripped.replace('العبرة:', '').strip()
        else:
            if title and (stripped or parsing_story):
                parsing_story = True
                story_lines.append(line)

    story_text = '\n'.join(story_lines).strip()

    # Fallback if parsing fails
    if not story_text:
        story_text = raw

    return story_text, title, moral


CHARACTER_DESCRIPTION_PROMPT = """
You are given context about a children's story character. Generate a SINGLE, detailed visual description of the main child character that an illustrator can reuse across every scene. Include:
- Exact hair color, style, and length
- Skin tone
- Eye color and shape
- Specific clothing (colors, patterns, accessories)
- Build and height relative to age
- Any distinguishing features

Also describe the animal companion with the same level of detail.

Keep it to 3-4 sentences total. Be very specific (e.g. "dark brown curly hair in two pigtails" not just "brown hair"). Write in English only.

Return ONLY the description, nothing else.
""".strip()


def generate_character_description(order):
    """Generate a consistent visual character description for illustrations."""
    client = anthropic.Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))

    gender = "boy" if order.child_gender == 'boy' else "girl"
    context = (
        f"The main character is a {order.child_age}-year-old {gender} named {order.child_name}. "
        f"Their favorite animal is a {order.favorite_animal}. "
        f"The story theme is: {order.theme}."
    )

    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=300,
        system=CHARACTER_DESCRIPTION_PROMPT,
        messages=[
            {"role": "user", "content": context}
        ],
    )

    return message.content[0].text.strip()


SCENE_EXTRACTION_PROMPT = """
You are given an Arabic children's bedtime story. The story has been split into paragraphs (separated by blank lines).

For EACH paragraph, generate 1 or 2 visual scene descriptions in English. Each description should be 1-2 sentences describing the visual setting, characters, and action for a children's book illustration.

Important:
- Describe the child character's appearance consistently (age, gender, clothing)
- Include the setting/environment details
- Mention the animal character if present in the scene
- Keep descriptions visual and concrete, not abstract
- Do NOT include any Arabic text
- Each paragraph gets 1 or 2 illustrations maximum
- Choose the most visually interesting moments

Return the output in this EXACT format (no other text):
PARAGRAPH 0
1. [description]
2. [description]
PARAGRAPH 1
1. [description]
PARAGRAPH 2
1. [description]
2. [description]
...and so on for each paragraph.
""".strip()


def extract_scene_descriptions(story_text, order):
    """Extract scene descriptions per paragraph from a story for illustration."""
    client = anthropic.Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))

    gender = "boy" if order.child_gender == 'boy' else "girl"
    context = f"The main character is a {order.child_age}-year-old {gender} named {order.child_name}. Their favorite animal is a {order.favorite_animal}."

    # Split story into paragraphs for reference
    paragraphs = [p.strip() for p in story_text.strip().split('\n\n') if p.strip()]
    numbered_paragraphs = "\n\n".join(
        f"[Paragraph {i}]\n{p}" for i, p in enumerate(paragraphs)
    )

    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=2048,
        system=SCENE_EXTRACTION_PROMPT,
        messages=[
            {"role": "user", "content": f"{context}\n\nStory paragraphs:\n{numbered_paragraphs}"}
        ],
    )

    # Parse the structured output into a list of (paragraph_index, description) tuples
    result = []
    current_para = 0
    for line in message.content[0].text.strip().split('\n'):
        line = line.strip()
        if not line:
            continue
        if line.upper().startswith('PARAGRAPH'):
            # Extract paragraph number
            parts = line.split()
            if len(parts) >= 2 and parts[1].isdigit():
                current_para = int(parts[1])
            continue
        if line and line[0].isdigit():
            desc = line.lstrip('0123456789').lstrip('.').lstrip(')').strip()
            if desc:
                result.append((current_para, desc))

    return result
