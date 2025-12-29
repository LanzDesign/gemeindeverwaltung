# Am Ende der urls.py hinzufügen (außerhalb if DEBUG)
from django.conf import settings
from django.conf.urls.static import static

# Media files IMMER servieren (auch in Production mit runserver --insecure)
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
