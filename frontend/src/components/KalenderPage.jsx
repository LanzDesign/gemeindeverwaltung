import React, { useState } from "react";
import {
  Box,
  Container,
  Paper,
  Typography,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import ModernCalendar from "../calendar/calendar";
import MitarbeiterKalenderView from "./MitarbeiterKalenderView";

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

  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

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
        </Box>

        {/* Gemeindetermine */}
        <TabPanel value={tabValue} index={0}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <ModernCalendar type="gemeinde" />
          )}
        </TabPanel>

        {/* Mitarbeitertermine */}
        <TabPanel value={tabValue} index={1}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <MitarbeiterKalenderView />
          )}
        </TabPanel>

        {/* Raumbelegungsplan */}
        <TabPanel value={tabValue} index={2}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <ModernCalendar type="raum" />
          )}
        </TabPanel>
      </Paper>
    </Container>
  );
}
