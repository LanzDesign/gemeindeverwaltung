#!/usr/bin/env python
"""Quick test script to check gender field"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Backend.settings')
django.setup()

from members.models import Member

print("=== Gender Field Test ===")
members = Member.objects.all()[:10]
for m in members:
    print(f"ID:{m.id} {m.first_name} {m.last_name} - gender=[{m.gender}]")

print("\n=== Count ===")
print(f"Total: {Member.objects.count()}")
print(f"Male: {Member.objects.filter(gender='male').count()}")
print(f"Female: {Member.objects.filter(gender='female').count()}")
print(f"Empty: {Member.objects.filter(gender='').count()}")
