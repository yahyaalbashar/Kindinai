from rest_framework import serializers
from .models import StoryOrder, StoryIllustration


class StoryOrderCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = StoryOrder
        fields = ['child_name', 'child_age', 'child_gender', 'favorite_animal', 'wish', 'theme']

    def validate_child_age(self, value):
        if value < 3 or value > 10:
            raise serializers.ValidationError('يجب أن يكون عمر الطفل بين ٣ و ١٠ سنوات')
        return value


class StoryIllustrationSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = StoryIllustration
        fields = ['scene_index', 'paragraph_index', 'image_url']

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class StoryOrderOutputSerializer(serializers.ModelSerializer):
    audio_url = serializers.SerializerMethodField()
    illustrations = serializers.SerializerMethodField()

    class Meta:
        model = StoryOrder
        fields = [
            'id', 'child_name', 'child_age', 'story_text', 'status',
            'audio_status', 'audio_url', 'illustrations_status', 'illustrations', 'created_at',
        ]

    def get_audio_url(self, obj):
        if obj.audio_file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.audio_file.url)
            return obj.audio_file.url
        return None

    def get_illustrations(self, obj):
        qs = obj.illustrations.all()
        if not qs.exists():
            return []
        return StoryIllustrationSerializer(qs, many=True, context=self.context).data
