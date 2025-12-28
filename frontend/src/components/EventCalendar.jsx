import React, { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
} from "@mui/material";
import axiosInstance from "../api/axios";

const EVENT_TYPES = [
  { value: "worship", label: "Gottesdienst" },
  { value: "prayer", label: "Gebetstreffen" },
  { value: "youth", label: "Jugendtreff" },
  { value: "conference", label: "Konferenz" },
  { value: "other", label: "Sonstiges" },
];

function emptyEvent(startDate) {
  return {
    title: "",
    description: "",
    event_type: "other",
    start_datetime: startDate || "",
    end_datetime: startDate || "",
    location: "",
    id: null,
  };
}

export default function EventCalendar({ isAdmin }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState(emptyEvent());

  // Load events from API
  const fetchEvents = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axiosInstance.get("/events/");
      setEvents(
        res.data.map((e) => ({
          ...e,
          start: e.start_datetime,
          end: e.end_datetime,
          allDay: false,
        }))
      );
    } catch (e) {
      setError("Fehler beim Laden der Events.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Handlers for FullCalendar
  const handleSelect = (info) => {
    if (!isAdmin) return;
    setFormData(emptyEvent(info.startStr));
    setEditingEvent(null);
    setDialogOpen(true);
  };

  const handleEventClick = (info) => {
    if (!isAdmin) return;
    const event = events.find(
      (e) => e.id === info.event.id || e.id === info.event.extendedProps.id
    );
    if (event) {
      setFormData({ ...event });
      setEditingEvent(event);
      setDialogOpen(true);
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingEvent(null);
    setFormData(emptyEvent());
    setError("");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setError("");
    try {
      if (editingEvent && editingEvent.id) {
        await axiosInstance.patch(`/events/${editingEvent.id}/`, formData);
      } else {
        await axiosInstance.post("/events/", formData);
      }
      fetchEvents();
      handleDialogClose();
    } catch (e) {
      setError("Fehler beim Speichern des Events.");
    }
  };

  const handleDelete = async () => {
    if (!editingEvent || !editingEvent.id) return;
    if (!window.confirm("Event wirklich löschen?")) return;
    setError("");
    try {
      await axiosInstance.delete(`/events/${editingEvent.id}/`);
      fetchEvents();
      handleDialogClose();
    } catch (e) {
      setError("Fehler beim Löschen des Events.");
    }
  };

  return (
    <Box sx={{ my: 4 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
        Gemeindekalender
      </Typography>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        events={events}
        editable={!!isAdmin}
        selectable={!!isAdmin}
        selectMirror={!!isAdmin}
        dayMaxEvents={true}
        height={600}
        select={isAdmin ? handleSelect : undefined}
        eventClick={isAdmin ? handleEventClick : undefined}
        eventDisplay="block"
        loading={loading}
      />
      {!isAdmin && (
        <Typography variant="body2" sx={{ mt: 2, color: "text.secondary" }}>
          Termine können nur von Administratoren bearbeitet werden.
        </Typography>
      )}
      <Dialog
        open={dialogOpen}
        onClose={handleDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingEvent ? "Event bearbeiten" : "Neues Event erstellen"}
        </DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}
        >
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="Titel"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
            fullWidth
          />
          <TextField
            label="Beschreibung"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            multiline
            rows={2}
            fullWidth
          />
          <TextField
            select
            label="Typ"
            name="event_type"
            value={formData.event_type}
            onChange={handleInputChange}
            fullWidth
          >
            {EVENT_TYPES.map((type) => (
              <MenuItem key={type.value} value={type.value}>
                {type.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Beginn"
            name="start_datetime"
            type="datetime-local"
            value={
              formData.start_datetime
                ? formData.start_datetime.slice(0, 16)
                : ""
            }
            onChange={handleInputChange}
            InputLabelProps={{ shrink: true }}
            fullWidth
            required
          />
          <TextField
            label="Ende"
            name="end_datetime"
            type="datetime-local"
            value={
              formData.end_datetime ? formData.end_datetime.slice(0, 16) : ""
            }
            onChange={handleInputChange}
            InputLabelProps={{ shrink: true }}
            fullWidth
            required
          />
          <TextField
            label="Ort"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          {editingEvent && (
            <Button onClick={handleDelete} color="error">
              Löschen
            </Button>
          )}
          <Button onClick={handleDialogClose}>Abbrechen</Button>
          <Button onClick={handleSave} variant="contained">
            {editingEvent ? "Speichern" : "Erstellen"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
