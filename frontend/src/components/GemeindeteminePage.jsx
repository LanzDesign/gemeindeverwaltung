import React from "react";
import {
  Container,
  Box,
  Typography,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import BuildingIcon from "@mui/icons-material/Domain";
import ModernCalendar from "../calendar/calendar";

export default function GemeindeteminePage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

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
          gap: 1,
          mb: { xs: 2, sm: 3 },
        }}
      >
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

      <ModernCalendar type="gemeinde" />
    </Container>
  );
}
