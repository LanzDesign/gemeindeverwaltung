from django.utils.deprecation import MiddlewareMixin

class DisableCSRFForAPIMiddleware(MiddlewareMixin):
    def process_request(self, request):
        # CSRF für alle /api/ Endpunkte deaktivieren (außer /admin/)
        if request.path.startswith('/api/'):
            setattr(request, '_dont_enforce_csrf_checks', True)
