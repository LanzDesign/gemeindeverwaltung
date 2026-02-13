# WICHTIG: Wir nutzen das VOLLE Image (ohne "-slim")
# Das hat alle Mime-Types und CSS-Bibliotheken vorinstalliert.
FROM python:3.11

WORKDIR /app

# Requirements installieren
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# pg_dump für SQL-Backups
RUN apt-get update \
	&& apt-get install -y --no-install-recommends postgresql-client \
	&& rm -rf /var/lib/apt/lists/*

# Code kopieren
COPY . .

# Port
EXPOSE 8000

# Startbefehl
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
