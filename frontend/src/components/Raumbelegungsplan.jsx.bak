import React, { useState, useEffect, useMemo } from "react";
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
  Chip,
  Stack,
  useTheme,
  useMediaQuery,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  Alert,
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import {
  ChevronLeft,
  ChevronRight,
  Add,
  Edit,
  Delete,
  Warning,
  Print,
} from "@mui/icons-material";
import axiosInstance from "../api/axios";

const MONTH_NAMES = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];

const DAY_NAMES_MONDAY_START = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

export default function RaumbelegungsplanExcel() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [currentDate, setCurrentDate] = useState(new Date());
  const [raeume, setRaeume] = useState([]);
  const [buchungen, setBuchungen] = useState([]);
  const [holidays, setHolidays] = useState({});
  
  // Dialogs
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [roomDetailsOpen, setRoomDetailsOpen] = useState(false);
  
  // Form states
  const [editingEntry, setEditingEntry] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedRoomDetails, setSelectedRoomDetails] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  
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

  const [errorMessage, setErrorMessage] = useState("");
  const tableContainerRef = React.useRef(null);

  useEffect(() => {
    loadData();
  }, [currentDate]);

  // Auto-scroll zu 6:00 Uhr beim Laden
  useEffect(() => {
    if (tableContainerRef.current) {
      setTimeout(() => {
        const hourCell = tableContainerRef.current.querySelector(
          'th[aria-label="06:00"]'
        );
        if (hourCell) {
          hourCell.scrollIntoView({ behavior: "auto", block: "start", inline: "start" });
        }
      }, 100);
    }
  }, [buchungen]);

  const loadData = async () => {
    try {
      const jahr = currentDate.getFullYear();
      const [raeumeRes, buchungenRes, feiertageRes] = await Promise.all([
        axiosInstance.get("/api/kalender/raeume/"),
        axiosInstance.get("/api/kalender/raumbelegungen/"),
        axiosInstance.get(`/api/kalender/feiertage/?jahr=${jahr}`),
      ]);
      
      setRaeume(raeumeRes.data);
      setBuchungen(buchungenRes.data);
      
      // Konvertiere Feiertage zu Dictionary
      const holidayDict = {};
      if (feiertageRes.data.feiertage) {
        feiertageRes.data.feiertage.forEach(ft => {
          holidayDict[ft.datum] = ft.name;
        });
      }
      setHolidays(holidayDict);
    } catch (error) {
      console.error("Fehler beim Laden:", error);
    }
  };

  // Berechne Zeitslots (Stunden)
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 6; hour <= 22; hour++) {
      slots.push({
        hour,
        label: `${String(hour).padStart(2, "0")}:00`,
      });
    }
    return slots;
  }, []);

  // Formatiere aktuelles Datum
  const currentDateString = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const day = currentDate.getDate();
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }, [currentDate]);

  const currentDayInfo = useMemo(() => {
    const dayOfWeek = currentDate.getDay();
    const feiertag = holidays[currentDateString];
    return {
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      feiertag: feiertag || null,
      dateString: currentDateString,
    };
  }, [currentDate, currentDateString, holidays]);

  // Hole Buchungen für bestimmten Zeitslot und Raum
  const getBookingsForTimeSlot = (raumId, hour) => {
    return buchungen.filter((booking) => {
      const matchesRoom = booking.raum && booking.raum.includes(raumId);
      const matchesDate = booking.datum_start === currentDateString;
      
      if (!matchesRoom || !matchesDate) return false;

      // Prüfe ob Buchung in diesem Zeitslot ist
      const [startHour] = booking.startzeit.split(":").map(Number);
      const [endHour] = booking.endzeit.split(":").map(Number);
      
      return hour >= startHour && hour < endHour;
    });
  };

  const handlePrevDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleCellClick = (raumId, hour) => {
    setSelectedRoom(raumId);
    setSelectedDate(currentDateString);
    setFormData({
      ...formData,
      raum: [raumId],
      datum_start: currentDateString,
      datum_ende: currentDateString,
      startzeit: `${String(hour).padStart(2, "0")}:00`,
      endzeit: `${String(hour + 1).padStart(2, "0")}:00`,
    });
    setEditingEntry(null);
    setDialogOpen(true);
  };

  const handleEditEntry = (entry) => {
    setEditingEntry(entry);
    setFormData({
      raum: entry.raum || [],
      titel: entry.titel,
      kontaktperson: entry.kontaktperson || "",
      telefon: entry.telefon || "",
      teilnehmerzahl: entry.teilnehmerzahl || "",
      datum_start: entry.datum_start,
      datum_ende: entry.datum_ende || entry.datum_start,
      startzeit: entry.startzeit || "09:00",
      endzeit: entry.endzeit || "17:00",
      kategorie: entry.kategorie || "termin",
      wiederholung: entry.wiederholung || "keine",
      wiederholung_bis: entry.wiederholung_bis || "",
      beschreibung: entry.beschreibung || "",
    });
    setDialogOpen(true);
  };

  const handleSaveEntry = async () => {
    // Validierung
    if (!formData.titel.trim()) {
      setErrorMessage("Bitte geben Sie einen Titel ein");
      return;
    }
    
    if (!formData.kontaktperson.trim()) {
      setErrorMessage("Name der Kontaktperson ist ein Pflichtfeld");
      return;
    }
    
    if (!formData.telefon.trim()) {
      setErrorMessage("Telefonnummer ist ein Pflichtfeld");
      return;
    }
    
    if (formData.raum.length === 0) {
      setErrorMessage("Bitte wählen Sie mindestens einen Raum aus");
      return;
    }

    const buchungData = {
      ...formData,
      teilnehmerzahl: formData.teilnehmerzahl ? parseInt(formData.teilnehmerzahl) : null,
      datum_ende: formData.datum_ende || null,
      wiederholung_bis: formData.wiederholung_bis || null,
    };

    try {
      if (editingEntry) {
        // Bestätigungsdialog für Bearbeitung
        setConfirmAction({
          type: "edit",
          data: buchungData,
          message: `Möchten Sie den Termin "${formData.titel}" wirklich bearbeiten?`,
          onConfirm: async () => {
            try {
              await axiosInstance.put(
                `/api/kalender/raumbelegungen/${editingEntry.id}/`,
                buchungData
              );
              await loadData();
              setDialogOpen(false);
              setConfirmDialogOpen(false);
              setErrorMessage("");
            } catch (error) {
              handleSaveError(error);
            }
          },
        });
        setConfirmDialogOpen(true);
      } else {
        await axiosInstance.post("/api/kalender/raumbelegungen/", buchungData);
        await loadData();
        setDialogOpen(false);
        setErrorMessage("");
      }
    } catch (error) {
      handleSaveError(error);
    }
  };

  const handleSaveError = (error) => {
    console.error("Fehler beim Speichern:", error);
    if (error.response?.data?.ueberschneidung) {
      const konflikte = error.response.data.konflikte || [];
      const msg = konflikte
        .map((k) => `${k.raum}: ${k.titel} am ${k.datum} (${k.zeit})`)
        .join("\n");
      setErrorMessage(`Überschneidung gefunden:\n${msg}`);
    } else if (error.response?.data) {
      const errors = Object.entries(error.response.data)
        .map(([key, value]) => `${key}: ${value}`)
        .join(", ");
      setErrorMessage(`Fehler: ${errors}`);
    } else {
      setErrorMessage("Fehler beim Speichern des Termins");
    }
    setConfirmDialogOpen(false);
  };

  const handleDeleteEntry = (entry) => {
    setConfirmAction({
      type: "delete",
      data: entry,
      message: `Möchten Sie den Termin "${entry.titel}" wirklich löschen?`,
      onConfirm: async () => {
        try {
          await axiosInstance.delete(`/api/kalender/raumbelegungen/${entry.id}/`);
          await loadData();
          setDialogOpen(false);
          setConfirmDialogOpen(false);
        } catch (error) {
          console.error("Fehler beim Löschen:", error);
          setErrorMessage("Fehler beim Löschen des Termins");
        }
      },
    });
    setConfirmDialogOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportICS = () => {
    if (buchungen.length === 0) {
      alert("Keine Termine zum Exportieren vorhanden");
      return;
    }

    // ICS Header
    let icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Gemeindeverwaltung FECG//Raumbelegungsplan//DE
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Raumbelegungsplan
X-WR-TIMEZONE:Europe/Berlin
`;

    // Ereignisse hinzufügen
    buchungen.forEach((booking) => {
      const start = `${booking.datum_start.replace(/-/g, "")}T${booking.startzeit.replace(
        /:/g,
        ""
      )}00`;
      const end = `${booking.datum_start.replace(/-/g, "")}T${booking.endzeit.replace(
        /:/g,
        ""
      )}00`;
      const uid = `${booking.id}@raumbelegungsplan.local`;
      const created = new Date().toISOString().replace(/[:-]/g, "").split(".")[0] + "Z";
      
      const title = `${booking.titel} (${booking.raum_namen?.join(", ") || "Raum"})`;
      const description = `Kontakt: ${booking.kontaktperson}, Tel: ${booking.telefon}\nBeschreibung: ${booking.beschreibung || ""}`;

      icsContent += `BEGIN:VEVENT
UID:${uid}
DTSTAMP:${created}
DTSTART:${start}
DTEND:${end}
SUMMARY:${title}
DESCRIPTION:${description}
LOCATION:${booking.raum_namen?.join(", ") || "Raum"}
END:VEVENT
`;
    });

    icsContent += "END:VCALENDAR";

    // Download
    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `raumbelegungsplan-${currentDateString}.ics`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenRoomDetails = (raum) => {
    setSelectedRoomDetails(raum);
    setRoomDetailsOpen(true);
  };

  const getBookingsForRoom = (raumId) => {
    return buchungen.filter((b) => {
      const matchesRoom = b.raum && b.raum.includes(raumId);
      const matchesDate = b.datum_start === currentDateString;
      return matchesRoom && matchesDate;
    }).sort((a, b) => {
      const [aHour, aMin] = a.startzeit.split(":").map(Number);
      const [bHour, bMin] = b.startzeit.split(":").map(Number);
      return (aHour * 60 + aMin) - (bHour * 60 + bMin);
    });
  };

  const getBookingColor = (booking) => {
    if (booking.wiederholung && booking.wiederholung !== "keine") {
      return "#eab308"; // Gelb (W)
    }
    if (booking.kategorie === "fest") {
      return "#9333ea"; // Lila (FT)
    }
    return "#2563eb"; // Blau (T)
  };

  const getBookingLabel = (booking) => {
    if (booking.wiederholung && booking.wiederholung !== "keine") {
      return "W";
    }
    if (booking.kategorie === "fest") {
      return "FT";
    }
    return "T";
  };

  const renderCell = (raumId, timeSlot) => {
    const bookings = getBookingsForTimeSlot(raumId, timeSlot.hour);

    return (
      <TableCell
        key={timeSlot.hour}
        align="center"
        onClick={() => handleCellClick(raumId, timeSlot.hour)}
        sx={{
          minWidth: isMobile ? 50 : 80,
          maxWidth: isMobile ? 50 : 80,
          width: isMobile ? 50 : 80,
          padding: "4px",
          backgroundColor: currentDayInfo.feiertag
            ? "#fee2e2"
            : currentDayInfo.isWeekend
            ? "#f5f5f5"
            : "white",
          borderRight: "1px solid #ddd",
          borderBottom: "1px solid #ddd",
          cursor: "pointer",
          position: "relative",
          verticalAlign: "middle",
          height: isMobile ? "50px" : "60px",
          "&:hover": {
            backgroundColor: "#e3f2fd",
          },
        }}
      >
        {bookings.length > 0 && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 0.5,
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
            }}
          >
            {bookings.map((booking, idx) => {
              const color = getBookingColor(booking);
              const label = getBookingLabel(booking);
              
              // Berechne Dauer in Stunden
              const [startHour, startMin] = booking.startzeit.split(":").map(Number);
              const [endHour, endMin] = booking.endzeit.split(":").map(Number);
              const duration = (endHour * 60 + endMin - startHour * 60 - startMin) / 60;

              return (
                <Tooltip
                  key={idx}
                  title={
                    <div>
                      <strong>{booking.titel}</strong><br />
                      {booking.kontaktperson}<br />
                      {booking.startzeit} - {booking.endzeit}<br />
                      {booking.teilnehmerzahl && `${booking.teilnehmerzahl} Personen`}
                    </div>
                  }
                  arrow
                  placement="top"
                >
                  <Box
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditEntry(booking);
                    }}
                    sx={{
                      backgroundColor: color,
                      color: "white",
                      fontSize: isMobile ? "10px" : "12px",
                      fontWeight: "bold",
                      padding: "4px 6px",
                      borderRadius: "4px",
                      width: "100%",
                      textAlign: "center",
                      cursor: "pointer",
                      "&:hover": {
                        opacity: 0.8,
                        transform: "scale(1.05)",
                      },
                      transition: "all 0.2s",
                    }}
                  >
                    <div>{label}</div>
                    <Typography variant="caption" sx={{ fontSize: "9px" }}>
                      {booking.startzeit}
                    </Typography>
                  </Box>
                </Tooltip>
              );
            })}
          </Box>
        )}
      </TableCell>
    );
  };        </Box>
      </TableCell>
    );
  };

  return (
    <Box>
      {/* Header mit Tagesnavigation */}
      <Stack
        direction="row"
        spacing={2}
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton
            onClick={handlePrevDay}
            size={isMobile ? "small" : "medium"}
          >
            <ChevronLeft />
          </IconButton>
          <Box sx={{ minWidth: 250 }}>
            <Typography
              variant={isMobile ? "h6" : "h5"}
              sx={{ textAlign: "center" }}
            >
              {currentDate.toLocaleDateString("de-DE", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </Typography>
            {currentDayInfo.feiertag && (
              <Chip
                label={`🎉 ${currentDayInfo.feiertag}`}
                size="small"
                sx={{
                  mt: 0.5,
                  width: "100%",
                  bgcolor: "#fee2e2",
                  color: "#dc2626",
                  fontWeight: "bold",
                }}
              />
            )}
          </Box>
          <IconButton
            onClick={handleNextDay}
            size={isMobile ? "small" : "medium"}
          >
            <ChevronRight />
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
            startIcon={<Print />}
          >
            Drucken
          </Button>
          <Button
            onClick={handleExportICS}
            size="small"
            variant="outlined"
          >
            ICS Export
          </Button>
        </Stack>
      </Stack>

      {/* Legende */}
      <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2, gap: 1 }}>
        <Chip
          label="F = Feiertag"
          size="small"
          sx={{ bgcolor: "#fee2e2", color: "#dc2626" }}
        />
        <Chip
          label="T = Termin"
          size="small"
          sx={{ bgcolor: "#dbeafe", color: "#2563eb" }}
        />
        <Chip
          label="W = Wiederholung"
          size="small"
          sx={{ bgcolor: "#fef3c7", color: "#eab308" }}
        />
        <Chip
          label="FT = Festgelegt"
          size="small"
          sx={{ bgcolor: "#ede9fe", color: "#9333ea" }}
        />
      </Stack>

      {/* Kalender Tabelle - Zeitstrahl */}
      <TableContainer
        ref={tableContainerRef}
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
                  minWidth: isMobile ? 120 : 200,
                  maxWidth: isMobile ? 120 : 200,
                  width: isMobile ? 120 : 200,
                  borderRight: "2px solid #ddd",
                  borderBottom: "2px solid #ddd",
                  padding: "8px",
                  fontSize: isMobile ? "11px" : "13px",
                }}
              >
                Räume
              </TableCell>

              {timeSlots.map((slot) => (
                <TableCell
                  key={slot.hour}
                  align="center"
                  aria-label={slot.label}
                  sx={{
                    minWidth: isMobile ? 50 : 80,
                    maxWidth: isMobile ? 50 : 80,
                    width: isMobile ? 50 : 80,
                    padding: "4px 2px",
                    backgroundColor: "#5b9bd5",
                    color: "white",
                    fontWeight: "bold",
                    fontSize: isMobile ? "10px" : "12px",
                    borderRight: "1px solid #ddd",
                    borderBottom: "2px solid #ddd",
                  }}
                >
                  {slot.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {raeume.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={timeSlots.length + 1}
                  align="center"
                  sx={{ py: 4 }}
                >
                  <Typography color="text.secondary">
                    Keine Räume vorhanden. Bitte legen Sie Räume im Django-Admin an.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              raeume.map((raum) => (
                <TableRow key={raum.id}>
                  <TableCell
                    sx={{
                      position: "sticky",
                      left: 0,
                      zIndex: 2,
                      backgroundColor: "white",
                      fontWeight: 500,
                      minWidth: isMobile ? 120 : 200,
                      maxWidth: isMobile ? 120 : 200,
                      width: isMobile ? 120 : 200,
                      borderRight: "2px solid #ddd",
                      borderBottom: "1px solid #ddd",
                      fontSize: isMobile ? "11px" : "13px",
                      padding: "8px",
                      cursor: "pointer",
                      "&:hover": {
                        backgroundColor: "#f5f5f5",
                      },
                    }}
                    onClick={() => handleOpenRoomDetails(raum)}
                  >
                    <div>{raum.name}</div>
                    <Typography variant="caption" color="text.secondary">
                      {raum.kapazitaet} Personen
                    </Typography>
                  </TableCell>
                  {timeSlots.map((slot) => renderCell(raum.id, slot))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog für Termin-Erstellung/Bearbeitung */}
      <Dialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setErrorMessage("");
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingEntry ? "Termin bearbeiten" : "Neuer Termin"}
        </DialogTitle>
        <DialogContent>
          {errorMessage && (
            <Alert
              severity="error"
              sx={{ mb: 2, whiteSpace: "pre-line" }}
              onClose={() => setErrorMessage("")}
            >
              {errorMessage}
            </Alert>
          )}

          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Titel *"
              value={formData.titel}
              onChange={(e) =>
                setFormData({ ...formData, titel: e.target.value })
              }
            />

            <TextField
              fullWidth
              label="Name der Kontaktperson *"
              value={formData.kontaktperson}
              onChange={(e) =>
                setFormData({ ...formData, kontaktperson: e.target.value })
              }
            />

            <TextField
              fullWidth
              label="Telefonnummer *"
              value={formData.telefon}
              onChange={(e) =>
                setFormData({ ...formData, telefon: e.target.value })
              }
            />

            <TextField
              fullWidth
              label="Teilnehmerzahl"
              type="number"
              value={formData.teilnehmerzahl}
              onChange={(e) =>
                setFormData({ ...formData, teilnehmerzahl: e.target.value })
              }
            />

            <FormControl fullWidth>
              <InputLabel>Räume auswählen *</InputLabel>
              <Select
                multiple
                value={formData.raum}
                onChange={(e) =>
                  setFormData({ ...formData, raum: e.target.value })
                }
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
                    <Checkbox checked={formData.raum.indexOf(raum.id) > -1} />
                    <ListItemText
                      primary={raum.name}
                      secondary={`${raum.kapazitaet} Personen`}
                    />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Stack direction="row" spacing={2}>
              <TextField
                fullWidth
                label="Von"
                type="date"
                value={formData.datum_start}
                onChange={(e) =>
                  setFormData({ ...formData, datum_start: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                label="Bis (optional)"
                type="date"
                value={formData.datum_ende}
                onChange={(e) =>
                  setFormData({ ...formData, datum_ende: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
              />
            </Stack>

            <Stack direction="row" spacing={2}>
              <TextField
                fullWidth
                label="Startzeit"
                type="time"
                value={formData.startzeit}
                onChange={(e) =>
                  setFormData({ ...formData, startzeit: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                label="Endzeit"
                type="time"
                value={formData.endzeit}
                onChange={(e) =>
                  setFormData({ ...formData, endzeit: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
              />
            </Stack>

            <FormControl fullWidth>
              <InputLabel>Kategorie</InputLabel>
              <Select
                value={formData.kategorie}
                onChange={(e) =>
                  setFormData({ ...formData, kategorie: e.target.value })
                }
                label="Kategorie"
              >
                <MenuItem value="termin">Termin (T)</MenuItem>
                <MenuItem value="fest">Festgelegt (FT)</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Wiederholung</InputLabel>
              <Select
                value={formData.wiederholung}
                onChange={(e) =>
                  setFormData({ ...formData, wiederholung: e.target.value })
                }
                label="Wiederholung"
              >
                <MenuItem value="keine">Keine</MenuItem>
                <MenuItem value="täglich">Täglich</MenuItem>
                <MenuItem value="wöchentlich">Wöchentlich</MenuItem>
                <MenuItem value="monatlich">Monatlich</MenuItem>
              </Select>
            </FormControl>

            {formData.wiederholung !== "keine" && (
              <TextField
                fullWidth
                label="Wiederholung bis"
                type="date"
                value={formData.wiederholung_bis}
                onChange={(e) =>
                  setFormData({ ...formData, wiederholung_bis: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
              />
            )}

            <TextField
              fullWidth
              label="Beschreibung"
              value={formData.beschreibung}
              onChange={(e) =>
                setFormData({ ...formData, beschreibung: e.target.value })
              }
              multiline
              rows={3}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          {editingEntry && (
            <Button onClick={() => handleDeleteEntry(editingEntry)} color="error">
              Löschen
            </Button>
          )}
          <Button onClick={() => setDialogOpen(false)}>Abbrechen</Button>
          <Button onClick={handleSaveEntry} variant="contained">
            Speichern
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bestätigungsdialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
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
          <Button onClick={() => setConfirmDialogOpen(false)}>Abbrechen</Button>
          <Button
            onClick={() => confirmAction?.onConfirm()}
            variant="contained"
            color="warning"
          >
            Bestätigen
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog für Raum-Details */}
      <Dialog
        open={roomDetailsOpen}
        onClose={() => setRoomDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <div>
              {selectedRoomDetails?.name}
              <Typography variant="caption" display="block" color="text.secondary">
                Kapazität: {selectedRoomDetails?.kapazitaet} Personen
              </Typography>
              {selectedRoomDetails?.beschreibung && (
                <Typography variant="body2" color="text.secondary">
                  {selectedRoomDetails.beschreibung}
                </Typography>
              )}
            </div>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {selectedRoomDetails &&
            (() => {
              const bookings = getBookingsForRoom(selectedRoomDetails.id);
              const sortedBookings = [...bookings].sort(
                (a, b) => new Date(a.datum_start) - new Date(b.datum_start)
              );

              if (sortedBookings.length === 0) {
                return (
                  <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                    Keine Buchungen in diesem Monat
                  </Typography>
                );
              }

              return (
                <Stack spacing={2} sx={{ mt: 2 }}>
                  {sortedBookings.map((booking) => {
                    const color = getBookingColor(booking);
                    const label = getBookingLabel(booking);
                    const isMultiDay =
                      booking.datum_ende && booking.datum_ende !== booking.datum_start;

                    return (
                      <Paper
                        key={booking.id}
                        sx={{
                          p: 2,
                          border: `2px solid ${color}`,
                          borderRadius: 2,
                          cursor: "pointer",
                          "&:hover": {
                            boxShadow: 2,
                          },
                        }}
                        onClick={() => {
                          setRoomDetailsOpen(false);
                          handleEditEntry(booking);
                        }}
                      >
                        <Stack direction="row" spacing={2} alignItems="flex-start">
                          <Box
                            sx={{
                              width: 60,
                              height: 60,
                              backgroundColor: color,
                              color: "white",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              borderRadius: 2,
                              fontWeight: "bold",
                              fontSize: "1.5rem",
                            }}
                          >
                            {label}
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" gutterBottom>
                              {booking.titel}
                            </Typography>
                            <Stack
                              direction="row"
                              spacing={1}
                              flexWrap="wrap"
                              sx={{ mb: 1 }}
                            >
                              <Chip
                                label={
                                  isMultiDay
                                    ? `${booking.datum_start} bis ${booking.datum_ende}`
                                    : booking.datum_start
                                }
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                              <Chip
                                label={`${booking.startzeit} - ${booking.endzeit}`}
                                size="small"
                                variant="outlined"
                              />
                              {booking.teilnehmerzahl && (
                                <Chip
                                  label={`${booking.teilnehmerzahl} Personen`}
                                  size="small"
                                />
                              )}
                            </Stack>
                            <Typography variant="body2" color="text.secondary">
                              Kontakt: {booking.kontaktperson} ({booking.telefon})
                            </Typography>
                            {booking.beschreibung && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mt: 1 }}
                              >
                                {booking.beschreibung}
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
          <Button onClick={() => setRoomDetailsOpen(false)}>Schließen</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
