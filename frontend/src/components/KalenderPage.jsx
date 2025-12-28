import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Paper,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardHeader,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Grid,
  Chip,
  IconButton,
  useTheme,
  useMediaQuery,
  Stack,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ViewListIcon from "@mui/icons-material/ViewList";
import CalendarViewMonthIcon from "@mui/icons-material/CalendarViewMonth";
import axiosInstance from "../api/axios";
import MonthCalendarView from "./MonthCalendarView";

// Tab Panel Component
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`kalender-tabpanel-${index}`}
      aria-labelledby={`kalender-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function KalenderPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));

  const [tabValue, setTabValue] = useState(0);
  const [gemeindetermine, setGemeindetermine] = useState([]);
  const [mitarbeitertermine, setMitarbeitertermine] = useState([]);
  const [raumbelegungen, setRaumbelegungen] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentTab, setCurrentTab] = useState(0);
  const [viewMode, setViewMode] = useState("list"); // "list" oder "month"

  const [formData, setFormData] = useState({
    titel: "",
    datum: "",
    startzeit: "",
    endzeit: "",
    beschreibung: "",
    typ: "termin", // termin, krankheit, urlaub
    raum: "", // für Raumbelegungen
    person: "", // für Mitarbeiter
  });

  // Gemeindetermine laden
  const loadGemeindetermine = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/gemeindetermine/");
      setGemeindetermine(response.data);
      setError(null);
    } catch (err) {
      setError(
        "Fehler beim Laden der Gemeindetermine: " +
          (err.response?.data?.detail || err.message)
      );
    } finally {
      setLoading(false);
    }
  };

  // Mitarbeitertermine laden
  const loadMitarbeitertermine = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/mitarbeitertermine/");
      setMitarbeitertermine(response.data);
      setError(null);
    } catch (err) {
      setError(
        "Fehler beim Laden der Mitarbeitertermine: " +
          (err.response?.data?.detail || err.message)
      );
    } finally {
      setLoading(false);
    }
  };

  // Raumbelegungen laden
  const loadRaumbelegungen = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      console.log("Token vorhanden:", !!token);
      if (!token) {
        setError("Nicht angemeldet - bitte erneut einloggen");
        setLoading(false);
        return;
      }
      const response = await axiosInstance.get("/raumbelegungen/");
      setRaumbelegungen(response.data);
      setError(null);
    } catch (err) {
      console.error("Fehler bei Raumbelegungen:", err);
      console.error("Status:", err.response?.status);
      console.error("Detail:", err.response?.data?.detail);
      setError(
        "Fehler beim Laden der Raumbelegungen: " +
          (err.response?.data?.detail || err.message)
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGemeindetermine();
    loadMitarbeitertermine();
    loadRaumbelegungen();
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setCurrentTab(newValue);
  };

  const handleOpenDialog = (item = null) => {
    if (item) {
      setEditingId(item.id);
      setFormData(item);
    } else {
      setEditingId(null);
      setFormData({
        titel: "",
        datum: "",
        startzeit: "",
        endzeit: "",
        beschreibung: "",
        typ: "termin",
        raum: "",
        person: "",
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    try {
      const endpoint =
        currentTab === 0
          ? "gemeindetermine"
          : currentTab === 1
          ? "mitarbeitertermine"
          : "raumbelegungen";

      if (editingId) {
        await axiosInstance.put(`/${endpoint}/${editingId}/`, formData);
      } else {
        await axiosInstance.post(`/${endpoint}/`, formData);
      }

      handleCloseDialog();
      if (currentTab === 0) loadGemeindetermine();
      else if (currentTab === 1) loadMitarbeitertermine();
      else loadRaumbelegungen();
      setError(null);
    } catch (err) {
      setError(
        "Fehler beim Speichern: " + (err.response?.data?.detail || err.message)
      );
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Möchten Sie diesen Eintrag wirklich löschen?")) return;

    try {
      const endpoint =
        currentTab === 0
          ? "gemeindetermine"
          : currentTab === 1
          ? "mitarbeitertermine"
          : "raumbelegungen";

      await axiosInstance.delete(`/${endpoint}/${id}/`);

      if (currentTab === 0) loadGemeindetermine();
      else if (currentTab === 1) loadMitarbeitertermine();
      else loadRaumbelegungen();
      setError(null);
    } catch (err) {
      setError(
        "Fehler beim Löschen: " + (err.response?.data?.detail || err.message)
      );
    }
  };

  const EventCard = ({ item }) => (
    <Card
      sx={{
        mb: 2,
        boxShadow: isMobile ? 1 : 2,
        "&:hover": {
          boxShadow: isMobile ? 2 : 4,
          transform: "translateY(-2px)",
          transition: "all 0.3s ease",
        },
      }}
    >
      <CardHeader
        title={
          <Typography
            variant={isMobile ? "h6" : "h5"}
            component="div"
            sx={{ fontWeight: 600 }}
          >
            {item.titel}
          </Typography>
        }
        subheader={
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}
          >
            <CalendarTodayIcon sx={{ fontSize: 16 }} />
            <Typography variant="body2" color="text.secondary">
              {new Date(item.datum).toLocaleDateString("de-DE", {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </Typography>
          </Box>
        }
        action={
          isMobile ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
              <IconButton
                size="small"
                color="primary"
                onClick={() => handleOpenDialog(item)}
              >
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                color="error"
                onClick={() => handleDelete(item.id)}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          ) : (
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                startIcon={<EditIcon />}
                onClick={() => handleOpenDialog(item)}
              >
                Bearbeiten
              </Button>
              <Button
                size="small"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => handleDelete(item.id)}
              >
                Löschen
              </Button>
            </Stack>
          )
        }
        sx={{ pb: 1 }}
      />
      <CardContent sx={{ pt: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
          <AccessTimeIcon sx={{ fontSize: 18, color: "text.secondary" }} />
          <Typography variant="body2" color="text.secondary">
            {item.startzeit} - {item.endzeit}
          </Typography>
        </Box>
        {item.beschreibung && (
          <Typography
            variant="body2"
            sx={{
              mb: 1.5,
              color: "text.primary",
              lineHeight: 1.6,
            }}
          >
            {item.beschreibung}
          </Typography>
        )}
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          {item.typ && (
            <Chip
              label={item.typ.charAt(0).toUpperCase() + item.typ.slice(1)}
              size="small"
              color={
                item.typ === "krankheit"
                  ? "error"
                  : item.typ === "urlaub"
                  ? "warning"
                  : "primary"
              }
            />
          )}
          {item.person && (
            <Chip label={`👤 ${item.person}`} size="small" variant="outlined" />
          )}
          {item.raum && (
            <Chip label={`🏢 ${item.raum}`} size="small" variant="outlined" />
          )}
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Container
      maxWidth="lg"
      sx={{
        py: { xs: 2, sm: 3 },
        px: { xs: 1, sm: 2, md: 3 },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          mb: { xs: 2, sm: 3 },
        }}
      >
        <CalendarTodayIcon
          sx={{
            fontSize: { xs: 28, sm: 32 },
            color: "primary.main",
          }}
        />
        <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: 700 }}>
          Kalender Management
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper
        sx={{
          mb: 3,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="Kalender Tabs"
            variant={isMobile ? "scrollable" : "fullWidth"}
            scrollButtons={isMobile ? "auto" : false}
            sx={{
              flex: 1,
              "& .MuiTab-root": {
                minHeight: { xs: 48, sm: 64 },
                fontSize: { xs: "0.875rem", sm: "1rem" },
                px: { xs: 1, sm: 2 },
              },
            }}
          >
            <Tab
              label={isMobile ? "🏛️ Gemeinde" : "🏛️ Gemeindetermine"}
              id="kalender-tab-0"
            />
            <Tab
              label={isMobile ? "👥 Mitarbeiter" : "👥 Mitarbeiterverwaltung"}
              id="kalender-tab-1"
            />
            <Tab
              label={isMobile ? "🏢 Räume" : "🏢 Raumbelegungsplan"}
              id="kalender-tab-2"
            />
          </Tabs>

          {/* View Mode Toggle - nur für Mitarbeiter und Räume */}
          {(tabValue === 1 || tabValue === 2) && (
            <Box sx={{ px: 2 }}>
              <IconButton
                onClick={() =>
                  setViewMode(viewMode === "list" ? "month" : "list")
                }
                size="small"
                color="primary"
                title={viewMode === "list" ? "Monatsansicht" : "Listenansicht"}
              >
                {viewMode === "list" ? (
                  <CalendarViewMonthIcon />
                ) : (
                  <ViewListIcon />
                )}
              </IconButton>
            </Box>
          )}
        </Box>

        {/* Gemeindetermine */}
        <TabPanel value={tabValue} index={0}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
                fullWidth={isMobile}
                sx={{ mb: 2 }}
              >
                {isMobile ? "Neu" : "Neuer Gemeindetermin"}
              </Button>
              {gemeindetermine.length === 0 ? (
                <Box
                  sx={{
                    textAlign: "center",
                    py: 4,
                    color: "text.secondary",
                  }}
                >
                  <CalendarTodayIcon
                    sx={{ fontSize: 48, mb: 1, opacity: 0.3 }}
                  />
                  <Typography>Keine Gemeindetermine vorhanden</Typography>
                </Box>
              ) : (
                gemeindetermine.map((item) => (
                  <EventCard key={item.id} item={item} />
                ))
              )}
            </>
          )}
        </TabPanel>

        {/* Mitarbeitertermine */}
        <TabPanel value={tabValue} index={1}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
                fullWidth={isMobile}
                sx={{ mb: 2 }}
              >
                {isMobile ? "Neu" : "Neuer Mitarbeitereintrag"}
              </Button>

              {viewMode === "month" ? (
                <MonthCalendarView
                  items={mitarbeitertermine}
                  resourceName="person"
                  type="staff"
                />
              ) : (
                <>
                  {mitarbeitertermine.length === 0 ? (
                    <Box
                      sx={{
                        textAlign: "center",
                        py: 4,
                        color: "text.secondary",
                      }}
                    >
                      <CalendarTodayIcon
                        sx={{ fontSize: 48, mb: 1, opacity: 0.3 }}
                      />
                      <Typography>
                        Keine Mitarbeitertermine vorhanden
                      </Typography>
                    </Box>
                  ) : (
                    mitarbeitertermine.map((item) => (
                      <EventCard key={item.id} item={item} />
                    ))
                  )}
                </>
              )}
            </>
          )}
        </TabPanel>

        {/* Raumbelegungsplan */}
        <TabPanel value={tabValue} index={2}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
                fullWidth={isMobile}
                sx={{ mb: 2 }}
              >
                {isMobile ? "Neu" : "Neue Raumbelegung"}
              </Button>

              {viewMode === "month" ? (
                <MonthCalendarView
                  items={raumbelegungen}
                  resourceName="raum"
                  type="room"
                />
              ) : (
                <>
                  {raumbelegungen.length === 0 ? (
                    <Box
                      sx={{
                        textAlign: "center",
                        py: 4,
                        color: "text.secondary",
                      }}
                    >
                      <CalendarTodayIcon
                        sx={{ fontSize: 48, mb: 1, opacity: 0.3 }}
                      />
                      <Typography>Keine Raumbelegungen vorhanden</Typography>
                    </Box>
                  ) : (
                    raumbelegungen.map((item) => (
                      <EventCard key={item.id} item={item} />
                    ))
                  )}
                </>
              )}
            </>
          )}
        </TabPanel>
      </Paper>

      {/* Dialog für neuen/bearbeiteten Eintrag */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          {editingId ? "Eintrag bearbeiten" : "Neuer Eintrag"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Titel"
              value={formData.titel}
              onChange={(e) =>
                setFormData({ ...formData, titel: e.target.value })
              }
            />

            <TextField
              fullWidth
              type="date"
              label="Datum"
              value={formData.datum}
              onChange={(e) =>
                setFormData({ ...formData, datum: e.target.value })
              }
              InputLabelProps={{ shrink: true }}
            />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="time"
                  label="Startzeit"
                  value={formData.startzeit}
                  onChange={(e) =>
                    setFormData({ ...formData, startzeit: e.target.value })
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="time"
                  label="Endzeit"
                  value={formData.endzeit}
                  onChange={(e) =>
                    setFormData({ ...formData, endzeit: e.target.value })
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>

            <TextField
              fullWidth
              label="Beschreibung"
              value={formData.beschreibung}
              onChange={(e) =>
                setFormData({ ...formData, beschreibung: e.target.value })
              }
              multiline
              rows={isMobile ? 4 : 3}
            />

            {currentTab === 1 && (
              <>
                <FormControl fullWidth>
                  <InputLabel>Typ</InputLabel>
                  <Select
                    value={formData.typ}
                    onChange={(e) =>
                      setFormData({ ...formData, typ: e.target.value })
                    }
                    label="Typ"
                  >
                    <MenuItem value="termin">Termin</MenuItem>
                    <MenuItem value="krankheit">Krankheit</MenuItem>
                    <MenuItem value="urlaub">Urlaub</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  label="Person"
                  value={formData.person}
                  onChange={(e) =>
                    setFormData({ ...formData, person: e.target.value })
                  }
                />
              </>
            )}

            {currentTab === 2 && (
              <TextField
                fullWidth
                label="Raum"
                value={formData.raum}
                onChange={(e) =>
                  setFormData({ ...formData, raum: e.target.value })
                }
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: isMobile ? 2 : 3, pb: isMobile ? 2 : 3 }}>
          <Button onClick={handleCloseDialog} fullWidth={isMobile}>
            Abbrechen
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!formData.titel || !formData.datum}
            fullWidth={isMobile}
          >
            Speichern
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
