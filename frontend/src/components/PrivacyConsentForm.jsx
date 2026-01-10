import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Grid,
  Alert,
  TextField,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import MyLocationIcon from "@mui/icons-material/MyLocation";

function PrivacyConsentForm({ memberData, onComplete }) {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [signatureLocation, setSignatureLocation] = useState(
    memberData.city || "Lahr"
  );
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const [consents, setConsents] = useState({
    membership: false,
    whatsapp: false,
    privacyRead: false,
    dataSharing: false,
    donation: false,
    childrenData: false,
  });

  // Canvas initialisieren und an Container-Breite anpassen
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const container = canvas.parentElement;

      // Canvas-Auflösung an Container anpassen
      canvas.width = container.offsetWidth;
      canvas.height = 200;

      const ctx = canvas.getContext("2d");
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    }

    // Resize-Handler für Fenstergrößen-Änderungen
    const handleResize = () => {
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const container = canvas.parentElement;
        const imageData = canvas
          .getContext("2d")
          .getImageData(0, 0, canvas.width, canvas.height);

        canvas.width = container.offsetWidth;
        canvas.height = 200;

        const ctx = canvas.getContext("2d");
        ctx.putImageData(imageData, 0, 0);
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleConsentChange = (field) => (event) => {
    setConsents({ ...consents, [field]: event.target.checked });
  };

  // Präzise Signatur mit korrekter Skalierung
  const getPoint = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    // Client-Koordinaten
    const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;

    // Präzise Umrechnung auf Canvas-Koordinaten
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    return { x, y };
  };

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const { x, y } = getPoint(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const { x, y } = getPoint(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation wird von Ihrem Browser nicht unterstützt");
      return;
    }

    setIsLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // Reverse Geocoding mit Nominatim (OpenStreetMap)
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=de`
          );
          const data = await response.json();

          // Versuche Stadt oder Ort zu extrahieren
          const city =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            "Lahr";
          setSignatureLocation(city);
        } catch (error) {
          console.error("Fehler beim Abrufen des Ortsnamens:", error);
          alert("Standort konnte nicht ermittelt werden");
        } finally {
          setIsLoadingLocation(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert("Standortzugriff wurde verweigert oder ist nicht verfügbar");
        setIsLoadingLocation(false);
      }
    );
  };

  const handleSubmit = async () => {
    if (
      !consents.membership ||
      !consents.privacyRead ||
      !consents.dataSharing
    ) {
      alert(
        "Bitte bestätigen Sie alle erforderlichen Einwilligungen (markiert mit *)"
      );
      return;
    }
    if (!hasSignature) {
      alert("Bitte unterschreiben Sie die Einwilligungserklärung");
      return;
    }

    // Unterschrift als Blob konvertieren
    const canvas = canvasRef.current;
    canvas.toBlob(async (blob) => {
      const formData = new FormData();
      formData.append("signature", blob, "signature.png");
      formData.append("signature_location", signatureLocation);

      // Datenschutz-Einwilligungen als Felder speichern
      formData.append("privacy_membership", consents.membership);
      formData.append("privacy_whatsapp", consents.whatsapp);
      formData.append("privacy_data_protection", consents.privacyRead);
      formData.append("privacy_data_release", consents.dataSharing);
      formData.append("privacy_donation", consents.donation);
      formData.append("privacy_children", consents.childrenData);

      // Mapping der Feldnamen für das Backend (person1_* Format)
      const fieldMapping = {
        first_name: "person1_first_name",
        last_name: "person1_last_name",
        gender: "person1_gender",
        email: "person1_email",
        phone: "person1_phone",
        street: "person1_street",
        postal_code: "person1_postal_code",
        city: "person1_city",
        date_of_birth: "person1_date_of_birth",
        married_since: "person1_married_since",
        profession: "person1_profession",
        nationality: "person1_nationality",
        is_youth: "person1_is_youth",
      };

      // Alle Felder hinzufügen mit korrektem Mapping
      Object.keys(memberData).forEach((key) => {
        const value = memberData[key];
        if (value === null || value === undefined) return;

        // Verwende gemappten Feldnamen, falls vorhanden
        const backendKey = fieldMapping[key] || key;

        if (key === "photo" && value instanceof Blob) {
          formData.append("photo", value, "photo.jpg");
        } else if (Array.isArray(value)) {
          // Arrays als JSON-String senden
          formData.append(backendKey, JSON.stringify(value));
        } else {
          formData.append(backendKey, value);
        }
      });

      // Consent-Daten als Metadata speichern (optional für später)
      formData.append("consent_metadata", JSON.stringify(consents));

      onComplete(formData, consents);
    });
  };

  return (
    <Container
      maxWidth="md"
      sx={{ mt: { xs: 2, sm: 4 }, mb: { xs: 2, sm: 4 }, px: { xs: 1, sm: 3 } }}
    >
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 } }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
          <Typography
            variant="h4"
            component="h1"
            sx={{ flexGrow: 1, fontSize: { xs: "1.5rem", sm: "2.125rem" } }}
          >
            Einwilligungserklärung
          </Typography>
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          Bitte lesen Sie die folgenden Punkte sorgfältig durch.
        </Alert>

        <Box sx={{ mb: 3 }}>
          <Typography variant="body1">
            <strong>Name:</strong> {memberData.last_name},{" "}
            {memberData.first_name}
          </Typography>
          <Typography variant="body1">
            <strong>Straße:</strong> {memberData.street || "nicht angegeben"}
          </Typography>
          <Typography variant="body1">
            <strong>PLZ, Ort:</strong> {memberData.postal_code}{" "}
            {memberData.city}
          </Typography>
          <Typography variant="body1">
            <strong>E-Mail:</strong> {memberData.email || "nicht angegeben"}
          </Typography>
          <Typography variant="body1">
            <strong>Telefon:</strong> {memberData.phone || "nicht angegeben"}
          </Typography>
          <Typography variant="body1">
            <strong>Geburtsdatum:</strong>{" "}
            {memberData.date_of_birth || "nicht angegeben"}
          </Typography>
          <Typography variant="body1" sx={{ mt: 2, color: "primary.main" }}>
            <strong>Ort:</strong> {memberData.city || "Lahr"} |{" "}
            <strong>Datum:</strong> {new Date().toLocaleDateString("de-DE")}
          </Typography>
        </Box>

        <Typography variant="body2" paragraph>
          Ich stimme der Nutzung, Speicherung und Übermittlung meiner Daten zu
          Vereinszwecken zu.
        </Typography>

        <Box sx={{ pl: 2, mb: 2 }}>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            Freie-Evangeliums-Christengemeinde Lahr
          </Typography>
          <Typography variant="body2">Hans-Inderfurth-Straße 11</Typography>
          <Typography variant="body2">77933 Lahr</Typography>
        </Box>

        <Grid container spacing={2} sx={{ mt: 2, mb: 3 }}>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={consents.membership}
                  onChange={handleConsentChange("membership")}
                  required
                />
              }
              label={
                <Typography variant="body2">
                  <strong style={{ color: "red" }}>*</strong> Zum Zweck meiner
                  Mitgliedschaft, Betreuung, Betreuung meiner minderjährigen
                  Kinder, Vereinsleben und Vereinsführung in der FECG Lahr
                  verarbeitet und gespeichert werden. Dabei nehme ich zur
                  Kenntnis, dass meine Daten an Leiter, Verwaltung, Kinder- und
                  Jugendbetreuer und sonstige freiwillige Mitarbeiter der FECG
                  Lahr weitergegeben werden.
                </Typography>
              }
            />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={consents.whatsapp}
                  onChange={handleConsentChange("whatsapp")}
                />
              }
              label={
                <Typography variant="body2">
                  Zu Kommunikations- und Informationszwecken der Messengerdienst
                  WhatsApp verwendet wird.
                </Typography>
              }
            />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={consents.privacyRead}
                  onChange={handleConsentChange("privacyRead")}
                  required
                />
              }
              label={
                <Typography variant="body2">
                  <strong style={{ color: "red" }}>*</strong> Stimme zu, dass
                  ich die Datenschutzerklärung erhalten, gelesen und verstanden
                  habe.
                </Typography>
              }
            />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={consents.dataSharing}
                  onChange={handleConsentChange("dataSharing")}
                  required
                />
              }
              label={
                <Typography variant="body2">
                  <strong style={{ color: "red" }}>*</strong> Stimme zu, dass
                  meine Daten an Leiter, Kinder- und Jugendbetreuer und sonstige
                  freiwillige Mitarbeiter der FECG Lahr zur internen Nutzung
                  weitergegeben werden.
                </Typography>
              }
            />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={consents.donation}
                  onChange={handleConsentChange("donation")}
                />
              }
              label={
                <Typography variant="body2">
                  Stimme zu, dass meine Daten zur Erstellung einer
                  Spendenbescheinigung gespeichert und an den Steuerberater
                  weitergegeben werden.
                </Typography>
              }
            />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={consents.childrenData}
                  onChange={handleConsentChange("childrenData")}
                />
              }
              label={
                <Typography variant="body2">
                  Stimme zu, dass die Daten meiner minderjährigen Kinder an
                  Leiter, Betreuer und sonstige freiwillige Mitarbeiter der FECG
                  Lahr zur internen Nutzung weitergegeben werden.
                </Typography>
              }
            />
          </Grid>
        </Grid>

        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
            Ihre Rechte gemäß DSGVO:
          </Typography>
          <Typography variant="body2">
            • Auskunft über Ihre gespeicherten Daten
            <br />
            • Berichtigung unrichtiger Daten
            <br />
            • Löschung Ihrer Daten
            <br />
            • Einschränkung der Verarbeitung
            <br />• Datenübertragbarkeit
          </Typography>
        </Alert>

        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Widerruf:</strong> Diese Einwilligung kann jederzeit per
            E-Mail an fecgverwaltung@gmail.com widerrufen werden.
          </Typography>
        </Alert>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Unterschriftsort
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                label="Ort der Unterschrift"
                value={signatureLocation}
                onChange={(e) => setSignatureLocation(e.target.value)}
                placeholder="z.B. Lahr"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<MyLocationIcon />}
                onClick={handleGetLocation}
                disabled={isLoadingLocation}
              >
                {isLoadingLocation ? "Lade..." : "GPS nutzen"}
              </Button>
            </Grid>
          </Grid>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h6"
            sx={{ mb: 2, fontSize: { xs: "1.1rem", sm: "1.25rem" } }}
          >
            Unterschrift <strong style={{ color: "red" }}>*</strong>
          </Typography>
          <Box
            sx={{
              border: "2px solid",
              borderColor: hasSignature ? "success.main" : "grey.400",
              borderRadius: 1,
              bgcolor: "white",
              mb: 1,
              touchAction: "none",
            }}
          >
            <canvas
              ref={canvasRef}
              style={{
                width: "100%",
                height: "200px",
                cursor: "crosshair",
                display: "block",
              }}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
          </Box>
          <Button
            variant="outlined"
            size="small"
            onClick={clearSignature}
            sx={{ mb: 2, minHeight: 44 }}
          >
            Unterschrift löschen
          </Button>
        </Box>

        <Box
          sx={{
            display: "flex",
            gap: 2,
            mt: 4,
            flexDirection: { xs: "column", sm: "row" },
          }}
        >
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
            fullWidth
            sx={{ order: { xs: 2, sm: 1 }, minHeight: 48 }}
          >
            Zurück
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            fullWidth
            sx={{ order: { xs: 1, sm: 2 }, minHeight: 48 }}
          >
            Einwilligung bestätigen
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}

export default PrivacyConsentForm;
