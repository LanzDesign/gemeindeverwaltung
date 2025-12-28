from django.contrib import admin
from .models import Event

@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ("title", "start", "end", "all_day", "created_by", "created_at")
    search_fields = ("title", "description")
    list_filter = ("all_day", "start")
