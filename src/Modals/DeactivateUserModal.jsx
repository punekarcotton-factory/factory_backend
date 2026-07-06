import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Box,
  Typography,
  Alert,
  MenuItem,
  TextField,
  Divider,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PersonRemoveIcon from "@mui/icons-material/PersonRemove";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import axiosInstance from "../utils/axiosInstance";
import { useDispatch, useSelector } from "react-redux";
import { showSnackbar } from "../Slice/snackbarSlice";

const DeactivateUserModal = ({ open, onClose, userToDeactivate, onUserDeactivated }) => {
  const dispatch = useDispatch();
  const authState = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [taskSummary, setTaskSummary] = useState(null);
  const [selectedReassigneeId, setSelectedReassigneeId] = useState("");
  const [error, setError] = useState("");

  const fetchTaskSummary = useCallback(async () => {
    if (!userToDeactivate) return;
    try {
      setLoading(true);
      setError("");
      const userId = userToDeactivate.id || userToDeactivate._id;
      const response = await axiosInstance.get(`/users/${userId}/tasks`);
      setTaskSummary(response.data.data);
    } catch (err) {
      console.error("Error fetching task summary:", err);
      setError("Failed to fetch user task summary.");
    } finally {
      setLoading(false);
    }
  }, [userToDeactivate]);

  useEffect(() => {
    if (open && userToDeactivate) {
      fetchTaskSummary();
    } else {
      setTaskSummary(null);
      setSelectedReassigneeId("");
      setError("");
    }
  }, [open, userToDeactivate, fetchTaskSummary]);

  const handleDeactivate = async () => {
    setError("");
    setSubmitting(false); // Reset submitting if there's an error later
    setSubmitting(true);
    const userId = userToDeactivate.id || userToDeactivate._id;
    const currentUserId = authState.user?.id || authState.user?._id;

    try {
      // 1. Reassign if needed
      if (taskSummary?.ongoingTasks > 0) {
        if (!selectedReassigneeId) {
          setError("Please select a user to reassign tasks to.");
          setSubmitting(false);
          return;
        }
        await axiosInstance.post("/users/reassign-tasks", {
          fromUserId: userId,
          toUserId: selectedReassigneeId,
        });
      }

      // 2. Deactivate
      await axiosInstance.delete(`/users/${userId}`, { 
        data: { deletedBy: currentUserId } 
      });

      dispatch(
        showSnackbar({
          open: true,
          severity: "success",
          message: `User ${userToDeactivate.firstName} deactivated successfully${taskSummary?.ongoingTasks > 0 ? " and tasks reassigned" : ""}.`,
        })
      );
      onUserDeactivated();
      onClose();
    } catch (err) {
      console.error("Error during deactivation:", err);
      setError(err.response?.data?.message || "An error occurred during deactivation.");
    } finally {
      setSubmitting(false);
    }
  };

  const textFieldStyle = {
    "& .MuiInputBase-root": {
      fontSize: "14px",
      backgroundColor: "#ffffff",
      borderRadius: "8px",
    },
    "& .MuiOutlinedInput-root": {
      "& fieldset": { borderColor: "#e5e7eb" },
      "&:hover fieldset": { borderColor: "#ef4444" },
      "&.Mui-focused fieldset": { borderColor: "#ef4444", borderWidth: "1.5px" },
    },
  };

  return (
    <Dialog
      open={open}
      onClose={!submitting ? onClose : undefined}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: { borderRadius: "12px" },
      }}
    >
      <DialogTitle sx={{ pb: 1, px: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <PersonRemoveIcon sx={{ color: "#ef4444" }} />
            <Typography sx={{ fontWeight: 600, fontSize: "18px" }}>Deactivate User</Typography>
          </Box>
          <IconButton onClick={onClose} disabled={submitting} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ px: 3, py: 2 }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={32} />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        ) : (
          <Box>
            <Typography sx={{ fontSize: "14px", color: "#374151", mb: 2 }}>
              Are you sure you want to deactivate <strong>{userToDeactivate?.firstName} {userToDeactivate?.lastName}</strong>?
            </Typography>

            {taskSummary?.ongoingTasks > 0 ? (
              <Box sx={{ bgcolor: "#fff7ed", p: 2, borderRadius: "8px", border: "1px solid #ffedd5", mb: 2 }}>
                <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
                  <WarningAmberIcon sx={{ color: "#f97316", fontSize: "20px" }} />
                  <Typography sx={{ fontSize: "14px", fontWeight: 600, color: "#9a3412" }}>
                    Ongoing Tasks: {taskSummary.ongoingTasks}
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: "13px", color: "#c2410c", mb: 1.5 }}>
                  This user has active tasks. You must reassign them to another <strong>{userToDeactivate?.roleName}</strong> before deactivation.
                </Typography>

                {taskSummary.eligibleReassignees?.length > 0 ? (
                  <Box>
                    <Typography sx={{ fontSize: "12px", fontWeight: 500, color: "#374151", mb: 0.5 }}>
                      Reassign tasks to:
                    </Typography>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      value={selectedReassigneeId}
                      onChange={(e) => setSelectedReassigneeId(e.target.value)}
                      disabled={submitting}
                      sx={textFieldStyle}
                    >
                      {taskSummary.eligibleReassignees.map((u) => (
                        <MenuItem key={u.id || u._id} value={u.id || u._id} sx={{ fontSize: "14px" }}>
                          {u.firstName} {u.lastName} ({u.email})
                        </MenuItem>
                      ))}
                    </TextField>
                  </Box>
                ) : (
                  <Alert severity="warning" sx={{ fontSize: "12px" }}>
                    No other users with the same role are available for reassignment. Please create a new <strong>{userToDeactivate?.roleName}</strong> first.
                  </Alert>
                )}
              </Box>
            ) : (
              <Box sx={{ bgcolor: "#f0fdf4", p: 2, borderRadius: "8px", border: "1px solid #dcfce7", mb: 2 }}>
                <Typography sx={{ fontSize: "13px", color: "#166534" }}>
                  This user has no ongoing tasks and can be safely deactivated.
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button
          onClick={onClose}
          disabled={submitting}
          sx={{ textTransform: "none", color: "#6b7280", borderRadius: "8px" }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleDeactivate}
          disabled={submitting || loading || !!error || (taskSummary?.ongoingTasks > 0 && (!selectedReassigneeId || taskSummary.eligibleReassignees?.length === 0))}
          sx={{
            textTransform: "none",
            borderRadius: "8px",
            bgcolor: "#ef4444",
            "&:hover": { bgcolor: "#dc2626" },
            boxShadow: "none",
          }}
        >
          {submitting ? "Processing..." : taskSummary?.ongoingTasks > 0 ? "Reassign & Deactivate" : "Deactivate User"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeactivateUserModal;
