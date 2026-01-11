import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Card,
  CardContent,
  Select,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import axiosInstance from "../api/axios";

const MONTH_NAMES = [
  "Januar",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
];

const DAY_NAMES_MONDAY_START = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

export default function RaumbelegungsplanView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [raeume, setRaeume] = useState([]);
  const [belegungen, setBelegungen] = useState([]);
  const [kategorien, setKategorien] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBelegung, setEditingBelegung] = useState(null);
  const [selectedRaum, setSelectedRaum] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [dayViewOpen, setDayViewOpen] = useState(false);

  const [formData, setFormData] = useState({
    raum: [],
    titel: "",
    kontaktperson: "",
    telefon: "",
    teilnehmerzahl: "",
    datum_start: "",
    datum_ende: "",
    startzeit: "08:00",
    endzeit: "17:00",
    kategorie_neu: null,
    wiederholung: "keine",
    wiederholung_bis: "",
    beschreibung: "",
  });

  const loadData = async () => {
    try {
      const [raeumeRes, belegumengenRes, kategorienRes] = await Promise.all([
        axiosInstance.get("/raeume/"),
        axiosInstance.get("/raumbelegungen/"),
        axiosInstance.get("/kalender-kategorien/"),
      ]);
      setRaeume(raeumeRes.data);
      setBelegungen(belegumengenRes.data);
      setKategorien(kategorienRes.data.filter((k) => k.aktiv));
    } catch (error) {
      console.error("Fehler beim Laden:", error);
    }
  };

  useEffect(() => {
    const id = setTimeout(() => {
      loadData();
    }, 0);
    return () => clearTimeout(id);
  }, [currentDate]);

  const generateCalendarDays = () => {
    const daysInMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    ).getDate();
    const firstDayOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    ).getDay();
    const firstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let day = 1; day <= daysInMonth; day++) days.push(day);
    return days;
  };

  const formatDateKey = (day) => {
    if (!day) return "";
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const dayStr = String(day).padStart(2, "0");
    return `${year}-${month}-${dayStr}`;
  };

  const getBelegungenForDay = (day, raum) => {
    const dateKey = formatDateKey(day);
    if (!dateKey) return [];
    return belegungen.filter((b) => {
      const matchesRoom = Array.isArray(b.raum)
        ? b.raum.includes(raum.id)
        : b.raum === raum.id;
      const matchesDate =
        b.datum_start === dateKey ||
        (b.datum_ende && dateKey >= b.datum_start && dateKey <= b.datum_ende);
      return matchesRoom && matchesDate;
    });
  };

  const handlePrevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)
    );
  };

  const handleDayClick = (day, raum) => {
    if (!raum || !raum.id) {
      alert("Bitte einen gültigen Raum auswählen");
      return;
    }
    setSelectedRaum(raum);
    setSelectedDate(formatDateKey(day));
    setEditingBelegung(null);
    setActionDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      // Validiere erforderliche Felder
      if (
        !formData.raum ||
        formData.raum.length === 0 ||
        !formData.titel ||
        !formData.datum_start
      ) {
        alert(
          "Bitte füllen Sie alle erforderlichen Felder aus (Räume, Titel, Datum)"
        );
        return;
      }

      if (editingBelegung) {
        await axiosInstance.put(
          `/raumbelegungen/${editingBelegung.id}/`,
          formData
        );
      } else {
        await axiosInstance.post("/raumbelegungen/", formData);
      }
      setDialogOpen(false);
      loadData();
    } catch (error) {
      console.error(
        "Fehler beim Speichern:",
        error.response?.data || error.message
      );
      const konfliktInfo = error.response?.data?.konflikte;
      const errorMsg =
        error.response?.data?.ueberschneidung ||
        error.response?.data?.detail ||
        error.response?.data?.non_field_errors?.[0] ||
        "Fehler beim Speichern";
      if (konfliktInfo) {
        alert(
          `${errorMsg}\nKonflikte:\n${konfliktInfo
            .map((k) => `• Raum ${k.raum_name}: ${k.zeitraum}`)
            .join("\n")}`
        );
      } else {
        alert(`Fehler: ${errorMsg}`);
      }
    }
  };

  const confirmDelete = (id) => {
    setDeleteTarget(id);
    setDeleteConfirmOpen(true);
  };

  const performDelete = async () => {
    if (!deleteTarget) return;
    try {
      await axiosInstance.delete(`/raumbelegungen/${deleteTarget}/`);
      setDeleteConfirmOpen(false);
      setDialogOpen(false);
      setDeleteTarget(null);
      loadData();
    } catch (error) {
      console.error("Fehler beim Löschen:", error);
    }
  };

  const days = generateCalendarDays();
  const monthTitle = `${
    MONTH_NAMES[currentDate.getMonth()]
  } ${currentDate.getFullYear()}`;

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Typography variant="h4">Raumbelegungsplan</Typography>
        {/* Legende */}
        {kategorien.length > 0 && (
          <Stack direction="row" spacing={2} flexWrap="wrap">
            {kategorien.map((kat) => (
              <Box
                key={kat.id}
                sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
              >
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    bgcolor: kat.farbe,
                    borderRadius: "50%",
                  }}
                />
                <Typography variant="body2">
                  {kat.abkuerzung || kat.bezeichnung}
                </Typography>
              </Box>
            ))}
          </Stack>
        )}
      </Stack>

      {/* Monats-Navigation */}
      <Stack direction="row" spacing={1} sx={{ mb: 2 }} alignItems="center">
        <IconButton onClick={handlePrevMonth}>
          <ChevronLeftIcon />
        </IconButton>
        <Typography variant="h6" sx={{ minWidth: 200 }}>
          {monthTitle}
        </Typography>
        <IconButton onClick={handleNextMonth}>
          <ChevronRightIcon />
        </IconButton>
        <Stack direction="row" spacing={1} sx={{ ml: 1 }}>
          <Button
            variant="outlined"
            onClick={() => {
              const jahr = currentDate.getFullYear();
              const monat = String(currentDate.getMonth() + 1);
              window.open(
                `/raeume/export/ics/?jahr=${jahr}&monat=${monat}`,
                "_blank"
              );
            }}
          >
            ICS Export
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              const jahr = currentDate.getFullYear();
              window.open(`/raeume/export/excel/?jahr=${jahr}`, "_blank");
            }}
          >
            Excel Export
          </Button>
        </Stack>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            if (raeume.length > 0) {
              // Direkt neue Buchung ohne Datum-Vorwahl
              setSelectedRaum(raeume[0]);
              setSelectedDate(formatDateKey(1));
              setEditingBelegung(null);
              setFormData((prev) => ({
                ...prev,
                raum: [raeume[0].id],
                datum_start: formatDateKey(1),
              }));
              setDialogOpen(true);
            } else {
              alert("Bitte erst einen Raum anlegen");
            }
          }}
          disabled={raeume.length === 0}
        >
          Neue Buchung
        </Button>
      </Stack>

      {/* Kalender für jeden Raum */}
      {raeume.map((raum) => (
        <Paper key={raum.id} sx={{ mb: 3, p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {raum.name} (Kapazität: {raum.kapazitaet})
          </Typography>

          <TableContainer>
            <Table size="small" border="1">
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                  <TableCell align="center" sx={{ width: "14%" }}>
                    Mo
                  </TableCell>
                  <TableCell align="center" sx={{ width: "14%" }}>
                    Di
                  </TableCell>
                  <TableCell align="center" sx={{ width: "14%" }}>
                    Mi
                  </TableCell>
                  <TableCell align="center" sx={{ width: "14%" }}>
                    Do
                  </TableCell>
                  <TableCell align="center" sx={{ width: "14%" }}>
                    Fr
                  </TableCell>
                  <TableCell align="center" sx={{ width: "14%" }}>
                    Sa
                  </TableCell>
                  <TableCell align="center" sx={{ width: "14%" }}>
                    So
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {/* Wochen-Rows */}
                {Array.from({ length: Math.ceil(days.length / 7) }).map(
                  (_, weekIdx) => (
                    <TableRow key={weekIdx}>
                      {Array.from({ length: 7 }).map((_, dayIdx) => {
                        const dayNum = days[weekIdx * 7 + dayIdx];
                        const dayBelegungen = dayNum
                          ? getBelegungenForDay(dayNum, raum)
                          : [];

                        return (
                          <TableCell
                            key={dayIdx}
                            sx={{
                              height: 100,
                              verticalAlign: "top",
                              border: "1px solid #ddd",
                              backgroundColor:
                                dayIdx === 5 || dayIdx === 6
                                  ? "#f9f9f9"
                                  : "white",
                              cursor: dayNum ? "pointer" : "default",
                              "&:hover": dayNum
                                ? { backgroundColor: "#e8e8e8" }
                                : {},
                            }}
                            onClick={() =>
                              dayNum && handleDayClick(dayNum, raum)
                            }
                          >
                            {dayNum && (
                              <>
                                <Typography
                                  variant="caption"
                                  sx={{ fontWeight: "bold" }}
                                >
                                  {dayNum}
                                </Typography>
                                <Box sx={{ mt: 0.5 }}>
                                  {dayBelegungen.map((b) => {
                                    const kategorie = kategorien.find(
                                      (k) => k.id === b.kategorie_neu
                                    );
                                    const farbe = kategorie
                                      ? kategorie.farbe
                                      : b.farbe || "#2563eb";

                                    return (
                                      <Card
                                        key={b.id}
                                        sx={{
                                          mb: 0.5,
                                          backgroundColor: farbe,
                                          p: 0.5,
                                          cursor: "pointer",
                                        }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditingBelegung(b);
                                          setFormData(b);
                                          setSelectedRaum(raum);
                                          setDialogOpen(true);
                                        }}
                                      >
                                        <CardContent sx={{ p: 0.5 }}>
                                          <Typography
                                            variant="caption"
                                            sx={{
                                              color: "white",
                                              fontWeight: "bold",
                                              display: "block",
                                              overflow: "hidden",
                                              textOverflow: "ellipsis",
                                            }}
                                          >
                                            {b.titel}
                                          </Typography>
                                          <Typography
                                            variant="caption"
                                            sx={{
                                              color: "white",
                                              fontSize: "0.7rem",
                                            }}
                                          >
                                            {b.startzeit}
                                          </Typography>
                                        </CardContent>
                                      </Card>
                                    );
                                  })}
                                </Box>
                              </>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      ))}

      {/* Auswahl-Dialog bei Tagesklick */}
      <Dialog
        open={actionDialogOpen}
        onClose={() => setActionDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Aktion wählen</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>Datum: {selectedDate}</Typography>
          <Stack spacing={1}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setFormData((prev) => ({
                  ...prev,
                  raum: selectedRaum?.id ? [selectedRaum.id] : [],
                  datum_start: selectedDate,
                  datum_ende: "",
                }));
                setActionDialogOpen(false);
                setDialogOpen(true);
              }}
            >
              Neuen Termin anlegen
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                setActionDialogOpen(false);
                setDayViewOpen(true);
              }}
            >
              Tagesansicht öffnen
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>

      {/* Dialog für neue/bearbeitete Buchung */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingBelegung ? "Buchung bearbeiten" : "Neue Buchung"}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            label="Räume"
            fullWidth
            margin="normal"
            select
            SelectProps={{ multiple: true }}
            value={formData.raum}
            onChange={(e) => {
              const value = e.target.value;
              const ids = Array.isArray(value)
                ? value.map((v) => Number(v))
                : [];
              setFormData({ ...formData, raum: ids });
            }}
          >
            {raeume.map((r) => (
              <MenuItem key={r.id} value={r.id}>
                {r.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Titel"
            fullWidth
            margin="normal"
            value={formData.titel}
            onChange={(e) =>
              setFormData({ ...formData, titel: e.target.value })
            }
          />

          <TextField
            label="Kontaktperson"
            fullWidth
            margin="normal"
            value={formData.kontaktperson}
            onChange={(e) =>
              setFormData({ ...formData, kontaktperson: e.target.value })
            }
          />

          <TextField
            label="Telefon"
            fullWidth
            margin="normal"
            value={formData.telefon}
            onChange={(e) =>
              setFormData({ ...formData, telefon: e.target.value })
            }
          />

          <TextField
            label="Teilnehmerzahl"
            fullWidth
            margin="normal"
            type="number"
            value={formData.teilnehmerzahl}
            onChange={(e) =>
              setFormData({ ...formData, teilnehmerzahl: e.target.value })
            }
          />

          <TextField
            label="Startdatum"
            fullWidth
            margin="normal"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={formData.datum_start}
            onChange={(e) =>
              setFormData({ ...formData, datum_start: e.target.value })
            }
          />

          <TextField
            label="Enddatum (optional)"
            fullWidth
            margin="normal"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={formData.datum_ende || ""}
            onChange={(e) =>
              setFormData({ ...formData, datum_ende: e.target.value })
            }
          />

          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            <TextField
              label="Startzeit"
              type="time"
              value={formData.startzeit}
              onChange={(e) =>
                setFormData({ ...formData, startzeit: e.target.value })
              }
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Endzeit"
              type="time"
              value={formData.endzeit}
              onChange={(e) =>
                setFormData({ ...formData, endzeit: e.target.value })
              }
              InputLabelProps={{ shrink: true }}
            />
          </Stack>

          <TextField
            label="Kategorie"
            fullWidth
            margin="normal"
            select
            value={formData.kategorie_neu || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                kategorie_neu: Number(e.target.value),
              })
            }
          >
            {kategorien.map((kat) => (
              <MenuItem key={kat.id} value={kat.id}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      bgcolor: kat.farbe,
                      borderRadius: "50%",
                    }}
                  />
                  {kat.bezeichnung}
                </Box>
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Wiederholung"
            fullWidth
            margin="normal"
            select
            value={formData.wiederholung}
            onChange={(e) =>
              setFormData({ ...formData, wiederholung: e.target.value })
            }
          >
            <MenuItem value="keine">Keine</MenuItem>
            <MenuItem value="täglich">Täglich</MenuItem>
            <MenuItem value="wöchentlich">Wöchentlich</MenuItem>
            <MenuItem value="monatlich">Monatlich</MenuItem>
          </TextField>

          {formData.wiederholung !== "keine" && (
            <TextField
              label="Wiederholung bis"
              fullWidth
              margin="normal"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={formData.wiederholung_bis || ""}
              onChange={(e) =>
                setFormData({ ...formData, wiederholung_bis: e.target.value })
              }
            />
          )}

          <TextField
            label="Beschreibung"
            fullWidth
            margin="normal"
            multiline
            rows={3}
            value={formData.beschreibung}
            onChange={(e) =>
              setFormData({ ...formData, beschreibung: e.target.value })
            }
          />
        </DialogContent>
        <DialogActions>
          {editingBelegung && (
            <Button
              color="error"
              onClick={() => {
                confirmDelete(editingBelegung.id);
              }}
            >
              Löschen
            </Button>
          )}
          <Button onClick={() => setDialogOpen(false)}>Abbrechen</Button>
          <Button onClick={handleSave} variant="contained">
            Speichern
          </Button>
        </DialogActions>
      </Dialog>
      {/* Bestätigungsdialog für Löschen */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Löschen bestätigen</DialogTitle>
        <DialogContent>
          <Typography>
            Möchten Sie diesen Termin wirklich löschen? Diese Aktion kann nicht
            rückgängig gemacht werden.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Abbrechen</Button>
          <Button color="error" variant="contained" onClick={performDelete}>
            Löschen
          </Button>
        </DialogActions>
      </Dialog>

      {/* Tagesansicht Dialog */}
      <Dialog
        open={dayViewOpen}
        onClose={() => setDayViewOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Tagesansicht – {selectedDate}</DialogTitle>
        <DialogContent>
          <Stack direction="row" spacing={2}>
            <Box sx={{ flex: 1 }}>
              {raeume.map((raum) => {
                const dayBelegungen = getBelegungenForDay(
                  Number(selectedDate?.split("-")[2]),
                  raum
                );
                return (
                  <Box key={raum.id} sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ mb: 1 }}>
                      {raum.name}
                    </Typography>
                    {dayBelegungen.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        Keine Termine
                      </Typography>
                    ) : (
                      dayBelegungen.map((b) => {
                        const kategorie = kategorien.find(
                          (k) => k.id === b.kategorie_neu
                        );
                        const farbe = kategorie
                          ? kategorie.farbe
                          : b.farbe || "#2563eb";
                        return (
                          <Card
                            key={`${raum.id}-${b.id}`}
                            sx={{
                              mb: 1,
                              backgroundColor: farbe,
                              cursor: "pointer",
                            }}
                            onClick={() => {
                              setEditingBelegung(b);
                              setFormData(b);
                              setSelectedRaum(raum);
                              setDayViewOpen(false);
                              setDialogOpen(true);
                            }}
                          >
                            <CardContent sx={{ p: 1 }}>
                              <Typography
                                variant="body2"
                                sx={{ color: "white", fontWeight: "bold" }}
                              >
                                {b.titel}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{ color: "white" }}
                              >
                                {b.startzeit} – {b.endzeit}
                              </Typography>
                            </CardContent>
                          </Card>
                        );
                      })
                    )}
                  </Box>
                );
              })}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDayViewOpen(false)}>Schließen</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
