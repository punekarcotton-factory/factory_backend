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
  Divider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import axiosInstance from "../utils/axiosInstance";
import { useDispatch } from "react-redux";
import { showSnackbar } from "../Slice/snackbarSlice";

const EditUserModal = ({ open, onClose, userToEdit, onUserUpdated }) => {
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
      "& fieldset": { borderColor: "#e5e7eb" },
      "&:hover fieldset": { borderColor: "#667eea" },
      "&.Mui-focused fieldset": { borderColor: "#667eea", borderWidth: "1.5px" },
    },
  };

  // Pre-fill form when user changes
  useEffect(() => {
    if (userToEdit) {
      setFormData({
        firstName: userToEdit.firstName || "",
        lastName: userToEdit.lastName || "",
        email: userToEdit.email || "",
        phone: userToEdit.phone || "",
        roleId: userToEdit.roleId || "",
      });
      setError("");
    }
  }, [userToEdit]);

  const fetchRoles = async () => {
    try {
      const response = await axiosInstance.get("/roles");
      const rolesData = response.data?.data || response.data || [];
      setRoles(rolesData);
    } catch (err) {
      console.error("Error fetching roles:", err);
    }
  };

  useEffect(() => {
    if (open && roles.length === 0) {
      fetchRoles();
    }
  }, [open]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "firstName" || name === "lastName") {
      if (!/^[a-zA-Z\s]*$/.test(value)) return;
    }

    if (name === "phone") {
      const digits = value.replace(/\D/g, "");
      if (digits.length > 10) return;
      setFormData((prev) => ({ ...prev, phone: digits }));
      if (error) setError("");
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.roleId) {
      setError("All fields are required.");
      return;
    }

    try {
      setSubmitting(true);
      const userId = userToEdit?.id || userToEdit?._id;
      await axiosInstance.put(`/users/${userId}`, formData);
      dispatch(showSnackbar({ open: true, severity: "success", message: "User updated successfully!" }));
      onUserUpdated();
      onClose();
    } catch (err) {
      console.error("Error updating user:", err);
      setError(err.response?.data?.message || "Failed to update user. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setError("");
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: "12px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" } }}
    >
      <DialogTitle sx={{ pb: 2, px: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <EditIcon sx={{ color: "#667eea" }} />
            <Typography sx={{ fontWeight: 600, fontSize: "18px", color: "#111827" }}>
              Edit User
            </Typography>
          </Box>
          <IconButton onClick={handleClose} disabled={submitting} sx={{ color: "#9ca3af", "&:hover": { backgroundColor: "#f3f4f6" } }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ px: 3, pb: 3 }}>
        {error && (
          <Alert
            severity="error"
            sx={{ mb: 2.5, fontSize: "13px", borderRadius: "8px", backgroundColor: "#fef2f2", color: "#991b1b" }}
            onClose={() => setError("")}
          >
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          {/* First Name & Last Name */}
          <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 1.5, mb: 1.5 }}>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: "13px", fontWeight: 500, color: "#374151", mb: 0.75 }}>First Name</Typography>
              <TextField
                fullWidth size="small" name="firstName"
                value={formData.firstName} onChange={handleInputChange}
                disabled={submitting} sx={textFieldStyle}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: "13px", fontWeight: 500, color: "#374151", mb: 0.75 }}>Last Name</Typography>
              <TextField
                fullWidth size="small" name="lastName"
                value={formData.lastName} onChange={handleInputChange}
                disabled={submitting} sx={textFieldStyle}
              />
            </Box>
          </Box>

          {/* Email */}
          <Box sx={{ mb: 1.5 }}>
            <Typography sx={{ fontSize: "13px", fontWeight: 500, color: "#374151", mb: 0.75 }}>Email Address</Typography>
            <TextField
              fullWidth size="small" name="email" type="email"
              value={formData.email} onChange={handleInputChange}
              disabled={submitting} sx={textFieldStyle}
            />
          </Box>

          {/* Phone */}
          <Box sx={{ mb: 1.5 }}>
            <Typography sx={{ fontSize: "13px", fontWeight: 500, color: "#374151", mb: 0.75 }}>Phone Number</Typography>
            <TextField
              fullWidth size="small" name="phone"
              value={formData.phone} onChange={handleInputChange}
              disabled={submitting} sx={textFieldStyle}
            />
          </Box>

          {/* Role */}
          <Box>
            <Typography sx={{ fontSize: "13px", fontWeight: 500, color: "#374151", mb: 0.75 }}>Role</Typography>
            <TextField
              select fullWidth size="small" name="roleId"
              value={formData.roleId}
              disabled
              helperText="Role cannot be changed after creation."
              sx={{
                ...textFieldStyle,
                "& .MuiFormHelperText-root": { fontSize: "11px", color: "#9ca3af" },
              }}
            >
              {roles.map((role) => (
                <MenuItem key={role.id || role._id} value={role.id || role._id} sx={{ fontSize: "14px" }}>
                  {role.roleName}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </Box>
      </DialogContent>

      <Divider sx={{ mb: 2 }} />

      <DialogActions sx={{ px: 3, pb: 3, pt: 0, gap: 1.5 }}>
        <Button
          onClick={handleClose}
          disabled={submitting}
          fullWidth
          sx={{ textTransform: "none", color: "#6b7280", fontSize: "14px", fontWeight: 500, py: 1.25, borderRadius: "8px", border: "1px solid #e5e7eb" }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting}
          fullWidth
          sx={{
            textTransform: "none", fontSize: "14px", fontWeight: 600, py: 1.25, borderRadius: "8px",
            background: "#667eea", boxShadow: "0 4px 6px -1px rgba(102,126,234,0.3)",
            "&:hover": { background: "#5a6fd6" },
          }}
        >
          {submitting ? "Saving..." : "Save Changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditUserModal;
