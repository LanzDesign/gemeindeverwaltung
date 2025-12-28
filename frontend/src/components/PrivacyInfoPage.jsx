import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axios";
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  IconButton,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import ArchiveIcon from "@mui/icons-material/Archive";
import InfoIcon from "@mui/icons-material/Info";
import WarningIcon from "@mui/icons-material/Warning";

function PrivacyInfoPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    deletedCount: 0,
    expiringSoonCount: 0,
    anonymizedCount: 0,
  });

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await axiosInstance.get("/members/trash/", {
        headers: { Authorization: `Token ${token}` },
      });

      const members = response.data;
      const now = new Date();

      const expiringSoon = members.filter((m) => {
        const deleted = new Date(m.deleted_at);
        const diffTime = 30 * 24 * 60 * 60 * 1000 - (now - deleted);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 7 && diffDays > 0;
      });

      const anonymized = members.filter((m) => m.anonymized_at);

      setStats({
        deletedCount: members.length,
        expiringSoonCount: expiringSoon.length,
        anonymizedCount: anonymized.length,
      });
    } catch (error) {
      console.error("Fehler beim Laden der Statistiken:", error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <IconButton onClick={() => navigate("/admin")} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          🔒 Datenschutz & Löschung
        </Typography>
      </Box>

      {/* Statistiken */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: "primary.light", color: "white" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <DeleteIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Gelöschte Mitglieder</Typography>
              </Box>
              <Typography variant="h3">{stats.deletedCount}</Typography>
              <Typography variant="body2">Im Papierkorb</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: "warning.main", color: "white" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <WarningIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Ablaufend</Typography>
              </Box>
              <Typography variant="h3">{stats.expiringSoonCount}</Typography>
              <Typography variant="body2">Weniger als 7 Tage</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: "success.main", color: "white" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <ArchiveIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Anonymisiert</Typography>
              </Box>
              <Typography variant="h3">{stats.anonymizedCount}</Typography>
              <Typography variant="body2">Nach 30 Tagen</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* DSGVO Informationen */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <InfoIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h5">DSGVO-Konforme Datenlöschung</Typography>
        </Box>

        <Alert severity="info" sx={{ mb: 2 }}>
          Dieses System implementiert automatische Datenlöschung gemäß DSGVO
          Artikel 17 (Recht auf Löschung).
        </Alert>

        <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
          Automatische Prozesse:
        </Typography>

        <List>
          <ListItem>
            <ListItemText
              primary={
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Chip
                    label="Tag 0"
                    color="primary"
                    size="small"
                    sx={{ mr: 2 }}
                  />
                  <Typography variant="body1">
                    <strong>Soft-Delete (Papierkorb)</strong>
                  </Typography>
                </Box>
              }
              secondary="Mitglied wird in den Papierkorb verschoben statt sofort gelöscht. Daten bleiben vollständig erhalten."
            />
          </ListItem>
          <Divider component="li" />

          <ListItem>
            <ListItemText
              primary={
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Chip
                    label="1-30 Tage"
                    color="default"
                    size="small"
                    sx={{ mr: 2 }}
                  />
                  <Typography variant="body1">
                    <strong>Wiederherstellungsphase</strong>
                  </Typography>
                </Box>
              }
              secondary="Mitglied kann jederzeit wiederhergestellt werden. Admin erhält Warnung bei ablaufender Frist (7 Tage)."
            />
          </ListItem>
          <Divider component="li" />

          <ListItem>
            <ListItemText
              primary={
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Chip
                    label="Tag 31"
                    color="warning"
                    size="small"
                    sx={{ mr: 2 }}
                  />
                  <Typography variant="body1">
                    <strong>Automatische Anonymisierung</strong>
                  </Typography>
                </Box>
              }
              secondary="Alle personenbezogenen Daten werden gelöscht (Name, E-Mail, Adresse, etc.). Datenschutzerklärung-PDF bleibt erhalten."
            />
          </ListItem>
          <Divider component="li" />

          <ListItem>
            <ListItemText
              primary={
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Chip
                    label="6 Jahre"
                    color="success"
                    size="small"
                    sx={{ mr: 2 }}
                  />
                  <Typography variant="body1">
                    <strong>Archivierung mit Löschzertifikat</strong>
                  </Typography>
                </Box>
              }
              secondary="Nach 6 Jahren wird ein Löschzertifikat erstellt und das Mitglied archiviert. Zertifikat wird weitere 6 Jahre aufbewahrt."
            />
          </ListItem>
        </List>

        <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
          Manuelle Löschung:
        </Typography>

        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Permanente Löschung auf Anfrage</strong>
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Admin kann Mitglieder jederzeit permanent löschen. Dabei wird
            automatisch ein Löschzertifikat erstellt, das heruntergeladen und
            ausgedruckt werden kann.
          </Typography>
        </Alert>

        <List dense>
          <ListItem>
            <ListItemText primary="✓ Löschzertifikat wird automatisch generiert (PDF)" />
          </ListItem>
          <ListItem>
            <ListItemText primary="✓ Zertifikat enthält: Zeitstempel, gelöschte Daten, DSGVO-Hinweise" />
          </ListItem>
          <ListItem>
            <ListItemText primary="✓ Optional: E-Mail-Benachrichtigung an Mitglied" />
          </ListItem>
          <ListItem>
            <ListItemText primary="✓ Alle personenbezogenen Daten werden sofort anonymisiert" />
          </ListItem>
        </List>
      </Paper>

      {/* Aufbewahrungsfristen */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          📅 Aufbewahrungsfristen (DSGVO)
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" color="primary">
                  30 Tage
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Papierkorb (Wiederherstellungsmöglichkeit)
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" color="primary">
                  6 Jahre
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Datenschutzerklärung-PDF (Steuerrechtliche Gründe)
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" color="primary">
                  6 Jahre
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Löschzertifikate (Nachweispflicht)
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Alert severity="success" sx={{ mt: 3 }}>
          <Typography variant="body2">
            <strong>Automatische Wartung:</strong> Ein täglicher Cronjob führt
            automatisch die Anonymisierung und Archivierung durch. Sie müssen
            nichts manuell tun.
          </Typography>
        </Alert>
      </Paper>
    </Container>
  );
}

export default PrivacyInfoPage;
