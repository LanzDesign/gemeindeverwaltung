import React, { useState, useRef, useEffect } from "react";
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Stepper,
  Step,
  StepLabel,
  Grid,
  FormControlLabel,
  Radio,
  RadioGroup,
  FormControl,
  FormLabel,
  IconButton,
  Alert,
  Checkbox,
  Link,
  Divider,
} from "@mui/material";
import { Add, Delete, CheckCircle, MyLocation } from "@mui/icons-material";
import axios from "axios";

const steps = ["Ihre Daten", "Familie", "Kinder (optional)", "Datenschutz"];

function PublicRegistration() {
  const [activeStep, setActiveStep] = useState(0);
  const [familyAction, setFamilyAction] = useState("create");
  const [familyCode, setFamilyCode] = useState("");
  const [familyCodeValid, setFamilyCodeValid] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [generatedFamilyCode, setGeneratedFamilyCode] = useState("");

  // Signature canvas state
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [signatureLocation, setSignatureLocation] = useState("Lahr");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Privacy consents state
  const [consents, setConsents] = useState({
    membership: false,
    whatsapp: false,
    privacyRead: false,
    dataSharing: false,
    donation: false,
    childrenData: false,
  });

  const [memberData, setMemberData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    street: "",
    postal_code: "",
    city: "",
    date_of_birth: "",
    profession: "",
    nationality: "Deutsch",
  });

  const [children, setChildren] = useState([]);

  // Initialize canvas on mount
  useEffect(() => {
    if (canvasRef.current && activeStep === 3) {
      const canvas = canvasRef.current;
      const container = canvas.parentElement;

      canvas.width = container.offsetWidth;
      canvas.height = 200;

      const ctx = canvas.getContext("2d");
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    }
  }, [activeStep]);

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleMemberChange = (field, value) => {
    setMemberData((prev) => ({ ...prev, [field]: value }));
  };

  const addChild = () => {
    setChildren((prev) => [
      ...prev,
      { first_name: "", last_name: memberData.last_name, date_of_birth: "" },
    ]);
  };

  const removeChild = (index) => {
    setChildren((prev) => prev.filter((_, i) => i !== index));
  };

  const handleChildChange = (index, field, value) => {
    setChildren((prev) =>
      prev.map((child, i) =>
        i === index ? { ...child, [field]: value } : child
      )
    );
  };

  const verifyFamilyCode = async () => {
    if (!familyCode.trim()) return;

    try {
      const response = await axios.get(
        `https://api.fecg-lahr-app.de/members/public/verify-family-code/?code=${familyCode.toUpperCase()}`
      );
      setFamilyCodeValid(response.data.valid);
    } catch (err) {
      setFamilyCodeValid(false);
    }
  };

  // Signature drawing functions
  const getPoint = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    return { x, y };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    setIsDrawing(true);
    const { x, y } = getPoint(e);
    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();

    const { x, y } = getPoint(e);
    const ctx = canvasRef.current.getContext("2d");
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = (e) => {
    e.preventDefault();
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
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await response.json();
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

  const handleConsentChange = (field) => (event) => {
    setConsents({ ...consents, [field]: event.target.checked });
  };

  const handleSubmit = async () => {
    // Validate required consents
    if (
      !consents.membership ||
      !consents.privacyRead ||
      !consents.dataSharing
    ) {
      setError(
        "Bitte bestätigen Sie alle erforderlichen Einwilligungen (markiert mit *)"
      );
      return;
    }

    if (!hasSignature) {
      setError("Bitte unterschreiben Sie die Einwilligungserklärung");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Convert signature to blob
      const canvas = canvasRef.current;
      const signatureBlob = await new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob));
      });

      // Create FormData
      const formData = new FormData();

      // Add signature
      formData.append("signature", signatureBlob, "signature.png");
      formData.append("signature_location", signatureLocation);

      // Add privacy consents
      formData.append("privacy_membership", consents.membership);
      formData.append("privacy_whatsapp", consents.whatsapp);
      formData.append("privacy_data_protection", consents.privacyRead);
      formData.append("privacy_data_release", consents.dataSharing);
      formData.append("privacy_donation", consents.donation);
      formData.append("privacy_children", consents.childrenData);

      // Add member data
      Object.keys(memberData).forEach((key) => {
        if (memberData[key] !== null && memberData[key] !== undefined) {
          formData.append(key, memberData[key]);
        }
      });

      // Add family data
      formData.append("family_action", familyAction);
      if (familyAction === "join") {
        formData.append("family_code", familyCode.toUpperCase());
      }

      // Add children data
      formData.append("children", JSON.stringify(children));

      const response = await axios.post(
        "https://api.fecg-lahr-app.de/members/public/register/",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setGeneratedFamilyCode(response.data.family_code);
      setSuccess(true);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut."
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Container maxWidth="md" sx={{ mt: 8, mb: 4 }}>
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <CheckCircle sx={{ fontSize: 80, color: "success.main", mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            Registrierung erfolgreich!
          </Typography>
          <Typography variant="body1" paragraph>
            Vielen Dank für Ihre Registrierung. Ein Administrator wird Ihre
            Daten überprüfen.
          </Typography>
          {generatedFamilyCode && (
            <Box
              sx={{ mt: 3, p: 2, bgcolor: "primary.light", borderRadius: 2 }}
            >
              <Typography variant="h6" color="primary.contrastText">
                Ihr Familien-Code
              </Typography>
              <Typography
                variant="h4"
                color="primary.contrastText"
                sx={{ fontWeight: 700, my: 1 }}
              >
                {generatedFamilyCode}
              </Typography>
              <Typography variant="body2" color="primary.contrastText">
                Teilen Sie diesen Code mit Ihren Familienmitgliedern, damit
                diese sich ebenfalls registrieren können.
              </Typography>
            </Box>
          )}
          <Button
            variant="contained"
            sx={{ mt: 3 }}
            onClick={() => window.location.reload()}
          >
            Weitere Person registrieren
          </Button>
        </Paper>
      </Container>
    );
  }

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Vorname"
                value={memberData.first_name}
                onChange={(e) =>
                  handleMemberChange("first_name", e.target.value)
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Nachname"
                value={memberData.last_name}
                onChange={(e) =>
                  handleMemberChange("last_name", e.target.value)
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                type="email"
                label="E-Mail"
                value={memberData.email}
                onChange={(e) => handleMemberChange("email", e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Telefon"
                value={memberData.phone}
                onChange={(e) => handleMemberChange("phone", e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Straße & Hausnummer"
                value={memberData.street}
                onChange={(e) => handleMemberChange("street", e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="PLZ"
                value={memberData.postal_code}
                onChange={(e) =>
                  handleMemberChange("postal_code", e.target.value)
                }
              />
            </Grid>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="Ort"
                value={memberData.city}
                onChange={(e) => handleMemberChange("city", e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="Geburtsdatum"
                InputLabelProps={{ shrink: true }}
                value={memberData.date_of_birth}
                onChange={(e) =>
                  handleMemberChange("date_of_birth", e.target.value)
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Beruf"
                value={memberData.profession}
                onChange={(e) =>
                  handleMemberChange("profession", e.target.value)
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nationalität"
                value={memberData.nationality}
                onChange={(e) =>
                  handleMemberChange("nationality", e.target.value)
                }
              />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Box>
            <FormControl component="fieldset">
              <FormLabel component="legend">Familie</FormLabel>
              <RadioGroup
                value={familyAction}
                onChange={(e) => setFamilyAction(e.target.value)}
              >
                <FormControlLabel
                  value="create"
                  control={<Radio />}
                  label="Neue Familie erstellen"
                />
                <FormControlLabel
                  value="join"
                  control={<Radio />}
                  label="Bestehender Familie beitreten"
                />
              </RadioGroup>
            </FormControl>

            {familyAction === "join" && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="body2" gutterBottom>
                  Geben Sie den Familien-Code ein, den Sie von Ihrem
                  Familienmitglied erhalten haben:
                </Typography>
                <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
                  <TextField
                    fullWidth
                    label="Familien-Code"
                    value={familyCode}
                    onChange={(e) =>
                      setFamilyCode(e.target.value.toUpperCase())
                    }
                    placeholder="z.B. ABCD1234"
                  />
                  <Button variant="outlined" onClick={verifyFamilyCode}>
                    Prüfen
                  </Button>
                </Box>
                {familyCodeValid === true && (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    ✓ Familien-Code gültig!
                  </Alert>
                )}
                {familyCodeValid === false && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    ✗ Familien-Code nicht gefunden.
                  </Alert>
                )}
              </Box>
            )}

            {familyAction === "create" && (
              <Alert severity="info" sx={{ mt: 3 }}>
                Sie erhalten nach der Registrierung einen Familien-Code, den Sie
                mit Ihren Familienmitgliedern teilen können.
              </Alert>
            )}
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Kinder hinzufügen (optional)
            </Typography>
            {children.map((child, index) => (
              <Paper key={index} sx={{ p: 2, mb: 2, bgcolor: "grey.50" }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Vorname"
                      value={child.first_name}
                      onChange={(e) =>
                        handleChildChange(index, "first_name", e.target.value)
                      }
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Nachname"
                      value={child.last_name}
                      onChange={(e) =>
                        handleChildChange(index, "last_name", e.target.value)
                      }
                    />
                  </Grid>
                  <Grid item xs={10} md={3}>
                    <TextField
                      fullWidth
                      size="small"
                      type="date"
                      label="Geburtsdatum"
                      InputLabelProps={{ shrink: true }}
                      value={child.date_of_birth}
                      onChange={(e) =>
                        handleChildChange(
                          index,
                          "date_of_birth",
                          e.target.value
                        )
                      }
                    />
                  </Grid>
                  <Grid item xs={2} md={1}>
                    <IconButton
                      color="error"
                      onClick={() => removeChild(index)}
                    >
                      <Delete />
                    </IconButton>
                  </Grid>
                </Grid>
              </Paper>
            ))}
            <Button startIcon={<Add />} onClick={addChild} variant="outlined">
              Kind hinzufügen
            </Button>
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Einwilligungserklärung
            </Typography>

            <Alert severity="info" sx={{ mb: 3 }}>
              Bitte lesen Sie die folgenden Punkte sorgfältig durch und stimmen
              Sie den erforderlichen Punkten (markiert mit *) zu.
            </Alert>

            <Box sx={{ mb: 3, p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
              <Typography variant="body2">
                <strong>Name:</strong> {memberData.last_name},{" "}
                {memberData.first_name}
              </Typography>
              <Typography variant="body2">
                <strong>Straße:</strong>{" "}
                {memberData.street || "nicht angegeben"}
              </Typography>
              <Typography variant="body2">
                <strong>PLZ, Ort:</strong> {memberData.postal_code}{" "}
                {memberData.city}
              </Typography>
              <Typography variant="body2">
                <strong>E-Mail:</strong> {memberData.email}
              </Typography>
              <Typography variant="body2">
                <strong>Telefon:</strong> {memberData.phone}
              </Typography>
              <Typography variant="body2">
                <strong>Geburtsdatum:</strong> {memberData.date_of_birth}
              </Typography>
              <Typography variant="body2" sx={{ mt: 2, color: "primary.main" }}>
                <strong>Ort:</strong> {signatureLocation} |{" "}
                <strong>Datum:</strong> {new Date().toLocaleDateString("de-DE")}
              </Typography>
            </Box>

            <Typography variant="body2" paragraph>
              Ich stimme der Nutzung, Speicherung und Übermittlung meiner Daten
              zu Vereinszwecken zu.
            </Typography>

            <Box sx={{ pl: 2, mb: 3 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Freie-Evangeliums-Christengemeinde Lahr
              </Typography>
              <Typography variant="body2">Hans-Inderfurth-Straße 11</Typography>
              <Typography variant="body2">77933 Lahr</Typography>
            </Box>

            <Grid container spacing={2} sx={{ mb: 3 }}>
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
                      <strong style={{ color: "red" }}>*</strong> Zum Zweck
                      meiner Mitgliedschaft, Betreuung, Betreuung meiner
                      minderjährigen Kinder, Vereinsleben und Vereinsführung in
                      der FECG Lahr verarbeitet und gespeichert werden. Dabei
                      nehme ich zur Kenntnis, dass meine Daten an Leiter,
                      Verwaltung, Kinder- und Jugendbetreuer und sonstige
                      freiwillige Mitarbeiter der FECG Lahr weitergegeben
                      werden.
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
                      Zu Kommunikations- und Informationszwecken der
                      Messengerdienst WhatsApp verwendet wird.
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
                      <strong style={{ color: "red" }}>*</strong> Stimme zu,
                      dass ich die Datenschutzerklärung erhalten, gelesen und
                      verstanden habe.
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
                      <strong style={{ color: "red" }}>*</strong> Stimme zu,
                      dass meine Daten an Leiter, Kinder- und Jugendbetreuer und
                      sonstige freiwillige Mitarbeiter der FECG Lahr zur
                      internen Nutzung weitergegeben werden.
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
              {children.length > 0 && (
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
                        Stimme zu, dass die Daten meiner minderjährigen Kinder
                        an Leiter, Betreuer und sonstige freiwillige Mitarbeiter
                        der FECG Lahr zur internen Nutzung weitergegeben werden.
                      </Typography>
                    }
                  />
                </Grid>
              )}
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
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
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
                    startIcon={<MyLocation />}
                    onClick={handleGetLocation}
                    disabled={isLoadingLocation}
                  >
                    {isLoadingLocation ? "Lade..." : "GPS nutzen"}
                  </Button>
                </Grid>
              </Grid>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
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
              <Button variant="outlined" size="small" onClick={clearSignature}>
                Unterschrift löschen
              </Button>
            </Box>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
            ⛪ FECG Lahr - Registrierung
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Registrieren Sie sich und Ihre Familie für die FECG Lahr
          </Typography>
        </Box>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 4 }}>{renderStepContent(activeStep)}</Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Button disabled={activeStep === 0} onClick={handleBack}>
            Zurück
          </Button>
          <Box sx={{ display: "flex", gap: 2 }}>
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={
                  loading ||
                  !consents.membership ||
                  !consents.privacyRead ||
                  !consents.dataSharing ||
                  !hasSignature
                }
              >
                {loading ? "Wird gesendet..." : "Registrierung absenden"}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={
                  (activeStep === 0 &&
                    (!memberData.first_name ||
                      !memberData.last_name ||
                      !memberData.email ||
                      !memberData.phone)) ||
                  (activeStep === 1 &&
                    familyAction === "join" &&
                    familyCodeValid !== true)
                }
              >
                Weiter
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}

export default PublicRegistration;
