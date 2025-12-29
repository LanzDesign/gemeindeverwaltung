import React, { useState, useMemo } from "react";
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
  Chip,
  Stack,
  useTheme,
  useMediaQuery,
  Tooltip,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

const MONTH_NAMES = [
  "Januar",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
];

const DAY_NAMES = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
const DAY_NAMES_MONDAY_START = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

// Typ-Farben
const TYPE_COLORS = {
  termin: { bg: "#E3F2FD", text: "#1976D2", label: "T" },
  krankheit: { bg: "#000000", text: "#FFFFFF", label: "K" },
  urlaub: { bg: "#C8E6C9", text: "#2E7D32", label: "U" },
  leitung: { bg: "#FFF9C4", text: "#F57F17", label: "Le" },
  extern: { bg: "#F3E5F5", text: "#7B1FA2", label: "E" },
  default: { bg: "#EEEEEE", text: "#424242", label: "•" },
};

export default function MonthCalendarView({
  items = [],
  resourceName = "person",
  type = "staff",
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [currentDate, setCurrentDate] = useState(new Date());

  // Gruppiere Items nach Person/Raum
  const groupedItems = useMemo(() => {
    const groups = {};
    items.forEach((item) => {
      const key = type === "staff" ? item.person : item.raum;
      if (!key) return;

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
    });
    return groups;
  }, [items, type]);

  // Berechne Tage im Monat
  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days = [];
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d);
      const dayOfWeek = date.getDay();
      // Konvertiere zu Montag-Start (Mo=0, Di=1, ..., So=6)
      const weekdayMondayStart = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      days.push({
        day: d,
        weekday: dayOfWeek, // Original (So=0, Mo=1, ...)
        weekdayMondayStart: weekdayMondayStart, // Montag-Start (Mo=0, ..., So=6)
        date: date,
        dateString: date.toISOString().split("T")[0],
      });
    }
    return days;
  }, [currentDate]);

  // Hole Events für einen bestimmten Tag und Person/Raum
  const getEventsForDay = (resourceKey, dateString) => {
    const resourceItems = groupedItems[resourceKey] || [];
    return resourceItems.filter((item) => item.datum === dateString);
  };

  const handlePrevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const renderCell = (resourceKey, dayInfo) => {
    const events = getEventsForDay(resourceKey, dayInfo.dateString);
    const isWeekend = dayInfo.weekday === 0 || dayInfo.weekday === 6;
    const isToday =
      dayInfo.dateString === new Date().toISOString().split("T")[0];

    return (
      <TableCell
        key={dayInfo.day}
        align="center"
        sx={{
          minWidth: isMobile ? 28 : 35,
          maxWidth: isMobile ? 28 : 35,
          width: isMobile ? 28 : 35,
          padding: "2px",
          backgroundColor: isWeekend ? "#f0f0f0" : "white",
          borderRight: "1px solid #ddd",
          borderBottom: "1px solid #ddd",
          cursor: events.length > 0 ? "pointer" : "default",
          position: "relative",
          verticalAlign: "middle",
          height: isMobile ? "40px" : "50px",
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
          {events.map((event, idx) => {
            const typeColor = TYPE_COLORS[event.typ] || TYPE_COLORS.default;
            return (
              <Tooltip
                key={idx}
                title={`${event.titel} (${event.startzeit || ""}-${
                  event.endzeit || ""
                })`}
                arrow
                placement="top"
              >
                <Box
                  sx={{
                    backgroundColor: typeColor.bg,
                    color: typeColor.text,
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
                  {typeColor.label}
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
          <IconButton
            onClick={handlePrevMonth}
            size={isMobile ? "small" : "medium"}
          >
            <ChevronLeftIcon />
          </IconButton>
          <Typography
            variant={isMobile ? "h6" : "h5"}
            sx={{ minWidth: 180, textAlign: "center" }}
          >
            {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
          </Typography>
          <IconButton
            onClick={handleNextMonth}
            size={isMobile ? "small" : "medium"}
          >
            <ChevronRightIcon />
          </IconButton>
        </Stack>
        <IconButton onClick={handleToday} size="small">
          <Typography variant="caption" sx={{ fontWeight: "bold" }}>
            Heute
          </Typography>
        </IconButton>
      </Stack>

      {/* Legende */}
      <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2, gap: 1 }}>
        {Object.entries(TYPE_COLORS)
          .filter(([key]) => key !== "default")
          .map(([key, value]) => (
            <Chip
              key={key}
              label={`${value.label} = ${
                key.charAt(0).toUpperCase() + key.slice(1)
              }`}
              size="small"
              sx={{
                backgroundColor: value.bg,
                color: value.text,
                fontSize: isMobile ? "10px" : "12px",
              }}
            />
          ))}
      </Stack>

      {/* Kalender Tabelle */}
      <TableContainer
        component={Paper}
        sx={{
          maxHeight: isMobile ? "calc(100vh - 320px)" : "calc(100vh - 280px)",
          overflowX: "auto",
          overflowY: "auto",
          border: "1px solid #ddd",
        }}
      >
        <Table stickyHeader size="small" sx={{ tableLayout: "fixed" }}>
          <TableHead>
            <TableRow>
              {/* Erste Spalte für Namen */}
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
                {type === "staff" ? "Mitarbeiter" : "Raum"}
              </TableCell>

              {/* Tage des Monats */}
              {daysInMonth.map((dayInfo) => (
                <TableCell
                  key={dayInfo.day}
                  align="center"
                  sx={{
                    minWidth: isMobile ? 28 : 35,
                    maxWidth: isMobile ? 28 : 35,
                    width: isMobile ? 28 : 35,
                    padding: "4px 2px",
                    backgroundColor:
                      dayInfo.weekday === 0 || dayInfo.weekday === 6
                        ? "#e0e0e0"
                        : "#5b9bd5",
                    color: "white",
                    fontWeight: "bold",
                    fontSize: isMobile ? "10px" : "11px",
                    borderRight: "1px solid #ddd",
                    borderBottom: "2px solid #ddd",
                  }}
                >
                  <div>{dayInfo.day}</div>
                  <div style={{ fontSize: isMobile ? "8px" : "9px" }}>
                    {DAY_NAMES_MONDAY_START[dayInfo.weekdayMondayStart]}
                  </div>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.keys(groupedItems).length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={daysInMonth.length + 1}
                  align="center"
                  sx={{ py: 4 }}
                >
                  <Typography color="text.secondary">
                    Keine Einträge für diesen Monat
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              Object.keys(groupedItems)
                .sort()
                .map((resourceKey) => (
                  <TableRow key={resourceKey}>
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
                      {resourceKey}
                    </TableCell>
                    {daysInMonth.map((dayInfo) =>
                      renderCell(resourceKey, dayInfo)
                    )}
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
