"""
Django settings for backend project.
Revised for Production with Nginx & React & Docker
"""
import os
from pathlib import Path
import dj_database_url

BASE_DIR = Path(__file__).resolve().parent.parent

# --- SECURITY ---
DEBUG = os.environ.get('DEBUG', 'False').lower() == 'true'

# ACHTUNG: ??ndere diesen Key, falls er ??ffentlich war!
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-lokaler-fallback-key-bitte-auf-render-setzen')

# ALLOWED_HOSTS f??r lokale Docker-Entwicklung UND Production
ALLOWED_HOSTS = [
    'fecg-lahr-app.de',
    'www.fecg-lahr-app.de',
    'fecg.technik-lanz.de',
    'localhost',
    '127.0.0.1',
    '87.106.75.150',  # Server IP
    'backend',  # Docker container name
    'fecg-backend',  # Docker container name
    'nginx',    # Nginx proxy
]

# Umgebungsvariable f??r Docker ??berschreiben
if os.environ.get('ALLOWED_HOSTS'):
    ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS').split(',')

# WICHTIG: Damit Django hinter Nginx erkennt, dass die Anfrage HTTPS ist
# Verhindert Infinite-Redirects und CSRF-Fehler
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# Cookies nur ??ber HTTPS senden (nur in Production!)
# F??r lokale Entwicklung auf False setzen
SESSION_COOKIE_SECURE = False if DEBUG else True
CSRF_COOKIE_SECURE = False if DEBUG else True

# --- APPS ---
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework.authtoken',
    'members',
    'kalender',
    'corsheaders',
]

# --- MIDDLEWARE ---
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'Backend.middleware.DisableCSRFForAPIMiddleware',  # VOR CsrfViewMiddleware!
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'Backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],  # Custom Templates
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'Backend.wsgi.application'

# --- DATABASE ---
# Automatische Unterst??tzung f??r DATABASE_URL Umgebungsvariable
database_url = os.environ.get('DATABASE_URL')

if database_url:
    # Docker oder Production mit PostgreSQL
    DATABASES = {
        'default': dj_database_url.config(
            default=database_url,
            conn_max_age=600,
            conn_health_checks=True,
        )
    }
else:
    # Lokale Entwicklung mit SQLite
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# --- PASSWORDS ---
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# --- INTERNATIONALIZATION ---
LANGUAGE_CODE = 'de-de'
TIME_ZONE = 'Europe/Berlin'
USE_I18N = True
USE_L10N = True
USE_TZ = True

# Deutsche Datumsformate
DATE_INPUT_FORMATS = ['%d.%m.%Y', '%d-%m-%Y', '%d/%m/%Y', '%Y-%m-%d']
DATE_FORMAT = 'd.m.Y'
SHORT_DATE_FORMAT = 'd.m.y'
DATETIME_FORMAT = 'd.m.Y H:i'
USE_THOUSAND_SEPARATOR = True
THOUSAND_SEPARATOR = '.'
DECIMAL_SEPARATOR = ','

# --- STATIC & MEDIA ---
STATIC_URL = 'static/'
STATIC_ROOT = '/var/www/AufnahmeGruppenFECG/Backend/static'
# Whitenoise f??r effizientes Static File Serving
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

MEDIA_URL = '/media/'
MEDIA_ROOT = '/var/www/AufnahmeGruppenFECG/Backend/media'

# --- BACKUPS ---
BACKUP_DIR = BASE_DIR / 'backups'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# --- CORS & CSRF ---
# Da React auf derselben Domain l??uft wie Django, brauchen wir theoretisch kein CORS.
# Wir setzen die Trusted Origins f??r den CSRF-Check.
CSRF_TRUSTED_ORIGINS = [
    'https://fecg.technik-lanz.de',
    'https://fecg-lahr-app.de',
    'https://www.fecg-lahr-app.de',
    'http://localhost:5173',
]

# Wir erlauben JS den Zugriff auf den CSRF Token (f??r Axios/Fetch)
CSRF_COOKIE_HTTPONLY = False 

# --- REST FRAMEWORK ---R Produktions-Domain erlauben)
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
    ],
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '5/minute',  # Max 5 Login-Versuche pro Minute
        'user': '100/hour'
    },
    'UNICODE_JSON': True,
    'STRICT_JSON': False,
}

# --- LOGGING ---mework.parsers.JSONParser',-
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        '': {
            'handlers': ['console'],
            'level': 'INFO',
        },
    },
}

# Custom Locale
LOCALE_PATHS = [BASE_DIR / 'Backend' / 'locale']

# KRITISCH: CORS f??r Development UND Production
CORS_ALLOWED_ORIGINS = [
    'https://fecg-lahr-app.de',
    'https://www.fecg-lahr-app.de',
    'http://localhost:5173',      # Vite Dev Server
    'http://127.0.0.1:5173',      # Vite Dev Server
    'http://localhost',           # Docker Reverse Proxy
    'http://127.0.0.1',          # Docker Reverse Proxy
    'http://frontend:5173',       # Docker Container
    'http://nginx',               # Docker Nginx
]

# Umgebungsvariable f??r Docker ??berschreiben
if os.environ.get('CORS_ALLOWED_ORIGINS'):
    CORS_ALLOWED_ORIGINS = os.environ.get('CORS_ALLOWED_ORIGINS').split(',')

# WICHTIG: Diese Zeile AUSKOMMENTIEREN oder L??SCHEN!
# CORS_ALLOW_ALL_ORIGINS = True  # ??? GEF??HRLICH in Produktion!

CORS_ALLOW_CREDENTIALS = True

# Security-Header
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# HSTS nur in Production
if not DEBUG:
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True

SECURE_SSL_REDIRECT = False  # Nginx macht das

# Session-Security
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax' if DEBUG else 'Strict'
CSRF_COOKIE_HTTPONLY = True

# settings.py

# 1. Django mitteilen, dass es hinter einem Proxy liegt
# Wenn der Header 'HTTP_X_FORWARDED_PROTO' auf 'https' steht, ist die Verbindung sicher.
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# 2. Sicherheits-Cookies aktivieren (Da wir jetzt sicher HTTPS nutzen)
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# 3. Vertrauensw??rdige Urspr??nge f??r Formulare (CSRF-Fix)
# Hier MUSS das 'https://' davor stehen (seit Django 4.0)
CSRF_TRUSTED_ORIGINS = [
    'https://fecg-lahr-app.de',
    'https://www.fecg-lahr-app.de',
]
