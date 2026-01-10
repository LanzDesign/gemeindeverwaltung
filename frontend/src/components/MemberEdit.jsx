import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import PhoneIcon from "@mui/icons-material/Phone";
import ChildCareIcon from "@mui/icons-material/ChildCare";
import VolunteerActivismOutlinedIcon from "@mui/icons-material/VolunteerActivismOutlined";

const STATUS_OPTIONS = [
  { value: "active", label: "Aktiv" },
  { value: "passive", label: "Passiv" },
  { value: "minor", label: "Minderjährig" },
  { value: "guest", label: "Gast" },
];

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
              {...params}
              label={label}
              placeholder="Dienste auswählen..."
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loading ? <CircularProgress size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />
      )}
    />
  );
}

function MemberEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    getValues,
    setValue,
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
  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState(null);
  const [availableServices, setAvailableServices] = useState([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [newServiceName, setNewServiceName] = useState("");
  const [serviceToDelete, setServiceToDelete] = useState(null);
  const [familyName, setFamilyName] = useState("");
  const [familyRole, setFamilyRole] = useState("");
  const [availableFamilies, setAvailableFamilies] = useState([]);
  const [isLoadingFamilies, setIsLoadingFamilies] = useState(false);
  const [selectedFamily, setSelectedFamily] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [newFeedbackCategory, setNewFeedbackCategory] = useState("");
  const [newFeedbackText, setNewFeedbackText] = useState("");
  const [openPrivacyDialog, setOpenPrivacyDialog] = useState(false);
  const [openSignatureDialog, setOpenSignatureDialog] = useState(false);
  const [isDrawingSignature, setIsDrawingSignature] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [signatureLocation, setSignatureLocation] = useState("");
  const signatureCanvasRef = useRef(null);
  const [privacyCheckboxes, setPrivacyCheckboxes] = useState({
    membership: true,
    whatsapp: true,
    dataProtection: true,
    dataRelease: true,
    donation: true,
    children: true,
  });
  const [gruppen, setGruppen] = useState([]);

  // Signature drawing helper functions
  const getPoint = (e) => {
    const canvas = signatureCanvasRef.current;
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
    setIsDrawingSignature(true);
    const { x, y } = getPoint(e);
    const ctx = signatureCanvasRef.current.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawingSignature) return;
    e.preventDefault();
    const { x, y } = getPoint(e);
    const ctx = signatureCanvasRef.current.getContext("2d");
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = (e) => {
    e.preventDefault();
    setIsDrawingSignature(false);
  };

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const openSignaturePad = () => {
    setHasSignature(false);
    setSignatureLocation(member?.signature_location || "Lahr");
    setOpenSignatureDialog(true);
  };

  useEffect(() => {
    if (openSignatureDialog && signatureCanvasRef.current) {
      const canvas = signatureCanvasRef.current;
      const container = canvas.parentElement;
      canvas.width = container.offsetWidth;
      canvas.height = 200;
      const ctx = canvas.getContext("2d");
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    }
  }, [openSignatureDialog]);

  const FEEDBACK_CATEGORIES = [
    { value: "community", label: "Wünsche von der Gemeinde" },
    { value: "groups", label: "Wünsche von den Gruppen" },
    { value: "servants", label: "Anregungen an die Diener" },
    { value: "elders", label: "Anregungen an die Ältesten" },
    { value: "pastor", label: "Anregungen an den Pastor" },
  ];

  const loadFeedbacks = React.useCallback(async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await axiosInstance.get(`/feedbacks/?member_id=${id}`, {
        headers: { Authorization: `Token ${token}` },
      });
      setFeedbacks(response.data || []);
    } catch (error) {
      console.error("Fehler beim Laden der Feedbacks:", error);
    }
  }, [id]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("adminToken");

        // Load member data
        const memberResponse = await axiosInstance.get(`/members/${id}/`, {
          headers: { Authorization: `Token ${token}` },
        });
        const member = memberResponse.data;
        setMember(member);
        setGruppen(member.gruppen || []);

        // Load available services
        setIsLoadingServices(true);
        const servicesResponse = await axiosInstance.get("/services/");
        setAvailableServices(servicesResponse.data);
        setIsLoadingServices(false);

        // Load available families (needs auth)
        try {
          setIsLoadingFamilies(true);
          const famResp = await axiosInstance.get("/families/", {
            headers: { Authorization: `Token ${token}` },
          });
          const familiesData = famResp.data || [];
          setAvailableFamilies(familiesData);

          // Bestehende Familienzuordnung des Mitglieds ermitteln
          let foundFamily = null;
          let foundRole = "";
          for (const fam of familiesData) {
            if (fam.vater === member.id) {
              foundFamily = fam;
              foundRole = "vater";
              break;
            }
            if (fam.mutter === member.id) {
              foundFamily = fam;
              foundRole = "mutter";
              break;
            }
            if (Array.isArray(fam.kinder) && fam.kinder.includes(member.id)) {
              foundFamily = fam;
              foundRole = "kind";
              break;
            }
          }
          if (foundFamily) {
            setSelectedFamily(foundFamily);
            setFamilyRole(foundRole);
            setFamilyName(foundFamily.name);
          } else {
            setSelectedFamily(null);
            setFamilyRole("");
          }
        } catch (e) {
          console.error("Familien laden fehlgeschlagen:", e);
        } finally {
          setIsLoadingFamilies(false);
        }

        // Find current and desired services as objects
        // Backend returns current_services and desired_services as objects
        const currentServices = member.current_services || [];
        const desiredServices = member.desired_services || [];

        // Set form values
        reset({
          first_name: member.first_name || "",
          last_name: member.last_name || "",
          gender: member.gender || "",
          email: member.email || "",
          phone: member.phone || "",
          street: member.street || "",
          postal_code: member.postal_code || "",
          city: member.city || "",
          date_of_birth: member.date_of_birth || "",
          married_since: member.married_since || "",
          marriage_location: member.marriage_location || "",
          profession: member.profession || "",
          nationality: member.nationality || "",
          status: member.status || "active",
          is_member: member.is_member || false,
          is_donor: member.is_donor || false,
          is_youth: member.is_youth || false,
          is_child: member.is_child || false,
          community_suggestions: member.community_suggestions || "",
          current_services: currentServices,
          desired_services: desiredServices,
          privacy_membership: member.privacy_membership || false,
          privacy_whatsapp: member.privacy_whatsapp || false,
          privacy_data_protection: member.privacy_data_protection || false,
          privacy_data_release: member.privacy_data_release || false,
          privacy_donation: member.privacy_donation || false,
          privacy_children: member.privacy_children || false,
        });

        setLoading(false);
      } catch (error) {
        console.error("Fehler beim Laden:", error);
        setStatus("error");
        setLoading(false);
      }
    };

    fetchData();
    loadFeedbacks();
  }, [id, reset, loadFeedbacks]);

  const handleAddFeedback = async () => {
    if (!newFeedbackCategory || !newFeedbackText.trim()) {
      alert("Bitte Kategorie und Text ausfüllen");
      return;
    }

    try {
      const token = localStorage.getItem("adminToken");
      await axiosInstance.post(
        "/feedbacks/",
        {
          member: parseInt(id),
          category: newFeedbackCategory,
          text: newFeedbackText,
        },
        {
          headers: { Authorization: `Token ${token}` },
        }
      );
      setNewFeedbackCategory("");
      setNewFeedbackText("");
      loadFeedbacks();
    } catch (error) {
      console.error("Fehler beim Hinzufügen des Feedbacks:", error);
      alert("Fehler beim Speichern");
    }
  };

  const handleDeleteFeedback = async (feedbackId) => {
    if (!window.confirm("Feedback wirklich löschen?")) return;

    try {
      const token = localStorage.getItem("adminToken");
      await axiosInstance.delete(`/feedbacks/${feedbackId}/`, {
        headers: { Authorization: `Token ${token}` },
      });
      loadFeedbacks();
    } catch (error) {
      console.error("Fehler beim Löschen des Feedbacks:", error);
      alert("Fehler beim Löschen");
    }
  };

  const onSubmit = async (data) => {
    setStatus(null);

    const cleanData = { ...data };
    if (cleanData.date_of_birth === "") cleanData.date_of_birth = null;
    if (cleanData.married_since === "") cleanData.married_since = null;

    cleanData.current_services_ids = data.current_services.map((s) => s.id);
    cleanData.desired_services_ids = data.desired_services.map((s) => s.id);
    delete cleanData.current_services;
    delete cleanData.desired_services;

    console.log("🔴 MemberEdit - Submitting data:");
    console.log("  Gender value:", cleanData.gender);
    console.log("  Full cleanData:", cleanData);

    try {
      const token = localStorage.getItem("adminToken");
      await axiosInstance.put(`/members/${id}/`, cleanData, {
        headers: { Authorization: `Token ${token}` },
      });
      setStatus("success");
      setTimeout(() => navigate("/admin-dashboard"), 1500);
    } catch (error) {
      console.error("Fehler beim Speichern:", error);
      console.error("Response data:", error.response?.data);
      console.error("Response status:", error.response?.status);
      alert(
        `Fehler beim Speichern: ${
          error.response?.data?.error ||
          error.response?.data?.message ||
          JSON.stringify(error.response?.data) ||
          error.message
        }`
      );
      setStatus("error");
    }
  };

  const handleAddService = async () => {
    const name = newServiceName.trim();
    if (!name) return;
    try {
      const token = localStorage.getItem("adminToken");
      const resp = await axiosInstance.post(
        "/services/",
        { name },
        token ? { headers: { Authorization: `Token ${token}` } } : {}
      );
      const created = resp.data;
      const updated = [...availableServices, created].sort((a, b) =>
        a.name.localeCompare(b.name)
      );
      setAvailableServices(updated);
      setNewServiceName("");
    } catch (e) {
      console.error("Dienst anlegen fehlgeschlagen:", e);
      alert("Dienst konnte nicht angelegt werden.");
    }
  };

  const handleDeleteService = async () => {
    if (!serviceToDelete) return;
    if (!window.confirm(`Dienst "${serviceToDelete.name}" wirklich löschen?`)) {
      return;
    }
    try {
      const token = localStorage.getItem("adminToken");
      await axiosInstance.delete(
        `/services/${serviceToDelete.id}/`,
        token ? { headers: { Authorization: `Token ${token}` } } : {}
      );
      const remaining = availableServices.filter(
        (s) => s.id !== serviceToDelete.id
      );
      setAvailableServices(remaining);

      const cs = getValues("current_services") || [];
      const ds = getValues("desired_services") || [];
      const newCs = cs.filter((s) => s.id !== serviceToDelete.id);
      const newDs = ds.filter((s) => s.id !== serviceToDelete.id);
      setValue("current_services", newCs, { shouldDirty: true });
      setValue("desired_services", newDs, { shouldDirty: true });

      setServiceToDelete(null);
      alert("Dienst gelöscht.");
    } catch (e) {
      console.error("Dienst löschen fehlgeschlagen:", e);
      alert("Dienst konnte nicht gelöscht werden.");
    }
  };

  const handleAssignFamily = async () => {
    if (!familyRole) {
      alert("Bitte Rolle angeben.");
      return;
    }
    try {
      const token = localStorage.getItem("adminToken");
      const payload = selectedFamily
        ? { family_id: selectedFamily.id, role: familyRole }
        : familyName.trim()
        ? { family_name: familyName.trim(), role: familyRole }
        : null;
      if (!payload) {
        alert("Bitte bestehende Familie auswählen oder Familienname eingeben.");
        return;
      }
      await axiosInstance.post(`/members/${id}/assign_family/`, payload, {
        headers: { Authorization: `Token ${token}` },
      });
      alert("Familie erfolgreich zugeordnet.");
      // Nach Zuordnung Familien neu laden und Auswahl aktualisieren
      try {
        setIsLoadingFamilies(true);
        const famResp = await axiosInstance.get("/families/", {
          headers: { Authorization: `Token ${token}` },
        });
        const familiesData = famResp.data || [];
        setAvailableFamilies(familiesData);
        let foundFamily = null;
        let foundRole = "";
        for (const fam of familiesData) {
          if (fam.vater === Number(id)) {
            foundFamily = fam;
            foundRole = "vater";
            break;
          }
          if (fam.mutter === Number(id)) {
            foundFamily = fam;
            foundRole = "mutter";
            break;
          }
          if (Array.isArray(fam.kinder) && fam.kinder.includes(Number(id))) {
            foundFamily = fam;
            foundRole = "kind";
            break;
          }
        }
        if (foundFamily) {
          setSelectedFamily(foundFamily);
          setFamilyRole(foundRole);
          setFamilyName(foundFamily.name);
        }
      } catch (e) {
        console.error("Familien Refresh fehlgeschlagen:", e);
      } finally {
        setIsLoadingFamilies(false);
      }
    } catch (e) {
      console.error("Familien-Zuordnung fehlgeschlagen:", e);
      alert("Familie konnte nicht zugeordnet werden.");
    }
  };

  const handleRemoveFromGroup = async (gruppeId) => {
    const gruppeToRemove = gruppen.find((g) => g.id === gruppeId);
    if (!window.confirm(`Wirklich aus "${gruppeToRemove?.name}" entfernen?`)) {
      return;
    }

    try {
      const token = localStorage.getItem("adminToken");
      await axiosInstance.post(
        `/gruppen/${gruppeId}/remove_members/`,
        { member_ids: [Number(id)] },
        {
          headers: { Authorization: `Token ${token}` },
        }
      );

      alert("Mitglied erfolgreich aus der Gruppe entfernt");

      // Force reload der Seite
      window.location.href = "/admin-dashboard";
    } catch (error) {
      console.error("Fehler beim Entfernen aus der Gruppe:", error);
      alert("Fehler beim Entfernen aus der Gruppe");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Möchten Sie dieses Mitglied wirklich löschen?")) {
      return;
    }

    try {
      const token = localStorage.getItem("adminToken");
      await axiosInstance.delete(`/members/${id}/`, {
        headers: { Authorization: `Token ${token}` },
      });
      // Force reload der Seite
      window.location.href = "/admin-dashboard";
    } catch (error) {
      console.error("Fehler beim Löschen:", error);
      alert("Fehler beim Löschen des Mitglieds");
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, textAlign: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container
      maxWidth="md"
      sx={{ mt: { xs: 2, sm: 4 }, mb: { xs: 2, sm: 4 }, px: { xs: 1, sm: 3 } }}
    >
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 } }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
          <IconButton
            onClick={() => navigate("/admin-dashboard")}
            sx={{ mr: { xs: 1, sm: 2 }, p: { xs: 1.5, sm: 1 } }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography
            variant="h4"
            component="h1"
            sx={{ flexGrow: 1, fontSize: { xs: "1.5rem", sm: "2.125rem" } }}
          >
            Mitglied bearbeiten
          </Typography>
          <IconButton
            color="error"
            onClick={handleDelete}
            sx={{ p: { xs: 1.5, sm: 1 } }}
          >
            <DeleteIcon />
          </IconButton>
        </Box>

        {status === "success" && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Änderungen erfolgreich gespeichert!
          </Alert>
        )}
        {status === "error" && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Fehler beim Speichern. Bitte versuchen Sie es erneut.
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <Grid container spacing={3} direction="column">
            {/* Foto-Anzeige und Upload */}
            <Grid item xs={12}>
              <Paper sx={{ p: 2, textAlign: "center" }}>
                <Typography
                  variant="subtitle2"
                  sx={{ mb: 2, fontWeight: "bold" }}
                >
                  Mitgliedsfoto
                </Typography>
                {member?.photo_thumb && (
                  <Box
                    component="img"
                    src={`https://fecg-lahr-app.de${member.photo_thumb}`}
                    alt={`${member.first_name} ${member.last_name}`}
                    sx={{
                      width: 240,
                      height: 240,
                      objectFit: "cover",
                      borderRadius: 2,
                      border: "2px solid",
                      borderColor: "grey.300",
                      mb: 2,
                    }}
                  />
                )}
                <Box>
                  <input
                    accept="image/*"
                    style={{ display: "none" }}
                    id="photo-upload"
                    type="file"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const formData = new FormData();
                        formData.append("photo", file);
                        try {
                          const token = localStorage.getItem("adminToken");
                          await axiosInstance.post(
                            `/members/${id}/upload_photo/`,
                            formData,
                            {
                              headers: {
                                Authorization: `Token ${token}`,
                                "Content-Type": "multipart/form-data",
                              },
                            }
                          );
                          alert("Foto erfolgreich hochgeladen!");
                          window.location.reload();
                        } catch (error) {
                          console.error("Fehler beim Hochladen:", error);
                          alert("Fehler beim Hochladen des Fotos");
                        }
                      }
                    }}
                  />
                  <label htmlFor="photo-upload">
                    <Button variant="contained" component="span" size="small">
                      Foto hochladen
                    </Button>
                  </label>
                </Box>
              </Paper>
            </Grid>

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
                {...register("first_name", { required: "Vorname ist Pflicht" })}
                error={!!errors.first_name}
                helperText={errors.first_name?.message}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Nachname"
                {...register("last_name", { required: "Nachname ist Pflicht" })}
                error={!!errors.last_name}
                helperText={errors.last_name?.message}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Geschlecht"
                {...register("gender")}
              >
                <MenuItem value="">Bitte wählen</MenuItem>
                <MenuItem value="male">Männlich</MenuItem>
                <MenuItem value="female">Weiblich</MenuItem>
              </TextField>
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
              <TextField fullWidth label="Beruf" {...register("profession")} />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nationalität"
                {...register("nationality")}
              />
            </Grid>

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
                label="Ist Jugendmitglied?"
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
                label="Ist Kind?"
              />
            </Grid>

            <Grid item xs={12} sx={{ mt: 2 }}>
              <Typography variant="h6">Dienst & Engagement</Typography>
            </Grid>

            <Grid item xs={12}>
              <ServiceAutocomplete
                control={control}
                name="current_services"
                label="Aktuelle Dienste"
                options={availableServices}
                loading={isLoadingServices}
              />
            </Grid>

            <Grid item xs={12}>
              <ServiceAutocomplete
                control={control}
                name="desired_services"
                label="Wunschdienste"
                options={availableServices}
                loading={isLoadingServices}
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <TextField
                  fullWidth
                  label="Neuen Dienst anlegen"
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                />
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleAddService}
                >
                  Hinzufügen
                </Button>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <Autocomplete
                  options={availableServices}
                  value={serviceToDelete}
                  onChange={(_, val) => setServiceToDelete(val)}
                  getOptionLabel={(option) => option?.name || ""}
                  isOptionEqualToValue={(option, value) =>
                    option.id === value.id
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Dienst auswählen zum Löschen"
                    />
                  )}
                  sx={{ flexGrow: 1 }}
                />
                <Button
                  color="error"
                  variant="outlined"
                  startIcon={<DeleteIcon />}
                  onClick={handleDeleteService}
                  disabled={!serviceToDelete}
                >
                  Dienst löschen
                </Button>
              </Box>
            </Grid>

            <Grid item xs={12} sx={{ mt: 2 }}>
              <Typography variant="h6">Familie</Typography>
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                options={availableFamilies}
                loading={isLoadingFamilies}
                value={selectedFamily}
                onChange={(_, v) => setSelectedFamily(v)}
                getOptionLabel={(option) => option?.name || ""}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Bestehende Familie auswählen"
                    placeholder="Familie suchen..."
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {isLoadingFamilies ? (
                            <CircularProgress size={20} />
                          ) : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Neuen Familiennamen (falls neu)"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                placeholder="z.B. Familie Müller"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Rolle in der Familie"
                value={familyRole}
                onChange={(e) => setFamilyRole(e.target.value)}
              >
                <MenuItem value="vater">Vater</MenuItem>
                <MenuItem value="mutter">Mutter</MenuItem>
                <MenuItem value="kind">Kind</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <Button variant="contained" onClick={handleAssignFamily}>
                Familie zuordnen
              </Button>
            </Grid>

            {/* === Gruppen === */}
            <Grid item xs={12} sx={{ mt: 3 }}>
              <Typography variant="h6">Gruppen</Typography>
            </Grid>

            {gruppen.length > 0 ? (
              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {gruppen.map((gruppe) => (
                      <Chip
                        key={gruppe.id}
                        label={gruppe.name}
                        onDelete={() => handleRemoveFromGroup(gruppe.id)}
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Paper>
              </Grid>
            ) : (
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  Dieses Mitglied ist keiner Gruppe zugeordnet.
                </Typography>
              </Grid>
            )}

            {/* === Feedbacks / Anregungen === */}
            <Grid item xs={12} sx={{ mt: 3 }}>
              <Typography variant="h6">Feedbacks / Anregungen</Typography>
            </Grid>

            {feedbacks.map((feedback, index) => (
              <Grid item xs={12} key={feedback.id}>
                <Paper sx={{ p: 2, position: "relative" }}>
                  <IconButton
                    onClick={() => handleDeleteFeedback(feedback.id)}
                    sx={{ position: "absolute", top: 8, right: 8 }}
                    size="small"
                  >
                    <DeleteIcon />
                  </IconButton>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Feedback / Anregung: #{index + 1}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    <strong>Kategorie:</strong> {feedback.category_display}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Inhalt:</strong>
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 0.5 }}>
                    {feedback.text}
                  </Typography>
                </Paper>
              </Grid>
            ))}

            <Grid item xs={12}>
              <Paper sx={{ p: 2, bgcolor: "#f5f5f5" }}>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                  Feedback / Anregung hinzufügen
                </Typography>
                <TextField
                  select
                  fullWidth
                  label="Kategorie"
                  value={newFeedbackCategory}
                  onChange={(e) => setNewFeedbackCategory(e.target.value)}
                  sx={{ mb: 2 }}
                >
                  {FEEDBACK_CATEGORIES.map((cat) => (
                    <MenuItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  fullWidth
                  label="Inhalt"
                  multiline
                  rows={4}
                  value={newFeedbackText}
                  onChange={(e) => setNewFeedbackText(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddFeedback}
                >
                  Hinzufügen
                </Button>
              </Paper>
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

            {/* Datenschutzerklärung neu generieren */}
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Paper sx={{ p: 2, bgcolor: "info.main", color: "white" }}>
                <Typography
                  variant="subtitle1"
                  sx={{ mb: 1, fontWeight: "bold" }}
                >
                  Datenschutzerklärung
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Passen Sie die Datenschutzerklärung für dieses Mitglied an.
                </Typography>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={() => {
                    // Initialisiere Dialog mit aktuellen Werten
                    if (member) {
                      setPrivacyCheckboxes({
                        membership: member.privacy_membership || false,
                        whatsapp: member.privacy_whatsapp || false,
                        dataProtection: member.privacy_data_protection || false,
                        dataRelease: member.privacy_data_release || false,
                        donation: member.privacy_donation || false,
                        children: member.privacy_children || false,
                      });
                    }
                    setOpenPrivacyDialog(true);
                  }}
                >
                  Datenschutzerklärung anpassen
                </Button>

                {/* Privacy PDF Dialog */}
                <Dialog
                  open={openPrivacyDialog}
                  onClose={() => setOpenPrivacyDialog(false)}
                  maxWidth="md"
                  fullWidth
                >
                  <DialogTitle>Datenschutzerklärung Einstellungen</DialogTitle>
                  <DialogContent>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      Wählen Sie die Punkte aus, die in der Datenschutzerklärung
                      angekreuzt werden sollen:
                    </Typography>
                    <Box
                      sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                    >
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={privacyCheckboxes.membership}
                            onChange={(e) =>
                              setPrivacyCheckboxes({
                                ...privacyCheckboxes,
                                membership: e.target.checked,
                              })
                            }
                          />
                        }
                        label="Mitgliedschaft, Betreuung und Vereinsführung"
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={privacyCheckboxes.whatsapp}
                            onChange={(e) =>
                              setPrivacyCheckboxes({
                                ...privacyCheckboxes,
                                whatsapp: e.target.checked,
                              })
                            }
                          />
                        }
                        label="WhatsApp Kommunikation"
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={privacyCheckboxes.dataProtection}
                            onChange={(e) =>
                              setPrivacyCheckboxes({
                                ...privacyCheckboxes,
                                dataProtection: e.target.checked,
                              })
                            }
                          />
                        }
                        label="Datenschutzerklärung erhalten und verstanden"
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={privacyCheckboxes.dataRelease}
                            onChange={(e) =>
                              setPrivacyCheckboxes({
                                ...privacyCheckboxes,
                                dataRelease: e.target.checked,
                              })
                            }
                          />
                        }
                        label="Datenfreigabe an Mitarbeiter"
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={privacyCheckboxes.donation}
                            onChange={(e) =>
                              setPrivacyCheckboxes({
                                ...privacyCheckboxes,
                                donation: e.target.checked,
                              })
                            }
                          />
                        }
                        label="Spendenbescheinigung"
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={privacyCheckboxes.children}
                            onChange={(e) =>
                              setPrivacyCheckboxes({
                                ...privacyCheckboxes,
                                children: e.target.checked,
                              })
                            }
                          />
                        }
                        label="Daten minderjähriger Kinder"
                      />
                    </Box>
                  </DialogContent>
                  <DialogActions>
                    <Button onClick={() => setOpenPrivacyDialog(false)}>
                      Abbrechen
                    </Button>
                    <Button
                      variant="contained"
                      color="secondary"
                      onClick={openSignaturePad}
                    >
                      Unterschrift erneuern
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={async () => {
                        try {
                          const token = localStorage.getItem("adminToken");
                          const response = await axiosInstance.post(
                            `/members/${id}/regenerate_privacy_pdf/`,
                            { privacy_settings: privacyCheckboxes },
                            { headers: { Authorization: `Token ${token}` } }
                          );
                          alert(
                            "Datenschutzerklärung wurde erfolgreich neu generiert!"
                          );

                          // Aktualisiere Member-Daten wenn vom Backend zurückgegeben
                          if (response.data.member) {
                            // Setze die privacy-Felder aus der Response
                            setValue(
                              "privacy_whatsapp",
                              response.data.member.privacy_whatsapp
                            );
                            setValue(
                              "privacy_membership",
                              response.data.member.privacy_membership
                            );
                            setValue(
                              "privacy_donation",
                              response.data.member.privacy_donation
                            );
                            setValue(
                              "privacy_children",
                              response.data.member.privacy_children
                            );
                          }

                          if (response.data.pdf_url) {
                            window.open(response.data.pdf_url, "_blank");
                          }
                          setOpenPrivacyDialog(false);

                          // Lade Member-Daten komplett neu für sofortige Anzeige-Aktualisierung
                          window.location.reload();
                        } catch (error) {
                          console.error("Fehler beim Generieren:", error);
                          alert(
                            "Fehler beim Generieren der Datenschutzerklärung"
                          );
                        }
                      }}
                    >
                      PDF generieren
                    </Button>
                  </DialogActions>
                </Dialog>

                {/* Signature Renewal Dialog */}
                <Dialog
                  open={openSignatureDialog}
                  onClose={() => setOpenSignatureDialog(false)}
                  maxWidth="md"
                  fullWidth
                  BackdropProps={{ sx: { touchAction: "none" } }}
                  PaperProps={{
                    sx: {
                      overflow: "hidden",
                      position: "fixed",
                      top: { xs: 12, sm: "auto" },
                      m: { xs: 1.5, sm: 3 },
                      width: { xs: "calc(100% - 24px)", sm: "auto" },
                      maxHeight: "90vh",
                    },
                  }}
                >
                  <DialogTitle>Unterschrift erneuern</DialogTitle>
                  <DialogContent sx={{ overflow: "hidden" }}>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      Bitte unterschreiben Sie in dem Feld unten:
                    </Typography>
                    <Box
                      sx={{
                        border: "1px solid #ccc",
                        borderRadius: 1,
                        mb: 2,
                        touchAction: "none",
                        overscrollBehavior: "contain",
                      }}
                    >
                      <canvas
                        ref={signatureCanvasRef}
                        style={{
                          display: "block",
                          width: "100%",
                          cursor: "crosshair",
                          backgroundColor: "#fff",
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
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Unterschriftsort (Ort der Unterzeichnung):
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      value={signatureLocation}
                      onChange={(e) => setSignatureLocation(e.target.value)}
                      sx={{ mb: 2 }}
                    />
                  </DialogContent>
                  <DialogActions>
                    <Button onClick={clearSignature} color="secondary">
                      Löschen
                    </Button>
                    <Button onClick={() => setOpenSignatureDialog(false)}>
                      Abbrechen
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      disabled={!hasSignature}
                      onClick={async () => {
                        try {
                          const canvas = signatureCanvasRef.current;
                          const signatureBlob = await new Promise((resolve) => {
                            canvas.toBlob((blob) => resolve(blob));
                          });

                          const formData = new FormData();
                          formData.append(
                            "signature",
                            signatureBlob,
                            "signature.png"
                          );
                          formData.append(
                            "signature_location",
                            signatureLocation
                          );

                          const token = localStorage.getItem("adminToken");
                          const response = await axiosInstance.post(
                            `/members/${id}/update_signature/`,
                            formData,
                            {
                              headers: { Authorization: `Token ${token}` },
                            }
                          );

                          alert(
                            "Unterschrift gespeichert und PDF regeneriert!"
                          );
                          setOpenSignatureDialog(false);
                          // Lade Member-Daten neu
                          window.location.reload();
                        } catch (error) {
                          console.error(
                            "Fehler beim Speichern der Unterschrift:",
                            error
                          );
                          alert(
                            "Fehler beim Speichern der Unterschrift: " +
                              (error.response?.data?.error || error.message)
                          );
                        }
                      }}
                    >
                      Speichern und PDF generieren
                    </Button>
                  </DialogActions>
                </Dialog>
              </Paper>
            </Grid>

            {/* Datenschutz-Einwilligungen Übersicht */}
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Paper sx={{ p: 2 }}>
                <Typography
                  variant="subtitle1"
                  sx={{ mb: 2, fontWeight: "bold" }}
                >
                  Datenschutz-Einwilligungen
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        p: 1,
                        borderRadius: 1,
                        bgcolor: getValues("privacy_whatsapp")
                          ? "#e3f2fd"
                          : "#ffebee",
                      }}
                    >
                      {getValues("privacy_whatsapp") ? (
                        <WhatsAppIcon sx={{ color: "#4caf50" }} />
                      ) : (
                        <WhatsAppIcon sx={{ color: "#f44336" }} />
                      )}
                      <Typography variant="body2">
                        WhatsApp:{" "}
                        {getValues("privacy_whatsapp") ? "Ja" : "Nein"}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        p: 1,
                        borderRadius: 1,
                        bgcolor: getValues("privacy_membership")
                          ? "#e3f2fd"
                          : "#ffebee",
                      }}
                    >
                      {getValues("privacy_membership") ? (
                        <PhoneIcon sx={{ color: "#4caf50" }} />
                      ) : (
                        <PhoneIcon sx={{ color: "#f44336" }} />
                      )}
                      <Typography variant="body2">
                        Mitgliedschaft:{" "}
                        {getValues("privacy_membership") ? "Ja" : "Nein"}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        p: 1,
                        borderRadius: 1,
                        bgcolor: getValues("privacy_donation")
                          ? "#e3f2fd"
                          : "#ffebee",
                      }}
                    >
                      {getValues("privacy_donation") ? (
                        <VolunteerActivismOutlinedIcon
                          sx={{ color: "#4caf50" }}
                        />
                      ) : (
                        <VolunteerActivismOutlinedIcon
                          sx={{ color: "#f44336" }}
                        />
                      )}
                      <Typography variant="body2">
                        Spende: {getValues("privacy_donation") ? "Ja" : "Nein"}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        p: 1,
                        borderRadius: 1,
                        bgcolor: getValues("privacy_children")
                          ? "#e3f2fd"
                          : "#ffebee",
                      }}
                    >
                      {getValues("privacy_children") ? (
                        <ChildCareIcon sx={{ color: "#4caf50" }} />
                      ) : (
                        <ChildCareIcon sx={{ color: "#f44336" }} />
                      )}
                      <Typography variant="body2">
                        Kinder: {getValues("privacy_children") ? "Ja" : "Nein"}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  mt: 2,
                  flexDirection: { xs: "column", sm: "row" },
                }}
              >
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  sx={{ order: { xs: 1, sm: 1 }, minHeight: 48 }}
                >
                  Änderungen speichern
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate("/admin-dashboard")}
                  fullWidth
                  sx={{ order: { xs: 2, sm: 2 }, minHeight: 48 }}
                >
                  Abbrechen
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
}

export default MemberEdit;
