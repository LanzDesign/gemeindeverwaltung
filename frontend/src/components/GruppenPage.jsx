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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  TableSortLabel,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Tooltip,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import GroupsIcon from "@mui/icons-material/Groups";
import PersonIcon from "@mui/icons-material/Person";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import ChildCareIcon from "@mui/icons-material/ChildCare";
import VolunteerActivismIcon from "@mui/icons-material/VolunteerActivism";

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
      {/* WhatsApp */}
      <Box
        title={
          member.privacy_whatsapp
            ? "WhatsApp Gruppe: Zugestimmt"
            : "WhatsApp Gruppe: Nicht zugestimmt"
        }
        sx={{ display: "flex", alignItems: "center" }}
      >
        <WhatsAppIcon
          sx={{
            fontSize: 24,
            color: member.privacy_whatsapp ? "#4caf50" : "#f44336",
          }}
        />
      </Box>

      {/* Mitgliedschaft */}
      <Box
        title={
          member.privacy_membership
            ? "Mitgliedschaft: Zugestimmt"
            : "Mitgliedschaft: Nicht zugestimmt"
        }
        sx={{ display: "flex", alignItems: "center" }}
      >
        <PersonIcon
          sx={{
            fontSize: 24,
            color: member.privacy_membership ? "#4caf50" : "#f44336",
          }}
        />
      </Box>

      {/* Spenden */}
      <Box
        title={
          member.privacy_donation
            ? "Spendenquittung: Zugestimmt"
            : "Spendenquittung: Nicht zugestimmt"
        }
        sx={{ display: "flex", alignItems: "center" }}
      >
        <VolunteerActivismIcon
          sx={{
            fontSize: 24,
            color: member.privacy_donation ? "#4caf50" : "#f44336",
          }}
        />
      </Box>

      {/* Kinder */}
      <Box
        title={
          member.privacy_children
            ? "Kinder-Daten: Zugestimmt"
            : "Kinder-Daten: Nicht zugestimmt"
        }
        sx={{ display: "flex", alignItems: "center" }}
      >
        <ChildCareIcon
          sx={{
            fontSize: 24,
            color: member.privacy_children ? "#4caf50" : "#f44336",
          }}
        />
      </Box>
    </Box>
  );
}

function GruppenPage() {
  const navigate = useNavigate();
  const [gruppen, setGruppen] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingGruppe, setEditingGruppe] = useState(null);
  const [gruppeName, setGruppeName] = useState("");
  const [sizeType, setSizeType] = useState("large");
  const [description, setDescription] = useState("");
  const [selectedAnsprechpartner, setSelectedAnsprechpartner] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [selectedGruppeId, setSelectedGruppeId] = useState(null);
  const [selectedParentGruppe, setSelectedParentGruppe] = useState(null);
  const [sortField, setSortField] = useState("last_name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [openQuickAssignDialog, setOpenQuickAssignDialog] = useState(false);
  const [selectedMemberForGroup, setSelectedMemberForGroup] = useState(null);
  const [selectedParentForAssign, setSelectedParentForAssign] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [memberCategoryFilter, setMemberCategoryFilter] = useState(null);

  // Helper function to count members by category
  const getMemberStats = () => {
    const stats = {
      active: 0,
      passive: 0,
      children: 0,
      youth: 0,
      donors: 0,
      new: 0,
      minor: 0,
    };

    allMembers.forEach((member) => {
      if (member.status === "active") stats.active++;
      if (member.status === "passive") stats.passive++;
      if (member.status === "minor") stats.minor++;
      if (member.is_child) stats.children++;
      if (member.is_youth) stats.youth++;
      if (member.is_donor) stats.donors++;
      if (member.status === "guest") stats.new++;
    });

    return stats;
  };

  // Filter members based on category
  const shouldShowMember = (member) => {
    if (!memberCategoryFilter) return true;
    switch (memberCategoryFilter) {
      case "active":
        return member.status === "active";
      case "passive":
        return member.status === "passive";
      case "minor":
        return member.status === "minor";
      case "children":
        return member.is_child;
      case "youth":
        return member.is_youth;
      case "donors":
        return member.is_donor;
      case "new":
        return member.status === "guest";
      default:
        return true;
    }
  };

  // Filter gruppen based on search query and member category
  const getFilteredGruppen = () => {
    // First filter by category if needed
    let filtered = gruppen.map((gruppe) => ({
      ...gruppe,
      members_list: (gruppe.members_list || []).filter(shouldShowMember),
    }));

    // If a member category filter is active, only show groups with members
    if (memberCategoryFilter !== null) {
      filtered = filtered.filter((gruppe) => {
        // Show if this group has members
        if ((gruppe.members_list || []).length > 0) return true;

        // If this is a large group, check if any subgroups have members
        if (gruppe.size_type === "large") {
          const subGroups = filtered.filter(
            (g) => g.parent_gruppe === gruppe.id
          );
          return subGroups.some((sg) => (sg.members_list || []).length > 0);
        }

        return false;
      });
    }

    if (!searchQuery.trim()) return filtered;

    const query = searchQuery.toLowerCase().trim();

    // Helper function to check if a gruppe matches the search
    const matchesSearch = (gruppe) => {
      // Check group name
      if (gruppe.name.toLowerCase().includes(query)) return true;

      // Check filtered members: Name, Vorname
      const members = gruppe.members_list || [];
      for (const member of members) {
        if (member.last_name?.toLowerCase().includes(query)) return true;
        if (member.first_name?.toLowerCase().includes(query)) return true;
      }

      // Check Ansprechpartner (responsible people)
      const ansprechpartner = gruppe.ansprechpartner || [];
      for (const person of ansprechpartner) {
        if (person.last_name?.toLowerCase().includes(query)) return true;
        if (person.first_name?.toLowerCase().includes(query)) return true;
      }

      return false;
    };

    // Filter gruppen - show small groups that match directly, and show parent groups only if they match or have matching subgroups
    return filtered.filter((gruppe) => {
      // Always show small groups (non-parent) if they match
      if (gruppe.size_type === "small" && matchesSearch(gruppe)) {
        return true;
      }

      // Show large groups if:
      // 1. They match directly
      if (gruppe.size_type === "large" && matchesSearch(gruppe)) {
        return true;
      }

      // 2. Or if any of their subgroups match
      if (gruppe.size_type === "large") {
        const subGroups = filtered.filter((g) => g.parent_gruppe === gruppe.id);
        return subGroups.some((subGroup) => matchesSearch(subGroup));
      }

      return false;
    });
  };

  const fetchGruppen = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      const response = await axiosInstance.get("/gruppen/", {
        headers: { Authorization: `Token ${token}` },
      });
      setGruppen(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Fehler beim Laden der Gruppen:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchGruppen();
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

  const handleOpenDialog = (gruppe = null) => {
    setEditingGruppe(gruppe);
    setGruppeName(gruppe ? gruppe.name : "");
    setSizeType(gruppe ? gruppe.size_type : "large");
    setDescription(gruppe ? gruppe.description || "" : "");

    if (gruppe) {
      // Set Ansprechpartner (mehrere)
      const ansprechpartner = gruppe.ansprechpartner_list
        ? allMembers.filter((m) =>
            gruppe.ansprechpartner_list.some((a) => a.id === m.id)
          )
        : [];
      setSelectedAnsprechpartner(ansprechpartner);

      // Set parent gruppe
      const parentGruppe = gruppe.parent_gruppe
        ? gruppen.find((g) => g.id === gruppe.parent_gruppe)
        : null;
      setSelectedParentGruppe(parentGruppe || null);

      // Set members
      const members = gruppe.members_list
        ? allMembers.filter((m) =>
            gruppe.members_list.some((gm) => gm.id === m.id)
          )
        : [];
      setSelectedMembers(members);
    } else {
      setSelectedAnsprechpartner([]);
      setSelectedParentGruppe(null);
      setSelectedMembers([]);
    }

    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingGruppe(null);
    setGruppeName("");
    setSizeType("large");
    setDescription("");
    setSelectedAnsprechpartner([]);
    setSelectedMembers([]);
    setSelectedParentGruppe(null);
  };

  // Filter members based on group type and constraints
  const getAvailableMembers = () => {
    // Base filter: only show members where is_member is true
    const membersList = allMembers.filter((m) => m.is_member === true);

    if (sizeType === "large") {
      // For large groups: show only members not in any large group and not in any small group
      return membersList.filter((member) => {
        if (!member.gruppen) return true;

        // Check if member is in any large group
        const inLargeGroup = member.gruppen.some((g) => {
          const gruppe = gruppen.find((gr) => gr.id === g.id);
          return gruppe && gruppe.size_type === "large";
        });

        // Check if member is in any small group
        const inSmallGroup = member.gruppen.some((g) => {
          const gruppe = gruppen.find((gr) => gr.id === g.id);
          return gruppe && gruppe.size_type === "small";
        });

        // If editing, allow members already in this group
        if (
          editingGruppe &&
          member.gruppen.some((g) => g.id === editingGruppe.id)
        ) {
          return true;
        }

        return !inLargeGroup && !inSmallGroup;
      });
    } else if (sizeType === "small") {
      // For small groups: show only members without ANY group assignment
      // Backend will automatically add them to the parent large group
      return membersList.filter((member) => {
        // When editing: show members already in this group OR members without any group
        if (editingGruppe) {
          // Check if member is in this specific group
          const isInThisGroup =
            member.gruppen &&
            member.gruppen.some((g) => g.id === editingGruppe.id);

          if (isInThisGroup) {
            return true; // Always show members already in this group
          }

          // For members not in this group: only show if they have NO groups at all
          return !member.gruppen || member.gruppen.length === 0;
        }

        // When creating new group: only show members with no groups at all
        return !member.gruppen || member.gruppen.length === 0;
      });
    }

    return allMembers;
  };

  const handleSave = async () => {
    if (!gruppeName.trim()) {
      alert("Bitte Gruppenname eingeben");
      return;
    }

    try {
      const token = localStorage.getItem("adminToken");
      const payload = {
        name: gruppeName.trim(),
        size_type: sizeType,
        description: description.trim(),
        ansprechpartner_ids: selectedAnsprechpartner.map((a) => a.id),
        parent_gruppe: selectedParentGruppe?.id || null,
      };

      let gruppeId;

      if (editingGruppe) {
        // Update
        await axiosInstance.put(`/gruppen/${editingGruppe.id}/`, payload, {
          headers: { Authorization: `Token ${token}` },
        });
        gruppeId = editingGruppe.id;
      } else {
        // Create
        const response = await axiosInstance.post("/gruppen/", payload, {
          headers: { Authorization: `Token ${token}` },
        });
        gruppeId = response.data.id;
      }

      // Update members - NUR für kleine Gruppen
      // Große Gruppen bekommen Mitglieder automatisch durch Kleingruppen-Zuordnung
      if (sizeType === "small") {
        const currentMemberIds = editingGruppe
          ? editingGruppe.members_list.map((m) => m.id)
          : [];
        const newMemberIds = selectedMembers.map((m) => m.id);

        // Members to add
        const toAdd = newMemberIds.filter(
          (id) => !currentMemberIds.includes(id)
        );
        if (toAdd.length > 0) {
          await axiosInstance.post(
            `/gruppen/${gruppeId}/add_members/`,
            { member_ids: toAdd },
            { headers: { Authorization: `Token ${token}` } }
          );
        }

        // Members to remove
        const toRemove = currentMemberIds.filter(
          (id) => !newMemberIds.includes(id)
        );
        if (toRemove.length > 0) {
          await axiosInstance.post(
            `/gruppen/${gruppeId}/remove_members/`,
            { member_ids: toRemove },
            { headers: { Authorization: `Token ${token}` } }
          );
        }
      }

      handleCloseDialog();
      fetchGruppen();
    } catch (error) {
      console.error("Fehler beim Speichern:", error);
      const errorMsg =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        JSON.stringify(error.response?.data) ||
        error.message ||
        "Unbekannter Fehler";
      alert(`Fehler beim Speichern der Gruppe: ${errorMsg}`);
    }
  };

  const handleDelete = async (gruppeId) => {
    if (!window.confirm("Diese Gruppe wirklich löschen?")) {
      return;
    }

    try {
      const token = localStorage.getItem("adminToken");
      await axiosInstance.delete(`/gruppen/${gruppeId}/`, {
        headers: { Authorization: `Token ${token}` },
      });
      fetchGruppen();
    } catch (error) {
      console.error("Fehler beim Löschen:", error);
      alert("Fehler beim Löschen der Gruppe");
    }
  };

  // Quick-Gruppenzuordnung Handler
  const handleOpenQuickAssign = (member) => {
    setSelectedMemberForGroup(member);
    setSelectedParentForAssign(null);
    setOpenQuickAssignDialog(true);
  };

  const handleCloseQuickAssign = () => {
    setOpenQuickAssignDialog(false);
    setSelectedMemberForGroup(null);
    setSelectedParentForAssign(null);
  };

  const handleQuickAssignToGroup = async (gruppeId) => {
    if (!selectedMemberForGroup) return;

    try {
      const gruppe = gruppen.find((g) => g.id === gruppeId);
      if (!gruppe) return;

      const token = localStorage.getItem("adminToken");

      // Use add_members action to trigger automatic parent group assignment
      await axiosInstance.post(
        `/gruppen/${gruppeId}/add_members/`,
        { member_ids: [selectedMemberForGroup.id] },
        { headers: { Authorization: `Token ${token}` } }
      );

      // Reload data
      await fetchGruppen();
      const membersResp = await axiosInstance.get("/members/", {
        headers: { Authorization: `Token ${token}` },
      });
      setAllMembers(membersResp.data);

      handleCloseQuickAssign();
      alert(
        `${selectedMemberForGroup.first_name} ${selectedMemberForGroup.last_name} wurde zu "${gruppe.name}" hinzugefügt!`
      );
    } catch (error) {
      console.error("Fehler beim Zuordnen:", error);
      alert(
        "Fehler beim Zuordnen zur Gruppe: " +
          (error.response?.data?.error || error.message)
      );
    }
  };

  // Helper function to get members without any group
  const getMembersWithoutGroup = () => {
    return allMembers.filter(
      (member) =>
        member.is_member === true &&
        (!member.gruppen || member.gruppen.length === 0)
    );
  };

  // Toggle expanded state for large groups
  const toggleGroupExpansion = (gruppeId) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(gruppeId)) {
        newSet.delete(gruppeId);
      } else {
        newSet.add(gruppeId);
      }
      return newSet;
    });
  };

  // Get sub-groups (small groups) for a large group
  const getSubGroups = (parentGruppeId) => {
    return gruppen
      .filter(
        (g) => g.parent_gruppe === parentGruppeId && g.size_type === "small"
      )
      .sort((a, b) => {
        // Extrahiere Zahlen aus den Gruppennamen für numerische Sortierung
        const getNumber = (name) => {
          const match = name.match(/\d+/);
          return match ? parseInt(match[0]) : 0;
        };
        const numA = getNumber(a.name);
        const numB = getNumber(b.name);

        // Sortiere numerisch, wenn Zahlen gefunden wurden
        if (numA !== numB) {
          return numA - numB;
        }
        // Fallback auf alphabetische Sortierung
        return a.name.localeCompare(b.name);
      });
  };

  // Remove member from group with live update
  const handleRemoveMemberFromGroup = async (memberId, gruppeId) => {
    try {
      const token = localStorage.getItem("adminToken");
      const member = allMembers.find((m) => m.id === memberId);

      if (
        !window.confirm(
          `${member.first_name} ${member.last_name} aus dieser Gruppe entfernen?`
        )
      ) {
        return;
      }

      await axiosInstance.post(
        `/gruppen/${gruppeId}/remove_members/`,
        { member_ids: [memberId] },
        { headers: { Authorization: `Token ${token}` } }
      );

      // Live update: Update gruppen state
      setGruppen((prevGruppen) =>
        prevGruppen.map((g) => {
          if (g.id === gruppeId) {
            return {
              ...g,
              members_list: g.members_list.filter((m) => m.id !== memberId),
            };
          }
          // Also update parent group if this is a small group
          if (g.size_type === "large") {
            const subGroups = getSubGroups(g.id);
            if (subGroups.some((sg) => sg.id === gruppeId)) {
              return {
                ...g,
                members_list: g.members_list.filter((m) => m.id !== memberId),
              };
            }
          }
          return g;
        })
      );

      // Live update: Update allMembers state
      setAllMembers((prevMembers) =>
        prevMembers.map((m) => {
          if (m.id === memberId) {
            return {
              ...m,
              gruppen: m.gruppen.filter((g) => g.id !== gruppeId),
            };
          }
          return m;
        })
      );

      // If viewing this group, update selected gruppe
      if (selectedGruppeId === gruppeId) {
        setGruppen((prevGruppen) => {
          const updated = prevGruppen.find((g) => g.id === gruppeId);
          return prevGruppen;
        });
      }
    } catch (error) {
      console.error("Fehler beim Entfernen:", error);
      alert("Fehler beim Entfernen des Mitglieds aus der Gruppe");
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, textAlign: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container
      maxWidth="lg"
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
          <GroupsIcon
            sx={{ mr: 1, fontSize: { xs: 28, sm: 32 }, color: "#1976d2" }}
          />
          <Typography
            variant="h4"
            component="h1"
            sx={{ flexGrow: 1, fontSize: { xs: "1.5rem", sm: "2.125rem" } }}
          >
            Gruppen verwalten
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
            Neue Gruppe
          </Button>
        </Box>

        {/* Member Category Filter Buttons */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: "bold" }}>
            Nach Mitgliederkategorie filtern:
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Chip
              label={`Alle (${allMembers.length})`}
              onClick={() => setMemberCategoryFilter(null)}
              variant={memberCategoryFilter === null ? "filled" : "outlined"}
              color={memberCategoryFilter === null ? "primary" : "default"}
            />
            <Chip
              label={`Aktive Mitglieder (${getMemberStats().active})`}
              onClick={() => setMemberCategoryFilter("active")}
              variant={
                memberCategoryFilter === "active" ? "filled" : "outlined"
              }
              color={memberCategoryFilter === "active" ? "primary" : "default"}
            />
            <Chip
              label={`Passive Mitglieder (${getMemberStats().passive})`}
              onClick={() => setMemberCategoryFilter("passive")}
              variant={
                memberCategoryFilter === "passive" ? "filled" : "outlined"
              }
              color={memberCategoryFilter === "passive" ? "primary" : "default"}
            />
            <Chip
              label={`Minderjährige (${getMemberStats().minor})`}
              onClick={() => setMemberCategoryFilter("minor")}
              variant={memberCategoryFilter === "minor" ? "filled" : "outlined"}
              color={memberCategoryFilter === "minor" ? "primary" : "default"}
            />
            <Chip
              label={`Kinder (${getMemberStats().children})`}
              onClick={() => setMemberCategoryFilter("children")}
              variant={
                memberCategoryFilter === "children" ? "filled" : "outlined"
              }
              color={
                memberCategoryFilter === "children" ? "primary" : "default"
              }
            />
            <Chip
              label={`Jugend (${getMemberStats().youth})`}
              onClick={() => setMemberCategoryFilter("youth")}
              variant={memberCategoryFilter === "youth" ? "filled" : "outlined"}
              color={memberCategoryFilter === "youth" ? "primary" : "default"}
            />
            <Chip
              label={`Spender (${getMemberStats().donors})`}
              onClick={() => setMemberCategoryFilter("donors")}
              variant={
                memberCategoryFilter === "donors" ? "filled" : "outlined"
              }
              color={memberCategoryFilter === "donors" ? "primary" : "default"}
            />
            <Chip
              label={`Neue Mitglieder (${getMemberStats().new})`}
              onClick={() => setMemberCategoryFilter("new")}
              variant={memberCategoryFilter === "new" ? "filled" : "outlined"}
              color={memberCategoryFilter === "new" ? "primary" : "default"}
            />
          </Box>
        </Box>

        {/* Search Bar */}
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Nach Gruppenname, Mitgliedername oder Verantwortlichem suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            variant="outlined"
            size="small"
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
              },
            }}
          />
        </Box>

        {/* Gruppen-Liste mit hierarchischer Ansicht */}
        <TableContainer>
          <Table>
            <TableHead
              sx={{ background: "linear-gradient(90deg, #f5f7fa, #c3cfe2)" }}
            >
              <TableRow>
                <TableCell>Gruppenname</TableCell>
                <TableCell>Größe</TableCell>
                <TableCell>Anzahl Mitglieder</TableCell>
                <TableCell>Ansprechpartner</TableCell>
                <TableCell align="right">Aktionen</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {gruppen.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography variant="body2" color="text.secondary">
                      Noch keine Gruppen angelegt
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                getFilteredGruppen()
                  .filter((gruppe) => {
                    // Always show large groups
                    if (gruppe.size_type === "large") return true;
                    // Show small groups only if they have no parent (standalone) OR if search is active
                    if (!gruppe.parent_gruppe) return true;
                    if (searchQuery.trim()) return true; // Show all groups during search
                    return false;
                  })
                  .sort((a, b) => {
                    // Extrahiere Zahlen aus den Gruppennamen für numerische Sortierung
                    const getNumber = (name) => {
                      const match = name.match(/\d+/);
                      return match ? parseInt(match[0]) : 0;
                    };
                    const numA = getNumber(a.name);
                    const numB = getNumber(b.name);

                    // Sortiere numerisch, wenn Zahlen gefunden wurden
                    if (numA !== numB) {
                      return numA - numB;
                    }
                    // Fallback auf alphabetische Sortierung
                    return a.name.localeCompare(b.name);
                  })
                  .map((gruppe) => {
                    const subGroups =
                      gruppe.size_type === "large"
                        ? getSubGroups(gruppe.id)
                        : [];

                    // When searching, auto-expand parent groups that have matching subgroups
                    let isExpanded = expandedGroups.has(gruppe.id);
                    if (searchQuery.trim() && gruppe.size_type === "large") {
                      const filteredSubGroups = getFilteredGruppen().filter(
                        (g) => g.parent_gruppe === gruppe.id
                      );
                      if (filteredSubGroups.length > 0) {
                        isExpanded = true;
                      }
                    }

                    return (
                      <React.Fragment key={gruppe.id}>
                        {/* Main Group Row */}
                        <TableRow
                          hover
                          onClick={() => {
                            setSelectedGruppeId(gruppe.id);
                            if (
                              gruppe.size_type === "large" &&
                              subGroups.length > 0
                            ) {
                              toggleGroupExpansion(gruppe.id);
                            }
                          }}
                          sx={{
                            "&:hover": { background: "#f8f9fa" },
                            cursor: "pointer",
                            backgroundColor:
                              selectedGruppeId === gruppe.id
                                ? "#e3f2fd"
                                : "transparent",
                          }}
                        >
                          <TableCell>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              {gruppe.size_type === "large" &&
                                subGroups.length > 0 && (
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleGroupExpansion(gruppe.id);
                                    }}
                                  >
                                    {isExpanded ? "▼" : "▶"}
                                  </IconButton>
                                )}
                              <Box>
                                <Typography
                                  variant="body1"
                                  sx={{ fontWeight: 600 }}
                                >
                                  {gruppe.name}
                                </Typography>
                                {gruppe.description && (
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ display: "block", mt: 0.5 }}
                                  >
                                    {gruppe.description}
                                  </Typography>
                                )}
                                {gruppe.parent_gruppe_name && (
                                  <Chip
                                    label={`↳ ${gruppe.parent_gruppe_name}`}
                                    size="small"
                                    variant="outlined"
                                    sx={{ mt: 0.5, fontSize: "0.7rem" }}
                                  />
                                )}
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={
                                gruppe.size_type === "large"
                                  ? "Groß (~100)"
                                  : "Klein (~30)"
                              }
                              size="small"
                              color={
                                gruppe.size_type === "large"
                                  ? "primary"
                                  : "secondary"
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={`${gruppe.member_count} Mitglieder`}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            {gruppe.ansprechpartner_names ? (
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 0.5,
                                  flexWrap: "wrap",
                                }}
                              >
                                <PersonIcon
                                  sx={{ fontSize: 18, color: "#1976d2" }}
                                />
                                <Typography variant="body2">
                                  {gruppe.ansprechpartner_names}
                                </Typography>
                              </Box>
                            ) : (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Nicht zugeordnet
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDialog(gruppe);
                              }}
                              color="primary"
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(gruppe.id);
                              }}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>

                        {/* Sub-groups (collapsed by default) */}
                        {isExpanded &&
                          subGroups.map((subGruppe) => (
                            <TableRow
                              key={subGruppe.id}
                              hover
                              onClick={() => setSelectedGruppeId(subGruppe.id)}
                              sx={{
                                "&:hover": { background: "#f0f0f0" },
                                cursor: "pointer",
                                backgroundColor:
                                  selectedGruppeId === subGruppe.id
                                    ? "#e3f2fd"
                                    : "#fafafa",
                              }}
                            >
                              <TableCell>
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                    ml: 6,
                                  }}
                                >
                                  <Box>
                                    <Typography
                                      variant="body2"
                                      sx={{ fontWeight: 500 }}
                                    >
                                      ↳ {subGruppe.name}
                                    </Typography>
                                    {subGruppe.description && (
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{ display: "block", mt: 0.5 }}
                                      >
                                        {subGruppe.description}
                                      </Typography>
                                    )}
                                  </Box>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label="Klein (~30)"
                                  size="small"
                                  color="secondary"
                                />
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={`${subGruppe.member_count} Mitglieder`}
                                  size="small"
                                  variant="outlined"
                                />
                              </TableCell>
                              <TableCell>
                                {subGruppe.ansprechpartner_names ? (
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 0.5,
                                      flexWrap: "wrap",
                                    }}
                                  >
                                    <PersonIcon
                                      sx={{ fontSize: 18, color: "#1976d2" }}
                                    />
                                    <Typography variant="body2">
                                      {subGruppe.ansprechpartner_names}
                                    </Typography>
                                  </Box>
                                ) : (
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    Nicht zugeordnet
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell align="right">
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenDialog(subGruppe);
                                  }}
                                  color="primary"
                                >
                                  <EditIcon />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(subGruppe.id);
                                  }}
                                  color="error"
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                      </React.Fragment>
                    );
                  })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Mitgliederliste der ausgewählten Gruppe */}
      {selectedGruppeId &&
        (() => {
          const selectedGruppe = gruppen.find((g) => g.id === selectedGruppeId);
          if (!selectedGruppe) return null;

          // Helper function to check if birthday is within next 5 days
          const getBirthdayInfo = (dateOfBirth) => {
            if (!dateOfBirth) return { isSoon: false, daysUntil: null };

            // Get current date in German timezone
            const today = new Date(
              new Date().toLocaleString("de-DE", { timeZone: "Europe/Berlin" })
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

          // Handler für Sortierung
          const handleSort = (field) => {
            if (sortField === field) {
              setSortDirection(sortDirection === "asc" ? "desc" : "asc");
            } else {
              setSortField(field);
              setSortDirection("asc");
            }
          };

          // Mitglieder sortieren: erst nach bevorstehendem Geburtstag, dann nach gewähltem Feld
          const gruppenMitglieder = (selectedGruppe.members_list || []).sort(
            (a, b) => {
              // Priorisiere Geburtstage
              const aBirthdaySoon = getBirthdayInfo(a.date_of_birth).isSoon;
              const bBirthdaySoon = getBirthdayInfo(b.date_of_birth).isSoon;

              if (aBirthdaySoon && !bBirthdaySoon) return -1;
              if (!aBirthdaySoon && bBirthdaySoon) return 1;

              // Dann nach gewähltem Feld sortieren
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
                  aVal = a.date_of_birth
                    ? new Date(a.date_of_birth).getTime()
                    : 0;
                  bVal = b.date_of_birth
                    ? new Date(b.date_of_birth).getTime()
                    : 0;
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
            }
          );

          const ansprechpartnerIds = selectedGruppe.ansprechpartner_list
            ? selectedGruppe.ansprechpartner_list.map((a) => a.id)
            : [];

          return (
            <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, mt: 3 }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                  Mitglieder von "{selectedGruppe.name}"
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {gruppenMitglieder.length}{" "}
                  {gruppenMitglieder.length === 1 ? "Mitglied" : "Mitglieder"}
                </Typography>
              </Box>

              {gruppenMitglieder.length === 0 ? (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ textAlign: "center", py: 3 }}
                >
                  Keine Mitglieder in dieser Gruppe
                </Typography>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead
                      sx={{
                        background: "linear-gradient(90deg, #f5f7fa, #c3cfe2)",
                      }}
                    >
                      <TableRow>
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
                        <TableCell>
                          <TableSortLabel
                            active={sortField === "date_of_birth"}
                            direction={sortDirection}
                            onClick={() => handleSort("date_of_birth")}
                          >
                            Geburtstag
                          </TableSortLabel>
                        </TableCell>
                        <TableCell>
                          <TableSortLabel
                            active={sortField === "email"}
                            direction={sortDirection}
                            onClick={() => handleSort("email")}
                          >
                            E-Mail
                          </TableSortLabel>
                        </TableCell>
                        <TableCell>Telefon</TableCell>
                        <TableCell>
                          <TableSortLabel
                            active={sortField === "city"}
                            direction={sortDirection}
                            onClick={() => handleSort("city")}
                          >
                            Ort
                          </TableSortLabel>
                        </TableCell>
                        <TableCell>
                          <TableSortLabel
                            active={sortField === "status"}
                            direction={sortDirection}
                            onClick={() => handleSort("status")}
                          >
                            Status
                          </TableSortLabel>
                        </TableCell>
                        <TableCell>Spender</TableCell>
                        <TableCell>Dienste</TableCell>
                        <TableCell>Wunschdienste</TableCell>
                        <TableCell>Datenschutz</TableCell>
                        <TableCell>Rolle</TableCell>
                        <TableCell align="right">Aktionen</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {gruppenMitglieder.map((member) => {
                        const isAnsprechpartner = ansprechpartnerIds.includes(
                          member.id
                        );
                        const birthdayInfo = getBirthdayInfo(
                          member.date_of_birth
                        );

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
                                : isAnsprechpartner
                                ? "#e3f2fd"
                                : "inherit",
                            }}
                            onClick={() =>
                              navigate(`/admin-dashboard/member/${member.id}`)
                            }
                          >
                            <TableCell>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1.5,
                                }}
                              >
                                <Avatar
                                  sx={{
                                    width: 40,
                                    height: 40,
                                    bgcolor: isAnsprechpartner
                                      ? "#1976d2"
                                      : "#757575",
                                  }}
                                >
                                  {(member.first_name?.[0] || "") +
                                    (member.last_name?.[0] || "")}
                                </Avatar>
                                <Box>
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      fontWeight:
                                        birthdayInfo.isSoon || isAnsprechpartner
                                          ? 700
                                          : 400,
                                    }}
                                  >
                                    {member.first_name || "N/A"}
                                  </Typography>
                                  {birthdayInfo.isSoon && (
                                    <Chip
                                      label={
                                        birthdayInfo.daysUntil === 0
                                          ? "🎉 Heute Geburtstag!"
                                          : `🎂 in ${
                                              birthdayInfo.daysUntil
                                            } Tag${
                                              birthdayInfo.daysUntil === 1
                                                ? ""
                                                : "en"
                                            }`
                                      }
                                      size="small"
                                      color="warning"
                                      sx={{ mt: 0.5, fontWeight: 600 }}
                                    />
                                  )}
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight:
                                      birthdayInfo.isSoon || isAnsprechpartner
                                        ? 700
                                        : 400,
                                  }}
                                >
                                  {member.last_name || "N/A"}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              {member.date_of_birth
                                ? new Date(
                                    member.date_of_birth
                                  ).toLocaleDateString("de-DE", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                  })
                                : "–"}
                            </TableCell>
                            <TableCell>{member.email || "–"}</TableCell>
                            <TableCell>{member.phone || "–"}</TableCell>
                            <TableCell>{member.city || "–"}</TableCell>
                            <TableCell>
                              <Chip
                                label={member.status}
                                color={
                                  member.status === "active"
                                    ? "success"
                                    : "default"
                                }
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              {member.is_donor ? (
                                <Chip label="Ja" size="small" color="success" />
                              ) : (
                                "–"
                              )}
                            </TableCell>
                            <TableCell>
                              {member.services && member.services.length > 0 ? (
                                <Box
                                  sx={{
                                    display: "flex",
                                    gap: 0.5,
                                    flexWrap: "wrap",
                                  }}
                                >
                                  {member.services.map((s, idx) => (
                                    <Chip
                                      key={idx}
                                      label={s}
                                      size="small"
                                      variant="outlined"
                                    />
                                  ))}
                                </Box>
                              ) : (
                                "–"
                              )}
                            </TableCell>
                            <TableCell>
                              {member.desired_services &&
                              member.desired_services.length > 0 ? (
                                <Box
                                  sx={{
                                    display: "flex",
                                    gap: 0.5,
                                    flexWrap: "wrap",
                                  }}
                                >
                                  {member.desired_services.map((s, idx) => (
                                    <Chip
                                      key={idx}
                                      label={s}
                                      size="small"
                                      variant="outlined"
                                      color="info"
                                    />
                                  ))}
                                </Box>
                              ) : (
                                "–"
                              )}
                            </TableCell>
                            <TableCell>
                              <PrivacyIcons member={member} />
                            </TableCell>
                            <TableCell>
                              {isAnsprechpartner && (
                                <Chip
                                  label="Ansprechpartner"
                                  size="small"
                                  color="primary"
                                  sx={{ fontWeight: 600 }}
                                />
                              )}
                            </TableCell>
                            <TableCell align="right">
                              <Tooltip title="Aus Gruppe entfernen">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveMemberFromGroup(
                                      member.id,
                                      selectedGruppe.id
                                    );
                                  }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          );
        })()}

      {/* Dialog für Erstellen/Bearbeiten */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingGruppe ? "Gruppe bearbeiten" : "Neue Gruppe erstellen"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={8}>
                <TextField
                  fullWidth
                  label="Gruppenname"
                  value={gruppeName}
                  onChange={(e) => setGruppeName(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Größe</InputLabel>
                  <Select
                    value={sizeType}
                    label="Größe"
                    onChange={(e) => setSizeType(e.target.value)}
                  >
                    <MenuItem value="large">Groß (~100)</MenuItem>
                    <MenuItem value="small">Klein (~30)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Beschreibung"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  multiline
                  rows={2}
                />
              </Grid>
              {sizeType === "small" && (
                <Grid item xs={12}>
                  <Autocomplete
                    value={selectedParentGruppe}
                    onChange={(event, newValue) =>
                      setSelectedParentGruppe(newValue)
                    }
                    options={gruppen.filter((g) => g.size_type === "large")}
                    getOptionLabel={(option) => option.name}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Übergeordnete Gruppe"
                        placeholder="Große Gruppe auswählen (optional)"
                        helperText="Kleine Gruppen können einer großen Gruppe zugeordnet werden (z.B. Gruppe 1-1 gehört zu Gruppe 1)"
                      />
                    )}
                  />
                </Grid>
              )}
              <Grid item xs={12}>
                <Autocomplete
                  multiple
                  value={selectedAnsprechpartner}
                  onChange={(event, newValue) =>
                    setSelectedAnsprechpartner(newValue)
                  }
                  options={allMembers}
                  getOptionLabel={(option) =>
                    `${option.first_name} ${option.last_name}${
                      option.email ? ` (${option.email})` : ""
                    }`
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Ansprechpartner"
                      placeholder="Ansprechpartner auswählen (mehrere möglich)"
                      helperText="Sie können mehrere Ansprechpartner für eine Gruppe festlegen"
                    />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        label={`${option.first_name} ${option.last_name}`}
                        {...getTagProps({ index })}
                        size="small"
                        color="primary"
                      />
                    ))
                  }
                />
              </Grid>
              {/* Mitglieder-Auswahl nur für kleine Gruppen */}
              {sizeType === "small" && (
                <Grid item xs={12}>
                  <Autocomplete
                    multiple
                    value={selectedMembers}
                    onChange={(event, newValue) => setSelectedMembers(newValue)}
                    options={getAvailableMembers()}
                    getOptionLabel={(option) =>
                      `${option.first_name} ${option.last_name}${
                        option.email ? ` (${option.email})` : ""
                      }`
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Mitglieder"
                        placeholder="Mitglieder hinzufügen"
                        helperText="Nur Mitglieder ohne jegliche Gruppenzugehörigkeit (werden automatisch zur übergeordneten Gruppe hinzugefügt)"
                      />
                    )}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          label={`${option.first_name} ${option.last_name}`}
                          {...getTagProps({ index })}
                          size="small"
                        />
                      ))
                    }
                  />
                </Grid>
              )}
              {/* Hinweis für große Gruppen */}
              {sizeType === "large" && (
                <Grid item xs={12}>
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: "info.light",
                      borderRadius: 1,
                      color: "info.contrastText",
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      ℹ️ Mitgliederverwaltung für große Gruppen
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      Große Gruppen erhalten ihre Mitglieder automatisch durch
                      die Zuordnung zu kleinen Gruppen. Bitte fügen Sie
                      Mitglieder über die entsprechenden kleinen Gruppen hinzu.
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions
          sx={{
            p: { xs: 2, sm: 3 },
            flexDirection: { xs: "column", sm: "row" },
            gap: { xs: 1, sm: 0 },
          }}
        >
          <Button
            onClick={handleCloseDialog}
            fullWidth
            sx={{ minHeight: 44, order: { xs: 2, sm: 1 } }}
          >
            Abbrechen
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            fullWidth
            sx={{ minHeight: 44, order: { xs: 1, sm: 2 } }}
          >
            {editingGruppe ? "Speichern" : "Erstellen"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Mitglieder ohne Gruppe */}
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, mt: 3 }}>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: "bold" }}>
          👥 Mitglieder ohne Gruppe
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead
              sx={{ background: "linear-gradient(90deg, #fff3e0, #ffe0b2)" }}
            >
              <TableRow>
                <TableCell>Hinzufügen</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>E-Mail</TableCell>
                <TableCell>Telefon</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {allMembers
                .filter(
                  (member) =>
                    member.is_member &&
                    (!member.gruppen || member.gruppen.length === 0)
                )
                .sort((a, b) => a.last_name.localeCompare(b.last_name))
                .map((member) => (
                  <TableRow key={member.id} hover>
                    <TableCell>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleOpenQuickAssign(member)}
                        title="Zu Gruppe hinzufügen"
                      >
                        <GroupAddIcon />
                      </IconButton>
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Avatar sx={{ width: 32, height: 32 }}>
                          {member.first_name[0]}
                        </Avatar>
                        <Typography variant="body2">
                          {member.first_name} {member.last_name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{member.email || "–"}</TableCell>
                    <TableCell>{member.phone || "–"}</TableCell>
                    <TableCell>
                      <Chip
                        label={member.status}
                        size="small"
                        color={
                          member.status === "active" ? "success" : "default"
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              {allMembers.filter(
                (m) => m.is_member && (!m.gruppen || m.gruppen.length === 0)
              ).length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ py: 2 }}
                    >
                      Alle Mitglieder sind einer Gruppe zugeordnet
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Quick-Gruppenzuordnung Dialog */}
      <Dialog
        open={openQuickAssignDialog}
        onClose={handleCloseQuickAssign}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            background: "linear-gradient(90deg, #667eea, #764ba2)",
            color: "white",
          }}
        >
          Gruppe zuordnen
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Wähle eine kleine Gruppe für{" "}
            <strong>
              {selectedMemberForGroup?.first_name}{" "}
              {selectedMemberForGroup?.last_name}
            </strong>
            :
          </Typography>

          {gruppen.filter((g) => g.size_type === "small").length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Keine kleinen Gruppen verfügbar. Bitte erstelle zuerst eine
              Gruppe.
            </Typography>
          ) : (
            <Box>
              {/* Schritt 1: Große Gruppe auswählen */}
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>1. Große Gruppe auswählen</InputLabel>
                <Select
                  value={selectedParentForAssign || ""}
                  onChange={(e) => setSelectedParentForAssign(e.target.value)}
                  label="1. Große Gruppe auswählen"
                >
                  {gruppen
                    .filter((g) => g.size_type === "large")
                    .sort((a, b) => {
                      const getNumber = (name) => {
                        const match = name.match(/\d+/);
                        return match ? parseInt(match[0]) : 0;
                      };
                      const numA = getNumber(a.name);
                      const numB = getNumber(b.name);
                      if (numA !== numB) return numA - numB;
                      return a.name.localeCompare(b.name);
                    })
                    .map((gruppe) => (
                      <MenuItem key={gruppe.id} value={gruppe.id}>
                        {gruppe.name}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>

              {/* Schritt 2: Kleine Gruppe auswählen (nur wenn Parent ausgewählt) */}
              {selectedParentForAssign && (
                <FormControl fullWidth>
                  <InputLabel>2. Kleine Gruppe auswählen</InputLabel>
                  <Select
                    label="2. Kleine Gruppe auswählen"
                    onChange={(e) => handleQuickAssignToGroup(e.target.value)}
                    defaultValue=""
                  >
                    {gruppen
                      .filter(
                        (g) =>
                          g.size_type === "small" &&
                          g.parent_gruppe === selectedParentForAssign
                      )
                      .sort((a, b) => {
                        const getNumber = (name) => {
                          const match = name.match(/\d+/);
                          return match ? parseInt(match[0]) : 0;
                        };
                        const numA = getNumber(a.name);
                        const numB = getNumber(b.name);
                        if (numA !== numB) return numA - numB;
                        return a.name.localeCompare(b.name);
                      })
                      .map((gruppe) => (
                        <MenuItem key={gruppe.id} value={gruppe.id}>
                          {gruppe.name} ({gruppe.members?.length || 0}{" "}
                          Mitglieder)
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseQuickAssign}>Abbrechen</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default GruppenPage;
