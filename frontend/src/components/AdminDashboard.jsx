import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axiosInstance from "../api/axios";
import DeleteMemberDialog from "./DeleteMemberDialog";

import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Chip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField as MuiTextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox as MuiCheckbox,
  FormGroup,
  FormControlLabel,
  TableSortLabel,
  Tooltip,
  IconButton,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import PeopleIcon from "@mui/icons-material/People";
import GroupIcon from "@mui/icons-material/Group";
import VolunteerActivismIcon from "@mui/icons-material/VolunteerActivism";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import EditIcon from "@mui/icons-material/Edit";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";
import GroupsIcon from "@mui/icons-material/Groups";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import DownloadIcon from "@mui/icons-material/Download";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import PersonIcon from "@mui/icons-material/Person";
import ChildCareIcon from "@mui/icons-material/ChildCare";
import ShareIcon from "@mui/icons-material/Share";

// Abstrakte Kennzahlenkarte
function StatCard({ title, value, icon, color, onClick, isActive }) {
  return (
    <Card
      onClick={onClick}
      sx={{
        background: isActive
          ? `linear-gradient(135deg, ${color}40 0%, ${color}20 100%)`
          : `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
        borderLeft: `4px solid ${color}`,
        minHeight: { xs: 100, sm: 120 },
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.2s ease",
        transform: isActive ? "scale(1.02)" : "scale(1)",
        boxShadow: isActive ? 4 : 1,
        "&:hover": onClick
          ? {
              transform: "scale(1.02)",
              boxShadow: 4,
            }
          : {},
      }}
    >
      <CardContent sx={{ py: { xs: 2, sm: 3 } }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontSize: { xs: "0.8rem", sm: "0.875rem" } }}
            >
              {title}
            </Typography>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color,
                fontSize: { xs: "1.75rem", sm: "2.125rem" },
              }}
            >
              {value}
            </Typography>
          </Box>
          <Box sx={{ fontSize: { xs: 40, sm: 50 }, color, opacity: 0.3 }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

// Datenschutz-Icons Komponente
function PrivacyIcons({ member }) {
  return (
    <Box
      sx={{
        display: "flex",
        gap: 0.8,
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "flex-start",
      }}
    >
      {/* WhatsApp - nur anzeigen wenn zugestimmt */}
      {member.privacy_whatsapp && (
        <Tooltip title="WhatsApp-Gruppe: Zugestimmt">
          <WhatsAppIcon sx={{ fontSize: 24, color: "#4caf50" }} />
        </Tooltip>
      )}

      {/* Mitgliedschaft - nur anzeigen wenn zugestimmt */}
      {member.privacy_membership && (
        <Tooltip title="Mitgliedschaft: Zugestimmt">
          <PersonIcon sx={{ fontSize: 24, color: "#4caf50" }} />
        </Tooltip>
      )}

      {/* Spenden - nur anzeigen wenn zugestimmt */}
      {member.privacy_donation && (
        <Tooltip title="Spendenquittung: Zugestimmt">
          <VolunteerActivismIcon sx={{ fontSize: 24, color: "#4caf50" }} />
        </Tooltip>
      )}

      {/* Kinder - nur anzeigen wenn zugestimmt */}
      {member.privacy_children && (
        <Tooltip title="Kinder-Daten: Zugestimmt">
          <ChildCareIcon sx={{ fontSize: 24, color: "#4caf50" }} />
        </Tooltip>
      )}
    </Box>
  );
}

function AdminDashboard() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    donors: 0,
    newThisMonth: 0,
    youth: 0,
    children: 0,
    inactive: 0,
  });
  const [allMembers, setAllMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDonor, setFilterDonor] = useState(false);
  const [filterNonDonor, setFilterNonDonor] = useState(false);
  const [filterMember, setFilterMember] = useState(false);
  const [filterNoGroup, setFilterNoGroup] = useState(false);
  const [filterYouth, setFilterYouth] = useState(false);
  const [filterChild, setFilterChild] = useState(false);
  const [filterMale, setFilterMale] = useState(false);
  const [filterFemale, setFilterFemale] = useState(false);
  const [filterShowAll, setFilterShowAll] = useState(false);
  const [filterWithServices, setFilterWithServices] = useState(false);
  const [filterWithoutServices, setFilterWithoutServices] = useState(false);
  const [filterWithDesiredServices, setFilterWithDesiredServices] =
    useState(false);
  const [filterWithoutDesiredServices, setFilterWithoutDesiredServices] =
    useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [sortField, setSortField] = useState("last_name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [searchField, setSearchField] = useState("all");

  const location = useLocation();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get("/members/");
        const members = response.data;
        
        // Debug: Gender-Werte ausgeben
        console.log("=== GENDER DEBUG ===");
        console.log("Erste 10 Members mit Gender:", 
          members.slice(0, 10).map(m => ({ 
            name: `${m.first_name} ${m.last_name}`, 
            gender: m.gender,
            genderType: typeof m.gender
          }))
        );
        const maleCount = members.filter((m) => m.gender === "male").length;
        const femaleCount = members.filter((m) => m.gender === "female").length;
        const emptyGender = members.filter((m) => !m.gender || m.gender === '').length;
        console.log(`Male: ${maleCount}, Female: ${femaleCount}, Empty: ${emptyGender}`);
        
        setStats({
          total: members.length,
          active: members.filter((m) => m.status === "active").length,
          donors: members.filter((m) => m.is_donor).length,
          newThisMonth: members.filter(
            (m) =>
              m.date_of_birth &&
              new Date(m.date_of_birth) >
                new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          ).length,
          youth: members.filter((m) => m.is_youth).length,
          children: members.filter((m) => m.is_child).length,
          male: members.filter((m) => m.gender === "male").length,
          female: members.filter((m) => m.gender === "female").length,
          inactive: members.filter((m) => m.status === "passive").length,
        });
        setAllMembers(members);
      } catch (error) {
        console.error("Fehler beim Laden:", error);
        if (error.response?.status === 401) {
          localStorage.removeItem("adminToken");
          window.location.href = "/admin-login";
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [location.key, location.state?.reload]);

  // Gefilterte und sortierte Mitglieder berechnen
  const filteredMembers = useMemo(() => {
    // Helper function to check if birthday is within next 5 days
    const isBirthdaySoon = (dateOfBirth) => {
      if (!dateOfBirth) return false;

      // Get current date in German timezone
      const today = new Date(
        new Date().toLocaleString("en-US", { timeZone: "Europe/Berlin" })
      );
      today.setHours(0, 0, 0, 0);

      // Parse birthday and set to current year
      const birthday = new Date(dateOfBirth + "T00:00:00");
      birthday.setFullYear(today.getFullYear());
      birthday.setHours(0, 0, 0, 0);

      // If birthday already passed this year, check next year
      if (birthday < today) {
        birthday.setFullYear(today.getFullYear() + 1);
      }

      const daysUntilBirthday = Math.floor(
        (birthday - today) / (1000 * 60 * 60 * 24)
      );
      return daysUntilBirthday >= 0 && daysUntilBirthday <= 5;
    };

    return allMembers
      .filter((m) => {
        const term = searchTerm.toLowerCase();

        // Field-specific search
        let matchesSearch = false;
        switch (searchField) {
          case "all":
            matchesSearch =
              m.first_name.toLowerCase().includes(term) ||
              m.last_name.toLowerCase().includes(term) ||
              (m.email && m.email.toLowerCase().includes(term)) ||
              (m.phone && m.phone.toLowerCase().includes(term)) ||
              (m.profession && m.profession.toLowerCase().includes(term)) ||
              (m.city && m.city.toLowerCase().includes(term)) ||
              (m.street && m.street.toLowerCase().includes(term)) ||
              (m.postal_code && m.postal_code.includes(term)) ||
              (m.nationality && m.nationality.toLowerCase().includes(term)) ||
              (m.date_of_birth &&
                (m.date_of_birth.includes(term) ||
                  new Date(m.date_of_birth)
                    .toLocaleDateString("de-DE", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })
                    .includes(term))) ||
              m.current_services?.some((s) =>
                s.name.toLowerCase().includes(term)
              ) ||
              m.desired_services?.some((s) =>
                s.name.toLowerCase().includes(term)
              ) ||
              m.gruppen?.some((g) => g.name.toLowerCase().includes(term));
            break;
          case "name":
            matchesSearch =
              m.first_name.toLowerCase().includes(term) ||
              m.last_name.toLowerCase().includes(term);
            break;
          case "email":
            matchesSearch = m.email && m.email.toLowerCase().includes(term);
            break;
          case "phone":
            matchesSearch = m.phone && m.phone.toLowerCase().includes(term);
            break;
          case "city":
            matchesSearch = m.city && m.city.toLowerCase().includes(term);
            break;
          case "address":
            matchesSearch =
              (m.street && m.street.toLowerCase().includes(term)) ||
              (m.postal_code && m.postal_code.includes(term)) ||
              (m.city && m.city.toLowerCase().includes(term));
            break;
          case "profession":
            matchesSearch =
              m.profession && m.profession.toLowerCase().includes(term);
            break;
          case "services":
            matchesSearch =
              m.current_services?.some((s) =>
                s.name.toLowerCase().includes(term)
              ) ||
              m.desired_services?.some((s) =>
                s.name.toLowerCase().includes(term)
              );
            break;
          case "group":
            matchesSearch = m.gruppen?.some((g) =>
              g.name.toLowerCase().includes(term)
            );
            break;
          case "nationality":
            matchesSearch =
              m.nationality && m.nationality.toLowerCase().includes(term);
            break;
          case "birthday":
            if (m.date_of_birth) {
              // Support both YYYY-MM-DD and DD.MM.YYYY formats
              const formattedDate = new Date(
                m.date_of_birth
              ).toLocaleDateString("de-DE", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              });
              matchesSearch =
                m.date_of_birth.includes(term) || formattedDate.includes(term);
            } else {
              matchesSearch = false;
            }
            break;
          default:
            matchesSearch = true;
        }

        if (!matchesSearch) return false;
        if (filterStatus !== "all" && m.status !== filterStatus) return false;
        if (filterDonor && !m.is_donor) return false;
        if (filterNonDonor && m.is_donor) return false;
        if (filterMember && !m.is_member) return false;
        if (filterYouth && !m.is_youth) return false;
        
        // Gender filter
        if (filterMale) {
          const gender = (m.gender || '').toLowerCase();
          if (gender !== "male" && gender !== "m" && gender !== "männlich") return false;
        }
        if (filterFemale) {
          const gender = (m.gender || '').toLowerCase();
          if (gender !== "female" && gender !== "f" && gender !== "weiblich") return false;
        }

        // Filter children:
        // - If "Alle anzeigen" is active, show everyone (adults and children)
        // - If "Kinder" filter is active, show only children
        // - Otherwise (default), show only adults (hide children)
        if (filterShowAll) {
          // Show all - no child filtering
        } else if (filterChild) {
          // Show only children
          if (!m.is_child) return false;
        } else {
          // Default: hide children
          if (m.is_child) return false;
        }

        if (filterNoGroup) {
          // Show only members without any group
          if (m.gruppen && m.gruppen.length > 0) return false;
        }
        if (filterWithServices) {
          if (!m.current_services || m.current_services.length === 0)
            return false;
        }
        if (filterWithoutServices) {
          if (m.current_services && m.current_services.length > 0) return false;
        }
        if (filterWithDesiredServices) {
          if (!m.desired_services || m.desired_services.length === 0)
            return false;
        }
        if (filterWithoutDesiredServices) {
          if (m.desired_services && m.desired_services.length > 0) return false;
        }
        return true;
      })
      .sort((a, b) => {
        // Sort by upcoming birthday first
        const aBirthdaySoon = isBirthdaySoon(a.date_of_birth);
        const bBirthdaySoon = isBirthdaySoon(b.date_of_birth);

        if (aBirthdaySoon && !bBirthdaySoon) return -1;
        if (!aBirthdaySoon && bBirthdaySoon) return 1;

        // Then sort by selected field
        let aVal, bVal;

        switch (sortField) {
          case "name":
            aVal = `${a.last_name} ${a.first_name}`.toLowerCase();
            bVal = `${b.last_name} ${b.first_name}`.toLowerCase();
            break;
          case "first_name":
            aVal = (a.first_name || "").toLowerCase();
            bVal = (b.first_name || "").toLowerCase();
            break;
          case "last_name":
            aVal = (a.last_name || "").toLowerCase();
            bVal = (b.last_name || "").toLowerCase();
            break;
          case "email":
            aVal = (a.email || "").toLowerCase();
            bVal = (b.email || "").toLowerCase();
            break;
          case "city":
            aVal = (a.city || "").toLowerCase();
            bVal = (b.city || "").toLowerCase();
            break;
          case "status":
            aVal = a.status || "";
            bVal = b.status || "";
            break;
          case "date_of_birth":
            aVal = a.date_of_birth ? new Date(a.date_of_birth).getTime() : 0;
            bVal = b.date_of_birth ? new Date(b.date_of_birth).getTime() : 0;
            break;
          default:
            aVal = (a.last_name || "").toLowerCase();
            bVal = (b.last_name || "").toLowerCase();
        }

        if (sortField === "date_of_birth") {
          return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
        }

        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return sortDirection === "asc" ? comparison : -comparison;
      });
  }, [
    allMembers,
    searchTerm,
    filterStatus,
    filterDonor,
    filterNonDonor,
    filterMember,
    filterMale,
    filterFemale,
    filterNoGroup,
    filterYouth,
    filterChild,
    filterShowAll,
    filterWithServices,
    filterWithoutServices,
    filterWithDesiredServices,
    filterWithoutDesiredServices,
    sortField,
    sortDirection,
    searchField,
  ]);

  // Handler für Sortierung
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Helper function for birthday highlighting (also used in render)
  const getBirthdayInfo = (dateOfBirth) => {
    if (!dateOfBirth) return { isSoon: false, daysUntil: null };

    // Get current date in German timezone
    const today = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Europe/Berlin" })
    );
    today.setHours(0, 0, 0, 0);

    // Parse birthday and set to current year
    const birthday = new Date(dateOfBirth + "T00:00:00");
    birthday.setFullYear(today.getFullYear());
    birthday.setHours(0, 0, 0, 0);

    if (birthday < today) {
      birthday.setFullYear(today.getFullYear() + 1);
    }

    const daysUntilBirthday = Math.floor(
      (birthday - today) / (1000 * 60 * 60 * 24)
    );
    return {
      isSoon: daysUntilBirthday >= 0 && daysUntilBirthday <= 5,
      daysUntil: daysUntilBirthday,
    };
  };

  const handleOpenMember = (member) =>
    navigate(`/admin-dashboard/member/${member.id}`);

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedMember(null);
  };

  const handleRegeneratePDF = async () => {
    if (!selectedMember) return;
    try {
      const token = localStorage.getItem("adminToken");
      await axiosInstance.post(
        `/members/${selectedMember.id}/regenerate-pdf/`,
        {},
        { headers: { Authorization: `Token ${token}` } }
      );
      alert("Datenschutzerklärung erfolgreich neu generiert!");
      handleCloseDialog();
    } catch (error) {
      console.error("Fehler beim Regenerieren:", error);
      alert("Fehler beim Erstellen des PDFs");
    }
  };

  const handleShareRegistrationLink = async () => {
    const registrationUrl = `${window.location.origin}/registrieren`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "FECG Lahr - Registrierung",
          text: "Registriere dich für die FECG Lahr",
          url: registrationUrl,
        });
      } catch (error) {
        // User cancelled or error occurred
        if (error.name !== "AbortError") {
          console.error("Error sharing:", error);
          // Fallback: copy to clipboard
          navigator.clipboard.writeText(registrationUrl);
          alert("Link wurde in die Zwischenablage kopiert!");
        }
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(registrationUrl);
      alert("Link wurde in die Zwischenablage kopiert!");
    }
  };

  // XLSX Export der aktuell gefilterten Mitglieder
  const handleExportXLSX = async () => {
    if (!filteredMembers || filteredMembers.length === 0) {
      alert("Keine Daten zum Exportieren");
      return;
    }

    try {
      // Dynamisch xlsx importieren
      const XLSX = await import("xlsx");

      // Daten für Excel vorbereiten
      const worksheetData = [
        // Header
        [
          "ID",
          "Vorname",
          "Nachname",
          "E-Mail",
          "Telefon",
          "Straße",
          "PLZ",
          "Ort",
          "Geburtsdatum",
          "Status",
          "Spender",
          "Mitglied",
          "Aktuelle Dienste",
          "Anzahl Dienste",
          "Wunschdienste",
          "Anzahl Wunschdienste",
          "Datenschutz PDF",
        ],
        // Datenzeilen
        ...filteredMembers.map((m) => [
          m.id,
          m.first_name || "",
          m.last_name || "",
          m.email || "",
          m.phone || "",
          m.street || "",
          m.postal_code || "",
          m.city || "",
          m.date_of_birth || "",
          m.status || "",
          m.is_donor ? "Ja" : "Nein",
          m.is_member ? "Ja" : "Nein",
          m.current_services
            ? m.current_services.map((s) => s.name).join(", ")
            : "",
          m.current_services ? m.current_services.length : 0,
          m.desired_services
            ? m.desired_services.map((s) => s.name).join(", ")
            : "",
          m.desired_services ? m.desired_services.length : 0,
          m.privacy_policy_pdf ? "Ja" : "Nein",
        ]),
      ];

      // Worksheet erstellen
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

      // Spaltenbreiten setzen
      const columnWidths = [
        { wch: 5 }, // ID
        { wch: 15 }, // Vorname
        { wch: 15 }, // Nachname
        { wch: 25 }, // E-Mail
        { wch: 15 }, // Telefon
        { wch: 20 }, // Straße
        { wch: 8 }, // PLZ
        { wch: 15 }, // Ort
        { wch: 12 }, // Geburtsdatum
        { wch: 10 }, // Status
        { wch: 8 }, // Spender
        { wch: 10 }, // Mitglied
        { wch: 30 }, // Aktuelle Dienste
        { wch: 8 }, // Anzahl
        { wch: 30 }, // Wunschdienste
        { wch: 8 }, // Anzahl
        { wch: 12 }, // PDF
      ];
      worksheet["!cols"] = columnWidths;

      // Workbook erstellen
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Mitglieder");

      // Datei herunterladen
      const filename = `mitglieder_export_${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`;
      XLSX.writeFile(workbook, filename);
    } catch (error) {
      console.error("Fehler beim XLSX Export:", error);
      alert("Fehler beim Erstellen der Excel-Datei");
    }
  };

  // Check admin rights (simple: adminToken in localStorage)
  const isAdmin = Boolean(localStorage.getItem("adminToken"));

  if (loading) {
    return (
      <Box sx={{ width: "100%", mt: 4 }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth={false} sx={{ mt: 4, mb: 4, px: { xs: 0.5, sm: 1, md: 2 } }}>
      <Box
        sx={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          borderRadius: 3,
          p: 4,
          mb: 4,
          color: "white",
        }}
      >
        <Typography
          variant="h3"
          sx={{
            fontWeight: 700,
            mb: 1,
            fontSize: { xs: "1.5rem", sm: "2.5rem", md: "3rem" },
            wordBreak: "break-word",
          }}
        >
          📊 Mitgliederverwaltung
        </Typography>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={4} md={3}>
          <StatCard
            title="Gesamt Mitglieder"
            value={stats.total}
            icon={<PeopleIcon />}
            color="#1976d2"
            onClick={() => {
              // Reset all filters to show all
              setFilterStatus("all");
              setFilterDonor(false);
              setFilterNonDonor(false);
              setFilterMember(false);
              setFilterNoGroup(false);
              setFilterYouth(false);
              setFilterChild(false);
              setFilterShowAll(true);
              setFilterWithServices(false);
              setFilterWithoutServices(false);
              setFilterWithDesiredServices(false);
              setFilterWithoutDesiredServices(false);
            }}
            isActive={
              filterStatus === "all" &&
              !filterDonor &&
              !filterNonDonor &&
              !filterMember &&
              !filterNoGroup &&
              !filterYouth &&
              !filterChild &&
              filterShowAll &&
              !filterWithServices &&
              !filterWithoutServices &&
              !filterWithDesiredServices &&
              !filterWithoutDesiredServices
            }
          />
        </Grid>
        <Grid item xs={6} sm={4} md={3}>
          <StatCard
            title="Aktive Mitglieder"
            value={stats.active}
            icon={<GroupIcon />}
            color="#2e7d32"
            onClick={() => {
              // Reset all other filters
              setFilterDonor(false);
              setFilterNonDonor(false);
              setFilterMember(false);
              setFilterNoGroup(false);
              setFilterYouth(false);
              setFilterChild(false);
              setFilterShowAll(false);
              setFilterWithServices(false);
              setFilterWithoutServices(false);
              setFilterWithDesiredServices(false);
              setFilterWithoutDesiredServices(false);
              // Toggle active filter
              setFilterStatus(filterStatus === "active" ? "all" : "active");
            }}
            isActive={filterStatus === "active"}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={3}>
          <StatCard
            title="Spender"
            value={stats.donors}
            icon={<VolunteerActivismIcon />}
            color="#ed6c02"
            onClick={() => {
              // Reset all other filters
              setFilterStatus("all");
              setFilterNonDonor(false);
              setFilterMember(false);
              setFilterNoGroup(false);
              setFilterYouth(false);
              setFilterChild(false);
              setFilterShowAll(false);
              setFilterWithServices(false);
              setFilterWithoutServices(false);
              setFilterWithDesiredServices(false);
              setFilterWithoutDesiredServices(false);
              // Toggle donor filter
              setFilterDonor(!filterDonor);
            }}
            isActive={filterDonor}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={3}>
          <StatCard
            title="Neu (30 Tage)"
            value={stats.newThisMonth}
            icon={<TrendingUpIcon />}
            color="#9c27b0"
          />
        </Grid>
        <Grid item xs={6} sm={4} md={3}>
          <StatCard
            title="Jugend"
            value={stats.youth}
            icon={<GroupIcon />}
            color="#0288d1"
            onClick={() => {
              // Reset all other filters
              setFilterStatus("all");
              setFilterDonor(false);
              setFilterNonDonor(false);
              setFilterMember(false);
              setFilterNoGroup(false);
              setFilterChild(false);
              setFilterShowAll(false);
              setFilterWithServices(false);
              setFilterWithoutServices(false);
              setFilterWithDesiredServices(false);
              setFilterWithoutDesiredServices(false);
              // Toggle youth filter
              setFilterYouth(!filterYouth);
            }}
            isActive={filterYouth}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={3}>
          <StatCard
            title="Kinder"
            value={stats.children}
            icon={<ChildCareIcon />}
            color="#f57c00"
            onClick={() => {
              // Reset all other filters
              setFilterStatus("all");
              setFilterDonor(false);
              setFilterNonDonor(false);
              setFilterMember(false);
              setFilterNoGroup(false);
              setFilterYouth(false);
              setFilterShowAll(false);
              setFilterWithServices(false);
              setFilterWithoutServices(false);
              setFilterWithDesiredServices(false);
              setFilterWithoutDesiredServices(false);
              // Toggle child filter
              const newChildFilter = !filterChild;
              setFilterChild(newChildFilter);
              // Enable show all when showing children
              if (newChildFilter) setFilterShowAll(true);
            }}
            isActive={filterChild}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={3}>
          <StatCard
            title="Männlich"
            value={stats.male}
            icon={<PersonIcon />}
            color="#1976d2"
            onClick={() => {
              setFilterMale(!filterMale);
              setFilterFemale(false);
            }}
            isActive={filterMale}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={3}>
          <StatCard
            title="Weiblich"
            value={stats.female}
            icon={<PersonIcon />}
            color="#d81b60"
            onClick={() => {
              setFilterFemale(!filterFemale);
              setFilterMale(false);
            }}
            isActive={filterFemale}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={3}>
          <StatCard
            title="Inaktive Mitglieder"
            value={stats.inactive}
            icon={<PersonIcon />}
            color="#d32f2f"
            onClick={() => {
              // Reset all other filters
              setFilterDonor(false);
              setFilterNonDonor(false);
              setFilterMember(false);
              setFilterNoGroup(false);
              setFilterYouth(false);
              setFilterChild(false);
              setFilterShowAll(false);
              setFilterWithServices(false);
              setFilterWithoutServices(false);
              setFilterWithDesiredServices(false);
              setFilterWithoutDesiredServices(false);
              // Toggle passive filter
              setFilterStatus(filterStatus === "passive" ? "all" : "passive");
            }}
            isActive={filterStatus === "passive"}
          />
        </Grid>
      </Grid>

      <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 3,
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            👥 Alle Mitglieder
          </Typography>
          <Box
            sx={{
              display: "flex",
              gap: 2,
              flexWrap: "wrap",
              flexDirection: { xs: "column", sm: "row" },
            }}
          >
            <Button
              variant="contained"
              startIcon={<AddCircleOutlineIcon />}
              onClick={() => navigate("/new-member")}
              fullWidth={isSmall}
              sx={{ minHeight: 48 }}
            >
              Mitglied anlegen
            </Button>
            <Button
              variant="contained"
              startIcon={<ShareIcon />}
              onClick={handleShareRegistrationLink}
              fullWidth={isSmall}
              sx={{
                minHeight: 48,
                bgcolor: "#25D366",
                "&:hover": { bgcolor: "#1da851" },
              }}
            >
              Anmeldelink teilen
            </Button>
            <Button
              variant="contained"
              startIcon={<FamilyRestroomIcon />}
              onClick={() => navigate("/admin-dashboard/families")}
              fullWidth={isSmall}
              sx={{ minHeight: 48 }}
            >
              Familien verwalten
            </Button>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<GroupsIcon />}
              onClick={() => navigate("/admin-dashboard/gruppen")}
              fullWidth={isSmall}
              sx={{ minHeight: 48 }}
            >
              Gruppen verwalten
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={(e) => {
                e.stopPropagation();
                handleExportXLSX();
              }}
              fullWidth={isSmall}
              sx={{ minHeight: 48 }}
            >
              Excel Export
            </Button>
          </Box>
        </Box>

        <Grid container spacing={1.5} sx={{ mb: 2 }}>
          <Grid item xs={12} md={4}>
            <MuiTextField
              fullWidth
              label="Suche"
              variant="outlined"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={
                searchField === "all"
                  ? "Alle Felder durchsuchen..."
                  : searchField === "name"
                  ? "Name suchen..."
                  : searchField === "email"
                  ? "E-Mail suchen..."
                  : searchField === "phone"
                  ? "Telefon suchen..."
                  : searchField === "city"
                  ? "Ort suchen..."
                  : searchField === "address"
                  ? "Adresse suchen..."
                  : searchField === "profession"
                  ? "Beruf suchen..."
                  : searchField === "services"
                  ? "Dienste suchen..."
                  : searchField === "group"
                  ? "Gruppe suchen..."
                  : searchField === "nationality"
                  ? "Nationalität suchen..."
                  : "Suchen..."
              }
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Suchfeld</InputLabel>
              <Select
                label="Suchfeld"
                value={searchField}
                onChange={(e) => setSearchField(e.target.value)}
              >
                <MenuItem value="all">Alle Felder</MenuItem>
                <MenuItem value="name">Name</MenuItem>
                <MenuItem value="email">E-Mail</MenuItem>
                <MenuItem value="phone">Telefon</MenuItem>
                <MenuItem value="city">Ort</MenuItem>
                <MenuItem value="address">Adresse</MenuItem>
                <MenuItem value="profession">Beruf</MenuItem>
                <MenuItem value="services">Dienste</MenuItem>
                <MenuItem value="group">Gruppe</MenuItem>
                <MenuItem value="nationality">Nationalität</MenuItem>
                <MenuItem value="birthday">Geburtstag</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                label="Status"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <MenuItem value="all">Alle</MenuItem>
                <MenuItem value="active">Aktiv</MenuItem>
                <MenuItem value="passive">Passiv</MenuItem>
                <MenuItem value="guest">Gast</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={1.5}>
            <FormGroup>
              <FormControlLabel
                control={
                  <MuiCheckbox
                    checked={filterDonor}
                    onChange={(e) => setFilterDonor(e.target.checked)}
                  />
                }
                label="Spender"
              />
            </FormGroup>
          </Grid>
          <Grid item xs={6} md={1.5}>
            <FormGroup>
              <FormControlLabel
                control={
                  <MuiCheckbox
                    checked={filterNonDonor}
                    onChange={(e) => setFilterNonDonor(e.target.checked)}
                  />
                }
                label="Nicht-Spender"
              />
            </FormGroup>
          </Grid>
          <Grid item xs={6} md={1.5}>
            <FormGroup>
              <FormControlLabel
                control={
                  <MuiCheckbox
                    checked={filterMember}
                    onChange={(e) => setFilterMember(e.target.checked)}
                  />
                }
                label="Mitglied"
              />
            </FormGroup>
          </Grid>
          <Grid item xs={6} md={1.5}>
            <FormGroup>
              <FormControlLabel
                control={
                  <MuiCheckbox
                    checked={filterNoGroup}
                    onChange={(e) => setFilterNoGroup(e.target.checked)}
                  />
                }
                label="Ohne Gruppe"
              />
            </FormGroup>
          </Grid>
          <Grid item xs={6} md={1.5}>
            <FormGroup>
              <FormControlLabel
                control={
                  <MuiCheckbox
                    checked={filterYouth}
                    onChange={(e) => setFilterYouth(e.target.checked)}
                  />
                }
                label="Jugend"
              />
            </FormGroup>
          </Grid>
          <Grid item xs={6} md={1.5}>
            <FormGroup>
              <FormControlLabel
                control={
                  <MuiCheckbox
                    checked={filterChild}
                    onChange={(e) => setFilterChild(e.target.checked)}
                  />
                }
                label="Kind"
              />
            </FormGroup>
          </Grid>
          <Grid item xs={6} md={1.5}>
            <FormGroup>
              <FormControlLabel
                control={
                  <MuiCheckbox
                    checked={filterMale}
                    onChange={(e) => {
                      setFilterMale(e.target.checked);
                      if (e.target.checked) {
                        setFilterShowAll(true);
                      }
                    }}
                  />
                }
                label="Männlich"
              />
            </FormGroup>
          </Grid>
          <Grid item xs={6} md={1.5}>
            <FormGroup>
              <FormControlLabel
                control={
                  <MuiCheckbox
                    checked={filterFemale}
                    onChange={(e) => {
                      setFilterFemale(e.target.checked);
                      if (e.target.checked) {
                        setFilterShowAll(true);
                      }
                    }}
                  />
                }
                label="Weiblich"
              />
            </FormGroup>
          </Grid>
          <Grid item xs={6} md={1.5}>
            <FormGroup>
              <FormControlLabel
                control={
                  <MuiCheckbox
                    checked={filterShowAll}
                    onChange={(e) => setFilterShowAll(e.target.checked)}
                  />
                }
                label="Alle anzeigen"
              />
            </FormGroup>
          </Grid>
          <Grid item xs={6} md={1.5}>
            <FormGroup>
              <FormControlLabel
                control={
                  <MuiCheckbox
                    checked={filterWithServices}
                    onChange={(e) => setFilterWithServices(e.target.checked)}
                  />
                }
                label="Mit Diensten"
              />
            </FormGroup>
          </Grid>
          <Grid item xs={6} md={1.5}>
            <FormGroup>
              <FormControlLabel
                control={
                  <MuiCheckbox
                    checked={filterWithoutServices}
                    onChange={(e) => setFilterWithoutServices(e.target.checked)}
                  />
                }
                label="Ohne Dienste"
              />
            </FormGroup>
          </Grid>
          <Grid item xs={6} md={1.5}>
            <FormGroup>
              <FormControlLabel
                control={
                  <MuiCheckbox
                    checked={filterWithDesiredServices}
                    onChange={(e) =>
                      setFilterWithDesiredServices(e.target.checked)
                    }
                  />
                }
                label="Mit Wunschdiensten"
              />
            </FormGroup>
          </Grid>
          <Grid item xs={6} md={1.5}>
            <FormGroup>
              <FormControlLabel
                control={
                  <MuiCheckbox
                    checked={filterWithoutDesiredServices}
                    onChange={(e) =>
                      setFilterWithoutDesiredServices(e.target.checked)
                    }
                  />
                }
                label="Ohne Wunschdienste"
              />
            </FormGroup>
          </Grid>
        </Grid>

        <TableContainer>
          <Table
            size="small"
            sx={{ "& .MuiTableCell-root": { px: 1, py: 0.5 } }}
          >
            <TableHead
              sx={{ background: "linear-gradient(90deg, #f5f7fa, #c3cfe2)" }}
            >
              <TableRow>
                <TableCell>Foto</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortField === "first_name"}
                    direction={sortDirection}
                    onClick={() => handleSort("first_name")}
                  >
                    Vorname
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortField === "last_name"}
                    direction={sortDirection}
                    onClick={() => handleSort("last_name")}
                  >
                    Nachname
                  </TableSortLabel>
                </TableCell>
                {!isSmall && (
                  <TableCell>
                    <TableSortLabel
                      active={sortField === "date_of_birth"}
                      direction={sortDirection}
                      onClick={() => handleSort("date_of_birth")}
                    >
                      Geburtstag
                    </TableSortLabel>
                  </TableCell>
                )}
                {!isSmall && <TableCell>Telefon</TableCell>}
                <TableCell>Datenschutz</TableCell>
                <TableCell>PDF</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortField === "status"}
                    direction={sortDirection}
                    onClick={() => handleSort("status")}
                  >
                    Status
                  </TableSortLabel>
                </TableCell>
                {!isSmall && <TableCell>Spender</TableCell>}
                <TableCell>Gruppen</TableCell>
                <TableCell>Dienste</TableCell>
                {!isSmall && <TableCell>Wunschdienste</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredMembers.map((member) => {
                const birthdayInfo = getBirthdayInfo(member.date_of_birth);
                return (
                  <TableRow
                    key={member.id}
                    hover
                    sx={{
                      "&:hover": {
                        background: "#f8f9fa",
                        cursor: "pointer",
                      },
                      border: birthdayInfo.isSoon
                        ? "3px solid #ff9800"
                        : "none",
                      backgroundColor: birthdayInfo.isSoon
                        ? "#fff3e0"
                        : "inherit",
                    }}
                    onClick={() => handleOpenMember(member)}
                  >
                    <TableCell>
                      <Avatar src={member.photo} alt={member.first_name} />
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: birthdayInfo.isSoon ? 700 : 400 }}
                        >
                          {member.first_name}
                        </Typography>
                        {birthdayInfo.isSoon && (
                          <Chip
                            label={
                              birthdayInfo.daysUntil === 0
                                ? "🎉 Heute Geburtstag!"
                                : `🎂 in ${birthdayInfo.daysUntil} Tag${
                                    birthdayInfo.daysUntil === 1 ? "" : "en"
                                  }`
                            }
                            size="small"
                            color="warning"
                            sx={{ mt: 0.5, fontWeight: 600 }}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: birthdayInfo.isSoon ? 700 : 400 }}
                        >
                          {member.last_name}
                        </Typography>
                        {birthdayInfo.isSoon && (
                          <Chip
                            label={
                              birthdayInfo.daysUntil === 0
                                ? "🎉 Heute Geburtstag!"
                                : `🎂 in ${birthdayInfo.daysUntil} Tag${
                                    birthdayInfo.daysUntil === 1 ? "" : "en"
                                  }`
                            }
                            size="small"
                            color="warning"
                            sx={{ mt: 0.5, fontWeight: 600 }}
                          />
                        )}
                      </Box>
                    </TableCell>
                    {!isSmall && (
                      <TableCell>
                        {member.date_of_birth
                          ? new Date(member.date_of_birth).toLocaleDateString(
                              "de-DE",
                              {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              }
                            )
                          : "–"}
                      </TableCell>
                    )}
                    {!isSmall && <TableCell>{member.phone || "–"}</TableCell>}
                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <PrivacyIcons member={member} />
                        {member.privacy_policy_pdf && (
                          <Tooltip title="PDF herunterladen">
                            <IconButton
                              size="small"
                              color="primary"
                              href={`https://api.fecg-lahr-app.de/members/${member.id}/download_pdf/`}
                              target="_blank"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <PictureAsPdfIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {member.privacy_policy_pdf ? (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<PictureAsPdfIcon />}
                          href={`https://api.fecg-lahr-app.de/members/${member.id}/download_pdf/`}
                          target="_blank"
                          onClick={(e) => e.stopPropagation()}
                          sx={{ minWidth: "auto" }}
                        >
                          PDF
                        </Button>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          –
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={
                          member.status === "active"
                            ? "Aktiv"
                            : member.status === "passive"
                            ? "Inaktiv"
                            : member.status === "guest"
                            ? "Gast"
                            : member.status
                        }
                        color={
                          member.status === "active"
                            ? "success"
                            : member.status === "passive"
                            ? "error"
                            : "default"
                        }
                        size="small"
                      />
                    </TableCell>
                    {!isSmall && (
                      <TableCell>{member.is_donor ? "✅" : "❌"}</TableCell>
                    )}
                    <TableCell>
                      {member.gruppen && member.gruppen.length > 0 ? (
                        <Box
                          sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}
                        >
                          {member.gruppen.map((g) => (
                            <Chip
                              key={g.id}
                              label={g.name}
                              size="small"
                              color="info"
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          –
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {member.current_services &&
                      member.current_services.length > 0 ? (
                        <Box
                          sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}
                        >
                          {member.current_services.map((s) => (
                            <Chip
                              key={s.id}
                              label={s.name}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          –
                        </Typography>
                      )}
                    </TableCell>
                    {!isSmall && (
                      <TableCell>
                        {member.desired_services &&
                        member.desired_services.length > 0 ? (
                          <Box
                            sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}
                          >
                            {member.desired_services.map((s) => (
                              <Chip
                                key={s.id}
                                label={s.name}
                                size="small"
                                color="secondary"
                                variant="outlined"
                              />
                            ))}
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            –
                          </Typography>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Member-Detail Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle
          sx={{
            background: "linear-gradient(90deg, #667eea, #764ba2)",
            color: "white",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar
              src={selectedMember?.photo}
              sx={{ width: 56, height: 56 }}
            />
            <Typography variant="h6">
              {selectedMember?.first_name} {selectedMember?.last_name}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ mt: 3 }}>
          <Grid container spacing={2}>
            <Grid
              item
              xs={12}
              sx={{ display: "flex", justifyContent: "center", mb: 2 }}
            >
              {selectedMember?.photo_thumb || selectedMember?.photo ? (
                <Box
                  sx={{
                    width: 240,
                    height: 240,
                    borderRadius: 2,
                    overflow: "hidden",
                    boxShadow: 2,
                  }}
                >
                  <img
                    src={selectedMember.photo_thumb || selectedMember.photo}
                    alt="Mitglied"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </Box>
              ) : (
                <Avatar sx={{ width: 120, height: 120 }} />
              )}
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                E-Mail
              </Typography>
              <Typography variant="body1">
                {selectedMember?.email || "-"}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Telefon
              </Typography>
              <Typography variant="body1">
                {selectedMember?.phone || "-"}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                Adresse
              </Typography>
              <Typography variant="body1">
                {selectedMember
                  ? `${selectedMember.street || ""} ${
                      selectedMember.postal_code || ""
                    } ${selectedMember.city || ""}`.trim() || "-"
                  : "-"}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Status
              </Typography>
              <Chip
                label={selectedMember?.status}
                color={
                  selectedMember?.status === "active" ? "success" : "default"
                }
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Spender
              </Typography>
              <Typography variant="body1">
                {selectedMember?.is_donor ? "✅ Ja" : "❌ Nein"}
              </Typography>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 2 }}>
          {selectedMember?.privacy_policy_pdf && (
            <Button
              variant="outlined"
              startIcon={<PictureAsPdfIcon />}
              href={`https://api.fecg-lahr-app.de/members/${selectedMember.id}/download_pdf/`}
              target="_blank"
            >
              PDF anzeigen
            </Button>
          )}
          <Button
            variant="contained"
            startIcon={<PictureAsPdfIcon />}
            onClick={handleRegeneratePDF}
          >
            Datenschutzerklärung anpassen
          </Button>
          <Button onClick={handleCloseDialog}>Schließen</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default AdminDashboard;
