import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  Today,
  Add,
  Delete,
} from '@mui/icons-material';
import axiosInstance from '../api/axios';

export default function ModernCalendar({ type = 'gemeinde' }) {
  const theme = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [events, setEvents] = useState({});
  const [openEventDialog, setOpenEventDialog] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventStartTime, setEventStartTime] = useState('09:00');
  const [eventEndTime, setEventEndTime] = useState('10:00');
  const [loading, setLoading] = useState(false);

  // Farben
  const colors = {
    primary: theme.palette.mode === 'dark' ? '#6d28d9' : '#7c3aed',
    secondary: theme.palette.mode === 'dark' ? '#ec4899' : '#db2777',
    accent: theme.palette.mode === 'dark' ? '#3b82f6' : '#2563eb',
    eventColor: theme.palette.mode === 'dark' ? '#10b981' : '#059669',
    cardBg: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.7) : theme.palette.background.paper,
    hoverBg: theme.palette.mode === 'dark' ? alpha('#7c3aed', 0.2) : alpha('#7c3aed', 0.1),
  };

  // Events vom Backend laden
  useEffect(() => {
    loadEvents();
  }, [currentDate, type]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const endpoint = type === 'gemeinde' ? 'gemeindetermine' : 
                       type === 'mitarbeiter' ? 'mitarbeitertermine' : 'raumbelegungen';
      const response = await axiosInstance.get(`/${endpoint}/`);
      
      // Events nach Datum gruppieren
      const groupedEvents = {};
      response.data.forEach((event) => {
        const dateKey = event.datum;
        if (!groupedEvents[dateKey]) {
          groupedEvents[dateKey] = [];
        }
        groupedEvents[dateKey].push(event);
      });
      setEvents(groupedEvents);
    } catch (error) {
      console.error('Fehler beim Laden der Events:', error);
    } finally {
      setLoading(false);
    }
  };

  // Kalender-Logik
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Leere Tage am Anfang
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Tage des Monats
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const formatDateKey = (day) => {
    if (!day) return '';
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
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

  // Navigation
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleDateClick = (day) => {
    if (!day) return;
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(date);
  };

  const handleAddEvent = () => {
    setOpenEventDialog(true);
  };

  const handleCloseEventDialog = () => {
    setOpenEventDialog(false);
    setEventTitle('');
    setEventDescription('');
    setEventStartTime('09:00');
    setEventEndTime('10:00');
  };

  const handleSaveEvent = async () => {
    if (!selectedDate || !eventTitle) return;

    try {
      const endpoint = type === 'gemeinde' ? 'gemeindetermine' : 
                       type === 'mitarbeiter' ? 'mitarbeitertermine' : 'raumbelegungen';
      
      const eventData = {
        titel: eventTitle,
        datum: formatDateKey(selectedDate.getDate()),
        startzeit: eventStartTime,
        endzeit: eventEndTime,
        beschreibung: eventDescription,
      };

      if (type === 'mitarbeiter') {
        eventData.typ = 'termin';
        eventData.person = 'Aktueller Benutzer'; // Anpassen nach Bedarf
      } else if (type === 'raum') {
        eventData.raum = 'Hauptraum'; // Anpassen nach Bedarf
      }

      await axiosInstance.post(`/${endpoint}/`, eventData);
      handleCloseEventDialog();
      loadEvents();
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      const endpoint = type === 'gemeinde' ? 'gemeindetermine' : 
                       type === 'mitarbeiter' ? 'mitarbeitertermine' : 'raumbelegungen';
      await axiosInstance.delete(`/${endpoint}/${eventId}/`);
      loadEvents();
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
    }
  };

  const monthYear = currentDate.toLocaleDateString('de-DE', {
    month: 'long',
    year: 'numeric',
  });

  const selectedDateStr = selectedDate
    ? selectedDate.toLocaleDateString('de-DE', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'Datum wählen';

  const selectedEvents = selectedDate
    ? events[formatDateKey(selectedDate.getDate())] || []
    : [];

  const weekDays = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  const calendarDays = generateCalendarDays();

  return (
    <Box sx={{ display: 'flex', gap: 3, height: '100%', flexWrap: 'wrap' }}>
      {/* Kalender Grid */}
      <Paper
        elevation={0}
        sx={{
          flex: 1,
          minWidth: 300,
          p: 3,
          borderRadius: 3,
          background: theme.palette.mode === 'dark' 
            ? `linear-gradient(135deg, ${alpha('#6d28d9', 0.05)} 0%, ${alpha('#ec4899', 0.05)} 100%)`
            : theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        {/* Header mit Navigation */}
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" mb={3}>
          <IconButton
            onClick={goToPreviousMonth}
            sx={{
              bgcolor: colors.primary,
              color: 'white',
              '&:hover': { bgcolor: colors.hoverBg, color: colors.primary },
              transition: 'all 0.3s',
            }}
          >
            <ChevronLeft />
          </IconButton>

          <Typography
            variant="h5"
            fontWeight="bold"
            sx={{
              background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {monthYear}
          </Typography>

          <Stack direction="row" spacing={1}>
            <Button
              onClick={goToToday}
              startIcon={<Today />}
              variant="contained"
              sx={{
                bgcolor: colors.secondary,
                '&:hover': { bgcolor: alpha(colors.secondary, 0.8) },
                borderRadius: 2,
                textTransform: 'none',
              }}
            >
              Heute
            </Button>
            <IconButton
              onClick={goToNextMonth}
              sx={{
                bgcolor: colors.primary,
                color: 'white',
                '&:hover': { bgcolor: colors.hoverBg, color: colors.primary },
                transition: 'all 0.3s',
              }}
            >
              <ChevronRight />
            </IconButton>
          </Stack>
        </Stack>

        {/* Wochentage */}
        <Grid container spacing={1} mb={1}>
          {weekDays.map((day) => (
            <Grid item xs={12 / 7} key={day}>
              <Typography
                align="center"
                fontWeight="bold"
                color={colors.secondary}
                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
              >
                {day}
              </Typography>
            </Grid>
          ))}
        </Grid>

        {/* Kalender-Tage */}
        <Grid container spacing={1}>
          {calendarDays.map((day, index) => {
            const today = isToday(day);
            const hasEvent = day && hasEvents(day);
            
            return (
              <Grid item xs={12 / 7} key={index}>
                <Button
                  onClick={() => handleDateClick(day)}
                  disabled={!day}
                  sx={{
                    width: '100%',
                    height: { xs: 50, sm: 70, md: 90 },
                    borderRadius: 2,
                    bgcolor: today
                      ? colors.accent
                      : hasEvent
                      ? colors.eventColor
                      : colors.cardBg,
                    color: today || hasEvent ? 'white' : 'text.primary',
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    fontWeight: today ? 'bold' : 'normal',
                    transition: 'all 0.2s',
                    border: selectedDate && day === selectedDate.getDate() 
                      ? `2px solid ${colors.primary}` 
                      : 'none',
                    '&:hover': {
                      bgcolor: today
                        ? alpha(colors.accent, 0.8)
                        : hasEvent
                        ? alpha(colors.eventColor, 0.8)
                        : colors.hoverBg,
                      transform: 'scale(1.05)',
                    },
                    '&:disabled': {
                      bgcolor: 'transparent',
                    },
                  }}
                >
                  {day}
                </Button>
              </Grid>
            );
          })}
        </Grid>
      </Paper>

      {/* Event Panel */}
      <Paper
        elevation={0}
        sx={{
          width: { xs: '100%', md: 350 },
          p: 3,
          borderRadius: 3,
          background: theme.palette.mode === 'dark' 
            ? `linear-gradient(135deg, ${alpha('#3b82f6', 0.05)} 0%, ${alpha('#6d28d9', 0.05)} 100%)`
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
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Termine
        </Typography>

        <Typography variant="body2" color="text.secondary" mb={2}>
          {selectedDateStr}
        </Typography>

        <Button
          fullWidth
          variant="contained"
          startIcon={<Add />}
          onClick={handleAddEvent}
          disabled={!selectedDate}
          sx={{
            mb: 2,
            bgcolor: colors.primary,
            '&:hover': { bgcolor: alpha(colors.primary, 0.8) },
            borderRadius: 2,
            textTransform: 'none',
            py: 1.5,
          }}
        >
          Termin hinzufügen
        </Button>

        <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
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
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: theme.shadows[4],
                    },
                  }}
                  secondaryAction={
                    <IconButton
                      edge="end"
                      onClick={() => handleDeleteEvent(event.id)}
                      sx={{ color: colors.secondary }}
                    >
                      <Delete />
                    </IconButton>
                  }
                >
                  <ListItemText
                    primary={
                      <Typography fontWeight="bold" sx={{ mb: 0.5 }}>
                        {event.titel}
                      </Typography>
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
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
              Keine Termine an diesem Tag
            </Typography>
          )}
        </Box>
      </Paper>

      {/* Event Dialog */}
      <Dialog
        open={openEventDialog}
        onClose={handleCloseEventDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: theme.palette.mode === 'dark' 
              ? alpha(theme.palette.background.paper, 0.95)
              : theme.palette.background.paper,
          },
        }}
      >
        <DialogTitle>
          <Typography
            variant="h6"
            fontWeight="bold"
            sx={{
              background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Neuer Termin
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              fullWidth
              label="Titel"
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              variant="outlined"
            />
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
          <Button onClick={handleCloseEventDialog} sx={{ textTransform: 'none' }}>
            Abbrechen
          </Button>
          <Button
            onClick={handleSaveEvent}
            variant="contained"
            sx={{
              bgcolor: colors.primary,
              '&:hover': { bgcolor: alpha(colors.primary, 0.8) },
              textTransform: 'none',
            }}
          >
            Speichern
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
