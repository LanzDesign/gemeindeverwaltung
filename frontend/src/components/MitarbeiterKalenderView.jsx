import React, { useState, useMemo, useEffect } from "react";
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
  useTheme,
  useMediaQuery,
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
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PrintIcon from "@mui/icons-material/Print";
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

export default function MitarbeiterKalenderView() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [currentDate, setCurrentDate] = useState(new Date());
  const [mitarbeiter, setMitarbeiter] = useState([]);
  const [eintraege, setEintraege] = useState([]);
  const [kategorien, setKategorien] = useState([]);
  const [feiertage, setFeiertage] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [selectedMitarbeiter, setSelectedMitarbeiter] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [mitarbeiterDetailsOpen, setMitarbeiterDetailsOpen] = useState(false);
  const [selectedMitarbeiterDetails, setSelectedMitarbeiterDetails] = useState(null);
  const [detailsTimeRange, setDetailsTimeRange] = useState("month"); // "day", "week", "month"
  const [formData, setFormData] = useState({
    typ: "termin",
    titel: "",
    datum_start: "",
    datum_ende: "",
    startzeit: "09:00",
    endzeit: "17:00",
    ganztaegig: false,
    halbtags: false,
    beschreibung: "",
    kategorie: null,
  });

  useEffect(() => {
    loadData();
  }, [currentDate]);

  const loadData = async () => {
    try {
      const jahr = currentDate.getFullYear();
      const monat = currentDate.getMonth() + 1;

      const [mitarbeiterRes, eintraegeRes, kategorienRes, feiertageRes] =
        await Promise.all([
          axiosInstance.get("/mitarbeiter/"),
          axiosInstance.get("/mitarbeitertermine/"),
          axiosInstance.get("/mitarbeiterkategorien/"),
          axiosInstance.get(`/feiertage/?jahr=${jahr}&monat=${monat}`),
        ]);
      setMitarbeiter(mitarbeiterRes.data);
      setEintraege(eintraegeRes.data);
      setKategorien(kategorienRes.data);
      setFeiertage(feiertageRes.data.feiertage || []);
    } catch (error) {
      console.error("Fehler beim Laden:", error);
    }
  };

  // Berechne Tage im Monat
  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const lastDay = new Date(year, month + 1, 0);

    const days = [];
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d);
      const dayOfWeek = date.getDay();
      const weekdayMondayStart = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const dateString = date.toISOString().split("T")[0];

      // Feiertag prüfen
      const feiertag = feiertage.find((ft) => ft.datum === dateString);

      days.push({
        day: d,
        weekday: dayOfWeek,
        weekdayMondayStart: weekdayMondayStart,
        date: date,
        dateString: dateString,
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
        feiertag: feiertag || null,
      });
    }
    return days;
  }, [currentDate, feiertage]);

  // Hole Einträge für bestimmten Tag und Mitarbeiter
  const getEntriesForDay = (mitarbeiterId, dateString) => {
    return eintraege.filter((entry) => {
      const matchesMitarbeiter = entry.mitarbeiter === mitarbeiterId;

      // Prüfe ob Datum im Bereich liegt
      const entryStart = entry.datum_start;
      const entryEnd = entry.datum_ende || entry.datum_start;
      const inRange = dateString >= entryStart && dateString <= entryEnd;

      return matchesMitarbeiter && inRange;
    });
  };

  const handlePrevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleCellClick = (mitarbeiterId, dateString) => {
    setSelectedMitarbeiter(mitarbeiterId);
    setSelectedDate(dateString);
    setFormData({
      ...formData,
      datum_start: dateString,
      datum_ende: dateString,
    });
    setEditingEntry(null);
    setDialogOpen(true);
  };

  const handleEditEntry = (entry) => {
    setEditingEntry(entry);
    setSelectedMitarbeiter(entry.mitarbeiter);
    setFormData({
      typ: entry.typ,
      titel: entry.titel,
      datum_start: entry.datum_start,
      datum_ende: entry.datum_ende || entry.datum_start,
      startzeit: entry.startzeit || "09:00",
      endzeit: entry.endzeit || "17:00",
      ganztaegig: entry.ganztaegig || false,
      halbtags: entry.halbtags || false,
      beschreibung: entry.beschreibung || "",
      kategorie: entry.kategorie,
    });
    setDialogOpen(true);
  };

  const handleSaveEntry = async () => {
    try {
      const payload = {
        mitarbeiter: selectedMitarbeiter,
        ...formData,
      };

      if (editingEntry) {
        await axiosInstance.put(
          `/mitarbeitertermine/${editingEntry.id}/`,
          payload
        );
      } else {
        await axiosInstance.post("/mitarbeitertermine/", payload);
      }

      setDialogOpen(false);
      loadData();
    } catch (error) {
      console.error("Fehler beim Speichern:", error);
    }
  };

  const handleDeleteEntry = async (entryId) => {
    if (!window.confirm("Eintrag löschen?")) return;
    try {
      await axiosInstance.delete(`/mitarbeitertermine/${entryId}/`);
      setDialogOpen(false);
      loadData();
    } catch (error) {
      console.error("Fehler beim Löschen:", error);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleOpenMitarbeiterDetails = (mitarbeiter) => {
    setSelectedMitarbeiterDetails(mitarbeiter);
    setMitarbeiterDetailsOpen(true);
  };

  const getFilteredEntriesForMitarbeiter = (mitarbeiterId) => {
    const filtered = eintraege.filter(e => e.mitarbeiter === mitarbeiterId);
    
    if (detailsTimeRange === "day") {
      const today = new Date().toISOString().split("T")[0];
      return filtered.filter(e => {
        return e.datum_start <= today && (e.datum_ende || e.datum_start) >= today;
      });
    } else if (detailsTimeRange === "week") {
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay() + 1); // Montag
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6); // Sonntag
      const startStr = weekStart.toISOString().split("T")[0];
      const endStr = weekEnd.toISOString().split("T")[0];
      return filtered.filter(e => {
        return e.datum_start <= endStr && (e.datum_ende || e.datum_start) >= startStr;
      });
    } else { // month
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, "0");
      const monthStr = `${year}-${month}`;
      return filtered.filter(e => {
        return e.datum_start.startsWith(monthStr) || (e.datum_ende && e.datum_ende.startsWith(monthStr));
      });
    }
  };

  const renderCell = (mitarbeiterId, dayInfo) => {
    const entries = getEntriesForDay(mitarbeiterId, dayInfo.dateString);
    const isFeiertag = !!dayInfo.feiertag;

    return (
      <TableCell
        key={dayInfo.day}
        align="center"
        onClick={() => handleCellClick(mitarbeiterId, dayInfo.dateString)}
        sx={{
          minWidth: isMobile ? 28 : 35,
          maxWidth: isMobile ? 28 : 35,
          width: isMobile ? 28 : 35,
          padding: "2px",
          backgroundColor: isFeiertag
            ? "#fee2e2"
            : dayInfo.isWeekend
            ? "#f5f5f5"
            : "white",
          borderRight: "1px solid #ddd",
          borderBottom: "1px solid #ddd",
          cursor: "pointer",
          position: "relative",
          verticalAlign: "middle",
          height: isMobile ? "40px" : "50px",
          "&:hover": {
            backgroundColor: "#e3f2fd",
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 0.3,
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
          }}
        >
          {entries.map((entry, idx) => {
            const kat = kategorien.find((k) => k.id === entry.kategorie);
            const color = kat?.farbe || "#6b7280";
            const abk = kat?.abkuerzung || "?";
            const isHalbtags = entry.halbtags;
            const isGanztags = entry.ganztaegig;

            return (
              <Tooltip
                key={idx}
                title={`${entry.titel}${isHalbtags ? ' (halbtags)' : isGanztags ? ' (ganztags)' : ''} (${entry.datum_start}${
                  entry.datum_ende && entry.datum_ende !== entry.datum_start
                    ? " - " + entry.datum_ende
                    : ""
                })`}
                arrow
                placement="top"
              >
                <Box
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditEntry(entry);
                  }}
                  sx={{
                    backgroundColor: color,
                    color: "white",
                    fontSize: isMobile ? "9px" : "11px",
                    fontWeight: "bold",
                    padding: "2px 4px",
                    borderRadius: "3px",
                    minWidth: isMobile ? "18px" : "22px",
                    textAlign: "center",
                    lineHeight: 1.2,
                    cursor: "pointer",
                    width: isHalbtags ? "50%" : isGanztags ? "100%" : "auto",
                    backgroundImage: isHalbtags 
                      ? `linear-gradient(to right, ${color} 50%, transparent 50%)`
                      : "none",
                    "&:hover": {
                      opacity: 0.8,
                    },
                  }}
                >
                  {abk}
                </Box>
              </Tooltip>
            );
          })}
        </Box>
      </TableCell>
    );
  };

  return (
    <Box>
      {/* Header mit Monatsnavigation */}
      <Stack
        direction="row"
        spacing={2}
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton
            onClick={handlePrevMonth}
            size={isMobile ? "small" : "medium"}
          >
            <ChevronLeftIcon />
          </IconButton>
          <Typography
            variant={isMobile ? "h6" : "h5"}
            sx={{ minWidth: 180, textAlign: "center" }}
          >
            {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
          </Typography>
          <IconButton
            onClick={handleNextMonth}
            size={isMobile ? "small" : "medium"}
          >
            <ChevronRightIcon />
          </IconButton>
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button onClick={handleToday} size="small" variant="outlined">
            Heute
          </Button>
          <Button
            onClick={handlePrint}
            size="small"
            variant="outlined"
            startIcon={<PrintIcon />}
          >
            Drucken
          </Button>
        </Stack>
      </Stack>

      {/* Legende */}
      <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2, gap: 1 }}>
        {kategorien.map((kat) => (
          <Box
            key={kat.id}
            sx={{
              backgroundColor: kat.farbe,
              color: "white",
              padding: "4px 12px",
              borderRadius: "4px",
              fontSize: "12px",
              fontWeight: "bold",
            }}
          >
            {kat.abkuerzung} = {kat.bezeichnung}
          </Box>
        ))}
      </Stack>

      {/* Kalender Tabelle */}
      <TableContainer
        component={Paper}
        sx={{
          maxHeight: "calc(100vh - 280px)",
          overflowX: "auto",
          overflowY: "auto",
          border: "1px solid #ddd",
        }}
      >
        <Table stickyHeader size="small" sx={{ tableLayout: "fixed" }}>
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  position: "sticky",
                  left: 0,
                  zIndex: 4,
                  backgroundColor: "#5b9bd5",
                  color: "white",
                  fontWeight: "bold",
                  minWidth: isMobile ? 100 : 180,
                  maxWidth: isMobile ? 100 : 180,
                  width: isMobile ? 100 : 180,
                  borderRight: "2px solid #ddd",
                  borderBottom: "2px solid #ddd",
                  padding: "8px",
                  fontSize: isMobile ? "11px" : "13px",
                }}
              >
                Mitarbeiter
              </TableCell>

              {daysInMonth.map((dayInfo) => (
                <TableCell
                  key={dayInfo.day}
                  align="center"
                  sx={{
                    minWidth: isMobile ? 28 : 35,
                    maxWidth: isMobile ? 28 : 35,
                    width: isMobile ? 28 : 35,
                    padding: "4px 2px",
                    backgroundColor: dayInfo.feiertag
                      ? "#dc2626"
                      : dayInfo.isWeekend
                      ? "#e0e0e0"
                      : "#5b9bd5",
                    color: "white",
                    fontWeight: "bold",
                    fontSize: isMobile ? "10px" : "11px",
                    borderRight: "1px solid #ddd",
                    borderBottom: "2px solid #ddd",
                  }}
                >
                  <Tooltip
                    title={dayInfo.feiertag ? dayInfo.feiertag.name : ""}
                    arrow
                  >
                    <div>
                      <div>{dayInfo.day}</div>
                      <div style={{ fontSize: isMobile ? "8px" : "9px" }}>
                        {dayInfo.feiertag
                          ? "F"
                          : DAY_NAMES_MONDAY_START[dayInfo.weekdayMondayStart]}
                      </div>
                    </div>
                  </Tooltip>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {mitarbeiter.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={daysInMonth.length + 1}
                  align="center"
                  sx={{ py: 4 }}
                >
                  <Typography color="text.secondary">
                    Keine Mitarbeiter vorhanden
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              mitarbeiter.map((ma) => (
                <TableRow key={ma.id}>
                  <TableCell
                    sx={{
                      position: "sticky",
                      left: 0,
                      zIndex: 2,
                      backgroundColor: "white",
                      fontWeight: 500,
                      minWidth: isMobile ? 100 : 180,
                      maxWidth: isMobile ? 100 : 180,
                      width: isMobile ? 100 : 180,
                      borderRight: "2px solid #ddd",
                      borderBottom: "1px solid #ddd",
                      fontSize: isMobile ? "11px" : "13px",
                      padding: "8px",
                      cursor: "pointer",
                      "&:hover": {
                        backgroundColor: "#f5f5f5",
                      },
                    }}
                    onClick={() => handleOpenMitarbeiterDetails(ma)}
                  >
                    <div>{ma.vollstaendiger_name}</div>
                    <Typography variant="caption" color="text.secondary">
                      Urlaub: {ma.urlaubstage_verfuegbar}/
                      {ma.urlaubstage_gesamt}
                    </Typography>
                  </TableCell>
                  {daysInMonth.map((dayInfo) => renderCell(ma.id, dayInfo))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog für Termin-Erstellung/Bearbeitung */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingEntry ? "Eintrag bearbeiten" : "Neuer Eintrag"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select
              label="Typ"
              value={formData.typ}
              onChange={(e) =>
                setFormData({ ...formData, typ: e.target.value })
              }
              fullWidth
            >
              <MenuItem value="termin">Termin</MenuItem>
              <MenuItem value="urlaub">Urlaub</MenuItem>
              <MenuItem value="krankheit">Krankheit</MenuItem>
              <MenuItem value="unentschuldigt">Unentschuldigt</MenuItem>
              <MenuItem value="leitung">Leitung</MenuItem>
              <MenuItem value="extern">Extern</MenuItem>
            </TextField>

            <TextField
              label="Titel"
              value={formData.titel}
              onChange={(e) =>
                setFormData({ ...formData, titel: e.target.value })
              }
              fullWidth
            />

            <Stack direction="row" spacing={2}>
              <TextField
                label="Von"
                type="date"
                value={formData.datum_start}
                onChange={(e) =>
                  setFormData({ ...formData, datum_start: e.target.value })
                }
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Bis"
                type="date"
                value={formData.datum_ende}
                onChange={(e) =>
                  setFormData({ ...formData, datum_ende: e.target.value })
                }
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Stack>

            <Stack direction="row" spacing={2}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.ganztaegig}
                    onChange={(e) => {
                      const isChecked = e.target.checked;
                      setFormData({ 
                        ...formData, 
                        ganztaegig: isChecked,
                        halbtags: isChecked ? false : formData.halbtags
                      });
                    }}
                  />
                }
                label="Ganztägig"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.halbtags}
                    onChange={(e) => {
                      const isChecked = e.target.checked;
                      setFormData({ 
                        ...formData, 
                        halbtags: isChecked,
                        ganztaegig: isChecked ? false : formData.ganztaegig
                      });
                    }}
                  />
                }
                label="Halbtags"
              />
            </Stack>

            {!formData.ganztaegig && !formData.halbtags && (
              <Stack direction="row" spacing={2}>
                <TextField
                  label="Startzeit"
                  type="time"
                  value={formData.startzeit}
                  onChange={(e) =>
                    setFormData({ ...formData, startzeit: e.target.value })
                  }
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="Endzeit"
                  type="time"
                  value={formData.endzeit}
                  onChange={(e) =>
                    setFormData({ ...formData, endzeit: e.target.value })
                  }
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Stack>
            )}

            <TextField
              select
              label="Kategorie"
              value={formData.kategorie || ""}
              onChange={(e) =>
                setFormData({ ...formData, kategorie: e.target.value || null })
              }
              fullWidth
            >
              <MenuItem value="">Keine</MenuItem>
              {kategorien.map((kat) => (
                <MenuItem key={kat.id} value={kat.id}>
                  {kat.bezeichnung} ({kat.abkuerzung})
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Beschreibung"
              value={formData.beschreibung}
              onChange={(e) =>
                setFormData({ ...formData, beschreibung: e.target.value })
              }
              fullWidth
              multiline
              rows={3}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          {editingEntry && (
            <Button
              onClick={() => handleDeleteEntry(editingEntry.id)}
              color="error"
            >
              Löschen
            </Button>
          )}
          <Button onClick={() => setDialogOpen(false)}>Abbrechen</Button>
          <Button onClick={handleSaveEntry} variant="contained">
            Speichern
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog für Mitarbeiter-Details */}
      <Dialog
        open={mitarbeiterDetailsOpen}
        onClose={() => setMitarbeiterDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <div>
              {selectedMitarbeiterDetails?.vollstaendiger_name}
              <Typography variant="caption" display="block" color="text.secondary">
                Urlaub: {selectedMitarbeiterDetails?.urlaubstage_verfuegbar}/{selectedMitarbeiterDetails?.urlaubstage_gesamt} Tage verfügbar
              </Typography>
            </div>
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                variant={detailsTimeRange === "day" ? "contained" : "outlined"}
                onClick={() => setDetailsTimeRange("day")}
              >
                Tag
              </Button>
              <Button
                size="small"
                variant={detailsTimeRange === "week" ? "contained" : "outlined"}
                onClick={() => setDetailsTimeRange("week")}
              >
                Woche
              </Button>
              <Button
                size="small"
                variant={detailsTimeRange === "month" ? "contained" : "outlined"}
                onClick={() => setDetailsTimeRange("month")}
              >
                Monat
              </Button>
            </Stack>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {selectedMitarbeiterDetails && (() => {
            const entries = getFilteredEntriesForMitarbeiter(selectedMitarbeiterDetails.id);
            const sortedEntries = [...entries].sort((a, b) => 
              new Date(b.datum_start) - new Date(a.datum_start)
            );

            if (sortedEntries.length === 0) {
              return (
                <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                  Keine Einträge gefunden
                </Typography>
              );
            }

            return (
              <Stack spacing={2} sx={{ mt: 2 }}>
                {sortedEntries.map((entry) => {
                  const kat = kategorien.find((k) => k.id === entry.kategorie);
                  const isMultiDay = entry.datum_ende && entry.datum_ende !== entry.datum_start;
                  
                  return (
                    <Paper
                      key={entry.id}
                      sx={{
                        p: 2,
                        border: `2px solid ${kat?.farbe || "#6b7280"}`,
                        borderRadius: 2,
                        cursor: "pointer",
                        "&:hover": {
                          boxShadow: 2,
                        },
                      }}
                      onClick={() => {
                        setMitarbeiterDetailsOpen(false);
                        handleEditEntry(entry);
                      }}
                    >
                      <Stack direction="row" spacing={2} alignItems="flex-start">
                        <Box
                          sx={{
                            width: 60,
                            height: 60,
                            backgroundColor: kat?.farbe || "#6b7280",
                            color: "white",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: 2,
                            fontWeight: "bold",
                            fontSize: "1.5rem",
                          }}
                        >
                          {kat?.abkuerzung || "?"}
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" gutterBottom>
                            {entry.titel}
                          </Typography>
                          <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ mb: 1 }}>
                            <Chip
                              label={isMultiDay 
                                ? `${entry.datum_start} bis ${entry.datum_ende}`
                                : entry.datum_start
                              }
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                            {entry.ganztaegig && (
                              <Chip label="Ganztägig" size="small" color="success" />
                            )}
                            {entry.halbtags && (
                              <Chip label="Halbtags" size="small" color="warning" />
                            )}
                            {!entry.ganztaegig && !entry.halbtags && entry.startzeit && (
                              <Chip
                                label={`${entry.startzeit} - ${entry.endzeit}`}
                                size="small"
                                variant="outlined"
                              />
                            )}
                            <Chip
                              label={`${entry.dauer_tage} Tag${entry.dauer_tage !== 1 ? 'e' : ''}`}
                              size="small"
                            />
                          </Stack>
                          {entry.beschreibung && (
                            <Typography variant="body2" color="text.secondary">
                              {entry.beschreibung}
                            </Typography>
                          )}
                        </Box>
                      </Stack>
                    </Paper>
                  );
                })}
              </Stack>
            );
          })()}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMitarbeiterDetailsOpen(false)}>Schließen</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
