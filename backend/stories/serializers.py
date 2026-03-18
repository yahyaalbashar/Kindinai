from rest_framework import serializers
from .models import StoryOrder


class StoryOrderCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = StoryOrder
        fields = ['child_name', 'child_age', 'child_gender', 'favorite_animal', 'wish', 'theme']

    def validate_child_age(self, value):
        if value < 3 or value > 10:
            raise serializers.ValidationError('يجب أن يكون عمر الطفل بين ٣ و ١٠ سنوات')
        return value


class StoryOrderOutputSerializer(serializers.ModelSerializer):
    class Meta:
        model = StoryOrder
        fields = ['id', 'child_name', 'child_age', 'story_text', 'status', 'created_at']
