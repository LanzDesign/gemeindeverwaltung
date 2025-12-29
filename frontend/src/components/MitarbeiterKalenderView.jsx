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
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
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
  const [formData, setFormData] = useState({
    typ: "termin",
    titel: "",
    datum_start: "",
    datum_ende: "",
    startzeit: "09:00",
    endzeit: "17:00",
    ganztaegig: false,
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
      
      const [mitarbeiterRes, eintraegeRes, kategorienRes, feiertageRes] = await Promise.all([
        axiosInstance.get("/mitarbeiter/"),
        axiosInstance.get("/mitarbeitertermine/"),
        axiosInstance.get("/kategorien/"),
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
      const feiertag = feiertage.find(ft => ft.datum === dateString);
      
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
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
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
        await axiosInstance.put(`/mitarbeitertermine/${editingEntry.id}/`, payload);
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
      loadData();
    } catch (error) {
      console.error("Fehler beim Löschen:", error);
    }
  };

  const handlePrint = () => {
    window.print();
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
          backgroundColor: isFeiertag ? "#fee2e2" : (dayInfo.isWeekend ? "#f5f5f5" : "white"),
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
            const kat = kategorien.find(k => k.id === entry.kategorie);
            const color = kat?.farbe || "#6b7280";
            const abk = kat?.abkuerzung || "?";
            
            return (
              <Tooltip
                key={idx}
                title={`${entry.titel} (${entry.datum_start}${entry.datum_ende && entry.datum_ende !== entry.datum_start ? ' - ' + entry.datum_ende : ''})`}
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
          <IconButton onClick={handlePrevMonth} size={isMobile ? "small" : "medium"}>
            <ChevronLeftIcon />
          </IconButton>
          <Typography variant={isMobile ? "h6" : "h5"} sx={{ minWidth: 180, textAlign: "center" }}>
            {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
          </Typography>
          <IconButton onClick={handleNextMonth} size={isMobile ? "small" : "medium"}>
            <ChevronRightIcon />
          </IconButton>
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button onClick={handleToday} size="small" variant="outlined">
            Heute
          </Button>
          <Button onClick={handlePrint} size="small" variant="outlined" startIcon={<PrintIcon />}>
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
                  zIndex: 3,
                  backgroundColor: "#5b9bd5",
                  color: "white",
                  fontWeight: "bold",
                  minWidth: isMobile ? 100 : 150,
                  maxWidth: isMobile ? 100 : 150,
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
                    backgroundColor: dayInfo.feiertag ? "#dc2626" : (dayInfo.isWeekend ? "#e0e0e0" : "#5b9bd5"),
                    color: "white",
                    fontWeight: "bold",
                    fontSize: isMobile ? "10px" : "11px",
                    borderRight: "1px solid #ddd",
                    borderBottom: "2px solid #ddd",
                  }}
                >
                  <Tooltip title={dayInfo.feiertag ? dayInfo.feiertag.name : ""} arrow>
                    <div>
                      <div>{dayInfo.day}</div>
                      <div style={{ fontSize: isMobile ? "8px" : "9px" }}>
                        {dayInfo.feiertag ? "F" : DAY_NAMES_MONDAY_START[dayInfo.weekdayMondayStart]}
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
                <TableCell colSpan={daysInMonth.length + 1} align="center" sx={{ py: 4 }}>
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
                      zIndex: 1,
                      backgroundColor: "white",
                      fontWeight: 500,
                      borderRight: "2px solid #ddd",
                      borderBottom: "1px solid #ddd",
                      fontSize: isMobile ? "11px" : "13px",
                      padding: "8px",
                    }}
                  >
                    <div>{ma.vollstaendiger_name}</div>
                    <Typography variant="caption" color="text.secondary">
                      Urlaub: {ma.urlaubstage_verfuegbar}/{ma.urlaubstage_gesamt}
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
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingEntry ? "Eintrag bearbeiten" : "Neuer Eintrag"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select
              label="Typ"
              value={formData.typ}
              onChange={(e) => setFormData({ ...formData, typ: e.target.value })}
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
              onChange={(e) => setFormData({ ...formData, titel: e.target.value })}
              fullWidth
            />

            <Stack direction="row" spacing={2}>
              <TextField
                label="Von"
                type="date"
                value={formData.datum_start}
                onChange={(e) => setFormData({ ...formData, datum_start: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Bis"
                type="date"
                value={formData.datum_ende}
                onChange={(e) => setFormData({ ...formData, datum_ende: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Stack>

            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.ganztaegig}
                  onChange={(e) => setFormData({ ...formData, ganztaegig: e.target.checked })}
                />
              }
              label="Ganztägig"
            />

            {!formData.ganztaegig && (
              <Stack direction="row" spacing={2}>
                <TextField
                  label="Startzeit"
                  type="time"
                  value={formData.startzeit}
                  onChange={(e) => setFormData({ ...formData, startzeit: e.target.value })}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="Endzeit"
                  type="time"
                  value={formData.endzeit}
                  onChange={(e) => setFormData({ ...formData, endzeit: e.target.value })}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Stack>
            )}

            <TextField
              select
              label="Kategorie"
              value={formData.kategorie || ""}
              onChange={(e) => setFormData({ ...formData, kategorie: e.target.value || null })}
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
              onChange={(e) => setFormData({ ...formData, beschreibung: e.target.value })}
              fullWidth
              multiline
              rows={3}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          {editingEntry && (
            <Button onClick={() => handleDeleteEntry(editingEntry.id)} color="error">
              Löschen
            </Button>
          )}
          <Button onClick={() => setDialogOpen(false)}>Abbrechen</Button>
          <Button onClick={handleSaveEntry} variant="contained">
            Speichern
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
