import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Chip,
  Container,
} from "@mui/material";
import {
  ChevronLeft,
  ChevronRight,
  Add,
  Edit,
  Delete,
  Warning,
  Close,
  Download,
} from "@mui/icons-material";
import axiosInstance from "../api/axios";
import * as XLSX from "xlsx";

const MONTH_NAMES = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];

// Farben für Kategorien
const KATEGORIE_FARBEN = {
  F: "#ef4444",      // Feiertag - Rot
  T: "#2563eb",      // Termin - Blau
  W: "#eab308",      // Wiederholend - Gelb
  FT: "#9333ea",     // Festgelegt - Lila
};

export default function RaumbelegungsplanExcel() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [raeume, setRaeume] = useState([]);
  const [buchungen, setBuchungen] = useState([]);
  const [holidays, setHolidays] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [dayViewOpen, setDayViewOpen] = useState(false);
  const [dayViewBookings, setDayViewBookings] = useState([]);

  // Dialog States
  const [newTerminDialogOpen, setNewTerminDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Form States
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    raum: [],
    titel: "",
    kontaktperson: "",
    telefon: "",
    teilnehmerzahl: "",
    datum_start: "",
    datum_ende: "",
    startzeit: "09:00",
    endzeit: "17:00",
    kategorie: "termin",
    wiederholung: "keine",
    wiederholung_bis: "",
    beschreibung: "",
  });

  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    loadData();
  }, [currentDate]);

  const loadData = async () => {
    try {
      const [raeume_res, buchungen_res, holidays_res] = await Promise.all([
        axiosInstance.get("/kalender/raum/"),
        axiosInstance.get("/kalender/raumbelegung/"),
        axiosInstance.get("/kalender/feiertage/?jahr=" + currentDate.getFullYear() + "&monat=" + (currentDate.getMonth() + 1)),
      ]);

      setRaeume(raeume_res.data);
      setBuchungen(buchungen_res.data);

      // Organisiere Feiertage nach Datum
      const feiertageMap = {};
      holidays_res.data.feiertage?.forEach((f) => {
        feiertageMap[f.datum] = f;
      });
      setHolidays(feiertageMap);
    } catch (error) {
      console.error("Fehler beim Laden der Daten:", error);
      setErrorMessage("Fehler beim Laden der Daten");
    }
  };

  const getDaysInMonth = () => {
    return new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = () => {
    return new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleDayClick = (day) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateStr = clickedDate.toISOString().split("T")[0];

    // Hole Buchungen für diesen Tag
    const bookingsForDay = buchungen.filter((b) => {
      const bStart = new Date(b.datum_start);
      const bEnd = b.datum_ende ? new Date(b.datum_ende) : bStart;
      return clickedDate >= bStart && clickedDate <= bEnd;
    });

    setSelectedDate(dateStr);
    setDayViewBookings(bookingsForDay);
    setDayViewOpen(true);
  };

  const handleNewTermin = () => {
    setFormData({
      raum: [],
      titel: "",
      kontaktperson: "",
      telefon: "",
      teilnehmerzahl: "",
      datum_start: selectedDate || "",
      datum_ende: "",
      startzeit: "09:00",
      endzeit: "17:00",
      kategorie: "termin",
      wiederholung: "keine",
      wiederholung_bis: "",
      beschreibung: "",
    });
    setEditingId(null);
    setNewTerminDialogOpen(true);
  };

  const handleEditTermin = (buchung) => {
    setFormData({
      raum: buchung.raum,
      titel: buchung.titel,
      kontaktperson: buchung.kontaktperson,
      telefon: buchung.telefon,
      teilnehmerzahl: buchung.teilnehmerzahl || "",
      datum_start: buchung.datum_start,
      datum_ende: buchung.datum_ende || "",
      startzeit: buchung.startzeit,
      endzeit: buchung.endzeit,
      kategorie: buchung.kategorie,
      wiederholung: buchung.wiederholung,
      wiederholung_bis: buchung.wiederholung_bis || "",
      beschreibung: buchung.beschreibung,
    });
    setEditingId(buchung.id);
    setEditDialogOpen(true);
  };

  const handleDeleteTermin = (buchung) => {
    setDeleteTarget(buchung);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await axiosInstance.delete(`/kalender/raumbelegung/${deleteTarget.id}/`);
      setSuccessMessage("Termin gelöscht");
      setDeleteConfirmOpen(false);
      setDeleteTarget(null);
      loadData();
    } catch (error) {
      setErrorMessage(error.response?.data?.detail || "Fehler beim Löschen");
    }
  };

  const handleSaveTermin = async () => {
    // Validierung
    if (!formData.kontaktperson.trim()) {
      setErrorMessage("Name der Kontaktperson ist erforderlich");
      return;
    }
    if (!formData.telefon.trim()) {
      setErrorMessage("Telefonnummer ist erforderlich");
      return;
    }
    if (!formData.datum_start) {
      setErrorMessage("Startdatum ist erforderlich");
      return;
    }
    if (formData.raum.length === 0) {
      setErrorMessage("Mindestens ein Raum muss ausgewählt werden");
      return;
    }

    try {
      const payload = {
        ...formData,
        teilnehmerzahl: formData.teilnehmerzahl ? parseInt(formData.teilnehmerzahl) : null,
      };

      if (editingId) {
        await axiosInstance.put(`/kalender/raumbelegung/${editingId}/`, payload);
        setSuccessMessage("Termin aktualisiert");
      } else {
        await axiosInstance.post("/kalender/raumbelegung/", payload);
        setSuccessMessage("Termin erstellt");
      }

      setNewTerminDialogOpen(false);
      setEditDialogOpen(false);
      loadData();
    } catch (error) {
      const errorData = error.response?.data;
      if (errorData?.ueberschneidung) {
        setErrorMessage(
          `Überschneidung gefunden: ${errorData.konflikte
            .map((k) => `${k.raum}: ${k.titel}`)
            .join(", ")}`
        );
      } else {
        setErrorMessage(
          errorData?.detail || errorData?.non_field_errors?.[0] || "Fehler beim Speichern"
        );
      }
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRaumChange = (event) => {
    setFormData((prev) => ({
      ...prev,
      raum: event.target.value,
    }));
  };

  const getKategoryTag = (buchung) => {
    let kategorie = "T"; // Default Termin
    if (buchung.wiederholung !== "keine") {
      kategorie = "W"; // Wiederholend
    } else if (buchung.kategorie === "fest") {
      kategorie = "FT"; // Festgelegt
    }
    return kategorie;
  };

  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();

    // 1. Zusammenfassungsblatt
    const summaryData = [];
    raeume.forEach((raum) => {
      const raumBuchungen = buchungen.filter((b) => b.raum_namen.includes(raum.name));
      summaryData.push({
        Raum: raum.name,
        Kapazität: raum.kapazitaet,
        Buchungen: raumBuchungen.length,
        "% Auslastung": raeume.length > 0 ? ((raumBuchungen.length / 30) * 100).toFixed(1) + "%" : "0%",
      });
    });
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, "Übersicht");

    // 2. Monatliche Blätter pro Raum
    raeume.forEach((raum) => {
      const raumBuchungen = buchungen.filter((b) => b.raum_namen.includes(raum.name));
      const sheetData = raumBuchungen.map((b) => ({
        Termin: b.titel,
        Kontakt: b.kontaktperson,
        Telefon: b.telefon,
        Teilnehmer: b.teilnehmerzahl || "-",
        Startdatum: b.datum_start,
        Enddatum: b.datum_ende || b.datum_start,
        Startzeit: b.startzeit,
        Endzeit: b.endzeit,
        Kategorie: getKategoryTag(b),
        Wiederholung: b.wiederholung,
        Beschreibung: b.beschreibung || "",
      }));
      const sheet = XLSX.utils.json_to_sheet(sheetData);
      XLSX.utils.book_append_sheet(workbook, sheet, raum.name.slice(0, 31));
    });

    XLSX.writeFile(workbook, `Raumbelegungsplan_${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}.xlsx`);
  };

  // Rendere Kalender Grid
  const days = [];
  const daysInMonth = getDaysInMonth();
  const firstDay = getFirstDayOfMonth();

  // Leere Tage am Anfang
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  // Tage des Monats
  for (let day = 1; day <= daysInMonth; day++) {
    const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateStr = dateObj.toISOString().split("T")[0];
    const isFeiertag = !!holidays[dateStr];
    const dayBookings = buchungen.filter((b) => {
      const bStart = new Date(b.datum_start);
      const bEnd = b.datum_ende ? new Date(b.datum_ende) : bStart;
      return dateObj >= bStart && dateObj <= bEnd;
    });

    days.push({
      day,
      dateStr,
      isFeiertag,
      bookingCount: dayBookings.length,
    });
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <IconButton onClick={handlePrevMonth}>
            <ChevronLeft />
          </IconButton>
          <Typography variant="h5" sx={{ minWidth: 250 }}>
            {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
          </Typography>
          <IconButton onClick={handleNextMonth}>
            <ChevronRight />
          </IconButton>
        </Box>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Add />}
            onClick={handleNewTermin}
          >
            Neuer Termin
          </Button>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={exportToExcel}
          >
            Excel Export
          </Button>
        </Box>
      </Box>

      {/* Legende */}
      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <Chip label="F - Feiertag" sx={{ backgroundColor: KATEGORIE_FARBEN.F, color: "white" }} />
        <Chip label="T - Termin" sx={{ backgroundColor: KATEGORIE_FARBEN.T, color: "white" }} />
        <Chip label="W - Wiederholend" sx={{ backgroundColor: KATEGORIE_FARBEN.W, color: "black" }} />
        <Chip label="FT - Festgelegt" sx={{ backgroundColor: KATEGORIE_FARBEN.FT, color: "white" }} />
      </Box>

      {/* Meldungen */}
      {errorMessage && (
        <Alert severity="error" onClose={() => setErrorMessage("")} sx={{ mb: 2 }}>
          {errorMessage}
        </Alert>
      )}
      {successMessage && (
        <Alert severity="success" onClose={() => setSuccessMessage("")} sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}

      {/* Kalender Grid */}
      <Paper sx={{ p: 2 }}>
        <Grid container spacing={1}>
          {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((day) => (
            <Grid item xs={12 / 7} key={day}>
              <Typography variant="subtitle2" sx={{ textAlign: "center", fontWeight: "bold", p: 1 }}>
                {day}
              </Typography>
            </Grid>
          ))}

          {days.map((dayData, idx) => (
            <Grid item xs={12 / 7} key={idx} sx={{ minHeight: 100 }}>
              {dayData ? (
                <Card
                  sx={{
                    height: "100%",
                    cursor: "pointer",
                    backgroundColor: dayData.isFeiertag ? KATEGORIE_FARBEN.F : "inherit",
                    border: "1px solid #e0e0e0",
                    "&:hover": { backgroundColor: "#f5f5f5" },
                  }}
                  onClick={() => handleDayClick(dayData.day)}
                >
                  <CardContent sx={{ p: 1 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: "bold",
                        color: dayData.isFeiertag ? "white" : "inherit",
                      }}
                    >
                      {dayData.day}
                    </Typography>
                    {dayData.isFeiertag && (
                      <Typography variant="caption" sx={{ color: "white", fontWeight: "bold" }}>
                        F
                      </Typography>
                    )}
                    {dayData.bookingCount > 0 && (
                      <Typography
                        variant="caption"
                        sx={{ display: "block", color: "#2563eb", mt: 0.5 }}
                      >
                        {dayData.bookingCount} Termine
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Box />
              )}
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Tagesansicht Dialog */}
      <Dialog open={dayViewOpen} onClose={() => setDayViewOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography>
              Tagesansicht {selectedDate}
            </Typography>
            <IconButton size="small" onClick={() => setDayViewOpen(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            {dayViewBookings.length === 0 ? (
              <Typography color="textSecondary">Keine Termine an diesem Tag</Typography>
            ) : (
              dayViewBookings.map((booking) => (
                <Card key={booking.id} variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                      {booking.titel}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {booking.startzeit} - {booking.endzeit}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      <strong>Kontakt:</strong> {booking.kontaktperson}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Telefon:</strong> {booking.telefon}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Räume:</strong> {booking.raum_namen.join(", ")}
                    </Typography>
                    {booking.teilnehmerzahl && (
                      <Typography variant="body2">
                        <strong>Teilnehmer:</strong> {booking.teilnehmerzahl}
                      </Typography>
                    )}
                    <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Edit />}
                        onClick={() => {
                          handleEditTermin(booking);
                          setDayViewOpen(false);
                        }}
                      >
                        Bearbeiten
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<Delete />}
                        onClick={() => {
                          handleDeleteTermin(booking);
                          setDayViewOpen(false);
                        }}
                      >
                        Löschen
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              ))
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" startIcon={<Add />} onClick={handleNewTermin}>
            Neuer Termin
          </Button>
          <Button onClick={() => setDayViewOpen(false)}>Schließen</Button>
        </DialogActions>
      </Dialog>

      {/* Neuer/Edit Termin Dialog */}
      <Dialog open={newTerminDialogOpen || editDialogOpen} onClose={() => {
        setNewTerminDialogOpen(false);
        setEditDialogOpen(false);
      }} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingId ? "Termin bearbeiten" : "Neuer Termin"}
        </DialogTitle>
        <DialogContent dividers sx={{ pt: 2 }}>
          <Stack spacing={2}>
            {/* Raum Auswahl */}
            <FormControl fullWidth>
              <InputLabel>Raum(e) *</InputLabel>
              <Select
                multiple
                value={formData.raum}
                onChange={handleRaumChange}
                label="Raum(e) *"
              >
                {raeume.map((raum) => (
                  <MenuItem key={raum.id} value={raum.id}>
                    {raum.name} ({raum.kapazitaet} Pers.)
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Titel */}
            <TextField
              fullWidth
              label="Titel"
              name="titel"
              value={formData.titel}
              onChange={handleFormChange}
            />

            {/* Kontaktperson */}
            <TextField
              fullWidth
              label="Kontaktperson Name *"
              name="kontaktperson"
              value={formData.kontaktperson}
              onChange={handleFormChange}
              required
            />

            {/* Telefon */}
            <TextField
              fullWidth
              label="Telefonnummer *"
              name="telefon"
              value={formData.telefon}
              onChange={handleFormChange}
              required
            />

            {/* Teilnehmerzahl */}
            <TextField
              fullWidth
              label="Teilnehmerzahl"
              name="teilnehmerzahl"
              type="number"
              value={formData.teilnehmerzahl}
              onChange={handleFormChange}
            />

            {/* Datum Start */}
            <TextField
              fullWidth
              label="Startdatum *"
              name="datum_start"
              type="date"
              value={formData.datum_start}
              onChange={handleFormChange}
              InputLabelProps={{ shrink: true }}
              required
            />

            {/* Datum Ende */}
            <TextField
              fullWidth
              label="Enddatum"
              name="datum_ende"
              type="date"
              value={formData.datum_ende}
              onChange={handleFormChange}
              InputLabelProps={{ shrink: true }}
            />

            {/* Startzeit */}
            <TextField
              fullWidth
              label="Startzeit"
              name="startzeit"
              type="time"
              value={formData.startzeit}
              onChange={handleFormChange}
              InputLabelProps={{ shrink: true }}
            />

            {/* Endzeit */}
            <TextField
              fullWidth
              label="Endzeit"
              name="endzeit"
              type="time"
              value={formData.endzeit}
              onChange={handleFormChange}
              InputLabelProps={{ shrink: true }}
            />

            {/* Kategorie */}
            <FormControl fullWidth>
              <InputLabel>Kategorie</InputLabel>
              <Select
                name="kategorie"
                value={formData.kategorie}
                onChange={handleFormChange}
                label="Kategorie"
              >
                <MenuItem value="termin">Termin</MenuItem>
                <MenuItem value="fest">Festgelegt</MenuItem>
                <MenuItem value="intern">Intern</MenuItem>
                <MenuItem value="extern">Extern</MenuItem>
              </Select>
            </FormControl>

            {/* Wiederholung */}
            <FormControl fullWidth>
              <InputLabel>Wiederholung</InputLabel>
              <Select
                name="wiederholung"
                value={formData.wiederholung}
                onChange={handleFormChange}
                label="Wiederholung"
              >
                <MenuItem value="keine">Keine</MenuItem>
                <MenuItem value="täglich">Täglich</MenuItem>
                <MenuItem value="wöchentlich">Wöchentlich</MenuItem>
                <MenuItem value="monatlich">Monatlich</MenuItem>
              </Select>
            </FormControl>

            {/* Wiederholung bis */}
            {formData.wiederholung !== "keine" && (
              <TextField
                fullWidth
                label="Wiederholung bis"
                name="wiederholung_bis"
                type="date"
                value={formData.wiederholung_bis}
                onChange={handleFormChange}
                InputLabelProps={{ shrink: true }}
              />
            )}

            {/* Beschreibung */}
            <TextField
              fullWidth
              label="Beschreibung"
              name="beschreibung"
              value={formData.beschreibung}
              onChange={handleFormChange}
              multiline
              rows={3}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setNewTerminDialogOpen(false);
            setEditDialogOpen(false);
          }}>Abbrechen</Button>
          <Button variant="contained" onClick={handleSaveTermin}>
            {editingId ? "Aktualisieren" : "Erstellen"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Warning color="error" />
          Termin löschen?
        </DialogTitle>
        <DialogContent>
          <Typography>
            Möchten Sie den Termin "{deleteTarget?.titel}" wirklich löschen?
          </Typography>
          <Typography variant="caption" color="textSecondary" sx={{ display: "block", mt: 1 }}>
            Diese Aktion kann nicht rückgängig gemacht werden.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Abbrechen</Button>
          <Button variant="contained" color="error" onClick={confirmDelete}>
            Löschen
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
