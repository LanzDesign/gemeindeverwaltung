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
  ToggleButtonGroup,
  ToggleButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
} from "@mui/material";
import {
  ChevronLeft,
  ChevronRight,
  Today,
  Add,
  Delete,
  Edit,
  CalendarViewMonth,
  CalendarViewWeek,
  CalendarViewDay,
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

export default function ModernCalendar({ type = "gemeinde" }) {
  const theme = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [events, setEvents] = useState({});
  const [openEventDialog, setOpenEventDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventStartTime, setEventStartTime] = useState("09:00");
  const [eventEndTime, setEventEndTime] = useState("10:00");
  const [eventType, setEventType] = useState("allgemein");
  const [viewMode, setViewMode] = useState("month");
  const [loading, setLoading] = useState(false);

  const colors = {
    primary: theme.palette.mode === "dark" ? "#6d28d9" : "#7c3aed",
    secondary: theme.palette.mode === "dark" ? "#ec4899" : "#db2777",
    accent: theme.palette.mode === "dark" ? "#3b82f6" : "#2563eb",
    intern: "#f472b6",
    extern: "#059669",
    allgemein: "#ea580c",
    feiertag: "#dc2626",
    cardBg:
      theme.palette.mode === "dark"
        ? alpha(theme.palette.background.paper, 0.7)
        : theme.palette.background.paper,
    hoverBg:
      theme.palette.mode === "dark"
        ? alpha("#7c3aed", 0.2)
        : alpha("#7c3aed", 0.1),
    sundayBg:
      theme.palette.mode === "dark" ? alpha("#666", 0.2) : alpha("#ccc", 0.3),
  };

  const getEventColor = (event) => {
    if (!event) return colors.allgemein;
    // Pr??fe auf Feiertag
    const holidays = getHolidays(new Date(event.datum).getFullYear());
    if (holidays[event.datum]) return colors.feiertag;
    // Nutze die Farbe aus der API, falls vorhanden
    if (event.farbe) return event.farbe;
    // Fallback auf Kategorie-basierte Farben
    if (event.kategorie === "intern") return colors.intern;
    if (event.kategorie === "extern") return colors.extern;
    if (event.kategorie === "feiertag") return colors.feiertag;
    return colors.allgemein;
  };

  useEffect(() => {
    loadEvents();
  }, [currentDate, type]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const endpoint =
        type === "gemeinde"
          ? "gemeindetermine"
          : type === "mitarbeiter"
          ? "mitarbeitertermine"
          : "raumbelegungen";
      const response = await axiosInstance.get(`/${endpoint}/`);
      const groupedEvents = {};
      response.data.forEach((event) => {
        if (!groupedEvents[event.datum]) groupedEvents[event.datum] = [];
        groupedEvents[event.datum].push(event);
      });
      setEvents(groupedEvents);
    } catch (error) {
      console.error("Fehler beim Laden:", error);
    } finally {
      setLoading(false);
    }
  };

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
    // Konvertiere Sonntag (0) zu 7, damit Montag (1) die erste Position ist
    const firstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let day = 1; day <= daysInMonth; day++) days.push(day);
    return days;
  };

  const getWeekDays = () => {
    if (viewMode !== "week") return [];
    const start = new Date(currentDate);
    const day = start.getDay();
    start.setDate(start.getDate() - day + (day === 0 ? -6 : 1));
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      weekDays.push(date);
    }
    return weekDays;
  };

  const formatDateKey = (day) => {
    if (!day) return "";
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const dayStr = String(day).padStart(2, "0");
    return `${year}-${month}-${dayStr}`;
  };

  const hasEvents = (day) => {
    const dateKey = formatDateKey(day);
    return events[dateKey] && events[dateKey].length > 0;
  };

  const isToday = (day) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const isSunday = (day) => {
    if (!day) return false;
    const date = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    );
    return date.getDay() === 0;
  };

  const isWeekend = (day) => {
    if (!day) return false;
    const date = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    );
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
  };

  const isHoliday = (day) => {
    if (!day) return false;
    const dateKey = formatDateKey(day);
    const holidays = getHolidays(currentDate.getFullYear());
    return !!holidays[dateKey];
  };

  const getWeekNumber = (day) => {
    if (!day) return null;
    const date = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    );
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  const goToPrevious = () => {
    if (viewMode === "month")
      setCurrentDate(
        new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
      );
    else if (viewMode === "week") {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 7);
      setCurrentDate(d);
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 1);
      setCurrentDate(d);
    }
  };

  const goToNext = () => {
    if (viewMode === "month")
      setCurrentDate(
        new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)
      );
    else if (viewMode === "week") {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 7);
      setCurrentDate(d);
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 1);
      setCurrentDate(d);
    }
  };

  const goToToday = () => setCurrentDate(new Date());

  const handleDateClick = (day) => {
    if (!day) return;
    // Verwende formatDate direkt statt Date-Konstruktion um Timezone-Probleme zu vermeiden
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const dayStr = String(day).padStart(2, "0");
    const dateStr = `${year}-${month}-${dayStr}`;
    // Erstelle Date aus ISO-String um Timezone-Shift zu vermeiden
    const [y, m, d] = dateStr.split("-").map(Number);
    setSelectedDate(new Date(y, m - 1, d));
  };

  const handleAddEvent = (date = null, hour = null) => {
    setEditingEvent(null);
    setEventTitle("");
    setEventDescription("");
    
    // Setze Zeit basierend auf dem geklickten Zeitslot oder Standard
    if (hour !== null) {
      const startHour = String(hour).padStart(2, "0");
      const endHour = String(hour + 1).padStart(2, "0");
      setEventStartTime(`${startHour}:00`);
      setEventEndTime(`${endHour}:00`);
    } else {
      setEventStartTime("09:00");
      setEventEndTime("10:00");
    }
    
    setEventType("allgemein");
    
    // Setze Datum basierend auf Parameter oder selectedDate oder heute
    if (date) {
      setSelectedDate(date);
    } else if (!selectedDate) {
      setSelectedDate(new Date());
    }
    
    setOpenEventDialog(true);
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setEventTitle(event.titel);
    setEventDescription(event.beschreibung || "");
    setEventStartTime(event.startzeit);
    setEventEndTime(event.endzeit);
    setEventType(event.kategorie || "allgemein");
    setOpenEventDialog(true);
  };

  const handleCloseEventDialog = () => {
    setOpenEventDialog(false);
    setEditingEvent(null);
  };

  const handleSaveEvent = async () => {
    if (!selectedDate || !eventTitle) {
      alert("Bitte Datum und Titel eingeben");
      return;
    }
    try {
      const endpoint =
        type === "gemeinde"
          ? "gemeindetermine"
          : type === "mitarbeiter"
          ? "mitarbeitertermine"
          : "raumbelegungen";

      // Sichere Datumformatierung um Timezone-Probleme zu vermeiden
      const datumStr =
        selectedDate instanceof Date
          ? `${selectedDate.getFullYear()}-${String(
              selectedDate.getMonth() + 1
            ).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(
              2,
              "0"
            )}`
          : formatDate(selectedDate);

      const eventData = {
        titel: eventTitle,
        datum: datumStr,
        startzeit: eventStartTime,
        endzeit: eventEndTime,
        beschreibung: eventDescription,
        kategorie: eventType,
        farbe:
          eventType === "intern"
            ? "#f472b6"
            : eventType === "extern"
            ? "#059669"
            : eventType === "feiertag"
            ? "#dc2626"
            : "#ea580c",
      };
      if (type === "mitarbeiter") {
        eventData.typ = "termin";
        eventData.person = "Benutzer";
      } else if (type === "raum") {
        eventData.raum = "Hauptraum";
      }

      if (editingEvent)
        await axiosInstance.put(`/${endpoint}/${editingEvent.id}/`, eventData);
      else await axiosInstance.post(`/${endpoint}/`, eventData);

      handleCloseEventDialog();
      loadEvents();
    } catch (error) {
      console.error(
        "Fehler beim Speichern:",
        error.response?.data || error.message
      );
      alert(
        `Fehler: ${
          error.response?.data?.detail ||
          error.response?.data?.non_field_errors?.[0] ||
          "Fehler beim Speichern"
        }`
      );
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm("Termin l??schen?")) return;
    try {
      const endpoint =
        type === "gemeinde"
          ? "gemeindetermine"
          : type === "mitarbeiter"
          ? "mitarbeitertermine"
          : "raumbelegungen";
      await axiosInstance.delete(`/${endpoint}/${eventId}/`);
      loadEvents();
    } catch (error) {
      console.error("Fehler:", error);
    }
  };

  const getViewTitle = () => {
    if (viewMode === "day")
      return currentDate.toLocaleDateString("de-DE", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    else if (viewMode === "week") {
      const weekDays = getWeekDays();
      const start = weekDays[0].toLocaleDateString("de-DE", {
        day: "numeric",
        month: "short",
      });
      const end = weekDays[6].toLocaleDateString("de-DE", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      return `${start} - ${end}`;
    }
    return currentDate.toLocaleDateString("de-DE", {
      month: "long",
      year: "numeric",
    });
  };

  const getEventsForView = () => {
    if (viewMode === "day") return events[formatDate(currentDate)] || [];
    else if (viewMode === "week") {
      const weekEvents = [];
      getWeekDays().forEach((day) => {
        const dateKey = formatDate(day);
        if (events[dateKey])
          weekEvents.push(
            ...events[dateKey].map((e) => ({ ...e, displayDate: day }))
          );
      });
      return weekEvents;
    }
    const monthEvents = [];
    Object.keys(events).forEach((dateKey) => {
      const eventDate = new Date(dateKey);
      if (
        eventDate.getMonth() === currentDate.getMonth() &&
        eventDate.getFullYear() === currentDate.getFullYear()
      ) {
        monthEvents.push(...events[dateKey]);
      }
    });
    return monthEvents;
  };

  const selectedEvents = selectedDate
    ? events[formatDate(selectedDate)] || []
    : [];
  const weekDays = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
  const calendarDays = generateCalendarDays();

  return (
    <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
      <Paper
        elevation={0}
        sx={{
          flex: 1,
          minWidth: 300,
          p: 3,
          borderRadius: 3,
          background:
            theme.palette.mode === "dark"
              ? `linear-gradient(135deg, ${alpha("#6d28d9", 0.05)} 0%, ${alpha(
                  "#ec4899",
                  0.05
                )} 100%)`
              : theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Stack spacing={2} mb={3}>
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            justifyContent="space-between"
          >
            <IconButton
              onClick={goToPrevious}
              sx={{
                bgcolor: colors.primary,
                color: "white",
                "&:hover": { bgcolor: colors.hoverBg, color: colors.primary },
              }}
            >
              <ChevronLeft />
            </IconButton>
            <Typography
              variant="h5"
              fontWeight="bold"
              sx={{
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {getViewTitle()}
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => {
                setSelectedDate(new Date());
                handleAddEvent();
              }}
              sx={{
                bgcolor: colors.primary,
                "&:hover": { bgcolor: colors.hoverBg },
              }}
            >
              Termin hinzufügen
            </Button>
            <Stack direction="row" spacing={1}>
              <Button
                onClick={goToToday}
                startIcon={<Today />}
                variant="contained"
                sx={{
                  bgcolor: colors.secondary,
                  "&:hover": { bgcolor: alpha(colors.secondary, 0.8) },
                  borderRadius: 2,
                  textTransform: "none",
                }}
              >
                Heute
              </Button>
              <IconButton
                onClick={goToNext}
                sx={{
                  bgcolor: colors.primary,
                  color: "white",
                  "&:hover": { bgcolor: colors.hoverBg, color: colors.primary },
                }}
              >
                <ChevronRight />
              </IconButton>
            </Stack>
          </Stack>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(e, v) => v && setViewMode(v)}
            sx={{ alignSelf: "center" }}
          >
            <ToggleButton value="month">
              <CalendarViewMonth sx={{ mr: 1 }} />
              Monat
            </ToggleButton>
            <ToggleButton value="week">
              <CalendarViewWeek sx={{ mr: 1 }} />
              Woche
            </ToggleButton>
            <ToggleButton value="day">
              <CalendarViewDay sx={{ mr: 1 }} />
              Tag
            </ToggleButton>
          </ToggleButtonGroup>
        </Stack>

        {viewMode === "month" && (
          <>
            {/* Kopfzeile mit KW und Wochentagen */}
            <Box sx={{ display: "flex", mb: 1, gap: 1 }}>
              <Box
                sx={{
                  width: 40,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography
                  align="center"
                  fontWeight="bold"
                  color={colors.secondary}
                  sx={{ fontSize: { xs: "0.65rem", sm: "0.75rem" } }}
                >
                  KW
                </Typography>
              </Box>
              <Box sx={{ display: "flex", flex: 1, gap: 1 }}>
                {weekDays.map((day) => (
                  <Box key={day} sx={{ flex: 1, textAlign: "center" }}>
                    <Typography
                      align="center"
                      fontWeight="bold"
                      color={colors.secondary}
                      sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
                    >
                      {day}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Kalender-Grid mit Wochen */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {(() => {
                const weeks = [];
                let currentWeek = [];
                let weekNumber = null;

                calendarDays.forEach((day, index) => {
                  if (index % 7 === 0 && currentWeek.length > 0) {
                    // Fülle die Woche mit null-Werten auf 7 Tage auf
                    while (currentWeek.length < 7) {
                      currentWeek.push(null);
                    }
                    weeks.push({ weekNumber, days: currentWeek });
                    currentWeek = [];
                    weekNumber = null;
                  }

                  if (index % 7 === 0 && day) {
                    weekNumber = getWeekNumber(day);
                  }

                  currentWeek.push(day);
                });

                if (currentWeek.length > 0) {
                  // Fülle die letzte Woche auch mit null-Werten auf 7 Tage auf
                  while (currentWeek.length < 7) {
                    currentWeek.push(null);
                  }
                  weeks.push({ weekNumber, days: currentWeek });
                }

                return weeks.map((week, weekIndex) => (
                  <Box key={weekIndex} sx={{ display: "flex", gap: 1 }}>
                    {/* KW-Spalte */}
                    <Box
                      sx={{
                        width: 40,
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: alpha(colors.secondary, 0.1),
                        borderRadius: 1,
                      }}
                    >
                      <Typography
                        fontWeight="bold"
                        color="text.secondary"
                        sx={{ fontSize: { xs: "0.65rem", sm: "0.75rem" } }}
                      >
                        {week.weekNumber || ""}
                      </Typography>
                    </Box>

                    {/* Tage der Woche */}
                    <Box sx={{ display: "flex", flex: 1, gap: 1 }}>
                      {week.days.map((day, dayIndex) => {
                        const today = isToday(day);
                        const hasEvent = day && hasEvents(day);
                        const sunday = isSunday(day);
                        const holiday = isHoliday(day);
                        const dateKey = formatDateKey(day);
                        const dayEvents = day ? events[dateKey] || [] : [];
                        const eventColor =
                          dayEvents.length > 0
                            ? getEventColor(dayEvents[0])
                            : null;

                        return (
                          <Box key={dayIndex} sx={{ flex: 1 }}>
                            <Button
                              onClick={() => handleDateClick(day)}
                              disabled={!day}
                              sx={{
                                width: "100%",
                                height: { xs: 50, sm: 70, md: 90 },
                                borderRadius: 2,
                                bgcolor: today
                                  ? colors.accent
                                  : holiday
                                  ? colors.feiertag
                                  : hasEvent
                                  ? eventColor
                                  : sunday
                                  ? colors.sundayBg
                                  : colors.cardBg,
                                color:
                                  today || hasEvent || holiday
                                    ? "white"
                                    : "text.primary",
                                fontSize: { xs: "0.875rem", sm: "1rem" },
                                fontWeight: today ? "bold" : "normal",
                                transition: "all 0.2s",
                                border:
                                  selectedDate && day === selectedDate.getDate()
                                    ? `2px solid ${colors.primary}`
                                    : "none",
                                "&:hover": {
                                  bgcolor: today
                                    ? alpha(colors.accent, 0.8)
                                    : hasEvent
                                    ? alpha(eventColor, 0.8)
                                    : colors.hoverBg,
                                  transform: "scale(1.05)",
                                },
                                "&:disabled": { bgcolor: "transparent" },
                              }}
                            >
                              <Stack spacing={0.5} alignItems="center">
                                <Typography>{day}</Typography>
                                {dayEvents.length > 1 && (
                                  <Typography
                                    variant="caption"
                                    sx={{ fontSize: "0.6rem" }}
                                  >
                                    {dayEvents.length} Termine
                                  </Typography>
                                )}
                              </Stack>
                            </Button>
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                ));
              })()}
            </Box>
          </>
        )}

        {viewMode === "week" && (
          <Box sx={{ overflowX: "auto" }}>
            <Box sx={{ minWidth: 800, position: "relative" }}>
              {/* Header mit Wochentagen */}
              <Box sx={{ display: "flex", borderBottom: 1, borderColor: "divider" }}>
                <Box sx={{ width: 60, flexShrink: 0, p: 1 }}>
                  <Typography variant="caption" color="text.secondary">Zeit</Typography>
                </Box>
                {getWeekDays().map((date, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      flex: 1,
                      p: 1,
                      textAlign: "center",
                      bgcolor: date.getDay() === 0 ? colors.sundayBg : "transparent",
                      borderLeft: idx > 0 ? 1 : 0,
                      borderColor: "divider",
                    }}
                  >
                    <Typography variant="caption" fontWeight="bold">
                      {date.toLocaleDateString("de-DE", { weekday: "short" })}
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">
                      {date.getDate()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {date.toLocaleDateString("de-DE", { month: "short" })}
                    </Typography>
                  </Box>
                ))}
              </Box>

              {/* Zeit-Raster */}
              <Box sx={{ position: "relative" }}>
                {Array.from({ length: 24 }, (_, hour) => (
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
                        width: 60,
                        flexShrink: 0,
                        p: 0.5,
                        borderRight: 1,
                        borderColor: "divider",
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        {String(hour).padStart(2, "0")}:00
                      </Typography>
                    </Box>
                    {getWeekDays().map((date, dayIdx) => {
                      const dateStr = formatDate(date);
                      const dayEvents = (events[dateStr] || []).filter((e) => {
                        const eventHour = parseInt(e.startzeit?.split(":")[0] || 0);
                        return eventHour === hour;
                      });
                      
                      return (
                        <Box
                          key={dayIdx}
                          onClick={() => handleAddEvent(date, hour)}
                          sx={{
                            flex: 1,
                            minWidth: 0,
                            maxWidth: '100%',
                            p: 0.5,
                            borderLeft: dayIdx > 0 ? 1 : 0,
                            borderColor: "divider",
                            bgcolor: date.getDay() === 0 ? colors.sundayBg : "transparent",
                            position: "relative",
                            cursor: "pointer",
                            transition: "background-color 0.2s",
                            "&:hover": {
                              bgcolor: date.getDay() === 0 
                                ? alpha(colors.sundayBg, 0.5)
                                : alpha(colors.primary, 0.05),
                            },
                          }}
                        >
                          {dayEvents.map((event, eventIdx) => (
                            <Box
                              key={eventIdx}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditEvent(event);
                              }}
                              sx={{
                                p: 0.5,
                                mb: 0.5,
                                borderRadius: 1,
                                bgcolor: alpha(getEventColor(event), 0.9),
                                color: "white",
                                cursor: "pointer",
                                fontSize: "0.75rem",
                                overflow: "hidden",
                                width: '100%',
                                boxSizing: 'border-box',
                                "&:hover": {
                                  bgcolor: getEventColor(event),
                                  transform: "scale(1.02)",
                                },
                                transition: "all 0.2s",
                              }}
                            >
                              <Typography variant="caption" fontWeight="bold" noWrap>
                                {event.titel}
                              </Typography>
                              <Typography variant="caption" display="block" noWrap>
                                {event.startzeit} - {event.endzeit}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      );
                    })}
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        )}

        {viewMode === "day" && (
          <Box sx={{ overflowY: "auto", maxHeight: 600 }}>
            <Box sx={{ position: "relative" }}>
              {/* Header mit aktuellem Tag */}
              <Box sx={{ display: "flex", borderBottom: 2, borderColor: "divider", mb: 2, pb: 1 }}>
                <Box sx={{ width: 80, flexShrink: 0, p: 1 }}>
                  <Typography variant="caption" color="text.secondary">Zeit</Typography>
                </Box>
                <Box sx={{ flex: 1, textAlign: "center" }}>
                  <Typography variant="h6" fontWeight="bold">
                    {currentDate.toLocaleDateString("de-DE", { 
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric"
                    })}
                  </Typography>
                </Box>
              </Box>

              {/* Zeit-Raster für einen Tag */}
              {Array.from({ length: 24 }, (_, hour) => {
                const dateStr = formatDate(currentDate);
                const hourEvents = (events[dateStr] || []).filter((e) => {
                  const eventHour = parseInt(e.startzeit?.split(":")[0] || 0);
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
                        flexShrink: 0,
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
                      onClick={() => handleAddEvent(currentDate, hour)}
                      sx={{
                        flex: 1,
                        p: 1,
                        position: "relative",
                        cursor: "pointer",
                        transition: "background-color 0.2s",
                        "&:hover": {
                          bgcolor: alpha(colors.primary, 0.05),
                        },
                      }}
                    >
                      {hourEvents.map((event, eventIdx) => (
                        <Box
                          key={eventIdx}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditEvent(event);
                          }}
                          sx={{
                            p: 1.5,
                            mb: 1,
                            borderRadius: 2,
                            bgcolor: alpha(getEventColor(event), 0.9),
                            color: "white",
                            cursor: "pointer",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            "&:hover": {
                              bgcolor: getEventColor(event),
                              transform: "translateX(4px)",
                              boxShadow: theme.shadows[4],
                            },
                            transition: "all 0.2s",
                          }}
                        >
                          <Box>
                            <Typography variant="body1" fontWeight="bold">
                              {event.titel}
                            </Typography>
                            <Typography variant="body2">
                              {event.startzeit} - {event.endzeit}
                            </Typography>
                            {event.beschreibung && (
                              <Typography variant="caption" sx={{ opacity: 0.9, mt: 0.5, display: "block" }}>
                                {event.beschreibung}
                              </Typography>
                            )}
                          </Box>
                          <Stack direction="row" spacing={0.5}>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditEvent(event);
                              }}
                              sx={{ color: "white" }}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteEvent(event.id);
                              }}
                              sx={{ color: "white" }}
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
        )}
      </Paper>

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
        <Typography
          variant="h6"
          fontWeight="bold"
          mb={2}
          sx={{
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.accent} 100%)`,
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Termine
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          {selectedDate
            ? selectedDate.toLocaleDateString("de-DE", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })
            : "Datum wählen"}
        </Typography>

        <Stack spacing={1} mb={2}>
          <Typography variant="caption" fontWeight="bold">
            Farblegende:
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip
              label="Intern"
              size="small"
              sx={{ bgcolor: alpha(colors.intern, 0.3) }}
            />
            <Chip
              label="Extern"
              size="small"
              sx={{ bgcolor: alpha(colors.extern, 0.3) }}
            />
            <Chip
              label="Allgemein"
              size="small"
              sx={{ bgcolor: alpha(colors.allgemein, 0.3) }}
            />
            <Chip
              label="Feiertag"
              size="small"
              sx={{ bgcolor: alpha(colors.feiertag, 0.3) }}
            />
          </Stack>
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ maxHeight: 400, overflow: "auto" }}>
          {selectedEvents.length > 0 ? (
            <List sx={{ p: 0 }}>
              {selectedEvents.map((event, idx) => (
                <ListItem
                  key={idx}
                  sx={{
                    mb: 1,
                    p: 2,
                    borderRadius: 2,
                    bgcolor: colors.cardBg,
                    border: `1px solid ${theme.palette.divider}`,
                    borderLeft: `4px solid ${getEventColor(event)}`,
                    transition: "all 0.2s",
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: theme.shadows[4],
                    },
                  }}
                >
                  <ListItemText
                    primary={
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        mb={0.5}
                      >
                        <Typography fontWeight="bold">{event.titel}</Typography>
                        <Chip
                          label={
                            event.event_type === "intern"
                              ? "Intern"
                              : event.event_type === "extern"
                              ? "Extern"
                              : "Allgemein"
                          }
                          size="small"
                          sx={{
                            bgcolor: alpha(getEventColor(event), 0.2),
                            color: getEventColor(event),
                          }}
                        />
                      </Stack>
                    }
                    secondary={
                      <Stack spacing={0.5}>
                        <Typography variant="body2" color="text.secondary">
                          {event.startzeit} - {event.endzeit}
                        </Typography>
                        {event.beschreibung && (
                          <Typography variant="body2" color="text.secondary">
                            {event.beschreibung}
                          </Typography>
                        )}
                      </Stack>
                    }
                  />
                  <Stack direction="row" spacing={0.5}>
                    <IconButton
                      size="small"
                      onClick={() => handleEditEvent(event)}
                      sx={{ color: colors.primary }}
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteEvent(event.id)}
                      sx={{ color: colors.secondary }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Stack>
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
              Keine Termine
            </Typography>
          )}
        </Box>
      </Paper>

      <Dialog
        open={openEventDialog}
        onClose={handleCloseEventDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography
            variant="h6"
            fontWeight="bold"
            sx={{
              background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {editingEvent ? "Termin bearbeiten" : "Neuer Termin"}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              fullWidth
              label="Titel"
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
            />
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
            <FormControl fullWidth>
              <InputLabel>Typ</InputLabel>
              <Select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                label="Typ"
              >
                <MenuItem value="intern">
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        bgcolor: colors.intern,
                      }}
                    />
                    <Typography>Intern</Typography>
                  </Stack>
                </MenuItem>
                <MenuItem value="extern">
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        bgcolor: colors.extern,
                      }}
                    />
                    <Typography>Extern</Typography>
                  </Stack>
                </MenuItem>
                <MenuItem value="allgemein">
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        bgcolor: colors.allgemein,
                      }}
                    />
                    <Typography>Allgemein</Typography>
                  </Stack>
                </MenuItem>
              </Select>
            </FormControl>
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
          <Button
            onClick={handleCloseEventDialog}
            sx={{ textTransform: "none" }}
          >
            Abbrechen
          </Button>
          <Button
            onClick={handleSaveEvent}
            variant="contained"
            sx={{
              bgcolor: colors.primary,
              "&:hover": { bgcolor: alpha(colors.primary, 0.8) },
              textTransform: "none",
            }}
          >
            Speichern
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
