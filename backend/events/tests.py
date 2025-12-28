from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from .models import Event

User = get_user_model()

class EventAPITestCase(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.event = Event.objects.create(
            title="Test Event",
            description="Test Desc",
            start="2025-12-14T10:00:00Z",
            end="2025-12-14T12:00:00Z",
            all_day=False,
            created_by=self.user
        )

    def test_list_events(self):
        url = reverse('event-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.data) >= 1)

    def test_create_event(self):
        url = reverse('event-list')
        data = {
            "title": "New Event",
            "description": "Desc",
            "start": "2025-12-15T10:00:00Z",
            "end": "2025-12-15T12:00:00Z",
            "all_day": False
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Event.objects.count(), 2)

    def test_update_event(self):
        url = reverse('event-detail', args=[self.event.id])
        data = {"title": "Updated Event"}
        response = self.client.patch(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.event.refresh_from_db()
        self.assertEqual(self.event.title, "Updated Event")

    def test_delete_event(self):
        url = reverse('event-detail', args=[self.event.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Event.objects.filter(id=self.event.id).exists())
