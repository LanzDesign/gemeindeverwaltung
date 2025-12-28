import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/auth";
import {
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  Container,
} from "@mui/material";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await login(username, password);
      navigate("/new-member");
    } catch (err) {
      console.error("Login-Fehler (Status):", err.response?.status);
      console.error("Login-Fehler (Data):", err.response?.data);
      console.error("Login-Fehler (Headers):", err.response?.headers);
      if (err.response?.status === 400 || err.response?.status === 401) {
        setError("Ungültige Anmeldedaten. Bitte erneut versuchen.");
      } else {
        setError(
          `Fehler ${err.response?.status}: ${err.response?.data || err.message}`
        );
      }
    }
  };

  return (
    <Container maxWidth="sm" className="app-root" sx={{ px: { xs: 2, sm: 3 } }}>
      <Box
        className="form-box"
        sx={{
          my: { xs: 2, sm: 4 },
          p: { xs: 2, sm: 3 },
          boxShadow: 3,
          borderRadius: 2,
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          align="center"
          sx={{ fontSize: { xs: "1.75rem", sm: "2.125rem" } }}
        >
          Anmelden
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <form onSubmit={handleSubmit} noValidate>
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
            sx={{ mt: 2, minHeight: 48 }}
            className="submit-button"
          >
            Anmelden
          </Button>
        </form>
      </Box>
    </Container>
  );
}

export default Login;
