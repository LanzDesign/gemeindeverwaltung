import React from "react";
import {
  Container,
  Box,
  Typography,
  useTheme,
  useMediaQuery,
  Button,
  Stack,
} from "@mui/material";
import BuildingIcon from "@mui/icons-material/Domain";
import DownloadIcon from "@mui/icons-material/Download";
import EventIcon from "@mui/icons-material/Event";
import ModernCalendar from "../calendar/calendar";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function GemeindeteminePage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const handleICSExport = () => {
    const currentYear = new Date().getFullYear();
    const url = `${API_BASE_URL}/api/kalender/gemeindetermine/export/ics/?jahr=${currentYear}`;
    window.open(url, "_blank");
  };

  const handleExcelExport = () => {
    const currentYear = new Date().getFullYear();
    const url = `${API_BASE_URL}/api/kalender/export/excel/?jahr=${currentYear}`;
    window.open(url, "_blank");
  };

  return (
    <Container
      maxWidth="xl"
      sx={{
        py: { xs: 2, sm: 3 },
        px: { xs: 1, sm: 2, md: 3 },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          mb: { xs: 2, sm: 3 },
          flexWrap: "wrap",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <BuildingIcon
            sx={{
              fontSize: { xs: 28, sm: 32 },
              color: "primary.main",
            }}
          />
          <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: 700 }}>
            Gemeindetermine
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<EventIcon />}
            onClick={handleICSExport}
            sx={{ whiteSpace: "nowrap" }}
          >
            ICS Export
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<DownloadIcon />}
            onClick={handleExcelExport}
            sx={{ whiteSpace: "nowrap" }}
          >
            Jahreskalender
          </Button>
        </Stack>
      </Box>

      <ModernCalendar type="gemeinde" />
    </Container>
  );
}
