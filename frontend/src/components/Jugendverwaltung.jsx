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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Chip,
  Button,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ChildCareIcon from "@mui/icons-material/ChildCare";
import PersonIcon from "@mui/icons-material/Person";

const StatCard = ({ title, value, icon, color }) => (
  <Card
    sx={{
      background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
      borderLeft: `4px solid ${color}`,
      minHeight: 120,
    }}
  >
    <CardContent sx={{ py: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, color }}>
            {value}
          </Typography>
        </Box>
        <Box sx={{ fontSize: 50, color, opacity: 0.3 }}>{icon}</Box>
      </Box>
    </CardContent>
  </Card>
);

function Jugendverwaltung() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [youthMembers, setYouthMembers] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
  });

  const fetchYouthData = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await axiosInstance.get("/members/", {
        headers: { Authorization: `Token ${token}` },
      });

      const allMembers = response.data;
      const youth = allMembers.filter((m) => m.is_youth);

      setYouthMembers(youth);
      setStats({
        total: youth.length,
      });
      setLoading(false);
    } catch (error) {
      console.error("Fehler beim Laden:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchYouthData();
  }, []);

  if (loading) {
    return (
      <Container sx={{ mt: 4, textAlign: "center" }}>
        <Typography>Laden...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/admin-dashboard")}
          sx={{ mb: 2 }}
        >
          Zurück zum Dashboard
        </Button>

        <Box
          sx={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            borderRadius: 3,
            p: 4,
            color: "white",
          }}
        >
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
            👥 Jugendverwaltung
          </Typography>
          <Typography variant="body1">
            Verwaltung von Jugendlichen
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <StatCard
            title="Jugendliche"
            value={stats.total}
            icon={<PersonIcon />}
            color="#2e7d32"
          />
        </Grid>
      </Grid>

      <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
          Alle Jugendlichen
        </Typography>

        <TableContainer>
          <Table size="small">
            <TableHead
              sx={{ background: "linear-gradient(90deg, #f5f7fa, #c3cfe2)" }}
            >
              <TableRow>
                <TableCell>Foto</TableCell>
                <TableCell>Vorname</TableCell>
                <TableCell>Nachname</TableCell>
                <TableCell>Geburtstag</TableCell>
                <TableCell>Typ</TableCell>
                <TableCell>Telefon</TableCell>
                <TableCell>E-Mail</TableCell>
                <TableCell>Gruppen</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {youthMembers.map((member) => (
                <TableRow
                  key={member.id}
                  hover
                  onClick={() =>
                    navigate(`/admin-dashboard/member/${member.id}`)
                  }
                  sx={{
                    cursor: "pointer",
                    "&:hover": { background: "#f8f9fa" },
                  }}
                >
                  <TableCell>
                    <Avatar
                      src={member.photo}
                      alt={member.first_name}
                      sx={{ width: 32, height: 32 }}
                    >
                      {member.first_name[0]}
                    </Avatar>
                  </TableCell>
                  <TableCell>{member.first_name}</TableCell>
                  <TableCell>{member.last_name}</TableCell>
                  <TableCell>
                    {member.date_of_birth
                      ? new Date(member.date_of_birth).toLocaleDateString(
                          "de-DE"
                        )
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <Chip label="Jugend" size="small" color="success" />
                  </TableCell>
                  <TableCell>{member.phone || "-"}</TableCell>
                  <TableCell>{member.email || "-"}</TableCell>
                  <TableCell>
                    {member.gruppen && member.gruppen.length > 0
                      ? member.gruppen.map((g) => g.name).join(", ")
                      : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
}

export default Jugendverwaltung;
