import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  TextField,
  Typography,
  Chip,
  Card,
  LinearProgress,
  IconButton,
  FormControl,
  InputLabel,
  OutlinedInput,
  InputAdornment,
} from "@mui/material";
import { Add, Remove, Close, TrendingUp } from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import { showSnackbar } from "../Slice/snackbarSlice";
import axiosInstance from "../utils/axiosInstance";
import { CreateButton } from "../components/Styled";

const KanchButtonProgressModal = ({
  open,
  onClose,
  kanchButtonDetails,
  onSuccess,
}) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const [submitting, setSubmitting] = useState(false);
  const [completedQuantity, setCompletedQuantity] = useState(0);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open && kanchButtonDetails) {
      setCompletedQuantity(0);
      setNotes("");
    }
  }, [open, kanchButtonDetails]);

  const totalShirts = kanchButtonDetails?.totalShirts || 0;
  const completedShirts = kanchButtonDetails?.completedShirts || 0;

  const handleQuantityChange = (value) => {
    const numValue = parseInt(value) || 0;
    const remaining = totalShirts - completedShirts;
    const limitedValue = totalShirts > 0 ? Math.min(numValue, remaining) : numValue;
    setCompletedQuantity(Math.max(0, limitedValue));
  };

  const incrementQuantity = () => {
    const remaining = totalShirts - completedShirts;
    if (totalShirts === 0 || completedQuantity < remaining) {
      setCompletedQuantity(completedQuantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (completedQuantity > 0) {
      setCompletedQuantity(completedQuantity - 1);
    }
  };

  const getOverallProgress = () => {
    const newCompleted = completedShirts + completedQuantity;
    return totalShirts > 0
      ? Math.round((newCompleted / totalShirts) * 100)
      : 0;
  };

  const handleSubmit = async () => {
    // ✅ Removed the completedQuantity <= 0 block — allow submit with 0
    try {
      setSubmitting(true);

      await axiosInstance.patch(
        `/kanch-button/${kanchButtonDetails._id}/progress`,
        {
          completedQuantity,
          performedBy: user?._id || user?.id,
          notes: notes.trim() || undefined,
        },
      );

      dispatch(
        showSnackbar({
          open: true,
          severity: "success",
          message: "Progress updated successfully",
        }),
      );

      onSuccess();
      handleClose();
    } catch (error) {
      console.error("Error updating progress:", error);
      dispatch(
        showSnackbar({
          open: true,
          severity: "error",
          message:
            error?.response?.data?.message || "Failed to update progress",
        }),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setCompletedQuantity(0);
    setNotes("");
    onClose();
  };

  if (!kanchButtonDetails) return null;

  const newCompleted = completedShirts + completedQuantity;
  const remaining = totalShirts - newCompleted;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pb: 2,
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Update Progress
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {kanchButtonDetails.name}
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {/* Overall Progress */}
          <Card sx={{ p: 2, bgcolor: "#f0f9ff", border: "1px solid #bae6fd" }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 1.5,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <TrendingUp sx={{ fontSize: 20, color: "#3b82f6" }} />
                <Typography
                  sx={{ fontSize: "13px", fontWeight: 700, color: "#1e40af" }}
                >
                  Overall Progress
                </Typography>
              </Box>
              <Chip
                label={`${getOverallProgress()}%`}
                size="small"
                sx={{
                  backgroundColor: "#3b82f6",
                  color: "white",
                  fontWeight: 700,
                }}
              />
            </Box>

            <LinearProgress
              variant="determinate"
              value={getOverallProgress()}
              sx={{
                height: 8,
                borderRadius: 4,
                mb: 1.5,
                backgroundColor: "#dbeafe",
                "& .MuiLinearProgress-bar": { backgroundColor: "#3b82f6" },
              }}
            />

            <Typography
              sx={{ fontSize: "12px", color: "#1e40af", fontWeight: 600 }}
            >
              {/* ✅ Show "Not set" gracefully if totalShirts is 0 */}
              Total Shirts: {totalShirts > 0 ? totalShirts : "Not set"}
            </Typography>

            {kanchButtonDetails?.memoItems?.length > 0 && (
              <Box sx={{ mt: 1 }}>
                <Typography sx={{ fontSize: "11px", color: "#6b7280", mb: 0.5, fontWeight: 600 }}>SKU Breakdown:</Typography>
                <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                  {kanchButtonDetails.memoItems.map((item, idx) => 
                     (item.shirtSKUs || []).map((skuObj, skuIdx) => (
                       <Chip 
                         key={`${idx}-${skuIdx}`}
                         label={typeof skuObj === 'string' ? skuObj : `${skuObj.sku}: ${skuObj.quantity}`}
                         size="small"
                         sx={{ fontSize: "10px", height: "20px", backgroundColor: "#ffffff", border: "1px solid #cbd5e1", color: "#334155" }}
                       />
                     ))
                  ).flat()}
                </Box>
              </Box>
            )}
          </Card>

          {/* Progress Update */}
          <Card sx={{ p: 2, border: "2px solid #e5e7eb", borderRadius: "12px" }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 1.5,
              }}
            >
              <Typography sx={{ fontSize: "14px", fontWeight: 700 }}>
                Kanch Button Work
              </Typography>
              <Chip
                label={totalShirts > 0 ? `${newCompleted}/${totalShirts}` : `+${completedQuantity}`}
                size="small"
                sx={{
                  fontSize: "11px",
                  backgroundColor: "#f3f4f6",
                  fontWeight: 600,
                }}
              />
            </Box>

            <Typography sx={{ fontSize: "11px", color: "#6b7280", mb: 1 }}>
              {totalShirts > 0
                ? `Current: ${completedShirts} • Remaining: ${totalShirts - completedShirts}`
                : `Completed so far: ${completedShirts}`}
            </Typography>

            <LinearProgress
              variant="determinate"
              value={getOverallProgress()}
              sx={{
                height: 6,
                borderRadius: 3,
                mb: 1.5,
                backgroundColor: "#e5e7eb",
                "& .MuiLinearProgress-bar": {
                  backgroundColor:
                    totalShirts > 0 && newCompleted === totalShirts
                      ? "#16a34a"
                      : "#3b82f6",
                },
              }}
            />

            <FormControl fullWidth variant="outlined">
              <InputLabel>Completed Quantity</InputLabel>
              <OutlinedInput
                type="number"
                value={completedQuantity}
                onChange={(e) => handleQuantityChange(e.target.value)}
                onWheel={(e) => e.target.blur()}
                label="Completed Quantity"
                inputProps={{
                  min: 0,
                  max: totalShirts > 0 ? totalShirts - completedShirts : undefined,
                }}
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton
                      onClick={decrementQuantity}
                      edge="end"
                      size="small"
                    >
                      <Remove />
                    </IconButton>
                    <IconButton
                      onClick={incrementQuantity}
                      edge="end"
                      size="small"
                    >
                      <Add />
                    </IconButton>
                  </InputAdornment>
                }
              />
            </FormControl>
          </Card>

          {/* Summary — show when quantity > 0 */}
          {completedQuantity > 0 && (
            <Card
              sx={{ p: 2, bgcolor: "#fef3c7", border: "1px solid #fbbf24" }}
            >
              <Typography
                sx={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#92400e",
                  mb: 1,
                }}
              >
                Completing This Update
              </Typography>
              <Typography
                sx={{ fontSize: "24px", fontWeight: 700, color: "#92400e" }}
              >
                {completedQuantity} shirts
              </Typography>
              {totalShirts > 0 && remaining === 0 && (
                <Typography
                  sx={{
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "#16a34a",
                    mt: 1,
                  }}
                >
                  ✓ This will complete all work!
                </Typography>
              )}
            </Card>
          )}

          {/* Notes */}
          <TextField
            label="Notes (Optional)"
            multiline
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes about this progress update..."
            fullWidth
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} disabled={submitting}>
          Cancel
        </Button>
        {/* ✅ Removed completedQuantity === 0 disabled condition */}
        <CreateButton onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Updating..." : "Update Progress"}
        </CreateButton>
      </DialogActions>
    </Dialog>
  );
};

export default KanchButtonProgressModal;