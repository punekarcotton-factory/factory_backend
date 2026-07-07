import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  IconButton,
  Box,
  Typography,
  Alert,
  MenuItem,
  alpha,
  Divider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import axiosInstance from "../utils/axiosInstance";
import { useDispatch } from "react-redux";
import { showSnackbar } from "../Slice/snackbarSlice";

const AddUserModal = ({ open, onClose, onUserCreated, currentUser }) => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    roleId: "",
  });
  const [roles, setRoles] = useState([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deactivatedUserId, setDeactivatedUserId] = useState(null);

  const textFieldStyle = {
    "& .MuiInputBase-root": {
      fontSize: "14px",
      backgroundColor: "#ffffff",
      borderRadius: "8px",
    },
    "& .MuiInputLabel-root": {
      fontSize: "14px",
      color: "#6b7280",
    },
    "& .MuiOutlinedInput-root": {
      "& fieldset": {
        borderColor: "#e5e7eb",
      },
      "&:hover fieldset": {
        borderColor: "#667eea",
      },
      "&.Mui-focused fieldset": {
        borderColor: "#667eea",
        borderWidth: "1.5px",
      },
    },
  };

const handleInputChange = (e) => {
  const { name, value } = e.target;

  if (name === "firstName" || name === "lastName") {
    const nameRegex = /^[a-zA-Z\s]*$/;
    if (!nameRegex.test(value)) {
      dispatch(showSnackbar({ open: true, severity: "error", message: "Only letters and spaces are allowed in name fields" }));
      return;
    }
  }

  if (name === "email") {
  // ✅ Block only truly invalid special chars, allow valid email chars
  const invalidChars = /[!#$%^&*(),?":{}|<>\[\]\\\/\s]/;
  if (invalidChars.test(value)) {
    dispatch(showSnackbar({ open: true, severity: "error", message: "Email contains invalid special characters" }));
    return;
  }
  if (value !== value.toLowerCase()) {
    dispatch(showSnackbar({ open: true, severity: "error", message: "Email must be in lowercase" }));
    return;
  }
}

  // ✅ Phone: only digits, max 10
  if (name === "phone") {
    const digitsOnly = value.replace(/\D/g, "");
    if (digitsOnly.length > 10) return;
    setFormData((prev) => ({ ...prev, phone: digitsOnly }));
    if (error) setError("");
    return;
  }

  setFormData((prev) => ({ ...prev, [name]: value }));
  if (error) setError("");
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.phone ||
      !formData.roleId
    ) {
      setError("All fields are required");
      return;
    }

    try {
      setSubmitting(true);
      const dataToSubmit = {
        ...formData,
        createdBy: currentUser?.email,
      };

      await axiosInstance.post("/users/create", dataToSubmit);
      dispatch(showSnackbar({
        open: true,
        severity: "success",
        message: "User created successfully!"
      }));
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        roleId: "",
      });
      onUserCreated();
      onClose();
    } catch (error) {
      console.error("Error creating user:", error);
      const errorMessage = error.response?.data?.message || "";
      
      if (errorMessage.startsWith("DEACTIVATED_USER_EXISTS:")) {
        const userId = errorMessage.split(":")[1];
        setDeactivatedUserId(userId);
        setError("This account already exists but is deactivated. Would you like to reactivate it?");
      } else {
        setError(errorMessage || "Failed to create user. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleReactivate = async () => {
    if (!deactivatedUserId) return;
    try {
      setSubmitting(true);
      setError("");
      await axiosInstance.post(`/users/reactivate/${deactivatedUserId}`);
      dispatch(showSnackbar({
        open: true,
        severity: "success",
        message: "User account reactivated successfully!"
      }));
      onUserCreated();
      onClose();
    } catch (err) {
      console.error("Error reactivating user:", err);
      setError(err.response?.data?.message || "Failed to reactivate account.");
    } finally {
      setSubmitting(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await axiosInstance.get("/roles");
     
      
      // Handle different response structures
      const rolesData = response.data?.data || response.data || [];
     
      setRoles(rolesData);
    } catch (error) {
      console.error("Error fetching roles:", error);
      console.error("Error details:", error.response?.data);
      console.error("Error status:", error.response?.status);
      dispatch(showSnackbar({
        open: true,
        severity: "error",
        message: "Failed to load roles. Please try again."
      }));
    }
  };

  useEffect(() => {
    if (open && roles.length === 0) {
      fetchRoles();
    }
  }, [open, roles.length]);

  const handleClose = () => {
    if (!submitting) {
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        roleId: "",
      });
      setError("");
      setDeactivatedUserId(null);
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "12px",
          boxShadow:
            "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          pb: 2,
          px: 3,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box>
              <Typography
                sx={{
                  fontWeight: 600,
                  fontSize: "18px",
                  color: "#111827",
                  lineHeight: 1.2,
                }}
              >
                Add New User
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={handleClose}
            disabled={submitting}
            sx={{
              color: "#9ca3af",
              "&:hover": {
                backgroundColor: "#f3f4f6",
                color: "#6b7280",
              },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </DialogTitle>

      <Divider />
      {/* Content */}
      <DialogContent sx={{ px: 3, pb: 3 }}>
        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 2.5,
              fontSize: "13px",
              borderRadius: "8px",
              backgroundColor: "#fef2f2",
              color: "#991b1b",
              "& .MuiAlert-icon": {
                color: "#dc2626",
              },
            }}
            onClose={() => setError("")}
          >
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Typography sx={{ fontSize: "13px" }}>{error}</Typography>
              {deactivatedUserId && (
                <Button
                  size="small"
                  variant="contained"
                  color="warning"
                  onClick={handleReactivate}
                  disabled={submitting}
                  sx={{ 
                    textTransform: "none", 
                    fontSize: "12px", 
                    py: 0.5,
                    width: "fit-content",
                    bgcolor: "#f59e0b",
                    "&:hover": { bgcolor: "#d97706" }
                  }}
                >
                  {submitting ? "Reactivating..." : "Reactivate Account Now"}
                </Button>
              )}
            </Box>
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          {/* First Name & Last Name */}
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              gap: 1.5,
              mb: 1.5,
            }}
          >
            <Box sx={{ flex: 1 }}>
              <Typography
                sx={{
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "#374151",
                  mb: 0.75,
                }}
              >
                First Name
              </Typography>
              <TextField
                fullWidth
                placeholder="Enter first name"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                required
                disabled={submitting}
                size="small"
                sx={textFieldStyle}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography
                sx={{
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "#374151",
                  mb: 0.75,
                }}
              >
                Last Name
              </Typography>
              <TextField
                fullWidth
                placeholder="Enter last name"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
                disabled={submitting}
                size="small"
                sx={textFieldStyle}
              />
            </Box>
          </Box>

          {/* Email */}
          <Box sx={{ mb: 1.5 }}>
            <Typography
              sx={{
                fontSize: "13px",
                fontWeight: 500,
                color: "#374151",
                mb: 0.75,
              }}
            >
              Email Address
            </Typography>
            <TextField
              fullWidth
              placeholder="user@example.com"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              disabled={submitting}
              size="small"
              sx={textFieldStyle}
            />
          </Box>

          {/* Phone */}
          <Box sx={{ mb: 1.5 }}>
            <Typography
              sx={{
                fontSize: "13px",
                fontWeight: 500,
                color: "#374151",
                mb: 0.75,
              }}
            >
              Phone Number
            </Typography>
            <TextField
              fullWidth
              placeholder="+1 (555) 000-0000"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              required
              disabled={submitting}
              size="small"
              sx={textFieldStyle}
            />
          </Box>

          {/* Role */}
          <Box>
            <Typography
              sx={{
                fontSize: "13px",
                fontWeight: 500,
                color: "#374151",
                mb: 0.75,
              }}
            >
              Role
            </Typography>
            <TextField
              select
              fullWidth
              name="roleId"
              value={formData.roleId}
              onChange={handleInputChange}
              required
              disabled={submitting}
              size="small"
              sx={textFieldStyle}
              SelectProps={{
                displayEmpty: true,
                renderValue: (selected) => {
                  if (!selected) {
                    return (
                      <span style={{ color: "#9ca3af" }}>Select role</span>
                    );
                  }
                  const selectedRole = roles.find(
                    (role) => (role.id || role._id) === selected
                  );
                  return selectedRole?.roleName;
                },
              }}
            >
              <MenuItem value="" disabled sx={{ fontSize: "14px" }}>
                Select a role
              </MenuItem>
              {roles.map((role) => (
                <MenuItem
                  key={role.id || role._id}
                  value={role.id || role._id}
                  sx={{ fontSize: "14px" }}
                >
                  {role.roleName}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </Box>
      </DialogContent>
      <Divider sx={{ mb: 2 }} />
      {/* Actions */}
      <DialogActions
        sx={{
          px: 3,
          pb: 3,
          pt: 0,
          gap: 1.5,
        }}
      >
        <Button
          onClick={handleClose}
          disabled={submitting}
          fullWidth
          sx={{
            textTransform: "none",
            color: "#6b7280",
            fontSize: "14px",
            fontWeight: 500,
            py: 1.25,
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting}
          fullWidth
          sx={{
            textTransform: "none",
            fontSize: "14px",
            fontWeight: 600,
            py: 1.25,
            borderRadius: "8px",
            background: "#667eea",
            boxShadow: "0 4px 6px -1px rgba(102, 126, 234, 0.3)",
          }}
        >
          {submitting ? "Creating..." : "Create User"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddUserModal;
