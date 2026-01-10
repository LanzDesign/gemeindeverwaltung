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
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import ViewDayIcon from "@mui/icons-material/ViewDay";
import ViewWeekIcon from "@mui/icons-material/ViewWeek";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import axiosInstance from "../api/axios";

const HOURS = Array.from({ length: 17 }, (_, i) => 6 + i); // 06:00 bis 22:00
const COLORS = {
  termin: "#2563eb", // Blau
  fest: "#9333ea", // Lila
  wiederholung: "#eab308", // Gelb
};

export default function RaumbelegungsplanExcel() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("day"); // day, week, month
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
        axiosInstance.get("/raeume/"),
        axiosInstance.get("/raumbelegungen/"),
        axiosInstance.get(`/feiertage/?jahr=${jahr}&monat=${monat}`),
      ]);
      setRaeume(raumRes.data);
      setBuchungen(buchRes.data);
      setHolidays(feiertageRes.data.feiertage || []);
    } catch (err) {
      setError("Daten konnten nicht geladen werden");
    }
  };

  const dayString = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const day = String(currentDate.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, [currentDate]);

  const displayDates = useMemo(() => {
    if (viewMode === "day") {
      return [currentDate];
    } else if (viewMode === "week") {
      const dates = [];
      const start = new Date(currentDate);
      const day = start.getDay();
      const diff = day === 0 ? -6 : 1 - day; // Start at Monday
      start.setDate(start.getDate() + diff);
      for (let i = 0; i < 7; i++) {
        dates.push(new Date(start));
        start.setDate(start.getDate() + 1);
      }
      return dates;
    } else {
      // month
      const dates = [];
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        dates.push(new Date(year, month, d));
      }
      return dates;
    }
  }, [currentDate, viewMode]);

  const dayStringFormatted = useMemo(() => {
    if (viewMode === "day") {
      const d = currentDate.getDate();
      const m = currentDate.getMonth() + 1;
      const y = currentDate.getFullYear();
      return `${String(d).padStart(2, "0")}.${String(m).padStart(2, "0")}.${y}`;
    } else if (viewMode === "week") {
      const monday = displayDates[0];
      const sunday = displayDates[6];
      return `${monday.toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })} - ${sunday.toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })}`;
    } else {
      return currentDate.toLocaleDateString("de-DE", {
        month: "long",
        year: "numeric",
      });
    }
  }, [currentDate, viewMode, displayDates]);

  const bookingsForDates = useMemo(() => {
    // Expandiere wiederholende Termine
    const expandedBookings = [];

    buchungen.forEach((b) => {
      if (b.wiederholung === "keine") {
        // Normaler Termin ohne Wiederholung
        expandedBookings.push(b);
      } else {
        // Wiederholender Termin - expandieren
        const startDate = new Date(b.datum_start);
        const endDate = b.wiederholung_bis
          ? new Date(b.wiederholung_bis)
          : new Date(startDate.getFullYear() + 1, 11, 31);

        let currentDate = new Date(startDate);
        while (currentDate <= endDate) {
          // Erstelle eine Instanz für dieses Datum
          expandedBookings.push({
            ...b,
            datum_start: currentDate.toISOString().slice(0, 10),
            datum_ende: currentDate.toISOString().slice(0, 10),
            _isRecurring: true,
            _originalId: b.id,
          });

          // Nächstes Datum basierend auf Wiederholungstyp
          if (b.wiederholung === "täglich") {
            currentDate.setDate(currentDate.getDate() + 1);
          } else if (b.wiederholung === "wöchentlich") {
            currentDate.setDate(currentDate.getDate() + 7);
          } else if (b.wiederholung === "monatlich") {
            currentDate.setMonth(currentDate.getMonth() + 1);
          }
        }
      }
    });

    // Filtere nur die Termine, die in displayDates liegen und füge datum-Property hinzu
    return expandedBookings
      .filter((b) => {
        const bStart = b.datum_start;
        const bEnd = b.datum_ende || b.datum_start;
        return displayDates.some((date) => {
          const ds = date.toISOString().slice(0, 10);
          return ds >= bStart && ds <= bEnd;
        });
      })
      .map((b) => ({
        ...b,
        datum: b.datum_start, // Füge datum-Property für Wochen-/Monatsansicht hinzu
      }));
  }, [buchungen, displayDates]);

  const bookingsForDay = useMemo(() => {
    // Expandiere wiederholende Termine
    const expandedBookings = [];

    buchungen.forEach((b) => {
      if (b.wiederholung === "keine") {
        expandedBookings.push(b);
      } else {
        // Wiederholender Termin
        const startDate = new Date(b.datum_start);
        const endDate = b.wiederholung_bis
          ? new Date(b.wiederholung_bis)
          : new Date(startDate.getFullYear() + 1, 11, 31);

        let currentDate = new Date(startDate);
        while (currentDate <= endDate) {
          expandedBookings.push({
            ...b,
            datum_start: currentDate.toISOString().slice(0, 10),
            datum_ende: currentDate.toISOString().slice(0, 10),
            _isRecurring: true,
            _originalId: b.id,
          });

          if (b.wiederholung === "täglich") {
            currentDate.setDate(currentDate.getDate() + 1);
          } else if (b.wiederholung === "wöchentlich") {
            currentDate.setDate(currentDate.getDate() + 7);
          } else if (b.wiederholung === "monatlich") {
            currentDate.setMonth(currentDate.getMonth() + 1);
          }
        }
      }
    });

    // Filtere für den aktuellen Tag
    return expandedBookings.filter((b) => {
      const start = b.datum_start;
      const end = b.datum_ende || b.datum_start;
      return dayString >= start && dayString <= end;
    });
  }, [buchungen, dayString]);

  const handlePrevDay = () => {
    const d = new Date(currentDate);
    if (viewMode === "day") {
      d.setDate(d.getDate() - 1);
    } else if (viewMode === "week") {
      d.setDate(d.getDate() - 7);
    } else {
      d.setMonth(d.getMonth() - 1);
    }
    setCurrentDate(d);
  };

  const handleNextDay = () => {
    const d = new Date(currentDate);
    if (viewMode === "day") {
      d.setDate(d.getDate() + 1);
    } else if (viewMode === "week") {
      d.setDate(d.getDate() + 7);
    } else {
      d.setMonth(d.getMonth() + 1);
    }
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
    setEditing(booking);
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
      await axiosInstance.delete(`/raumbelegungen/${editing.id}/`);
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
      raum: formData.raum,
      titel: formData.titel,
      kontaktperson: formData.kontaktperson,
      telefon: formData.telefon,
      startzeit: formData.startzeit,
      endzeit: formData.endzeit,
      datum_start: formData.datum_start,
      kategorie: formData.kategorie,
      wiederholung: formData.wiederholung,
      beschreibung: formData.beschreibung || "",
    };

    // Optionale Felder nur hinzufügen, wenn sie einen Wert haben
    if (formData.teilnehmerzahl) {
      payload.teilnehmerzahl = parseInt(formData.teilnehmerzahl, 10);
    }

    if (formData.datum_ende) {
      payload.datum_ende = formData.datum_ende;
    }

    if (formData.wiederholung !== "keine" && formData.wiederholung_bis) {
      payload.wiederholung_bis = formData.wiederholung_bis;
    }
    try {
      if (editing) {
        await axiosInstance.put(`/raumbelegungen/${editing.id}/`, payload);
        setMessage("Termin aktualisiert");
      } else {
        await axiosInstance.post("/raumbelegungen/", payload);
        setMessage("Termin erstellt");
      }
      setDialogOpen(false);
      setEditing(null);
      loadData();
    } catch (err) {
      const errData = err.response?.data;
      console.error("Fehler beim Speichern:", JSON.stringify(errData, null, 2));
      console.error("Gesendete Daten:", JSON.stringify(payload, null, 2));
      if (errData?.ueberschneidung) {
        setError(
          `Überschneidung: ${errData.konflikte
            .map((k) => `${k.raum}: ${k.titel}`)
            .join(", ")}`
        );
      } else if (errData) {
        // Zeige detaillierte Fehlermeldungen an
        const errorMessages = Object.entries(errData)
          .map(([field, messages]) => {
            const msg = Array.isArray(messages)
              ? messages.join(", ")
              : messages;
            return `${field}: ${msg}`;
          })
          .join("; ");
        setError(errorMessages || "Speichern fehlgeschlagen");
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
            {dayStringFormatted}
          </Typography>
          <IconButton onClick={handleNextDay}>
            <ChevronRightIcon />
          </IconButton>
          {holidaysMap[dayString] && (
            <Chip label="Feiertag" color="error" size="small" sx={{ ml: 1 }} />
          )}
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(e, val) => val && setViewMode(val)}
            size="small"
          >
            <ToggleButton value="day">
              <ViewDayIcon fontSize="small" sx={{ mr: 0.5 }} />
              Tag
            </ToggleButton>
            <ToggleButton value="week">
              <ViewWeekIcon fontSize="small" sx={{ mr: 0.5 }} />
              Woche
            </ToggleButton>
            <ToggleButton value="month">
              <CalendarMonthIcon fontSize="small" sx={{ mr: 0.5 }} />
              Monat
            </ToggleButton>
          </ToggleButtonGroup>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleCellClick(raeume[0]?.id || null, 9)}
            disabled={raeume.length === 0}
          >
            Neuer Termin
          </Button>
        </Box>
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
              {viewMode === "day"
                ? HOURS.map((h) => (
                    <TableCell
                      key={h}
                      align="center"
                      sx={{ minWidth: 70, fontWeight: 700 }}
                    >
                      {`${String(h).padStart(2, "0")}:00`}
                    </TableCell>
                  ))
                : displayDates.map((date) => {
                    const dateStr = date.toLocaleDateString("de-DE", {
                      day: "2-digit",
                      month: "2-digit",
                    });
                    const dayName = date.toLocaleDateString("de-DE", {
                      weekday: "short",
                    });
                    return (
                      <TableCell
                        key={dateStr}
                        align="center"
                        sx={{ minWidth: 100, fontWeight: 700 }}
                      >
                        {dayName}
                        <br />
                        {dateStr}
                      </TableCell>
                    );
                  })}
            </TableRow>
          </TableHead>
          <TableBody>
            {raeume.map((raum) => {
              return (
                <TableRow key={raum.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{raum.name}</TableCell>
                  {viewMode === "day"
                    ? HOURS.map((h) => {
                        const bookings = bookingsForDay.filter((b) =>
                          b.raum.includes(raum.id)
                        );
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
                      })
                    : displayDates.map((date) => {
                        const dateStr = date.toISOString().split("T")[0];
                        const dayBookings = bookingsForDates.filter(
                          (b) => b.datum === dateStr && b.raum.includes(raum.id)
                        );
                        if (dayBookings.length > 0) {
                          return (
                            <TableCell
                              key={`${raum.id}-${dateStr}`}
                              align="center"
                              sx={{
                                p: 0.5,
                                cursor: "pointer",
                                verticalAlign: "top",
                              }}
                            >
                              {dayBookings.map((booking) => (
                                <Box
                                  key={booking.id}
                                  sx={{
                                    mb: 0.5,
                                    p: 0.5,
                                    backgroundColor: colorForBooking(booking),
                                    color: "white",
                                    borderRadius: 1,
                                    fontSize: "0.75rem",
                                  }}
                                  onClick={() => handleBookingClick(booking)}
                                >
                                  {booking.startzeit.slice(0, 5)}-
                                  {booking.endzeit.slice(0, 5)}
                                  <br />
                                  {booking.titel}
                                </Box>
                              ))}
                            </TableCell>
                          );
                        }
                        return (
                          <TableCell
                            key={`${raum.id}-${dateStr}`}
                            sx={{ cursor: "pointer" }}
                            onClick={() => {
                              setCurrentDate(date);
                              setViewMode("day");
                            }}
                          />
                        );
                      })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
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
              onChange={(e) =>
                setFormData((p) => ({ ...p, titel: e.target.value }))
              }
              fullWidth
            />

            <TextField
              label="Kontaktperson *"
              value={formData.kontaktperson}
              onChange={(e) =>
                setFormData((p) => ({ ...p, kontaktperson: e.target.value }))
              }
              fullWidth
              required
            />

            <TextField
              label="Telefon *"
              value={formData.telefon}
              onChange={(e) =>
                setFormData((p) => ({ ...p, telefon: e.target.value }))
              }
              fullWidth
              required
            />

            <TextField
              label="Teilnehmerzahl"
              type="number"
              value={formData.teilnehmerzahl}
              onChange={(e) =>
                setFormData((p) => ({ ...p, teilnehmerzahl: e.target.value }))
              }
              fullWidth
            />

            <TextField
              label="Datum"
              type="date"
              value={formData.datum_start}
              onChange={(e) =>
                setFormData((p) => ({
                  ...p,
                  datum_start: e.target.value,
                  datum_ende: e.target.value,
                }))
              }
              InputLabelProps={{ shrink: true }}
              fullWidth
            />

            <Stack direction="row" spacing={2}>
              <TextField
                label="Startzeit"
                type="time"
                value={formData.startzeit}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, startzeit: e.target.value }))
                }
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                label="Endzeit"
                type="time"
                value={formData.endzeit}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, endzeit: e.target.value }))
                }
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Stack>

            <FormControl fullWidth>
              <InputLabel>Kategorie</InputLabel>
              <Select
                value={formData.kategorie}
                label="Kategorie"
                onChange={(e) =>
                  setFormData((p) => ({ ...p, kategorie: e.target.value }))
                }
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
                onChange={(e) =>
                  setFormData((p) => ({ ...p, wiederholung: e.target.value }))
                }
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
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    wiederholung_bis: e.target.value,
                  }))
                }
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            )}

            <TextField
              label="Beschreibung"
              multiline
              rows={3}
              value={formData.beschreibung}
              onChange={(e) =>
                setFormData((p) => ({ ...p, beschreibung: e.target.value }))
              }
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          {editing && (
            <Button
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleDelete}
            >
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
