import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axios";
import {
  Container,
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Alert,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import RestoreIcon from "@mui/icons-material/Restore";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import DownloadIcon from "@mui/icons-material/Download";

function TrashPage() {
  const navigate = useNavigate();
  const [deletedMembers, setDeletedMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    member: null,
  });

  const fetchDeletedMembers = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await axiosInstance.get("/members/trash/", {
        headers: { Authorization: `Token ${token}` },
      });
      setDeletedMembers(response.data);
      setLoading(false);
    } catch (err) {
      console.error("Fehler beim Laden:", err);
      setError("Fehler beim Laden der gelöschten Mitglieder");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeletedMembers();
  }, []);

  const handleRestore = async (memberId) => {
    try {
      const token = localStorage.getItem("adminToken");
      await axiosInstance.post(
        `/members/${memberId}/restore/`,
        {},
        { headers: { Authorization: `Token ${token}` } }
      );
      alert("Mitglied erfolgreich wiederhergestellt!");
      fetchDeletedMembers();
    } catch (error) {
      console.error("Fehler beim Wiederherstellen:", error);
      alert("Fehler beim Wiederherstellen");
    }
  };

  const handlePermanentDelete = async () => {
    const member = deleteDialog.member;
    if (!member) return;

    try {
      const token = localStorage.getItem("adminToken");
      const response = await axiosInstance.post(
        `/members/${member.id}/permanent_delete/`,
        { confirm: true },
        { headers: { Authorization: `Token ${token}` } }
      );

      alert(`${response.data.message}\n\nLöschzertifikat wurde erstellt.`);

      // Download Löschzertifikat
      if (response.data.certificate_url) {
        try {
          const certResponse = await axiosInstance.get(
            `/members/${member.id}/download_deletion_certificate/`,
            {
              headers: { Authorization: `Token ${token}` },
              responseType: "blob",
            }
          );
          const url = window.URL.createObjectURL(new Blob([certResponse.data]));
          const link = document.createElement("a");
          link.href = url;
          link.setAttribute(
            "download",
            `Loeschzertifikat_${member.last_name}_${member.first_name}.pdf`
          );
          document.body.appendChild(link);
          link.click();
          link.remove();
        } catch (downloadError) {
          console.error("Fehler beim Download des Zertifikats:", downloadError);
        }
      }

      setDeleteDialog({ open: false, member: null });
      fetchDeletedMembers();
    } catch (error) {
      console.error("Fehler bei permanenter Löschung:", error);
      alert(
        "Fehler bei der permanenten Löschung: " +
          (error.response?.data?.error || error.message)
      );
    }
  };

  const getDaysRemaining = (deletedAt) => {
    const deleted = new Date(deletedAt);
    const now = new Date();
    const diffTime = 30 * 24 * 60 * 60 * 1000 - (now - deleted);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  if (loading) return <Container sx={{ mt: 4 }}>Lädt...</Container>;

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <IconButton onClick={() => navigate("/admin")} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          🗑️ Papierkorb
        </Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>DSGVO-Hinweis:</strong> Gelöschte Mitglieder werden 30 Tage
          lang gespeichert und können wiederhergestellt werden. Nach 30 Tagen
          werden personenbezogene Daten automatisch anonymisiert. Die
          Datenschutzerklärung-PDF bleibt aus steuerrechtlichen Gründen 6 Jahre
          erhalten.
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          <strong>Permanente Löschung:</strong> Sie können Mitglieder jederzeit
          permanent löschen. Dabei wird ein Löschzertifikat erstellt, das Sie
          herunterladen und ausdrucken können. Das Zertifikat wird 6 Jahre
          archiviert.
        </Typography>
      </Alert>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {deletedMembers.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h6" color="text.secondary">
            Papierkorb ist leer
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ bgcolor: "grey.200" }}>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>E-Mail</TableCell>
                <TableCell>Gelöscht am</TableCell>
                <TableCell>Verbleibende Tage</TableCell>
                <TableCell>Aktionen</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {deletedMembers.map((member) => {
                const daysLeft = getDaysRemaining(member.deleted_at);
                const isExpiringSoon = daysLeft <= 7;

                return (
                  <TableRow
                    key={member.id}
                    sx={{
                      bgcolor: isExpiringSoon ? "#fff3e0" : "inherit",
                    }}
                  >
                    <TableCell>
                      {member.last_name}, {member.first_name}
                    </TableCell>
                    <TableCell>{member.email || "-"}</TableCell>
                    <TableCell>
                      {new Date(member.deleted_at).toLocaleDateString("de-DE")}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${daysLeft} Tage`}
                        color={isExpiringSoon ? "warning" : "default"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        startIcon={<RestoreIcon />}
                        onClick={() => handleRestore(member.id)}
                        sx={{ mr: 1 }}
                      >
                        Wiederherstellen
                      </Button>
                      <Button
                        variant="contained"
                        color="error"
                        size="small"
                        startIcon={<DeleteForeverIcon />}
                        onClick={() => setDeleteDialog({ open: true, member })}
                      >
                        Permanent löschen
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Bestätigungsdialog für permanente Löschung */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, member: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: "error.main", color: "white" }}>
          ⚠️ Permanente Löschung bestätigen
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <DialogContentText>
            <strong>ACHTUNG:</strong> Diese Aktion kann nicht rückgängig gemacht
            werden!
          </DialogContentText>
          <DialogContentText sx={{ mt: 2 }}>
            Sie sind dabei, folgendes Mitglied permanent zu löschen:
          </DialogContentText>
          <Paper sx={{ p: 2, mt: 2, bgcolor: "grey.100" }}>
            <Typography variant="body1">
              <strong>Name:</strong> {deleteDialog.member?.first_name}{" "}
              {deleteDialog.member?.last_name}
            </Typography>
            <Typography variant="body2">
              <strong>E-Mail:</strong> {deleteDialog.member?.email || "Keine"}
            </Typography>
          </Paper>
          <DialogContentText sx={{ mt: 2 }}>
            <strong>Was passiert bei der permanenten Löschung?</strong>
          </DialogContentText>
          <Box component="ul" sx={{ mt: 1 }}>
            <li>Alle personenbezogenen Daten werden sofort anonymisiert</li>
            <li>
              Ein Löschzertifikat (PDF) wird erstellt und automatisch
              heruntergeladen
            </li>
            <li>Das Zertifikat wird 6 Jahre lang archiviert (DSGVO-konform)</li>
            <li>
              Optional wird eine Benachrichtigungs-E-Mail an das Mitglied
              gesendet
            </li>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setDeleteDialog({ open: false, member: null })}
            variant="outlined"
          >
            Abbrechen
          </Button>
          <Button
            onClick={handlePermanentDelete}
            variant="contained"
            color="error"
            startIcon={<DeleteForeverIcon />}
          >
            Jetzt permanent löschen
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default TrashPage;
