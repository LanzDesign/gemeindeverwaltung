import React from "react";
import { Container, Paper, Typography, Box } from "@mui/material";

function PrivacyPolicy() {
  return (
    <Container
      maxWidth="md"
      sx={{ my: { xs: 2, sm: 4 }, px: { xs: 2, sm: 3 } }}
    >
      <Paper sx={{ p: { xs: 2, sm: 4 } }}>
        <Typography
          variant="h3"
          gutterBottom
          sx={{ fontSize: { xs: "1.875rem", sm: "3rem" } }}
        >
          Datenschutzerklärung
        </Typography>

        <Box sx={{ mt: 3 }}>
          <Typography variant="h5" gutterBottom>
            1. Allgemeines
          </Typography>
          <Typography paragraph>
            Diese Datenschutzerklärung informiert Sie über die Verarbeitung
            Ihrer personenbezogenen Daten gemäß der Datenschutz-Grundverordnung
            (DSGVO).
          </Typography>

          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            2. Erhobene Daten
          </Typography>
          <Typography paragraph>
            Wir erheben und verarbeiten folgende personenbezogene Daten:
          </Typography>
          <ul>
            <li>Name und Vorname</li>
            <li>Geburtsdatum</li>
            <li>Adresse</li>
            <li>E-Mail-Adresse</li>
            <li>Telefonnummer</li>
            <li>Foto (optional)</li>
            <li>Unterschrift</li>
          </ul>

          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            3. Zweck der Datenverarbeitung
          </Typography>
          <Typography paragraph>
            Die Daten werden ausschließlich für folgende Zwecke verarbeitet:
          </Typography>
          <ul>
            <li>Verwaltung der Gemeindemitglieder</li>
            <li>Kommunikation über Veranstaltungen und Dienste</li>
            <li>Organisation von Diensten und Gruppen</li>
          </ul>

          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            4. Ihre Rechte
          </Typography>
          <Typography paragraph>Sie haben folgende Rechte:</Typography>
          <ul>
            <li>Recht auf Auskunft über Ihre gespeicherten Daten</li>
            <li>Recht auf Berichtigung unrichtiger Daten</li>
            <li>Recht auf Löschung Ihrer Daten</li>
            <li>Recht auf Einschränkung der Verarbeitung</li>
            <li>Recht auf Widerruf der Einwilligung</li>
          </ul>

          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            5. Kontakt
          </Typography>
          <Typography paragraph>
            Bei Fragen zur Verarbeitung Ihrer Daten wenden Sie sich bitte an die
            Gemeindeleitung.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}

export default PrivacyPolicy;
