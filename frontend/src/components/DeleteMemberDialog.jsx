import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import WarningIcon from "@mui/icons-material/Warning";
import axiosInstance from "../api/axios";

export default function DeleteMemberDialog({
  member,
  open,
  onClose,
  onSuccess,
}) {
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleDelete = async () => {
    if (!confirmed) {
      alert("Bitte bestätigen Sie die Löschung");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const response = await axiosInstance.post(
        `/members/${member.id}/permanent_delete/`,
        { confirm: true },
        {
          headers: {
            Authorization: `Token ${token}`,
            "Cache-Control": "no-cache",
          },
        }
      );

      // Zeige Bestätigung
      alert(
        `Mitglied gelöscht. Zertifikat verfügbar: ${response.data.certificate_url}`
      );

      // Download Zertifikat automatisch
      if (response.data.certificate_url) {
        window.open(response.data.certificate_url, "_blank");
      }

      onSuccess();
      onClose();
    } catch (error) {
      alert(`Fehler: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <WarningIcon sx={{ color: "#f44336" }} />
        Mitglied permanent löschen
      </DialogTitle>

      <DialogContent>
        <Alert severity="error" sx={{ mb: 2 }}>
          <strong>WARNUNG:</strong> Diese Aktion kann nicht rückgängig gemacht
          werden!
        </Alert>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2">
            Sie sind im Begriff,{" "}
            <strong>
              {member?.first_name} {member?.last_name}
            </strong>{" "}
            permanent zu löschen.
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Folgende Daten werden gelöscht:
          </Typography>
          <Typography variant="body2" sx={{ pl: 2, mt: 1 }}>
            • Persönliche Daten (Name, Adresse, E-Mail, Telefon)
            <br />
            • Geburtsdatum und Familiendaten
            <br />
            • Fotos und Unterschriften
            <br />
            • Alle Datenschutz-Einwilligungen
            <br />
            • Dienst- und Gruppenzuordnungen
            <br />• Datenschutzerklärung (PDF)
          </Typography>
        </Box>

        <Alert severity="info" sx={{ mb: 2 }}>
          Ein Löschzertifikat wird automatisch erstellt und zum Herunterladen
          bereitgestellt. Dies dokumentiert die DSGVO-konforme Löschung gemäß
          Artikel 17.
        </Alert>

        <FormControlLabel
          control={
            <Checkbox
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
          }
          label="Ich bestätige, dass ich alle Daten dieser Person gelöschen möchte und verstehe, dass dies nicht rückgängig gemacht werden kann."
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Abbrechen
        </Button>
        <Button
          onClick={handleDelete}
          disabled={loading || !confirmed}
          variant="contained"
          color="error"
          startIcon={loading ? <CircularProgress size={20} /> : <DeleteIcon />}
        >
          {loading ? "Wird gelöscht..." : "Permanent löschen"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
