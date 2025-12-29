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
  const [registeredMemberId, setRegisteredMemberId] = useState(null);

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

  // Person 1 (Elternteil 1) - wird die Hauptperson sein
  const [person1, setPerson1] = useState({
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

  // Person 2 (Elternteil 2) - optional
  const [person2, setPerson2] = useState({
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

  const [showPerson2, setShowPerson2] = useState(false);

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

  const handlePerson1Change = (e) => {
    const { name, value, type, checked } = e.target;
    setPerson1((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handlePerson2Change = (e) => {
    const { name, value, type, checked } = e.target;
    setPerson2((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const addChild = () => {
    setChildren((prev) => [
      ...prev,
      { first_name: "", last_name: person1.last_name, date_of_birth: "" },
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
        `https://api.fecg-lahr-app.de/public/verify-family-code/?code=${familyCode.toUpperCase()}`
      );
      setFamilyCodeValid(response.data.valid);
    } catch {
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

      // Add privacy consents
      formData.append("privacy_whatsapp", consents.whatsapp);
      formData.append("privacy_data_protection", consents.privacyRead);
      formData.append("privacy_data_release", consents.dataSharing);
      formData.append("privacy_donation", consents.donation);
      formData.append("privacy_children", consents.childrenData);

      // Add Person 1 data (skip empty strings)
      Object.keys(person1).forEach((key) => {
        if (
          person1[key] !== null &&
          person1[key] !== undefined &&
          person1[key] !== ""
        ) {
          formData.append(`person1_${key}`, person1[key]);
        }
      });

      // Add Person 2 data only if person2 has data (skip empty strings)
      if (showPerson2) {
        Object.keys(person2).forEach((key) => {
          if (
            person2[key] !== null &&
            person2[key] !== undefined &&
            person2[key] !== ""
          ) {
            formData.append(`person2_${key}`, person2[key]);
          }
        });
      }

      // Add family action
      formData.append("family_action", showPerson2 ? "create" : familyAction);
      if (familyAction === "join") {
        formData.append("family_code", familyCode.toUpperCase());
      }

      // Add children data
      formData.append("children", JSON.stringify(children));

      const response = await axios.post(
        "https://api.fecg-lahr-app.de/api/public/register/",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setGeneratedFamilyCode(response.data.family_code);
      setRegisteredMemberId(response.data.person1?.id);
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
          {registeredMemberId && (
            <Button
              variant="outlined"
              color="primary"
              sx={{ mt: 3, mr: 2 }}
              href={`https://api.fecg-lahr-app.de/members/${registeredMemberId}/download_pdf/`}
              target="_blank"
            >
              📄 Datenschutzerklärung PDF herunterladen
            </Button>
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
                Persönliche Daten - Elternteil 1
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Vorname"
                name="first_name"
                value={person1.first_name}
                onChange={handlePerson1Change}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Nachname"
                name="last_name"
                value={person1.last_name}
                onChange={handlePerson1Change}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                type="date"
                label="Geburtsdatum"
                InputLabelProps={{ shrink: true }}
                name="date_of_birth"
                value={person1.date_of_birth}
                onChange={handlePerson1Change}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                type="date"
                label="Verheiratet seit"
                InputLabelProps={{ shrink: true }}
                name="married_since"
                value={person1.married_since}
                onChange={handlePerson1Change}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Beruf"
                name="profession"
                value={person1.profession}
                onChange={handlePerson1Change}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nationalität"
                name="nationality"
                value={person1.nationality}
                onChange={handlePerson1Change}
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
                value={person1.email}
                onChange={handlePerson1Change}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Telefon"
                name="phone"
                value={person1.phone}
                onChange={handlePerson1Change}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Straße & Hausnummer"
                name="street"
                value={person1.street}
                onChange={handlePerson1Change}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="PLZ"
                name="postal_code"
                value={person1.postal_code}
                onChange={handlePerson1Change}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Ort"
                name="city"
                value={person1.city}
                onChange={handlePerson1Change}
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
                    checked={person1.is_youth}
                    name="is_youth"
                    onChange={handlePerson1Change}
                  />
                }
                label="Jugendmitglied (12-18 Jahre)"
              />
            </Grid>

            {/* Datenschutz Section */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>
                Datenschutzerklärung & Einwilligung
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={consents.whatsapp}
                    onChange={handleConsentChange("whatsapp")}
                  />
                }
                label="Ich möchte Informationen per WhatsApp erhalten."
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
                    <strong style={{ color: "red" }}>*</strong> Ich habe die
                    Datenschutzerklärung erhalten, gelesen und verstanden.
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
                    <strong style={{ color: "red" }}>*</strong> Meine Daten
                    dürfen an Leiter, Betreuer und freiwillige Mitarbeiter
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
                label="Meine Daten dürfen für Spendenbescheinigungen verwendet werden."
              />
            </Grid>

            {/* Signature Canvas */}
            <Grid item xs={12}>
              <Typography
                variant="body2"
                sx={{ mt: 3, mb: 1, fontWeight: 600 }}
              >
                Unterschrift
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
                }}
              >
                <canvas
                  ref={canvasRef}
                  style={{
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
                sx={{ mt: 1 }}
              >
                Unterschrift löschen
              </Button>
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3} direction="column">
            {/* Checkbox für Elternteil 2 */}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={showPerson2}
                    onChange={(e) => setShowPerson2(e.target.checked)}
                  />
                }
                label="Es gibt einen zweiten Elternteil"
              />
            </Grid>

            {showPerson2 && (
              <>
                {/* Persönliche Daten Überschrift */}
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                    Persönliche Daten - Elternteil 2
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    required
                    label="Vorname"
                    name="first_name"
                    value={person2.first_name}
                    onChange={handlePerson2Change}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    required
                    label="Nachname"
                    name="last_name"
                    value={person2.last_name}
                    onChange={handlePerson2Change}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Geburtsdatum"
                    InputLabelProps={{ shrink: true }}
                    name="date_of_birth"
                    value={person2.date_of_birth}
                    onChange={handlePerson2Change}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Verheiratet seit"
                    InputLabelProps={{ shrink: true }}
                    name="married_since"
                    value={person2.married_since}
                    onChange={handlePerson2Change}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Beruf"
                    name="profession"
                    value={person2.profession}
                    onChange={handlePerson2Change}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Nationalität"
                    name="nationality"
                    value={person2.nationality}
                    onChange={handlePerson2Change}
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
                    value={person2.email}
                    onChange={handlePerson2Change}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Telefon"
                    name="phone"
                    value={person2.phone}
                    onChange={handlePerson2Change}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Straße & Hausnummer"
                    name="street"
                    value={person2.street}
                    onChange={handlePerson2Change}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="PLZ"
                    name="postal_code"
                    value={person2.postal_code}
                    onChange={handlePerson2Change}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Ort"
                    name="city"
                    value={person2.city}
                    onChange={handlePerson2Change}
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
                        checked={person2.is_youth}
                        name="is_youth"
                        onChange={handlePerson2Change}
                      />
                    }
                    label="Jugendmitglied (12-18 Jahre)"
                  />
                </Grid>

                {/* Datenschutz Section für Person2 */}
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>
                    Datenschutzerklärung & Einwilligung
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={consents.whatsapp}
                        onChange={handleConsentChange("whatsapp")}
                      />
                    }
                    label="Ich möchte Informationen per WhatsApp erhalten."
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
                        <strong style={{ color: "red" }}>*</strong> Ich habe die
                        Datenschutzerklärung erhalten, gelesen und verstanden.
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
                        <strong style={{ color: "red" }}>*</strong> Meine Daten
                        dürfen an Leiter, Betreuer und freiwillige Mitarbeiter
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
                    label="Meine Daten dürfen für Spendenbescheinigungen verwendet werden."
                  />
                </Grid>

                {/* Signature Canvas */}
                <Grid item xs={12}>
                  <Typography
                    variant="body2"
                    sx={{ mt: 3, mb: 1, fontWeight: 600 }}
                  >
                    Unterschrift
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
                    }}
                  >
                    <canvas
                      ref={canvasRef}
                      style={{
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
                    sx={{ mt: 1 }}
                  >
                    Unterschrift löschen
                  </Button>
                </Grid>
              </>
            )}

            {!showPerson2 && (
              <>
                {/* Familie Optionen */}
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
                      Geben Sie den Familien-Code ein, den Sie von Ihrem
                      Familienmitglied erhalten haben:
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
                      Sie erhalten nach der Registrierung einen Familien-Code,
                      den Sie mit Ihren Familienmitgliedern teilen können.
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
              </>
            )}

            {showPerson2 && (
              <Grid item xs={12}>
                <Alert severity="success">
                  Mit zwei Elternteilen wird automatisch eine Familie erstellt.
                  Sie erhalten einen Familien-Code für weitere
                  Familienmitglieder.
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
                <strong>Name:</strong> {person1.last_name}, {person1.first_name}
              </Typography>
              <Typography variant="body2">
                <strong>Straße:</strong> {person1.street || "nicht angegeben"}
              </Typography>
              <Typography variant="body2">
                <strong>PLZ, Ort:</strong> {person1.postal_code} {person1.city}
              </Typography>
              <Typography variant="body2">
                <strong>E-Mail:</strong> {person1.email}
              </Typography>
              <Typography variant="body2">
                <strong>Telefon:</strong> {person1.phone}
              </Typography>
              <Typography variant="body2">
                <strong>Geburtsdatum:</strong> {person1.date_of_birth}
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
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Ort der Unterschrift"
                    value={signatureLocation}
                    onChange={(e) => setSignatureLocation(e.target.value)}
                    placeholder="z.B. Lahr"
                  />
                </Grid>
                <Grid item xs={12}>
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
                    (!person1.first_name ||
                      !person1.last_name ||
                      !person1.phone ||
                      !consents.privacyRead ||
                      !consents.dataSharing ||
                      !hasSignature)) ||
                  (activeStep === 1 &&
                    showPerson2 &&
                    (!person2.first_name ||
                      !person2.last_name ||
                      !person2.phone ||
                      !consents.privacyRead ||
                      !consents.dataSharing ||
                      !hasSignature)) ||
                  (activeStep === 1 &&
                    !showPerson2 &&
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
