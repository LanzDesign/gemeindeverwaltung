import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axios";
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Alert,
  Grid,
  IconButton,
  Divider,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PersonIcon from "@mui/icons-material/Person";
import LockIcon from "@mui/icons-material/Lock";

function ProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
  });
  const [passwords, setPasswords] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await axiosInstance.get("/auth/profile/", {
        headers: { Authorization: `Token ${token}` },
      });
      setProfile(response.data);
      setLoading(false);
    } catch (err) {
      console.error("Fehler beim Laden des Profils:", err);
      setError("Fehler beim Laden des Profils");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    try {
      const token = localStorage.getItem("adminToken");
      await axiosInstance.patch(
        "/auth/profile/",
        {
          email: profile.email,
          first_name: profile.first_name,
          last_name: profile.last_name,
        },
        {
          headers: { Authorization: `Token ${token}` },
        }
      );
      setMessage("Profil erfolgreich aktualisiert!");
    } catch (err) {
      console.error("Fehler beim Aktualisieren:", err);
      setError("Fehler beim Aktualisieren des Profils");
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    if (passwords.new_password !== passwords.confirm_password) {
      setError("Neue Passwörter stimmen nicht überein");
      return;
    }

    if (passwords.new_password.length < 8) {
      setError("Passwort muss mindestens 8 Zeichen lang sein");
      return;
    }

    try {
      const token = localStorage.getItem("adminToken");
      await axiosInstance.post(
        "/auth/change-password/",
        {
          current_password: passwords.current_password,
          new_password: passwords.new_password,
        },
        {
          headers: { Authorization: `Token ${token}` },
        }
      );
      setMessage("Passwort erfolgreich geändert!");
      setPasswords({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
    } catch (err) {
      console.error("Fehler beim Ändern des Passworts:", err);
      setError(err.response?.data?.error || "Fehler beim Ändern des Passworts");
    }
  };

  if (loading) return <Container sx={{ mt: 4 }}>Lädt...</Container>;

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <IconButton onClick={() => navigate("/admin")} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          👤 Mein Profil
        </Typography>
      </Box>

      {message && (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          onClose={() => setMessage(null)}
        >
          {message}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Profil-Daten */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <PersonIcon sx={{ mr: 1, color: "primary.main" }} />
          <Typography variant="h6">Profil-Informationen</Typography>
        </Box>
        <Divider sx={{ mb: 3 }} />

        <form onSubmit={handleProfileUpdate}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Benutzername"
                value={profile.username}
                disabled
                helperText="Benutzername kann nicht geändert werden"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Vorname"
                value={profile.first_name}
                onChange={(e) =>
                  setProfile({ ...profile, first_name: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nachname"
                value={profile.last_name}
                onChange={(e) =>
                  setProfile({ ...profile, last_name: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="E-Mail"
                type="email"
                value={profile.email}
                onChange={(e) =>
                  setProfile({ ...profile, email: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
              >
                Profil speichern
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {/* Passwort ändern */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <LockIcon sx={{ mr: 1, color: "warning.main" }} />
          <Typography variant="h6">Passwort ändern</Typography>
        </Box>
        <Divider sx={{ mb: 3 }} />

        <form onSubmit={handlePasswordChange}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Aktuelles Passwort"
                type="password"
                value={passwords.current_password}
                onChange={(e) =>
                  setPasswords({
                    ...passwords,
                    current_password: e.target.value,
                  })
                }
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Neues Passwort"
                type="password"
                value={passwords.new_password}
                onChange={(e) =>
                  setPasswords({ ...passwords, new_password: e.target.value })
                }
                required
                helperText="Mindestens 8 Zeichen"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Neues Passwort bestätigen"
                type="password"
                value={passwords.confirm_password}
                onChange={(e) =>
                  setPasswords({
                    ...passwords,
                    confirm_password: e.target.value,
                  })
                }
                required
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="warning"
                size="large"
              >
                Passwort ändern
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
}

export default ProfilePage;
