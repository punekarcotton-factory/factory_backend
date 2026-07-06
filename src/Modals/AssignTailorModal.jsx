import { Assignment } from "@mui/icons-material";
import {
  Avatar,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { CreateButton, DialogCancelButton } from "../components/Styled";
import { showSnackbar } from "../Slice/snackbarSlice";
import axiosInstance from "../utils/axiosInstance";

const AssignTailorModal = ({ open, onClose, memoId, onAssignmentSuccess }) => {
  const [tailorForm, setTailorForm] = useState({
    name: "",
    phoneNumber: "",
  });

  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    if (open) {
      setTailorForm({ name: "", phoneNumber: "" });
      setFormErrors({});
    }
  }, [open]);

  const validateForm = () => {
    const errors = {};

    if (!tailorForm.name.trim()) {
      errors.name = "Tailor name is required";
    }

    if (!tailorForm.phoneNumber.trim()) {
      errors.phoneNumber = "Phone number is required";
    } else if (tailorForm.phoneNumber.length !== 10) {
      errors.phoneNumber = "Phone number must be exactly 10 digits";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAssign = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);

      await axiosInstance.post(`/assign-tailor/${memoId}/assign`, {
        tailorName: tailorForm.name,
        tailorPhoneNumber: tailorForm.phoneNumber,
      });

      dispatch(
        showSnackbar({
          open: true,
          severity: "success",
          message: "Tailor assigned successfully!",
        }),
      );

      if (onAssignmentSuccess) {
        onAssignmentSuccess();
      }

      onClose();
    } catch (error) {
      console.error("Error assigning tailor:", error);
      dispatch(
        showSnackbar({
          open: true,
          severity: "error",
          message: error.response?.data?.message || "Failed to assign tailor",
        }),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
        },
      }}
    >
      <DialogTitle
        sx={{
          pb: 2,
          borderBottom: "2px solid #e5e7eb",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar
            sx={{
              backgroundColor: "#16a34a",
              width: 48,
              height: 48,
            }}
          >
            <Assignment sx={{ fontSize: 24 }} />
          </Avatar>
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                mb: 0.5,
                fontSize: "20px",
              }}
            >
              Assign Tailor
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: "#6b7280", fontSize: "14px" }}
            >
              Assign this completed pre-stitch work to a tailor
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ pt: 3, display: "flex", flexDirection: "column", gap: 2.5 }}>
          <TextField
            label="Tailor Name"
            value={tailorForm.name}
            onChange={(e) =>
              setTailorForm({ ...tailorForm, name: e.target.value })
            }
            error={!!formErrors.name}
            helperText={formErrors.name}
            fullWidth
            required
            autoFocus
            placeholder="Enter tailor's full name"
          />
          <TextField
            label="Phone Number"
            value={tailorForm.phoneNumber}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "");
              if (value.length <= 10) {
                setTailorForm({ ...tailorForm, phoneNumber: value });
              }
            }}
            error={!!formErrors.phoneNumber}
            helperText={formErrors.phoneNumber || "10 digit mobile number"}
            fullWidth
            required
            placeholder="Enter 10 digit number"
          />
        </Box>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 3, gap: 2 }}>
        <DialogCancelButton onClick={onClose} disabled={submitting}>
          Cancel
        </DialogCancelButton>
        <CreateButton
          onClick={handleAssign}
          variant="contained"
          disabled={submitting}
          sx={{
            backgroundColor: "#16a34a",
            "&:hover": {
              backgroundColor: "#15803d",
            },
          }}
        >
          {submitting ? "Assigning..." : "Assign Tailor"}
        </CreateButton>
      </DialogActions>
    </Dialog>
  );
};

export default AssignTailorModal;
