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
  IconButton,
  Alert,
  Checkbox,
  Divider,
} from "@mui/material";
import { Add, Delete, CheckCircle, MyLocation } from "@mui/icons-material";
import axios from "axios";

const steps = ["Elternteil", "Familie", "Kinder (optional)", "Datenschutz"];

function PublicRegistration() {
  const [activeStep, setActiveStep] = useState(0);
  const [familyAction, setFamilyAction] = useState("create");
  const [familyCode, setFamilyCode] = useState("");
  const [familyCodeValid, setFamilyCodeValid] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [generatedFamilyCode, setGeneratedFamilyCode] = useState("");
  const [registeredMember, setRegisteredMember] = useState(null);

  // Signature canvas state
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [signatureLocation, setSignatureLocation] = useState("Lahr");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Photo state
  const photoInputRef = useRef(null);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  // Privacy consents state
  const [consents, setConsents] = useState({
    membership: false,
    whatsapp: false,
    privacyRead: false,
    dataSharing: false,
    donation: false,
    childrenData: false,
  });

  // Person (only one parent)
  const [person, setPerson] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    street: "",
    postal_code: "",
    city: "",
    date_of_birth: "",
    married_since: "",
    profession: "",
    nationality: "Deutsch",
    is_youth: false,
  });

  // Kinder
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

  const handlePersonChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPerson((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const addChild = () => {
    setChildren((prev) => [
      ...prev,
      { first_name: "", last_name: person.last_name, date_of_birth: "" },
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
    if (!familyCode.trim()) {
      setError("Bitte geben Sie einen Familien-Code ein.");
      return;
    }

    try {
      const response = await axios.get(
        `https://api.fecg-lahr-app.de/public/verify-family-code/?code=${familyCode.toUpperCase()}`
      );
      setFamilyCodeValid(response.data.valid);
      if (!response.data.valid) {
        setError("Familien-Code nicht gefunden.");
      } else {
        setError("");
      }
    } catch (err) {
      setFamilyCodeValid(false);
      setError("Fehler beim Prüfen des Familien-Codes.");
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

  // Photo upload handler
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoPreview(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearPhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
    if (photoInputRef.current) {
      photoInputRef.current.value = "";
    }
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
    if (!consents.privacyRead || !consents.dataSharing) {
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

      // Add photo if provided
      if (photo) {
        formData.append("photo", photo);
      }

      // Add privacy consents
      formData.append("privacy_whatsapp", consents.whatsapp);
      formData.append("privacy_data_protection", consents.privacyRead);
      formData.append("privacy_data_release", consents.dataSharing);
      formData.append("privacy_donation", consents.donation);
      formData.append("privacy_children", consents.childrenData);

      // Add Person data (only send non-empty values)
      Object.keys(person).forEach((key) => {
        const value = person[key];
        // Skip empty strings, null, undefined, and false (except for booleans that are intentionally false)
        if (value === null || value === undefined || value === "") {
          return; // Skip this field
        }
        formData.append(`person1_${key}`, value);
      });

      // Add family action and code
      formData.append("family_action", familyAction);
      if (familyAction === "join") {
        formData.append("family_code", familyCode.toUpperCase());
      }

      // Add children data
      formData.append("children", JSON.stringify(children));

      const response = await axios.post(
        "https://api.fecg-lahr-app.de/public/register/",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setGeneratedFamilyCode(response.data.family_code);
      setRegisteredMember(response.data.person1);
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

          {/* PDF Section */}
          {registeredMember && registeredMember.privacy_policy_pdf && (
            <Box sx={{ mt: 3, p: 2, bgcolor: "#f5f5f5", borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>
                📄 Datenschutzerklärung
              </Typography>
              <Typography variant="body2" paragraph>
                Ihre unterzeichnete Datenschutzerklärung:
              </Typography>
              <Button
                variant="contained"
                color="primary"
                href={registeredMember.privacy_policy_pdf}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ mr: 1 }}
              >
                PDF anzeigen
              </Button>
              <Button
                variant="outlined"
                color="primary"
                href={registeredMember.privacy_policy_pdf}
                download
              >
                PDF herunterladen
              </Button>
            </Box>
          )}

          {/* Family Code Section */}
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
          <Grid container spacing={3} direction="column">
            {/* Persönliche Daten Überschrift */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 1, mb: 1 }}>
                Persönliche Daten
              </Typography>
            </Grid>

            {/* Foto Upload */}
            <Grid item xs={12}>
              <Box sx={{ p: 2, bgcolor: "grey.100", borderRadius: 1 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  Foto (optional)
                </Typography>
                {photoPreview ? (
                  <Box sx={{ mb: 2, textAlign: "center" }}>
                    <img
                      src={photoPreview}
                      alt="Foto Preview"
                      style={{
                        maxWidth: "200px",
                        maxHeight: "200px",
                        borderRadius: "8px",
                        border: "1px solid #ccc",
                      }}
                    />
                    <Box
                      sx={{
                        mt: 1,
                        display: "flex",
                        gap: 1,
                        justifyContent: "center",
                      }}
                    >
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => photoInputRef.current?.click()}
                      >
                        Ändern
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={clearPhoto}
                      >
                        Löschen
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <Button
                    variant="outlined"
                    onClick={() => photoInputRef.current?.click()}
                    fullWidth
                  >
                    Foto hochladen
                  </Button>
                )}
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  style={{ display: "none" }}
                />
              </Box>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Vorname"
                name="first_name"
                value={person.first_name}
                onChange={handlePersonChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Nachname"
                name="last_name"
                value={person.last_name}
                onChange={handlePersonChange}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                type="date"
                label="Geburtsdatum"
                InputLabelProps={{ shrink: true }}
                name="date_of_birth"
                value={person.date_of_birth}
                onChange={handlePersonChange}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                type="date"
                label="Verheiratet seit"
                InputLabelProps={{ shrink: true }}
                name="married_since"
                value={person.married_since}
                onChange={handlePersonChange}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Beruf"
                name="profession"
                value={person.profession}
                onChange={handlePersonChange}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nationalität"
                name="nationality"
                value={person.nationality}
                onChange={handlePersonChange}
              />
            </Grid>

            {/* Kontaktdaten Überschrift */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                Kontaktdaten
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                type="email"
                label="E-Mail"
                name="email"
                value={person.email}
                onChange={handlePersonChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Telefon"
                name="phone"
                value={person.phone}
                onChange={handlePersonChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Straße & Hausnummer"
                name="street"
                value={person.street}
                onChange={handlePersonChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="PLZ"
                name="postal_code"
                value={person.postal_code}
                onChange={handlePersonChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Ort"
                name="city"
                value={person.city}
                onChange={handlePersonChange}
              />
            </Grid>

            {/* Gemeindedaten Überschrift */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                Gemeindedaten
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={person.is_youth}
                    name="is_youth"
                    onChange={handlePersonChange}
                  />
                }
                label="Jugendmitglied (12-18 Jahre)"
              />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3} direction="column">
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>
                Familie
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <FormControl component="fieldset" fullWidth>
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
                  <FormControlLabel
                    value="none"
                    control={<Radio />}
                    label="Ohne Familie (Einzelperson)"
                  />
                </RadioGroup>
              </FormControl>
            </Grid>

            {familyAction === "join" && (
              <Grid item xs={12}>
                <Typography variant="body2" gutterBottom>
                  Geben Sie den Familien-Code ein:
                </Typography>
                <Box>
                  <TextField
                    fullWidth
                    label="Familien-Code"
                    value={familyCode}
                    onChange={(e) =>
                      setFamilyCode(e.target.value.toUpperCase())
                    }
                    placeholder="z.B. ABCD1234"
                    sx={{ mb: 2 }}
                  />
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={verifyFamilyCode}
                  >
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
              </Grid>
            )}

            {familyAction === "create" && (
              <Grid item xs={12}>
                <Alert severity="info">
                  Sie erhalten nach der Registrierung einen Familien-Code, den
                  Sie mit Ihren Familienmitgliedern teilen können.
                </Alert>
              </Grid>
            )}

            {familyAction === "none" && (
              <Grid item xs={12}>
                <Alert severity="info">
                  Sie werden als Einzelperson ohne Familienzuordnung
                  registriert.
                </Alert>
              </Grid>
            )}
          </Grid>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Kinder hinzufügen (optional)
            </Typography>
            {children.map((child, index) => (
              <Paper key={index} sx={{ p: 2, mb: 2, bgcolor: "grey.50" }}>
                <Grid container spacing={2} direction="column">
                  <Grid item xs={12}>
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
                  <Grid item xs={12}>
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
                  <Grid item xs={12}>
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
                  <Grid item xs={12}>
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
          <Grid container spacing={3} direction="column">
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>
                Einwilligungserklärung
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Alert severity="info">
                Bitte lesen Sie die folgenden Punkte sorgfältig durch und
                stimmen Sie den erforderlichen Punkten (markiert mit *) zu.
              </Alert>
            </Grid>

            {/* Zusammenfassung der Daten */}
            <Grid item xs={12}>
              <Paper sx={{ p: 2, bgcolor: "grey.50" }}>
                <Typography variant="body2">
                  <strong>Name:</strong> {person.last_name}, {person.first_name}
                </Typography>
                <Typography variant="body2">
                  <strong>Straße:</strong> {person.street || "nicht angegeben"}
                </Typography>
                <Typography variant="body2">
                  <strong>PLZ, Ort:</strong> {person.postal_code} {person.city}
                </Typography>
                <Typography variant="body2">
                  <strong>E-Mail:</strong> {person.email || "nicht angegeben"}
                </Typography>
                <Typography variant="body2">
                  <strong>Telefon:</strong> {person.phone}
                </Typography>
                <Typography variant="body2">
                  <strong>Geburtsdatum:</strong>{" "}
                  {person.date_of_birth || "nicht angegeben"}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ mt: 2, color: "primary.main" }}
                >
                  <strong>Ort:</strong> {signatureLocation} |{" "}
                  <strong>Datum:</strong>{" "}
                  {new Date().toLocaleDateString("de-DE")}
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="body2" paragraph>
                Ich stimme der Nutzung, Speicherung und Übermittlung meiner
                Daten zu Vereinszwecken zu.
              </Typography>

              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Freie-Evangeliums-Christengemeinde Lahr
              </Typography>
              <Typography variant="body2">Hans-Inderfurth-Straße 11</Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                77933 Lahr
              </Typography>
            </Grid>

            {/* Datenschutz Checkboxes */}
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
                    <strong style={{ color: "red" }}>*</strong> Stimme zu, dass
                    ich die Datenschutzerklärung erhalten, gelesen und
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
                    <strong style={{ color: "red" }}>*</strong> Stimme zu, dass
                    meine Daten an Leiter, Kinder- und Jugendbetreuer und
                    sonstige freiwillige Mitarbeiter der FECG Lahr zur internen
                    Nutzung weitergegeben werden.
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
                      Stimme zu, dass die Daten meiner minderjährigen Kinder an
                      Leiter, Betreuer und sonstige freiwillige Mitarbeiter der
                      FECG Lahr zur internen Nutzung weitergegeben werden.
                    </Typography>
                  }
                />
              </Grid>
            )}

            {/* DSGVO Hinweise */}
            <Grid item xs={12}>
              <Alert severity="info">
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
            </Grid>

            <Grid item xs={12}>
              <Alert severity="warning">
                <Typography variant="body2">
                  <strong>Widerruf:</strong> Diese Einwilligung kann jederzeit
                  per E-Mail an fecgverwaltung@gmail.com widerrufen werden.
                </Typography>
              </Alert>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                Unterschriftsort
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Ort der Unterschrift"
                value={signatureLocation}
                onChange={(e) => setSignatureLocation(e.target.value)}
                placeholder="z.B. Lahr"
                size="small"
              />
            </Grid>

            <Grid item xs={12}>
              <Button
                fullWidth
                variant="outlined"
                size="small"
                onClick={handleGetLocation}
                disabled={isLoadingLocation}
              >
                {isLoadingLocation ? "Wird ermittelt..." : "Standort"}
              </Button>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Bitte unterschreiben Sie hier:
              </Typography>
              <Box
                sx={{
                  border: "1px solid #ccc",
                  borderRadius: 1,
                  overflow: "hidden",
                  bgcolor: hasSignature ? "#f0f0f0" : "white",
                  touchAction: "none",
                  overscrollBehavior: "contain",
                }}
              >
                <canvas
                  ref={canvasRef}
                  style={{
                    cursor: "crosshair",
                    display: "block",
                    touchAction: "none",
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
                sx={{ mt: 1 }}
              >
                Unterschrift löschen
              </Button>
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper component="form" autoComplete="off" sx={{ p: 4 }}>
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
                    (!person.first_name ||
                      !person.last_name ||
                      !person.phone ||
                      !person.street ||
                      !person.postal_code ||
                      !person.city)) ||
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
