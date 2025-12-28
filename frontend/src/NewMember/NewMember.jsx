// frontend/src/NewMember/NewMember.jsx
import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import axiosInstance from "../api/axios";
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Grid,
  Autocomplete,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
} from "@mui/material";
import PrivacyConsentForm from "../components/PrivacyConsentForm";

// NEU: globales CSS für das App-Design
import "./NewMember.css";

const STATUS_OPTIONS = [
  { value: "active", label: "Aktiv" },
  { value: "passive", label: "Passiv" },
  { value: "minor", label: "Minderjährig" },
  { value: "guest", label: "Gast" },
];

// --- NEU: Hilfskomponente für das Dienste-Autocomplete ---
// Dies kapselt die komplexe Logik des Autocomplete-Widgets.
function ServiceAutocomplete({ control, name, label, options, loading }) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, value } }) => (
        <Autocomplete
          multiple
          options={options}
          getOptionLabel={(option) => option.name}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          value={value}
          onChange={(_, newValue) => onChange(newValue)}
          loading={loading}
          renderInput={(params) => (
            <TextField
              fullWidth
              {...params}
              label={label}
              placeholder="Dienste auswählen..."
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <React.Fragment>
                    {loading ? (
                      <CircularProgress color="inherit" size={20} />
                    ) : null}
                    {params.InputProps.endAdornment}
                  </React.Fragment>
                ),
              }}
            />
          )}
        />
      )}
    />
  );
}

function NewMember() {
  const [activeStep, setActiveStep] = useState(0);
  const [memberData, setMemberData] = useState(null);
  // const [privacyConsents, setPrivacyConsents] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      status: "active",
      is_member: false,
      is_donor: false,
      is_youth: false,
      is_child: false,
      current_services: [],
      desired_services: [],
    },
  });

  const [status, setStatus] = useState(null);
  const [availableServices, setAvailableServices] = useState([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);

  // --- NEU: Dienste vom Backend laden, wenn die App startet ---
  useEffect(() => {
    const fetchServices = async () => {
      setIsLoadingServices(true);
      try {
        // Wir rufen den Endpunkt auf, den wir im Backend erstellt haben
        const response = await axiosInstance.get("/services/");
        setAvailableServices(response.data);
      } catch (error) {
        console.error("Fehler beim Laden der Dienste:", error);
        // Hier könnte man eine Fehlermeldung anzeigen
      } finally {
        setIsLoadingServices(false);
      }
    };

    fetchServices();
  }, []); // Leeres Array bedeutet: Nur einmal beim ersten Rendern ausführen

  const onSubmit = async (data) => {
    console.log("Rohdaten vom Formular:", data);
    setStatus(null);

    const cleanData = { ...data };
    if (cleanData.date_of_birth === "") cleanData.date_of_birth = null;
    if (cleanData.married_since === "") cleanData.married_since = null;

    cleanData.current_services_ids = data.current_services.map(
      (service) => service.id
    );
    cleanData.desired_services_ids = data.desired_services.map(
      (service) => service.id
    );
    delete cleanData.current_services;
    delete cleanData.desired_services;

    // Schritt 1: Daten speichern und zu Schritt 2 wechseln
    // Falls Foto vorhanden, anhängen (wird in Schritt 2 als FormData gesendet)
    setMemberData({ ...cleanData, photo: photoFile || null });
    setActiveStep(1);
  };

  const handlePrivacyComplete = async (formData /*, consents*/) => {
    try {
      // FormData wird direkt vom PrivacyConsentForm übergeben und enthält bereits alle Daten
      const response = await axiosInstance.post("/members/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      console.log("Erfolg!", response.data);
      setStatus("success");
      setActiveStep(0);
      setMemberData(null);
      // reset consent-related state if introduced later
      reset({
        status: "active",
        is_member: false,
        is_donor: false,
        current_services: [],
        desired_services: [],
      });
    } catch (error) {
      console.error("Fehler beim Senden:", error);
      setStatus("error");
    }
  };

  const steps = ["Persönliche Daten", "Datenschutzerklärung"];

  // Zeige Datenschutzformular wenn Schritt 2
  if (activeStep === 1 && memberData) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          <PrivacyConsentForm
            memberData={memberData}
            onComplete={handlePrivacyComplete}
          />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" className="app-root">
      <Box sx={{ my: 4 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box
          className="form-box"
          sx={{
            p: 3,
            boxShadow: 3,
            borderRadius: 2,
            bgcolor: "background.paper",
          }}
        >
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Neues Mitglied aufnehmen
          </Typography>

          {status === "success" && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Mitglied erfolgreich angelegt!
            </Alert>
          )}
          {status === "error" && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Fehler beim Anlegen. Bitte prüfe die Eingaben oder ob der Server
              läuft.
            </Alert>
          )}

          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="member-form"
          >
            <Grid container spacing={3} direction="column">
              {/* === Persönliche Daten === */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mt: 1 }}>
                  Persönliche Daten
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Vorname"
                  {...register("first_name", {
                    required: "Vorname ist Pflicht",
                  })}
                  error={!!errors.first_name}
                  helperText={errors.first_name?.message}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Nachname"
                  {...register("last_name", {
                    required: "Nachname ist Pflicht",
                  })}
                  error={!!errors.last_name}
                  helperText={errors.last_name?.message}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Geburtsdatum"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  {...register("date_of_birth")}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Verheiratet seit"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  {...register("married_since")}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Heiratsort"
                  {...register("marriage_location")}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Beruf"
                  {...register("profession")}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nationalität"
                  {...register("nationality")}
                />
              </Grid>

              {/* === Kontaktdaten === */}
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Typography variant="h6">Kontaktdaten</Typography>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="E-Mail"
                  type="email"
                  {...register("email", {
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Ungültige E-Mail-Adresse",
                    },
                  })}
                  error={!!errors.email}
                  helperText={errors.email?.message}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Telefon"
                  {...register("phone", { required: "Telefon ist Pflicht" })}
                  error={!!errors.phone}
                  helperText={errors.phone?.message}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Straße"
                  {...register("street", { required: "Straße ist Pflicht" })}
                  error={!!errors.street}
                  helperText={errors.street?.message}
                />
              </Grid>

              <Grid item xs={12}>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <TextField
                      required
                      fullWidth
                      label="PLZ"
                      {...register("postal_code", {
                        required: "PLZ ist Pflicht",
                      })}
                      error={!!errors.postal_code}
                      helperText={errors.postal_code?.message}
                    />
                  </Grid>
                  <Grid item xs={8}>
                    <TextField
                      required
                      fullWidth
                      label="Ort"
                      {...register("city", { required: "Ort ist Pflicht" })}
                      error={!!errors.city}
                      helperText={errors.city?.message}
                    />
                  </Grid>
                </Grid>
              </Grid>

              {/* === Gemeindedaten === */}
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Typography variant="h6">Gemeindedaten</Typography>
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      fullWidth
                      label="Status"
                      error={!!errors.status}
                      helperText={errors.status?.message}
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>

              <Grid item xs={12} sx={{ display: "flex", alignItems: "center" }}>
                <FormControlLabel
                  control={
                    <Controller
                      name="is_member"
                      control={control}
                      render={({ field: { onChange, value } }) => (
                        <Checkbox checked={value} onChange={onChange} />
                      )}
                    />
                  }
                  label="Ist Mitglied?"
                />
              </Grid>

              <Grid item xs={12} sx={{ display: "flex", alignItems: "center" }}>
                <FormControlLabel
                  control={
                    <Controller
                      name="is_donor"
                      control={control}
                      render={({ field: { onChange, value } }) => (
                        <Checkbox checked={value} onChange={onChange} />
                      )}
                    />
                  }
                  label="Ist Spender?"
                />
              </Grid>

              <Grid item xs={12} sx={{ display: "flex", alignItems: "center" }}>
                <FormControlLabel
                  control={
                    <Controller
                      name="is_youth"
                      control={control}
                      render={({ field: { onChange, value } }) => (
                        <Checkbox checked={value} onChange={onChange} />
                      )}
                    />
                  }
                  label="Jugendmitglied (Ja/Nein)"
                />
              </Grid>

              <Grid item xs={12} sx={{ display: "flex", alignItems: "center" }}>
                <FormControlLabel
                  control={
                    <Controller
                      name="is_child"
                      control={control}
                      render={({ field: { onChange, value } }) => (
                        <Checkbox checked={value} onChange={onChange} />
                      )}
                    />
                  }
                  label="Kind (Ja/Nein)"
                />
              </Grid>

              {/* === NEU: Dienst & Engagement === */}
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Typography variant="h6">Dienst & Engagement</Typography>
              </Grid>

              <Grid item xs={12}>
                {/* Hier nutzen wir unsere neue Hilfskomponente */}
                <ServiceAutocomplete
                  control={control}
                  name="current_services"
                  label="Aktuelle Dienste"
                  options={availableServices}
                  loading={isLoadingServices}
                />
              </Grid>

              <Grid item xs={12}>
                {/* Und hier nochmal für die Wunschdienste */}
                <ServiceAutocomplete
                  control={control}
                  name="desired_services"
                  label="Wunschdienste"
                  options={availableServices}
                  loading={isLoadingServices}
                />
              </Grid>

              {/* === Sonstiges === */}
              <Grid item xs={12} sx={{ mt: 3 }}>
                <Typography variant="h6">Sonstiges</Typography>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Anregungen der Gemeinde (Notizen)"
                  multiline
                  rows={4}
                  {...register("community_suggestions")}
                />
              </Grid>

              {/* Foto Upload (optional) */}
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Typography variant="h6">Foto (optional)</Typography>
              </Grid>
              <Grid item xs={12}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    // Clientseitige Resize auf max Breite 720px, 1:1 nicht erzwungen hier (nur Skalierung)
                    const resized = await resizeImage(file, 720);
                    setPhotoFile(resized.blob);
                    setPhotoPreview(resized.dataUrl);
                  }}
                />
                {photoPreview && (
                  <Box
                    sx={{
                      mt: 2,
                      width: 240,
                      height: 240,
                      borderRadius: 2,
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src={photoPreview}
                      alt="Vorschau"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </Box>
                )}
              </Grid>

              {/* === Submit Button === */}
              <Grid item xs={12}>
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  className="submit-button"
                  sx={{ mt: 2 }}
                >
                  Mitglied speichern
                </Button>
              </Grid>
            </Grid>
          </form>
        </Box>
      </Box>
    </Container>
  );
}

export default NewMember;

// Hilfsfunktion: Bild clientseitig skalieren (maxWidth), erhält Blob und DataURL zurück
async function resizeImage(file, maxWidth) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxWidth / bitmap.width);
  const targetW = Math.round(bitmap.width * scale);
  const targetH = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bitmap, 0, 0, targetW, targetH);
  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.85)
  );
  const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
  return { blob, dataUrl };
}
