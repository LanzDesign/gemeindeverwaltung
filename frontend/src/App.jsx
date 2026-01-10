import React, { useEffect, useState, useCallback } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useNavigate,
} from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  useMediaQuery,
  useTheme,
  Menu,
  MenuItem,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import NewMember from "./NewMember/NewMember";
import AdminDashboard from "./components/AdminDashboard";
import AdminLogin from "./components/AdminLogin";
import PrivacyPolicy from "./components/PrivacyPolicy";
import ProtectedRoute from "./components/ProtectedRoute";
import MemberEdit from "./components/MemberEdit";
import FamiliesPage from "./components/FamiliesPage";
import GruppenPage from "./components/GruppenPage";
import TrashPage from "./components/TrashPage";
import ProfilePage from "./components/ProfilePage";
import PrivacyInfoPage from "./components/PrivacyInfoPage";
import Jugendverwaltung from "./components/Jugendverwaltung";
import GemeindeteminePage from "./components/GemeindeteminePage";
import RaumbelegungsplanPage from "./components/RaumbelegungsplanPage";
import MitarbeiterKalenderPage from "./components/MitarbeiterKalenderPage";
import PublicRegistration from "./components/PublicRegistration_SingleParent";
import { canAccessJugendverwaltung } from "./utils/auth";
import "./styles.css";

function NavBar() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [currentUser, setCurrentUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const isLoggedIn = !!localStorage.getItem("adminToken");
  const openUserMenu = Boolean(anchorEl);

  const handleUserMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = useCallback(() => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUsername");
    localStorage.removeItem("loginTime");
    localStorage.removeItem("userGroups");
    localStorage.removeItem("isJugendleiter");
    localStorage.removeItem("isGemeindeallteste");
    setMobileMenuOpen(false);
    setAnchorEl(null);
    navigate("/admin-login");
  }, [navigate]);

  const handleMenuClose = () => {
    setMobileMenuOpen(false);
  };

  const handleProfileClick = () => {
    setAnchorEl(null);
    navigate("/profile");
  };

  const menuItems = [
    { text: "Alle Mitglieder", path: "/" },
    { text: "🗑️ Papierkorb", path: "/trash" },
    { text: "🔒 Datenschutz-Info", path: "/privacy-info" },
    { text: "🏛️ Gemeindetermine", path: "/gemeindetermine" },
    { text: "🏢 Raumbelegungsplan", path: "/raumbelegungsplan" },
    { text: "Gruppen verwalten", path: "/admin-dashboard/gruppen" },
    { text: "Familien verwalten", path: "/admin-dashboard/families" },
  ];

  // Füge Mitarbeiterkalender hinzu, wenn Admin eingeloggt ist
  if (isLoggedIn) {
    menuItems.push({ text: "👨‍💼 Mitarbeiterkalender", path: "/mitarbeiterkalender" });
  }

  // Füge Jugendverwaltung hinzu, wenn Berechtigung vorhanden
  if (canAccessJugendverwaltung()) {
    menuItems.push({ text: "👥 Jugendverwaltung", path: "/jugendverwaltung" });
  }

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("adminToken");
      if (token) {
        try {
          const username = localStorage.getItem("adminUsername") || "Admin";
          setCurrentUser(username);

          // Token-Ablauf prüfen (nach 24h automatisch ausloggen)
          const loginTime = localStorage.getItem("loginTime");
          if (loginTime) {
            const elapsed = Date.now() - parseInt(loginTime);
            if (elapsed > 24 * 60 * 60 * 1000) {
              handleLogout();
            }
          }
        } catch (error) {
          console.error("Fehler beim Laden des Users:", error);
        }
      }
    };
    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <AppBar
        position="static"
        sx={{ background: "linear-gradient(90deg, #667eea, #764ba2)" }}
      >
        <Toolbar>
          <Typography
            variant="h6"
            sx={{
              flexGrow: 1,
              fontWeight: 700,
              fontSize: { xs: "1rem", sm: "1.25rem" },
            }}
          >
            ⛪ FECG Lahr Mitgliederverwaltung
          </Typography>
          {isLoggedIn && (
            <>
              {isMobile ? (
                <IconButton
                  color="inherit"
                  edge="end"
                  onClick={() => setMobileMenuOpen(true)}
                  sx={{ ml: 1 }}
                >
                  <MenuIcon />
                </IconButton>
              ) : (
                <>
                  <Button color="inherit" component={Link} to="/">
                    Alle Mitglieder
                  </Button>
                  <Button color="inherit" component={Link} to="/trash">
                    🗑️ Papierkorb
                  </Button>
                  <Button color="inherit" component={Link} to="/privacy-info">
                    🔒 Datenschutz
                  </Button>
                  <Button color="inherit" component={Link} to="/gemeindetermine">
                    🏛️ Gemeindetermine
                  </Button>
                  <Button color="inherit" component={Link} to="/raumbelegungsplan">
                    🏢 Raumbelegungsplan
                  </Button>
                  <Button
                    color="inherit"
                    component={Link}
                    to="/admin-dashboard/gruppen"
                  >
                    Gruppen verwalten
                  </Button>
                  <Button
                    color="inherit"
                    component={Link}
                    to="/admin-dashboard/families"
                  >
                    Familien verwalten
                  </Button>
                  {canAccessJugendverwaltung() && (
                    <Button
                      color="inherit"
                      component={Link}
                      to="/jugendverwaltung"
                    >
                      Jugendverwaltung
                    </Button>
                  )}
                  <Button
                    color="inherit"
                    onClick={handleUserMenuClick}
                    endIcon={<ArrowDropDownIcon />}
                    startIcon={<AccountCircleIcon />}
                    sx={{ ml: 2 }}
                  >
                    {currentUser || "Admin"}
                  </Button>
                  <Menu
                    anchorEl={anchorEl}
                    open={openUserMenu}
                    onClose={handleUserMenuClose}
                    anchorOrigin={{
                      vertical: "bottom",
                      horizontal: "right",
                    }}
                    transformOrigin={{
                      vertical: "top",
                      horizontal: "right",
                    }}
                  >
                    <MenuItem onClick={handleProfileClick}>👤 Profil</MenuItem>
                    <Divider />
                    <MenuItem
                      onClick={handleLogout}
                      sx={{ color: "error.main" }}
                    >
                      Abmelden
                    </MenuItem>
                  </Menu>
                </>
              )}
            </>
          )}
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer Menu */}
      <Drawer
        anchor="right"
        open={mobileMenuOpen}
        onClose={handleMenuClose}
        PaperProps={{
          sx: { width: { xs: "75%", sm: 300 } },
        }}
      >
        <Box
          sx={{
            p: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Menü
          </Typography>
          <IconButton onClick={handleMenuClose}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider />

        {currentUser && (
          <>
            <Box
              sx={{
                p: 2,
                bgcolor: "primary.light",
                color: "primary.contrastText",
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                👤 {currentUser}
              </Typography>
            </Box>
            <Divider />
          </>
        )}

        <List>
          {menuItems.map((item) => (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
                component={Link}
                to={item.path}
                onClick={handleMenuClose}
                sx={{ py: 1.5 }}
              >
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}

          <Divider sx={{ my: 1 }} />

          <ListItem disablePadding>
            <ListItemButton
              onClick={handleLogout}
              sx={{ py: 1.5, color: "error.main" }}
            >
              <ListItemText primary="Abmelden" />
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>
    </>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes without NavBar */}
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/datenschutz" element={<PrivacyPolicy />} />
        <Route path="/registrieren" element={<PublicRegistration />} />

        {/* Protected routes with NavBar */}
        <Route
          path="/*"
          element={
            <>
              <NavBar />
              <Container
                maxWidth={false}
                sx={{ px: { xs: 0, sm: 2, md: 3 }, py: { xs: 0, sm: 2 } }}
              >
                <Routes>
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <AdminDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/trash"
                    element={
                      <ProtectedRoute>
                        <TrashPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/privacy-info"
                    element={
                      <ProtectedRoute>
                        <PrivacyInfoPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/gemeindetermine"
                    element={
                      <ProtectedRoute>
                        <GemeindeteminePage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/raumbelegungsplan"
                    element={
                      <ProtectedRoute>
                        <RaumbelegungsplanPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/mitarbeiterkalender"
                    element={
                      <ProtectedRoute>
                        <MitarbeiterKalenderPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <ProfilePage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/new-member"
                    element={
                      <ProtectedRoute>
                        <NewMember />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin-dashboard"
                    element={
                      <ProtectedRoute>
                        <AdminDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin-dashboard/gruppen"
                    element={
                      <ProtectedRoute>
                        <GruppenPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin-dashboard/families"
                    element={
                      <ProtectedRoute>
                        <FamiliesPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin-dashboard/member/:id"
                    element={
                      <ProtectedRoute>
                        <MemberEdit />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/jugendverwaltung"
                    element={
                      <ProtectedRoute>
                        {canAccessJugendverwaltung() ? (
                          <Jugendverwaltung />
                        ) : (
                          <AdminDashboard />
                        )}
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </Container>
            </>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
