import uuid
from django.db import models


class StoryOrder(models.Model):
    class Status(models.TextChoices):
        PENDING_PAYMENT = 'pending_payment'
        PAID = 'paid'
        GENERATING = 'generating'
        COMPLETED = 'completed'
        FAILED = 'failed'

    class Gender(models.TextChoices):
        BOY = 'boy', 'ولد'
        GIRL = 'girl', 'بنت'

    WISH_CHOICES = [
        ('brave', 'شجاع'),
        ('kind', 'طيب القلب'),
        ('smart', 'ذكي'),
        ('curious', 'فضولي ومحب للاكتشاف'),
        ('strong', 'قوي'),
    ]

    THEME_CHOICES = [
        ('adventure', 'مغامرة في الغابة'),
        ('magic', 'عالم سحري'),
        ('animals', 'مملكة الحيوانات'),
        ('space', 'رحلة إلى الفضاء'),
        ('ocean', 'أعماق البحر'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    child_name = models.CharField(max_length=100)
    child_age = models.IntegerField()
    child_gender = models.CharField(max_length=10, choices=Gender.choices)
    favorite_animal = models.CharField(max_length=100)
    wish = models.CharField(max_length=50, choices=WISH_CHOICES)
    theme = models.CharField(max_length=50, choices=THEME_CHOICES)
    child_photo = models.ImageField(upload_to='child_photos/', blank=True)
    stripe_payment_intent_id = models.CharField(max_length=255, blank=True)
    story_title = models.CharField(max_length=200, blank=True)
    story_moral = models.CharField(max_length=300, blank=True)
    story_text = models.TextField(blank=True)
    audio_file = models.FileField(upload_to='story_audio/', blank=True)
    audio_status = models.CharField(
        max_length=20,
        choices=[('pending', 'Pending'), ('generating', 'Generating'), ('completed', 'Completed'), ('failed', 'Failed')],
        default='pending',
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING_PAYMENT)
    created_at = models.DateTimeField(auto_now_add=True)

    illustrations_status = models.CharField(
        max_length=20,
        choices=[('pending', 'Pending'), ('generating', 'Generating'), ('completed', 'Completed'), ('failed', 'Failed')],
        default='pending',
    )

    video_status = models.CharField(
        max_length=20,
        choices=[('pending', 'Pending'), ('generating', 'Generating'), ('completed', 'Completed'), ('failed', 'Failed')],
        default='pending',
    )

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Story for {self.child_name} ({self.status})"


class StoryIllustration(models.Model):
    story = models.ForeignKey(StoryOrder, on_delete=models.CASCADE, related_name='illustrations')
    scene_index = models.IntegerField()
    paragraph_index = models.IntegerField(default=0)
    scene_description = models.TextField()
    image = models.ImageField(upload_to='story_illustrations/')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['paragraph_index', 'scene_index']

    def __str__(self):
        return f"Illustration {self.scene_index} (para {self.paragraph_index}) for {self.story_id}"


class StoryVideoClip(models.Model):
    story = models.ForeignKey(StoryOrder, on_delete=models.CASCADE, related_name='video_clips')
    paragraph_index = models.IntegerField()
    scene_description = models.TextField()
    video = models.FileField(upload_to='story_videos/')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['paragraph_index']

    def __str__(self):
        return f"Video clip {self.paragraph_index} for {self.story_id}"
