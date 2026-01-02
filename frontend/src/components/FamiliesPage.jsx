import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axios";
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Chip,
  Autocomplete,
  Grid,
  TextField as SearchField,
  Collapse,
  List,
  ListItem,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import PersonIcon from "@mui/icons-material/Person";
import MoreVertIcon from "@mui/icons-material/MoreVert";

function FamiliesPage() {
  const navigate = useNavigate();
  const [families, setFamilies] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingFamily, setEditingFamily] = useState(null);
  const [familyName, setFamilyName] = useState("");
  const [selectedVater, setSelectedVater] = useState(null);
  const [selectedMutter, setSelectedMutter] = useState(null);
  const [selectedKinder, setSelectedKinder] = useState([]);
  const [isNameDirty, setIsNameDirty] = useState(false);
  const [isVaterDirty, setIsVaterDirty] = useState(false);
  const [isMutterDirty, setIsMutterDirty] = useState(false);
  const [isKinderDirty, setIsKinderDirty] = useState(false);

  // New state for search and expand
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFamilyId, setExpandedFamilyId] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedMemberForMenu, setSelectedMemberForMenu] = useState(null);

  const handleMenuOpen = (event, member) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedMemberForMenu(member);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedMemberForMenu(null);
  };

  const fetchFamilies = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      const response = await axiosInstance.get("/families/", {
        headers: { Authorization: `Token ${token}` },
      });
      setFamilies(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Fehler beim Laden der Familien:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchFamilies();
      try {
        const token = localStorage.getItem("adminToken");
        const membersResp = await axiosInstance.get("/members/", {
          headers: { Authorization: `Token ${token}` },
        });
        setAllMembers(membersResp.data);
      } catch (error) {
        console.error("Fehler beim Laden der Mitglieder:", error);
      }
    };
    loadData();
  }, []);

  const handleOpenDialog = (family = null) => {
    setEditingFamily(family);
    setFamilyName(family ? family.name : "");
    setIsNameDirty(false);
    setIsVaterDirty(false);
    setIsMutterDirty(false);
    setIsKinderDirty(false);

    if (family) {
      // Find and set vater
      const vater = family.vater
        ? allMembers.find((m) => m.id === family.vater)
        : null;
      setSelectedVater(vater || null);

      // Find and set mutter
      const mutter = family.mutter
        ? allMembers.find((m) => m.id === family.mutter)
        : null;
      setSelectedMutter(mutter || null);

      // Find and set kinder
      const kinder = family.kinder
        ? allMembers.filter((m) => family.kinder.includes(m.id))
        : [];
      setSelectedKinder(kinder);
    } else {
      setSelectedVater(null);
      setSelectedMutter(null);
      setSelectedKinder([]);
    }

    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingFamily(null);
    setFamilyName("");
    setSelectedVater(null);
    setSelectedMutter(null);
    setSelectedKinder([]);
    setIsNameDirty(false);
    setIsVaterDirty(false);
    setIsMutterDirty(false);
    setIsKinderDirty(false);
  };

  const handleSave = async () => {
    if (!familyName.trim()) {
      alert("Bitte Familienname eingeben");
      return;
    }

    try {
      const token = localStorage.getItem("adminToken");
      // Baue payload nur mit geänderten Feldern, um unbeabsichtigtes Löschen zu vermeiden
      const payload = {};
      if (!editingFamily || isNameDirty) payload.name = familyName.trim();
      if (!editingFamily || isVaterDirty)
        payload.vater_id = selectedVater?.id ?? null;
      if (!editingFamily || isMutterDirty)
        payload.mutter_id = selectedMutter?.id ?? null;
      if (!editingFamily || isKinderDirty)
        payload.kinder_ids = selectedKinder.map((k) => k.id);

      if (editingFamily) {
        // Partielles Update vermeidet Überschreiben nicht-geänderter Felder
        await axiosInstance.patch(`/families/${editingFamily.id}/`, payload, {
          headers: { Authorization: `Token ${token}` },
        });
      } else {
        // Create
        await axiosInstance.post("/families/", payload, {
          headers: { Authorization: `Token ${token}` },
        });
      }
      handleCloseDialog();
      fetchFamilies();
    } catch (error) {
      console.error("Fehler beim Speichern:", error);
      alert("Fehler beim Speichern der Familie");
    }
  };

  const handleDelete = async (familyId) => {
    if (!window.confirm("Diese Familie wirklich löschen?")) {
      return;
    }

    try {
      const token = localStorage.getItem("adminToken");
      await axiosInstance.delete(`/families/${familyId}/`, {
        headers: { Authorization: `Token ${token}` },
      });
      fetchFamilies();
    } catch (error) {
      console.error("Fehler beim Löschen:", error);
      alert("Fehler beim Löschen der Familie");
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, textAlign: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  // Filter families based on search query
  const filteredFamilies = families.filter((family) => {
    const query = searchQuery.toLowerCase();

    // Suche im Familiennamen
    if (family.name.toLowerCase().includes(query)) return true;

    // Suche im Vater-Namen
    if (family.vater_name && family.vater_name.toLowerCase().includes(query))
      return true;

    // Suche im Mutter-Namen
    if (family.mutter_name && family.mutter_name.toLowerCase().includes(query))
      return true;

    // Suche in Kinder-Namen
    if (family.kinder_names && family.kinder_names.length > 0) {
      const kinderMatch = family.kinder_names.some((name) =>
        name.toLowerCase().includes(query)
      );
      if (kinderMatch) return true;
    }

    return false;
  });

  // Get family members for a family
  const getFamilyMembers = (family) => {
    const members = [];
    if (family.vater) {
      const vater = allMembers.find((m) => m.id === family.vater);
      if (vater) members.push({ ...vater, role: "Vater" });
    }
    if (family.mutter) {
      const mutter = allMembers.find((m) => m.id === family.mutter);
      if (mutter) members.push({ ...mutter, role: "Mutter" });
    }
    if (family.kinder && family.kinder.length > 0) {
      family.kinder.forEach((kindId) => {
        const kind = allMembers.find((m) => m.id === kindId);
        if (kind) members.push({ ...kind, role: "Kind" });
      });
    }
    return members;
  };

  const handleEditMember = (member) => {
    handleMenuClose();
    // Navigate to the protected MemberEdit route used elsewhere
    navigate(`/admin-dashboard/member/${member.id}`);
  };

  const handleViewMemberDetails = (member) => {
    handleMenuClose();
    // Navigate to member details
    navigate(`/admin-dashboard/member/${member.id}`);
  };

  return (
    <Container
      maxWidth="xl"
      sx={{ mt: { xs: 2, sm: 4 }, mb: { xs: 2, sm: 4 }, px: { xs: 1, sm: 3 } }}
    >
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 } }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            mb: 3,
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          <IconButton
            onClick={() => navigate("/admin-dashboard")}
            sx={{ mr: { xs: 0, sm: 2 }, p: { xs: 1.5, sm: 1 } }}
          >
            <ArrowBackIcon />
          </IconButton>
          <FamilyRestroomIcon
            sx={{ mr: 1, fontSize: { xs: 28, sm: 32 }, color: "#1976d2" }}
          />
          <Typography
            variant="h4"
            component="h1"
            sx={{ flexGrow: 1, fontSize: { xs: "1.5rem", sm: "2.125rem" } }}
          >
            Familien verwalten
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => navigate("/new-member")}
            sx={{
              minHeight: 44,
              mt: { xs: 1, sm: 0 },
              mr: 1,
              width: { xs: "100%", sm: "auto" },
            }}
          >
            Neues Mitglied
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{
              minHeight: 44,
              mt: { xs: 1, sm: 0 },
              width: { xs: "100%", sm: "auto" },
            }}
          >
            Neue Familie
          </Button>
        </Box>

        {/* Suchfeld */}
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Familie oder Mitglied suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            variant="outlined"
            size="small"
          />
        </Box>

        <TableContainer>
          <Table>
            <TableHead
              sx={{ background: "linear-gradient(90deg, #f5f7fa, #c3cfe2)" }}
            >
              <TableRow>
                <TableCell>Familienname</TableCell>
                <TableCell>Vater</TableCell>
                <TableCell>Mutter</TableCell>
                <TableCell>Kinder</TableCell>
                <TableCell align="right">Aktionen</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredFamilies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body2" color="text.secondary">
                      {searchQuery
                        ? "Keine Familien gefunden"
                        : "Noch keine Familien angelegt"}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredFamilies.map((family) => (
                  <React.Fragment key={family.id}>
                    <TableRow
                      hover
                      onClick={() =>
                        setExpandedFamilyId(
                          expandedFamilyId === family.id ? null : family.id
                        )
                      }
                      sx={{
                        "&:hover": { background: "#f8f9fa", cursor: "pointer" },
                      }}
                    >
                      <TableCell>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedFamilyId(
                                expandedFamilyId === family.id
                                  ? null
                                  : family.id
                              );
                            }}
                          >
                            {expandedFamilyId === family.id ? (
                              <ExpandLessIcon />
                            ) : (
                              <ExpandMoreIcon />
                            )}
                          </IconButton>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {family.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {family.vater_name ? (
                          <Chip
                            label={family.vater_name}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            –
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {family.mutter_name ? (
                          <Chip
                            label={family.mutter_name}
                            size="small"
                            color="secondary"
                            variant="outlined"
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            –
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {family.kinder_names &&
                        family.kinder_names.length > 0 ? (
                          <Box
                            sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}
                          >
                            {family.kinder_names.map((name, idx) => (
                              <Chip
                                key={idx}
                                label={name}
                                size="small"
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
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDialog(family);
                          }}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(family.id);
                          }}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>

                    {/* Expandable Mitglieder-Zeile */}
                    <TableRow>
                      <TableCell colSpan={6} sx={{ py: 0, px: 0 }}>
                        <Collapse
                          in={expandedFamilyId === family.id}
                          timeout="auto"
                          unmountOnExit
                        >
                          <Box sx={{ p: 2, bgcolor: "#f5f5f5" }}>
                            <Typography
                              variant="h6"
                              sx={{ mb: 2, fontWeight: 600 }}
                            >
                              Familienmitglieder (
                              {getFamilyMembers(family).length})
                            </Typography>
                            <List sx={{ width: "100%" }}>
                              {getFamilyMembers(family).map((member) => (
                                <ListItem
                                  key={member.id}
                                  sx={{
                                    bgcolor: "white",
                                    mb: 1,
                                    borderRadius: 1,
                                    border: "1px solid #e0e0e0",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    "&:hover": {
                                      bgcolor: "#f5f5f5",
                                      cursor: "pointer",
                                    },
                                  }}
                                  onClick={() => handleEditMember(member)}
                                >
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 2,
                                    }}
                                  >
                                    <PersonIcon color="action" />
                                    <ListItemText
                                      primary={
                                        <Typography
                                          variant="body1"
                                          fontWeight={600}
                                        >
                                          {`${member.first_name} ${member.last_name}`}
                                        </Typography>
                                      }
                                      secondary={
                                        <Box
                                          sx={{
                                            display: "flex",
                                            gap: 1,
                                            mt: 0.5,
                                          }}
                                        >
                                          <Chip
                                            label={member.role}
                                            size="small"
                                            color="primary"
                                            variant="outlined"
                                          />
                                          <Chip
                                            label={member.status || "Aktiv"}
                                            size="small"
                                            variant="outlined"
                                          />
                                        </Box>
                                      }
                                    />
                                  </Box>
                                  <Box sx={{ display: "flex", gap: 1 }}>
                                    <Tooltip title="Bearbeiten">
                                      <IconButton
                                        size="small"
                                        color="primary"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleEditMember(member);
                                        }}
                                      >
                                        <EditIcon />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Mehr Aktionen">
                                      <IconButton
                                        size="small"
                                        onClick={(e) =>
                                          handleMenuOpen(e, member)
                                        }
                                      >
                                        <MoreVertIcon />
                                      </IconButton>
                                    </Tooltip>
                                  </Box>
                                </ListItem>
                              ))}
                              {getFamilyMembers(family).length === 0 && (
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  Keine Mitglieder in dieser Familie
                                </Typography>
                              )}
                            </List>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Member Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() => handleViewMemberDetails(selectedMemberForMenu)}
        >
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Mitglied bearbeiten
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleMenuClose();
            navigate(`/admin-dashboard/member/${selectedMemberForMenu?.id}`);
          }}
        >
          <PersonIcon fontSize="small" sx={{ mr: 1 }} />
          Details anzeigen
        </MenuItem>
      </Menu>

      {/* Create/Edit Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingFamily ? "Familie bearbeiten" : "Neue Familie anlegen"}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                autoFocus
                fullWidth
                label="Familienname"
                value={familyName}
                onChange={(e) => {
                  setFamilyName(e.target.value);
                  setIsNameDirty(true);
                }}
                placeholder="z.B. Familie Müller"
              />
            </Grid>

            <Grid item xs={12}>
              <Autocomplete
                options={allMembers}
                value={selectedVater}
                onChange={(_, newValue) => {
                  setSelectedVater(newValue);
                  setIsVaterDirty(true);
                }}
                getOptionLabel={(option) =>
                  `${option.first_name} ${option.last_name}`
                }
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Vater"
                    placeholder="Vater auswählen..."
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Autocomplete
                options={allMembers}
                value={selectedMutter}
                onChange={(_, newValue) => {
                  setSelectedMutter(newValue);
                  setIsMutterDirty(true);
                }}
                getOptionLabel={(option) =>
                  `${option.first_name} ${option.last_name}`
                }
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Mutter"
                    placeholder="Mutter auswählen..."
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={allMembers}
                value={selectedKinder}
                onChange={(_, newValue) => {
                  setSelectedKinder(newValue);
                  setIsKinderDirty(true);
                }}
                getOptionLabel={(option) =>
                  `${option.first_name} ${option.last_name}`
                }
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Kinder"
                    placeholder="Kinder auswählen..."
                  />
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions
          sx={{ p: 3, gap: 1, flexDirection: { xs: "column", sm: "row" } }}
        >
          <Button
            onClick={handleCloseDialog}
            fullWidth
            sx={{ order: { xs: 2, sm: 1 } }}
          >
            Abbrechen
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            fullWidth
            sx={{ order: { xs: 1, sm: 2 }, minHeight: 44 }}
          >
            Speichern
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default FamiliesPage;
