import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Stack,
  Chip,
  Alert,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import axiosInstance from "../api/axios";

const HOURS = Array.from({ length: 17 }, (_, i) => 6 + i); // 06:00 bis 22:00
const COLORS = {
  termin: "#2563eb", // Blau
  fest: "#9333ea", // Lila
  wiederholung: "#eab308", // Gelb
};

export default function RaumbelegungsplanExcel() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [raeume, setRaeume] = useState([]);
  const [buchungen, setBuchungen] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    raum: [],
    titel: "",
    kontaktperson: "",
    telefon: "",
    teilnehmerzahl: "",
    startzeit: "09:00",
    endzeit: "11:00",
    datum_start: new Date().toISOString().slice(0, 10),
    datum_ende: "",
    kategorie: "termin",
    wiederholung: "keine",
    wiederholung_bis: "",
    beschreibung: "",
  });

  useEffect(() => {
    loadData();
  }, [currentDate]);

  const loadData = async () => {
    try {
      const jahr = currentDate.getFullYear();
      const monat = currentDate.getMonth() + 1;
      const [raumRes, buchRes, feiertageRes] = await Promise.all([
        axiosInstance.get("/kalender/raum/"),
        axiosInstance.get("/kalender/raumbelegung/"),
        axiosInstance.get(`/kalender/feiertage/?jahr=${jahr}&monat=${monat}`),
      ]);
      setRaeume(raumRes.data);
      setBuchungen(buchRes.data);
      setHolidays(feiertageRes.data.feiertage || []);
    } catch (err) {
      setError("Daten konnten nicht geladen werden");
    }
  };

  const dayString = useMemo(() => {
    return currentDate.toISOString().slice(0, 10);
  }, [currentDate]);

  const bookingsForDay = useMemo(() => {
    return buchungen.filter((b) => {
      const start = b.datum_start;
      const end = b.datum_ende || b.datum_start;
      return dayString >= start && dayString <= end;
    });
  }, [buchungen, dayString]);

  const handlePrevDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 1);
    setCurrentDate(d);
  };

  const handleNextDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 1);
    setCurrentDate(d);
  };

  const handleCellClick = (raumId, hour) => {
    setFormData((prev) => ({
      ...prev,
      raum: [raumId],
      datum_start: dayString,
      datum_ende: "",
      startzeit: `${String(hour).padStart(2, "0")}:00`,
      endzeit: `${String(hour + 1).padStart(2, "0")}:00`,
    }));
    setEditing(null);
    setDialogOpen(true);
  };

  const handleBookingClick = (booking) => {
    setEditing(booking.id);
    setFormData({
      raum: booking.raum,
      titel: booking.titel,
      kontaktperson: booking.kontaktperson,
      telefon: booking.telefon,
      teilnehmerzahl: booking.teilnehmerzahl || "",
      startzeit: booking.startzeit,
      endzeit: booking.endzeit,
      datum_start: booking.datum_start,
      datum_ende: booking.datum_ende || "",
      kategorie: booking.kategorie,
      wiederholung: booking.wiederholung,
      wiederholung_bis: booking.wiederholung_bis || "",
      beschreibung: booking.beschreibung || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!editing) return;
    try {
      await axiosInstance.delete(`/kalender/raumbelegung/${editing}/`);
      setMessage("Termin gelöscht");
      setDialogOpen(false);
      setEditing(null);
      loadData();
    } catch (err) {
      setError("Löschen fehlgeschlagen");
    }
  };

  const handleSave = async () => {
    setError("");
    if (!formData.kontaktperson.trim()) {
      setError("Kontaktperson ist Pflicht");
      return;
    }
    if (!formData.telefon.trim()) {
      setError("Telefon ist Pflicht");
      return;
    }
    if (formData.raum.length === 0) {
      setError("Bitte Raum auswählen");
      return;
    }
    const payload = {
      ...formData,
      teilnehmerzahl: formData.teilnehmerzahl
        ? parseInt(formData.teilnehmerzahl, 10)
        : null,
    };
    try {
      if (editing) {
        await axiosInstance.put(`/kalender/raumbelegung/${editing}/`, payload);
        setMessage("Termin aktualisiert");
      } else {
        await axiosInstance.post("/kalender/raumbelegung/", payload);
        setMessage("Termin erstellt");
      }
      setDialogOpen(false);
      setEditing(null);
      loadData();
    } catch (err) {
      const errData = err.response?.data;
      if (errData?.ueberschneidung) {
        setError(
          `Überschneidung: ${errData.konflikte
            .map((k) => `${k.raum}: ${k.titel}`)
            .join(", ")}`
        );
      } else {
        setError("Speichern fehlgeschlagen");
      }
    }
  };

  const colorForBooking = (b) => {
    if (b.wiederholung !== "keine") return COLORS.wiederholung;
    if (b.kategorie === "fest") return COLORS.fest;
    return COLORS.termin;
  };

  const holidaysMap = useMemo(() => {
    const map = {};
    holidays.forEach((h) => (map[h.datum] = h));
    return map;
  }, [holidays]);

  return (
    <Box sx={{ py: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton onClick={handlePrevDay}>
            <ChevronLeftIcon />
          </IconButton>
          <Typography variant="h6" sx={{ minWidth: 180 }}>
            {dayString}
          </Typography>
          <IconButton onClick={handleNextDay}>
            <ChevronRightIcon />
          </IconButton>
          {holidaysMap[dayString] && (
            <Chip label="Feiertag" color="error" size="small" sx={{ ml: 1 }} />
          )}
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleCellClick(raeume[0]?.id || null, 9)}
          disabled={raeume.length === 0}
        >
          Neuer Termin
        </Button>
      </Box>

      {message && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMessage("")}>
          {message}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 200, fontWeight: 700 }}>Raum</TableCell>
              {HOURS.map((h) => (
                <TableCell key={h} align="center" sx={{ minWidth: 70, fontWeight: 700 }}>
                  {`${String(h).padStart(2, "0")}:00`}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {raeume.map((raum) => {
              const bookings = bookingsForDay.filter((b) => b.raum.includes(raum.id));
              return (
                <TableRow key={raum.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{raum.name}</TableCell>
                  {HOURS.map((h) => {
                    const booking = bookings.find((b) => {
                      const start = parseInt(b.startzeit.slice(0, 2), 10);
                      const end = parseInt(b.endzeit.slice(0, 2), 10);
                      return h >= start && h < end;
                    });
                    if (booking) {
                      return (
                        <TableCell
                          key={`${raum.id}-${h}`}
                          align="center"
                          sx={{
                            p: 0.5,
                            backgroundColor: colorForBooking(booking),
                            color: "white",
                            cursor: "pointer",
                          }}
                          onClick={() => handleBookingClick(booking)}
                        >
                          {booking.titel || "Termin"}
                        </TableCell>
                      );
                    }
                    return (
                      <TableCell
                        key={`${raum.id}-${h}`}
                        sx={{ cursor: "pointer" }}
                        onClick={() => handleCellClick(raum.id, h)}
                      />
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>{editing ? "Termin bearbeiten" : "Neuer Termin"}</span>
          <IconButton size="small" onClick={() => setDialogOpen(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <FormControl fullWidth>
              <InputLabel>Raum(e)</InputLabel>
              <Select
                multiple
                value={formData.raum}
                label="Raum(e)"
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    raum: e.target.value,
                  }))
                }
              >
                {raeume.map((raum) => (
                  <MenuItem key={raum.id} value={raum.id}>
                    {raum.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Titel"
              value={formData.titel}
              onChange={(e) => setFormData((p) => ({ ...p, titel: e.target.value }))}
              fullWidth
            />

            <TextField
              label="Kontaktperson *"
              value={formData.kontaktperson}
              onChange={(e) => setFormData((p) => ({ ...p, kontaktperson: e.target.value }))}
              fullWidth
              required
            />

            <TextField
              label="Telefon *"
              value={formData.telefon}
              onChange={(e) => setFormData((p) => ({ ...p, telefon: e.target.value }))}
              fullWidth
              required
            />

            <TextField
              label="Teilnehmerzahl"
              type="number"
              value={formData.teilnehmerzahl}
              onChange={(e) => setFormData((p) => ({ ...p, teilnehmerzahl: e.target.value }))}
              fullWidth
            />

            <TextField
              label="Datum"
              type="date"
              value={formData.datum_start}
              onChange={(e) =>
                setFormData((p) => ({ ...p, datum_start: e.target.value, datum_ende: e.target.value }))
              }
              InputLabelProps={{ shrink: true }}
              fullWidth
            />

            <Stack direction="row" spacing={2}>
              <TextField
                label="Startzeit"
                type="time"
                value={formData.startzeit}
                onChange={(e) => setFormData((p) => ({ ...p, startzeit: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                label="Endzeit"
                type="time"
                value={formData.endzeit}
                onChange={(e) => setFormData((p) => ({ ...p, endzeit: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Stack>

            <FormControl fullWidth>
              <InputLabel>Kategorie</InputLabel>
              <Select
                value={formData.kategorie}
                label="Kategorie"
                onChange={(e) => setFormData((p) => ({ ...p, kategorie: e.target.value }))}
              >
                <MenuItem value="termin">Termin</MenuItem>
                <MenuItem value="fest">Festgelegt</MenuItem>
                <MenuItem value="intern">Intern</MenuItem>
                <MenuItem value="extern">Extern</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Wiederholung</InputLabel>
              <Select
                value={formData.wiederholung}
                label="Wiederholung"
                onChange={(e) => setFormData((p) => ({ ...p, wiederholung: e.target.value }))}
              >
                <MenuItem value="keine">Keine</MenuItem>
                <MenuItem value="täglich">Täglich</MenuItem>
                <MenuItem value="wöchentlich">Wöchentlich</MenuItem>
                <MenuItem value="monatlich">Monatlich</MenuItem>
              </Select>
            </FormControl>

            {formData.wiederholung !== "keine" && (
              <TextField
                label="Wiederholung bis"
                type="date"
                value={formData.wiederholung_bis}
                onChange={(e) => setFormData((p) => ({ ...p, wiederholung_bis: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            )}

            <TextField
              label="Beschreibung"
              multiline
              rows={3}
              value={formData.beschreibung}
              onChange={(e) => setFormData((p) => ({ ...p, beschreibung: e.target.value }))}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          {editing && (
            <Button color="error" startIcon={<DeleteIcon />} onClick={handleDelete}>
              Löschen
            </Button>
          )}
          <Button onClick={() => setDialogOpen(false)}>Abbrechen</Button>
          <Button variant="contained" onClick={handleSave}>
            Speichern
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
