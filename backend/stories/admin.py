from django.contrib import admin
from .models import StoryOrder


@admin.register(StoryOrder)
class StoryOrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'child_name', 'child_age', 'status', 'created_at')
    list_filter = ('status', 'child_gender', 'theme')
    readonly_fields = ('id', 'created_at')
