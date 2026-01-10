import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Chip,
  Stack,
  useTheme,
  alpha,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Alert,
  Divider,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import {
  ChevronLeft,
  ChevronRight,
  Today,
  Add,
  Delete,
  Edit,
  CalendarViewMonth,
  CalendarViewDay,
  Meeting,
  Warning,
} from "@mui/icons-material";
import axiosInstance from "../api/axios";

// Feiertage für Baden-Württemberg
const getHolidays = (year) => {
  const easterDate = getEasterDate(year);
  const addDays = (date, days) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  };
  const fd = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;

  return {
    [`${year}-01-01`]: "Neujahr",
    [`${year}-01-06`]: "Heilige Drei Könige (BW)",
    [fd(addDays(easterDate, -2))]: "Karfreitag",
    [fd(easterDate)]: "Ostersonntag",
    [fd(addDays(easterDate, 1))]: "Ostermontag",
    [`${year}-05-01`]: "Tag der Arbeit",
    [fd(addDays(easterDate, 39))]: "Christi Himmelfahrt",
    [fd(addDays(easterDate, 49))]: "Pfingstsonntag",
    [fd(addDays(easterDate, 50))]: "Pfingstmontag",
    [fd(addDays(easterDate, 60))]: "Fronleichnam (BW)",
    [`${year}-10-03`]: "Tag der Deutschen Einheit",
    [`${year}-11-01`]: "Allerheiligen (BW)",
    [`${year}-12-25`]: "1. Weihnachtstag",
    [`${year}-12-26`]: "2. Weihnachtstag",
  };
};

const getEasterDate = (year) => {
  const a = year % 19,
    b = Math.floor(year / 100),
    c = year % 100,
    d = Math.floor(b / 4),
    e = b % 4;
  const f = Math.floor((b + 8) / 25),
    g = Math.floor((b - f + 1) / 3),
    h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4),
    k = c % 4,
    l = (32 + 2 * e + 2 * i - h - k) % 7,
    m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31),
    day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
};

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function Raumbelegungsplan() {
  const theme = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("month"); // month, day
  const [buchungen, setBuchungen] = useState({});
  const [raeume, setRaeume] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDayView, setShowDayView] = useState(false);
  
  // Dialog states
  const [openEventDialog, setOpenEventDialog] = useState(false);
  const [openDayDialog, setOpenDayDialog] = useState(false);
  const [openRoomDialog, setOpenRoomDialog] = useState(false);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  
  // Form states
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventTitle, setEventTitle] = useState("");
  const [eventKontaktperson, setEventKontaktperson] = useState("");
  const [eventTelefon, setEventTelefon] = useState("");
  const [eventTeilnehmerzahl, setEventTeilnehmerzahl] = useState("");
  const [eventStartTime, setEventStartTime] = useState("09:00");
  const [eventEndTime, setEventEndTime] = useState("10:00");
  const [eventDescription, setEventDescription] = useState("");
  const [eventKategorie, setEventKategorie] = useState("termin");
  const [eventWiederholung, setEventWiederholung] = useState("keine");
  const [eventWiederholungBis, setEventWiederholungBis] = useState("");
  const [selectedRaeume, setSelectedRaeume] = useState([]);
  
  // Neuer Raum
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomKapazitaet, setNewRoomKapazitaet] = useState("");
  const [newRoomBeschreibung, setNewRoomBeschreibung] = useState("");
  
  const [errorMessage, setErrorMessage] = useState("");

  const colors = {
    primary: "#3b82f6",
    secondary: "#8b5cf6",
    holiday: "#ef4444", // Rot für Feiertage (F)
    termin: "#2563eb", // Blau für Termin (T)
    wiederholung: "#eab308", // Gelb für Wiederholung (W)
    fest: "#9333ea", // Lila für Festgelegt (FT)
  };

  useEffect(() => {
    loadRaeume();
    loadBuchungen();
  }, [currentDate]);

  const loadRaeume = async () => {
    try {
      const response = await axiosInstance.get("/api/kalender/raeume/");
      setRaeume(response.data);
    } catch (error) {
      console.error("Fehler beim Laden der Räume:", error);
    }
  };

  const loadBuchungen = async () => {
    try {
      const response = await axiosInstance.get("/api/kalender/raumbelegungen/");
      
      // Organisiere Buchungen nach Datum
      const buchungenByDate = {};
      response.data.forEach((buchung) => {
        const datum = buchung.datum_start;
        if (!buchungenByDate[datum]) {
          buchungenByDate[datum] = [];
        }
        buchungenByDate[datum].push(buchung);
      });
      
      setBuchungen(buchungenByDate);
    } catch (error) {
      console.error("Fehler beim Laden der Buchungen:", error);
    }
  };

  const getBuchungenForDate = (date) => {
    const dateStr = formatDate(date);
    return buchungen[dateStr] || [];
  };

  const isHoliday = (date) => {
    const holidays = getHolidays(date.getFullYear());
    const dateStr = formatDate(date);
    return holidays[dateStr];
  };

  const getEventColor = (event) => {
    // Wiederholung hat Vorrang
    if (event.wiederholung && event.wiederholung !== "keine") {
      return colors.wiederholung; // Gelb (W)
    }
    
    // Dann Kategorie
    if (event.kategorie === "fest") {
      return colors.fest; // Lila (FT)
    }
    
    return colors.termin; // Blau (T)
  };

  const getEventLabel = (event) => {
    if (event.wiederholung && event.wiederholung !== "keine") {
      return "W";
    }
    if (event.kategorie === "fest") {
      return "FT";
    }
    return "T";
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

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleDayClick = (date) => {
    setSelectedDate(date);
    setOpenDayDialog(true);
  };

  const handleAddEvent = (date) => {
    setSelectedDate(date);
    setEditingEvent(null);
    setEventTitle("");
    setEventKontaktperson("");
    setEventTelefon("");
    setEventTeilnehmerzahl("");
    setEventStartTime("09:00");
    setEventEndTime("10:00");
    setEventDescription("");
    setEventKategorie("termin");
    setEventWiederholung("keine");
    setEventWiederholungBis("");
    setSelectedRaeume([]);
    setErrorMessage("");
    setOpenEventDialog(true);
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setEventTitle(event.titel);
    setEventKontaktperson(event.kontaktperson || "");
    setEventTelefon(event.telefon || "");
    setEventTeilnehmerzahl(event.teilnehmerzahl || "");
    setSelectedDate(new Date(event.datum_start));
    setEventStartTime(event.startzeit);
    setEventEndTime(event.endzeit);
    setEventDescription(event.beschreibung || "");
    setEventKategorie(event.kategorie || "termin");
    setEventWiederholung(event.wiederholung || "keine");
    setEventWiederholungBis(event.wiederholung_bis || "");
    setSelectedRaeume(event.raum || []);
    setErrorMessage("");
    setOpenEventDialog(true);
  };

  const handleDeleteEvent = (eventId) => {
    const event = Object.values(buchungen)
      .flat()
      .find((e) => e.id === eventId);
    
    setConfirmAction({
      type: "delete",
      data: event,
      message: `Möchten Sie den Termin "${event.titel}" wirklich löschen?`,
      onConfirm: async () => {
        try {
          await axiosInstance.delete(`/api/kalender/raumbelegungen/${eventId}/`);
          await loadBuchungen();
          setOpenConfirmDialog(false);
        } catch (error) {
          console.error("Fehler beim Löschen:", error);
          setErrorMessage("Fehler beim Löschen des Termins");
        }
      },
    });
    setOpenConfirmDialog(true);
  };

  const handleSaveEvent = async () => {
    // Validierung
    if (!eventTitle.trim()) {
      setErrorMessage("Bitte geben Sie einen Titel ein");
      return;
    }
    
    if (!eventKontaktperson.trim()) {
      setErrorMessage("Name der Kontaktperson ist ein Pflichtfeld");
      return;
    }
    
    if (!eventTelefon.trim()) {
      setErrorMessage("Telefonnummer ist ein Pflichtfeld");
      return;
    }
    
    if (selectedRaeume.length === 0) {
      setErrorMessage("Bitte wählen Sie mindestens einen Raum aus");
      return;
    }

    const buchungData = {
      titel: eventTitle,
      kontaktperson: eventKontaktperson,
      telefon: eventTelefon,
      teilnehmerzahl: eventTeilnehmerzahl ? parseInt(eventTeilnehmerzahl) : null,
      datum_start: formatDate(selectedDate),
      datum_ende: null,
      startzeit: eventStartTime,
      endzeit: eventEndTime,
      beschreibung: eventDescription,
      kategorie: eventKategorie,
      wiederholung: eventWiederholung,
      wiederholung_bis: eventWiederholungBis || null,
      raum: selectedRaeume,
    };

    try {
      if (editingEvent) {
        // Bestätigungsdialog für Bearbeitung
        setConfirmAction({
          type: "edit",
          data: buchungData,
          message: `Möchten Sie den Termin "${eventTitle}" wirklich bearbeiten?`,
          onConfirm: async () => {
            try {
              await axiosInstance.put(
                `/api/kalender/raumbelegungen/${editingEvent.id}/`,
                buchungData
              );
              await loadBuchungen();
              setOpenEventDialog(false);
              setOpenConfirmDialog(false);
            } catch (error) {
              console.error("Fehler beim Bearbeiten:", error);
              if (error.response?.data?.ueberschneidung) {
                setErrorMessage(
                  `Überschneidung gefunden: ${JSON.stringify(error.response.data.konflikte)}`
                );
              } else {
                setErrorMessage("Fehler beim Bearbeiten des Termins");
              }
              setOpenConfirmDialog(false);
            }
          },
        });
        setOpenConfirmDialog(true);
      } else {
        await axiosInstance.post("/api/kalender/raumbelegungen/", buchungData);
        await loadBuchungen();
        setOpenEventDialog(false);
      }
    } catch (error) {
      console.error("Fehler beim Speichern:", error);
      if (error.response?.data?.ueberschneidung) {
        setErrorMessage(
          `Überschneidung gefunden: ${JSON.stringify(error.response.data.konflikte)}`
        );
      } else if (error.response?.data) {
        const errors = Object.entries(error.response.data)
          .map(([key, value]) => `${key}: ${value}`)
          .join(", ");
        setErrorMessage(`Fehler: ${errors}`);
      } else {
        setErrorMessage("Fehler beim Speichern des Termins");
      }
    }
  };

  const handleCloseEventDialog = () => {
    setOpenEventDialog(false);
    setErrorMessage("");
  };

  const handleOpenRoomDialog = () => {
    setNewRoomName("");
    setNewRoomKapazitaet("");
    setNewRoomBeschreibung("");
    setOpenRoomDialog(true);
  };

  const handleSaveRoom = async () => {
    if (!newRoomName.trim()) {
      setErrorMessage("Bitte geben Sie einen Raumnamen ein");
      return;
    }
    
    if (!newRoomKapazitaet || parseInt(newRoomKapazitaet) <= 0) {
      setErrorMessage("Bitte geben Sie eine gültige Personenanzahl ein");
      return;
    }

    try {
      await axiosInstance.post("/api/kalender/raeume/", {
        name: newRoomName,
        kapazitaet: parseInt(newRoomKapazitaet),
        beschreibung: newRoomBeschreibung,
        aktiv: true,
      });
      await loadRaeume();
      setOpenRoomDialog(false);
    } catch (error) {
      console.error("Fehler beim Anlegen des Raums:", error);
      setErrorMessage("Fehler beim Anlegen des Raums");
    }
  };

  const handleShowDayView = (date) => {
    setSelectedDate(date);
    setShowDayView(true);
    setOpenDayDialog(false);
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Füge leere Tage am Anfang hinzu
    const startDay = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }

    // Füge die Tage des Monats hinzu
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const days = getDaysInMonth(currentDate);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", gap: 3, flexDirection: { xs: "column", md: "row" } }}>
        {/* Kalender */}
        <Paper
          elevation={0}
          sx={{
            flex: 1,
            p: 3,
            borderRadius: 3,
            background:
              theme.palette.mode === "dark"
                ? `linear-gradient(135deg, ${alpha("#3b82f6", 0.05)} 0%, ${alpha(
                    "#6d28d9",
                    0.05
                  )} 100%)`
                : theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          {/* Header */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <Typography variant="h4" fontWeight="bold">
              Raumbelegungsplan
            </Typography>
            
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={handleOpenRoomDialog}
                sx={{ textTransform: "none" }}
              >
                Neuer Raum
              </Button>
              
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(e, newMode) => newMode && setViewMode(newMode)}
                size="small"
              >
                <ToggleButton value="month">
                  <CalendarViewMonth />
                </ToggleButton>
                <ToggleButton value="day">
                  <CalendarViewDay />
                </ToggleButton>
              </ToggleButtonGroup>
            </Stack>
          </Box>

          {/* Navigation */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <Typography variant="h5" fontWeight="bold">
              {currentDate.toLocaleDateString("de-DE", {
                month: "long",
                year: "numeric",
              })}
            </Typography>

            <Stack direction="row" spacing={1}>
              <IconButton onClick={handlePrevMonth} sx={{ bgcolor: alpha(colors.primary, 0.1) }}>
                <ChevronLeft />
              </IconButton>
              <Button
                variant="outlined"
                onClick={handleToday}
                startIcon={<Today />}
                sx={{ textTransform: "none" }}
              >
                Heute
              </Button>
              <IconButton onClick={handleNextMonth} sx={{ bgcolor: alpha(colors.primary, 0.1) }}>
                <ChevronRight />
              </IconButton>
            </Stack>
          </Box>

          {/* Legende */}
          <Box sx={{ mb: 2, display: "flex", gap: 2, flexWrap: "wrap" }}>
            <Chip
              label="Feiertag (F)"
              size="small"
              sx={{ bgcolor: alpha(colors.holiday, 0.2), color: colors.holiday }}
            />
            <Chip
              label="Termin (T)"
              size="small"
              sx={{ bgcolor: alpha(colors.termin, 0.2), color: colors.termin }}
            />
            <Chip
              label="Wiederholung (W)"
              size="small"
              sx={{ bgcolor: alpha(colors.wiederholung, 0.2), color: colors.wiederholung }}
            />
            <Chip
              label="Festgelegt (FT)"
              size="small"
              sx={{ bgcolor: alpha(colors.fest, 0.2), color: colors.fest }}
            />
          </Box>

          {/* Monatsansicht */}
          {viewMode === "month" && (
            <Box>
              {/* Wochentage */}
              <Grid container spacing={1} sx={{ mb: 1 }}>
                {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((day) => (
                  <Grid item xs key={day}>
                    <Typography
                      variant="caption"
                      fontWeight="bold"
                      textAlign="center"
                      display="block"
                      color="text.secondary"
                    >
                      {day}
                    </Typography>
                  </Grid>
                ))}
              </Grid>

              {/* Tage */}
              <Grid container spacing={1}>
                {days.map((day, index) => {
                  if (!day) {
                    return <Grid item xs key={`empty-${index}`} />;
                  }

                  const dayBuchungen = getBuchungenForDate(day);
                  const holiday = isHoliday(day);
                  const isToday =
                    formatDate(day) === formatDate(new Date());

                  return (
                    <Grid item xs key={index}>
                      <Paper
                        onClick={() => handleDayClick(day)}
                        sx={{
                          p: 1,
                          minHeight: 100,
                          cursor: "pointer",
                          bgcolor: holiday
                            ? alpha(colors.holiday, 0.05)
                            : isToday
                            ? alpha(colors.primary, 0.05)
                            : "background.paper",
                          border: isToday
                            ? `2px solid ${colors.primary}`
                            : `1px solid ${theme.palette.divider}`,
                          "&:hover": {
                            bgcolor: alpha(colors.primary, 0.1),
                            transform: "scale(1.02)",
                          },
                          transition: "all 0.2s",
                        }}
                      >
                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                          <Typography
                            variant="body2"
                            fontWeight={isToday ? "bold" : "normal"}
                            color={holiday ? colors.holiday : "text.primary"}
                          >
                            {day.getDate()}
                          </Typography>
                          {holiday && (
                            <Chip
                              label="F"
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: "0.65rem",
                                bgcolor: alpha(colors.holiday, 0.2),
                                color: colors.holiday,
                              }}
                            />
                          )}
                        </Box>

                        <Box sx={{ mt: 0.5 }}>
                          {dayBuchungen.slice(0, 3).map((buchung, idx) => (
                            <Box
                              key={idx}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditEvent(buchung);
                              }}
                              sx={{
                                p: 0.3,
                                mb: 0.3,
                                borderRadius: 0.5,
                                bgcolor: alpha(getEventColor(buchung), 0.9),
                                color: "white",
                                fontSize: "0.65rem",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                              }}
                            >
                              <Chip
                                label={getEventLabel(buchung)}
                                size="small"
                                sx={{
                                  height: 14,
                                  fontSize: "0.6rem",
                                  bgcolor: "rgba(255,255,255,0.3)",
                                  color: "white",
                                }}
                              />
                              <Typography variant="caption" noWrap>
                                {buchung.titel}
                              </Typography>
                            </Box>
                          ))}
                          {dayBuchungen.length > 3 && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ fontSize: "0.65rem" }}
                            >
                              +{dayBuchungen.length - 3} weitere
                            </Typography>
                          )}
                        </Box>
                      </Paper>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          )}

          {/* Tagesansicht */}
          {viewMode === "day" && selectedDate && (
            <Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" fontWeight="bold">
                  {selectedDate.toLocaleDateString("de-DE", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", gap: 2 }}>
                {/* Zeit-Raster */}
                <Box sx={{ flex: 1 }}>
                  {Array.from({ length: 24 }, (_, hour) => {
                    const hourBuchungen = getBuchungenForDate(selectedDate).filter((b) => {
                      const eventHour = parseInt(b.startzeit?.split(":")[0] || 0);
                      return eventHour === hour;
                    });

                    return (
                      <Box
                        key={hour}
                        sx={{
                          display: "flex",
                          borderBottom: 1,
                          borderColor: "divider",
                          minHeight: 60,
                        }}
                      >
                        <Box
                          sx={{
                            width: 80,
                            p: 1,
                            borderRight: 1,
                            borderColor: "divider",
                            textAlign: "right",
                          }}
                        >
                          <Typography variant="body2" color="text.secondary" fontWeight="bold">
                            {String(hour).padStart(2, "0")}:00
                          </Typography>
                        </Box>
                        <Box
                          onClick={() => {
                            const newDate = new Date(selectedDate);
                            setSelectedDate(newDate);
                            handleAddEvent(newDate);
                          }}
                          sx={{
                            flex: 1,
                            p: 1,
                            cursor: "pointer",
                            "&:hover": {
                              bgcolor: alpha(colors.primary, 0.05),
                            },
                          }}
                        >
                          {hourBuchungen.map((buchung, idx) => (
                            <Box
                              key={idx}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditEvent(buchung);
                              }}
                              sx={{
                                p: 1,
                                mb: 1,
                                borderRadius: 1,
                                bgcolor: alpha(getEventColor(buchung), 0.9),
                                color: "white",
                                cursor: "pointer",
                                display: "flex",
                                justifyContent: "space-between",
                                "&:hover": {
                                  bgcolor: getEventColor(buchung),
                                },
                              }}
                            >
                              <Box>
                                <Typography variant="body2" fontWeight="bold">
                                  {buchung.titel}
                                </Typography>
                                <Typography variant="caption">
                                  {buchung.startzeit} - {buchung.endzeit}
                                </Typography>
                              </Box>
                              <Stack direction="row" spacing={0.5}>
                                <IconButton
                                  size="small"
                                  sx={{ color: "white" }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditEvent(buchung);
                                  }}
                                >
                                  <Edit fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  sx={{ color: "white" }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteEvent(buchung.id);
                                  }}
                                >
                                  <Delete fontSize="small" />
                                </IconButton>
                              </Stack>
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            </Box>
          )}
        </Paper>

        {/* Seitenleiste mit Räumen */}
        <Paper
          elevation={0}
          sx={{
            width: { xs: "100%", md: 350 },
            p: 3,
            borderRadius: 3,
            background:
              theme.palette.mode === "dark"
                ? `linear-gradient(135deg, ${alpha("#3b82f6", 0.05)} 0%, ${alpha(
                    "#6d28d9",
                    0.05
                  )} 100%)`
                : theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography variant="h6" fontWeight="bold" mb={2}>
            Verfügbare Räume
          </Typography>

          <List>
            {raeume.map((raum) => (
              <ListItem
                key={raum.id}
                sx={{
                  mb: 1,
                  borderRadius: 2,
                  bgcolor: alpha(colors.primary, 0.05),
                  "&:hover": {
                    bgcolor: alpha(colors.primary, 0.1),
                  },
                }}
              >
                <ListItemText
                  primary={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Meeting />
                      <Typography fontWeight="bold">{raum.name}</Typography>
                    </Stack>
                  }
                  secondary={
                    <Typography variant="body2" color="text.secondary">
                      {raum.kapazitaet} Personen
                      {raum.beschreibung && ` • ${raum.beschreibung}`}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      </Box>

      {/* Dialog: Tag-Optionen */}
      <Dialog
        open={openDayDialog}
        onClose={() => setOpenDayDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          {selectedDate &&
            selectedDate.toLocaleDateString("de-DE", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Button
              variant="contained"
              fullWidth
              startIcon={<Add />}
              onClick={() => {
                setOpenDayDialog(false);
                handleAddEvent(selectedDate);
              }}
            >
              Neuer Termin
            </Button>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<CalendarViewDay />}
              onClick={() => {
                setViewMode("day");
                setOpenDayDialog(false);
              }}
            >
              Tagesansicht
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>

      {/* Dialog: Termin erstellen/bearbeiten */}
      <Dialog
        open={openEventDialog}
        onClose={handleCloseEventDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight="bold">
            {editingEvent ? "Termin bearbeiten" : "Neuer Termin"}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {errorMessage && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMessage("")}>
              {errorMessage}
            </Alert>
          )}
          
          <Stack spacing={2} mt={1}>
            <TextField
              fullWidth
              label="Titel *"
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
            />

            <TextField
              fullWidth
              label="Name der Kontaktperson *"
              value={eventKontaktperson}
              onChange={(e) => setEventKontaktperson(e.target.value)}
            />

            <TextField
              fullWidth
              label="Telefonnummer *"
              value={eventTelefon}
              onChange={(e) => setEventTelefon(e.target.value)}
            />

            <TextField
              fullWidth
              label="Teilnehmerzahl"
              type="number"
              value={eventTeilnehmerzahl}
              onChange={(e) => setEventTeilnehmerzahl(e.target.value)}
            />

            <FormControl fullWidth>
              <InputLabel>Räume auswählen *</InputLabel>
              <Select
                multiple
                value={selectedRaeume}
                onChange={(e) => setSelectedRaeume(e.target.value)}
                label="Räume auswählen *"
                renderValue={(selected) =>
                  selected
                    .map((id) => raeume.find((r) => r.id === id)?.name)
                    .filter(Boolean)
                    .join(", ")
                }
              >
                {raeume.map((raum) => (
                  <MenuItem key={raum.id} value={raum.id}>
                    <Checkbox checked={selectedRaeume.indexOf(raum.id) > -1} />
                    <ListItemText
                      primary={raum.name}
                      secondary={`${raum.kapazitaet} Personen`}
                    />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Datum"
              type="date"
              value={selectedDate ? formatDate(selectedDate) : ""}
              onChange={(e) => {
                const [y, m, d] = e.target.value.split("-").map(Number);
                setSelectedDate(new Date(y, m - 1, d));
              }}
              InputLabelProps={{ shrink: true }}
            />

            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                fullWidth
                label="Startzeit"
                type="time"
                value={eventStartTime}
                onChange={(e) => setEventStartTime(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                label="Endzeit"
                type="time"
                value={eventEndTime}
                onChange={(e) => setEventEndTime(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Box>

            <FormControl fullWidth>
              <InputLabel>Kategorie</InputLabel>
              <Select
                value={eventKategorie}
                onChange={(e) => setEventKategorie(e.target.value)}
                label="Kategorie"
              >
                <MenuItem value="termin">Termin (T)</MenuItem>
                <MenuItem value="fest">Festgelegt (FT)</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Wiederholung</InputLabel>
              <Select
                value={eventWiederholung}
                onChange={(e) => setEventWiederholung(e.target.value)}
                label="Wiederholung"
              >
                <MenuItem value="keine">Keine</MenuItem>
                <MenuItem value="täglich">Täglich</MenuItem>
                <MenuItem value="wöchentlich">Wöchentlich</MenuItem>
                <MenuItem value="monatlich">Monatlich</MenuItem>
              </Select>
            </FormControl>

            {eventWiederholung !== "keine" && (
              <TextField
                fullWidth
                label="Wiederholung bis"
                type="date"
                value={eventWiederholungBis}
                onChange={(e) => setEventWiederholungBis(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            )}

            <TextField
              fullWidth
              label="Beschreibung"
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
              multiline
              rows={3}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseEventDialog}>Abbrechen</Button>
          <Button onClick={handleSaveEvent} variant="contained">
            Speichern
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Neuer Raum */}
      <Dialog open={openRoomDialog} onClose={() => setOpenRoomDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h6" fontWeight="bold">
            Neuer Raum
          </Typography>
        </DialogTitle>
        <DialogContent>
          {errorMessage && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMessage("")}>
              {errorMessage}
            </Alert>
          )}
          
          <Stack spacing={2} mt={1}>
            <TextField
              fullWidth
              label="Raumname *"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
            />

            <TextField
              fullWidth
              label="Personenanzahl *"
              type="number"
              value={newRoomKapazitaet}
              onChange={(e) => setNewRoomKapazitaet(e.target.value)}
            />

            <TextField
              fullWidth
              label="Beschreibung"
              value={newRoomBeschreibung}
              onChange={(e) => setNewRoomBeschreibung(e.target.value)}
              multiline
              rows={3}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenRoomDialog(false)}>Abbrechen</Button>
          <Button onClick={handleSaveRoom} variant="contained">
            Anlegen
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bestätigungsdialog */}
      <Dialog
        open={openConfirmDialog}
        onClose={() => setOpenConfirmDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" spacing={1} alignItems="center">
            <Warning color="warning" />
            <Typography variant="h6" fontWeight="bold">
              Bestätigung erforderlich
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Typography>{confirmAction?.message}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirmDialog(false)}>Abbrechen</Button>
          <Button
            onClick={() => confirmAction?.onConfirm()}
            variant="contained"
            color="warning"
          >
            Bestätigen
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
