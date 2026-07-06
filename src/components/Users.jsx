import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import { Box, Button, Card, Chip, Skeleton, Typography, Menu, MenuItem } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import AddUserModal from "../Modals/AddUserModal";
import axiosInstance from "../utils/axiosInstance";
import { showSnackbar } from "../Slice/snackbarSlice";
import NoResponsePage from "../pages/NoResponsePage";
import DeactivateUserModal from "../Modals/DeactivateUserModal";
import EditUserModal from "../Modals/EditUserModal";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import FilterListIcon from "@mui/icons-material/FilterList";
import { IconButton } from "@mui/material";

const Users = () => {
  const { user } = useSelector((state) => state.auth);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [userToDeactivate, setUserToDeactivate] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("active");
  const [anchorEl, setAnchorEl] = useState(null);
  const dispatch = useDispatch();

  const getRoleColor = (role) => {
    const roleColors = {
      Admin: { bg: "#fef3f2", color: "#b42318" },
      Manager: { bg: "#fffaeb", color: "#b54708" },
      User: { bg: "#f0fdf4", color: "#15803d" },
      "Fabric Manager": { bg: "#faf5ff", color: "#7c3aed" },
      "Pre-stitcher": { bg: "#eff6ff", color: "#6366F1" },
    };
    return roleColors[role] || { bg: "#f3f4f6", color: "#374151" };
  };

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const userId = user?.id || user?._id;
      if (userId) {
        const response = await axiosInstance.get(`/users/${userId}`);
        setUsers(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);

      dispatch(
        showSnackbar({
          open: true,
          severity: "error",
          message: "Failed to load users.",
        })
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleUserCreated = () => {
    fetchUsers();
  };

  const handleDeactivateClick = (userData) => {
    setUserToDeactivate(userData);
    setIsDeactivateModalOpen(true);
  };

  const handleUserDeactivated = () => {
    fetchUsers();
  };

  const handleEditClick = (userData) => {
    setUserToEdit(userData);
    setIsEditModalOpen(true);
  };

  const handleUserUpdated = () => {
    fetchUsers();
  };

  useEffect(() => {
    if (user) {
      fetchUsers();
    }
  }, [user, fetchUsers]);

  if (loading) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Box
          sx={{
            mb: { xs: 2, md: 3 },
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
            gap: { xs: 2, sm: 0 },
          }}
        >
          <Skeleton
            variant="text"
            width={{ xs: "100%", sm: 200 }}
            height={40}
          />
          <Skeleton
            variant="rectangular"
            width={{ xs: "100%", sm: 150 }}
            height={36}
          />
        </Box>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(auto-fill, minmax(280px, 1fr))",
            },
            gap: 2,
          }}
        >
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton
              key={i}
              variant="rectangular"
              width="100%"
              height={160}
              sx={{ borderRadius: "12px" }}
            />
          ))}
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 2 } }}>

      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "stretch", sm: "center" },
          mb: { xs: 2, md: 2 },
          gap: { xs: 1.5, sm: 0 },
        }}
      >
        <Button
          variant="contained"
          onClick={() => setIsModalOpen(true)}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            borderRadius: "8px",
            boxShadow: "none",
            background: "#667eea",
            width: { xs: "100%", sm: "auto" },
          }}
        >
          Add New User
        </Button>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            onClick={(e) => setAnchorEl(e.currentTarget)}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              borderRadius: "8px",
              borderColor: "#e5e7eb",
              color: "#374151",
              "&:hover": {
                borderColor: "#667eea",
                backgroundColor: "#f9fafb",
              },
            }}
          >
            Filter: {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
          </Button>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "right",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
          >
            <MenuItem
              onClick={() => {
                setStatusFilter("all");
                setAnchorEl(null);
              }}
              selected={statusFilter === "all"}
            >
              All Users
            </MenuItem>
            <MenuItem
              onClick={() => {
                setStatusFilter("active");
                setAnchorEl(null);
              }}
              selected={statusFilter === "active"}
            >
              Active
            </MenuItem>
            <MenuItem
              onClick={() => {
                setStatusFilter("deactivated");
                setAnchorEl(null);
              }}
              selected={statusFilter === "deactivated"}
            >
              Deactivated
            </MenuItem>
          </Menu>
        </Box>
      </Box>
      {users.length === 0 ? (
        <NoResponsePage />
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(auto-fill, minmax(280px, 1fr))",
              lg: "repeat(auto-fill, minmax(280px, 1fr))",
            },
            gap: { xs: 2, md: 2.5 },
          }}
        >
          {users
            .filter((userData) => {
              if (statusFilter === "active") return userData.isActive !== false;
              if (statusFilter === "deactivated") return userData.isActive === false;
              return true;
            })
            .map((userData) => {
            const roleStyle = getRoleColor(userData.roleName);
            const isDeactivated = userData.isActive === false;

            return (
              <Card
                key={userData.id || userData._id}
                sx={{
                  borderRadius: "12px",
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
                  backgroundColor: "#ffffff",
                }}
              >
                <Box sx={{ p: 2.5 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mb: 1.5,
                      gap: 1,
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: "16px",
                        fontWeight: 600,
                        color: "#111827",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        flex: 1,
                      }}
                    >
                      {userData.firstName} {userData.lastName}
                    </Typography>

                    <Chip
                      label={userData.roleName || "User"}
                      size="small"
                      sx={{
                        backgroundColor: roleStyle.bg,
                        color: roleStyle.color,
                        fontWeight: 600,
                        fontSize: "11px",
                        height: "24px",
                        borderRadius: "6px",
                        flexShrink: 0,
                      }}
                    />

                    {userData._id !== user?.id && userData._id !== user?._id && !isDeactivated && (
                      <IconButton
                        size="small"
                        onClick={() => handleDeactivateClick(userData)}
                        sx={{
                          color: "#9ca3af",
                          "&:hover": { color: "#ef4444", backgroundColor: "#fef2f2" },
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 1,
                    }}
                  >
                    <EmailIcon
                      sx={{ fontSize: 16, color: "#9ca3af", flexShrink: 0 }}
                    />
                    <Typography
                      sx={{
                        fontSize: "13px",
                        color: "#6b7280",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {userData.email}
                    </Typography>
                  </Box>


                  {userData.phone && (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 1,
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <PhoneIcon
                          sx={{ fontSize: 16, color: "#9ca3af", flexShrink: 0 }}
                        />
                        <Typography
                          sx={{
                            fontSize: "13px",
                            color: "#6b7280",
                          }}
                        >
                          {userData.phone}
                        </Typography>
                      </Box>
                      {userData._id !== user?.id && userData._id !== user?._id && !isDeactivated && (
                        <IconButton
                          size="small"
                          onClick={() => handleEditClick(userData)}
                          sx={{
                            color: "#9ca3af",
                            "&:hover": { color: "#667eea", backgroundColor: "#eff6ff" },
                            p: 0.5,
                          }}
                        >
                          <EditIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      )}
                      {isDeactivated && (
                        <Chip
                          label="Deactivated"
                          size="small"
                          sx={{
                            backgroundColor: "#fef2f2",
                            color: "#ef4444",
                            fontWeight: 600,
                            fontSize: "11px",
                            height: "24px",
                            borderRadius: "6px",
                            flexShrink: 0,
                            border: "1px solid #ef4444"
                          }}
                        />
                      )}
                    </Box>
                  )}
                </Box>
              </Card>
            );
          })}
        </Box>
      )}

      <AddUserModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUserCreated={handleUserCreated}
        currentUser={user}
      />

      <DeactivateUserModal
        open={isDeactivateModalOpen}
        onClose={() => setIsDeactivateModalOpen(false)}
        userToDeactivate={userToDeactivate}
        onUserDeactivated={handleUserDeactivated}
      />

      <EditUserModal
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        userToEdit={userToEdit}
        onUserUpdated={handleUserUpdated}
      />
    </Box>
  );
};

export default Users;
