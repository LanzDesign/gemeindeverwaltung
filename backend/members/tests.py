from django.test import TestCase
from .models import Member, Familie, ServiceTag


class FamilieSerializerTest(TestCase):
	def setUp(self):
		# Erstelle einige Mitglieder
		self.vater = Member.objects.create(first_name="Hans", last_name="Müller")
		self.mutter = Member.objects.create(first_name="Anna", last_name="Müller")
		self.kind1 = Member.objects.create(first_name="Lisa", last_name="Müller")
		self.kind2 = Member.objects.create(first_name="Tom", last_name="Müller")

	def test_create_familie_with_ids(self):
		familie = Familie.objects.create(name="Familie Müller", vater=self.vater, mutter=self.mutter)
		familie.kinder.set([self.kind1, self.kind2])
		self.assertEqual(familie.vater.first_name, "Hans")
		self.assertEqual(familie.mutter.first_name, "Anna")
		self.assertEqual(familie.kinder.count(), 2)

	def test_update_children_clear_and_set(self):
		familie = Familie.objects.create(name="Familie Müller", vater=self.vater, mutter=self.mutter)
		familie.kinder.set([self.kind1, self.kind2])
		# Entferne ein Kind und füge keines hinzu
		familie.kinder.set([self.kind1])
		self.assertEqual(list(familie.kinder.values_list('id', flat=True)), [self.kind1.id])
		# Leere Liste => alle Kinder entfernen
		familie.kinder.set([])
		self.assertEqual(familie.kinder.count(), 0)
