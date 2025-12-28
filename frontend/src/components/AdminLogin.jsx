import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
} from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";

function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await axios.post(
        "https://api.fecg-lahr-app.de/login/",
        { username, password },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      console.log("Login erfolgreich:", response.data);

      if (response.data.token) {
        localStorage.setItem("adminToken", response.data.token);
        localStorage.setItem(
          "adminUsername",
          response.data.username || username
        );
        localStorage.setItem("loginTime", Date.now().toString());

        // Speichere Gruppeninformationen
        if (response.data.groups) {
          localStorage.setItem(
            "userGroups",
            JSON.stringify(response.data.groups)
          );
        }
        if (response.data.is_jugendleiter !== undefined) {
          localStorage.setItem(
            "isJugendleiter",
            response.data.is_jugendleiter.toString()
          );
        }
        if (response.data.is_gemeindeallteste !== undefined) {
          localStorage.setItem(
            "isGemeindeallteste",
            response.data.is_gemeindeallteste.toString()
          );
        }

        navigate("/");
      } else {
        setError("Kein Token vom Server erhalten");
      }
    } catch (err) {
      console.error("Login-Fehler:", err.response?.data || err.message);
      console.error("Status:", err.response?.status);
      console.error("URL:", err.config?.url);

      if (err.response?.status === 400) {
        setError("Ungültige Anmeldedaten");
      } else if (err.response?.status === 404) {
        setError("Login-Endpunkt nicht gefunden (Server-Problem)");
      } else {
        setError(
          `Fehler: ${err.response?.status || "Netzwerkfehler"} - ${
            err.response?.data?.detail || err.message
          }`
        );
      }
    }
  };

  return (
    <Container
      maxWidth="sm"
      sx={{ mt: { xs: 4, sm: 8 }, px: { xs: 2, sm: 3 } }}
    >
      <Paper elevation={6} sx={{ p: { xs: 3, sm: 4 }, borderRadius: 3 }}>
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <LockIcon
            sx={{ fontSize: { xs: 48, sm: 60 }, color: "primary.main" }}
          />
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              mt: 2,
              fontSize: { xs: "1.75rem", sm: "2.125rem" },
            }}
          >
            Admin Login
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleLogin}>
          <TextField
            fullWidth
            label="Benutzername"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Passwort"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            required
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            sx={{ mt: 3, py: 1.5, minHeight: 48 }}
          >
            Anmelden
          </Button>
        </form>
      </Paper>
    </Container>
  );
}

export default AdminLogin;
