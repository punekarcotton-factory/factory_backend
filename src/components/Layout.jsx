import {
  Avatar,
  Box,
  CssBaseline,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { logoutUser } from "../Slice/authSlice";
import { getNavItems, getPageTitle } from "../utils/Navigation";
import Profile from "./Sidebar/Profile";
import Sidebar from "./Sidebar/Sidebar";
import { showSnackbar } from "../Slice/snackbarSlice";

import GlobalSearch from "./GlobalSearch";

// ========== HELPER FUNCTIONS ==========
const getAvatarInitials = (user) => {
  if (!user) return "U";
  const firstName = user?.firstName || "";
  const lastName = user?.lastName || "";
  const email = user?.email || "";

  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  }
  if (firstName) return firstName.substring(0, 2).toUpperCase();
  if (email) return email[0].toUpperCase();
  return "U";
};

const getUserDisplayName = (user) => {
  if (!user) return "User";
  const firstName = user?.firstName || "";
  const lastName = user?.lastName || "";
  const email = user?.email || "";

  if (firstName && lastName) return `${firstName} ${lastName}`;
  if (firstName) return firstName;
  if (email) return email;
  return "User";
};

// ========== COMPONENT ==========

const Layout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { user, loading } = useSelector((state) => state.auth);
  const [showProfileModal, setShowProfileModal] = useState(false);
 

  const navItems = getNavItems();
  const pageTitle = getPageTitle(location.pathname);

  const handleProfileClick = () => setShowProfileModal(true);
  const handleProfileClose = () => setShowProfileModal(false);

  const handleLogout = async () => {
    try {
      const result = await dispatch(logoutUser());

      if (result?.meta?.requestStatus === "fulfilled") {
        dispatch(
          showSnackbar  ({
            open: true,
            severity: "success",
            message: "Logged out successfully.",
          })
        );

        navigate("/login", { replace: true });
      } else {
        dispatch(
          showSnackbar({
            open: true,
            severity: "error",
            message: "Logout failed. Please try again.",
          })
        );
      }
    } catch (error) {
      dispatch(
        showSnackbar({
          open: true,
          severity: "error",
          message: "An unexpected error occurred.",
        })
      );
    }
  };

  return (
    <Box
      sx={{ display: "flex", height: "100vh", backgroundColor: "#f9fafb", overflow: "hidden" }}
    >
      <CssBaseline />

      {/* Sidebar */}
      <Sidebar items={navItems} currentPath={location.pathname} />

      {/* Main Content */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Top Bar */}
        <Box
          sx={{
            height: { xs: "60px", md: "70px" },
            backgroundColor: "#ffffff",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: { xs: "0 16px 0 72px", md: "0 32px" },
            boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
          }}
        >
          {/* Left - Page Title */}
          <Box sx={{ display: { xs: "none", sm: "block" } }}>
            <Typography
              sx={{
                fontSize: { xs: "18px", md: "20px" },
                fontWeight: 700,
                color: "#111827",
                letterSpacing: "-0.5px",
              }}
            >
              {pageTitle}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: "16px", flex: 1, justifyContent: "flex-end" }}>
            {/* Global Search */}
            <Box 
              sx={{ 
                display: "block", 
                mr: { xs: 0, md: 2 }, 
                flex: { xs: 1, md: "initial" }, 
                maxWidth: { xs: "100%", md: "350px" } 
              }}
            >
              <GlobalSearch />
            </Box>

            {/* Divider */}
            <Box
              sx={{
                width: "1px",
                height: "32px",
                backgroundColor: "#e5e7eb",
                display: { xs: "none", sm: "block" },
              }}
            />

            {/* User Profile */}
            <Box
              onClick={handleProfileClick}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                cursor: "pointer",
                padding: "6px 12px",
                borderRadius: "10px",
                transition: "background-color 0.2s",
                "&:hover": {
                  backgroundColor: "#f3f4f6",
                },
              }}
            >
              <Avatar
                sx={{
                  width: { xs: 32, md: 38 },
                  height: { xs: 32, md: 38 },
                  fontSize: { xs: "12px", md: "14px" },
                  fontWeight: 600,
                  background: "#667eea",
                  color: "#ffffff",
                }}
              >
                {getAvatarInitials(user)}
              </Avatar>
              <Box
                sx={{
                  display: { xs: "none", sm: "flex" },
                  flexDirection: "column",
                  alignItems: "flex-start",
                }}
              >
                <Typography
                  sx={{
                    fontSize: { xs: "13px", md: "14px" },
                    fontWeight: 600,
                    color: "#111827",
                    lineHeight: "1.2",
                  }}
                >
                  {getUserDisplayName(user)}
                </Typography>
                <Typography
                  sx={{
                    fontSize: { xs: "11px", md: "12px" },
                    color: "#6b7280",
                    lineHeight: "1.2",
                  }}
                >
                  {user?.roleName || "User"}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Page Content */}
        <Box
          sx={{
            flex: 1,
            overflow: "auto",
            "&::-webkit-scrollbar": {
              width: "8px",
            },
            "&::-webkit-scrollbar-track": {
              backgroundColor: "transparent",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "#d1d5db",
              borderRadius: "4px",
              "&:hover": {
                backgroundColor: "#9ca3af",
              },
            },
          }}
        >
          <Outlet />
        </Box>
      </Box>

      {/* Profile Modal */}
      {showProfileModal && (
        <Profile
          open={showProfileModal}
          handleClose={handleProfileClose}
          user={user}
          onLogout={handleLogout}
          loading={loading}
        />
      )}
    </Box>
  );
};

export default Layout;
