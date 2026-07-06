// src/Modals/DamageFabricModal.jsx
import { Close, Warning, AssignmentReturn } from "@mui/icons-material";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  TextField,
  Typography,
  Alert,
  Chip,
} from "@mui/material";
import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { showSnackbar } from "../Slice/snackbarSlice";
import axiosInstance from "../utils/axiosInstance";
import { resolveImageUrl } from "../config";

const DamageFabricModal = ({
  open,
  onClose,
  memo,
  item,
  performedBy,
  onSuccess,
}) => {
  const dispatch = useDispatch();
  const [damagedQuantity, setDamagedQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [damageHistory, setDamageHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

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

  // Fetch damage history for this item
  useEffect(() => {
    const fetchDamageHistory = async () => {
      if (!open || !item?._id) return;

      try {
        setLoadingHistory(true);
        const response = await axiosInstance.get("/fabrics/damage");
        const allRecords = response.data.data || [];

        // Filter records for this specific memo item
        const itemRecords = allRecords.filter(
          (record) => record.deliveryMemoItemId === item._id,
        );

        setDamageHistory(itemRecords);
      } catch (error) {
        console.error("Failed to fetch damage history:", error);
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchDamageHistory();
  }, [open, item]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const quantity = parseFloat(damagedQuantity);

    if (!quantity || quantity <= 0) {
      setError("Please enter a valid quantity");
      return;
    }

    if (quantity > availableQuantity) {
      setError(
        `Damaged quantity cannot exceed available quantity (${availableQuantity.toFixed(2)}m)`,
      );
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        fabricSKU: item.fabricSKU,
        damagedQuantity: quantity,
        deliveryMemoId: memo?.deliveryMemoId,
        deliveryMemoItemId: item?._id,
        performedBy: performedBy,
        notes: notes || undefined,
        metadata: {
          fabricTitle: item.fabricTitle,
          fabricColor: item.fabricColor,
          originalDhap: item.dhap,
          originalFold: item.fold,
          totalAllocated: totalAllocated,
        },
      };

      const response = await axiosInstance.post("/fabrics/damage", payload);

      const action = quantity < 6 ? "damage" : "return";

      dispatch(
        showSnackbar({
          open: true,
          severity: "success",
          message:
            response.data.message || `Fabric ${action} recorded successfully`,
        }),
      );

      setDamagedQuantity("");
      setNotes("");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Submit error:", error);
      setError(
        error.response?.data?.message ||
          "Failed to record damage. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setDamagedQuantity("");
      setNotes("");
      setError("");
      onClose();
    }
  };

  const quantity = parseFloat(damagedQuantity || 0);
  const isReturn = quantity >= 6;

  // Calculate quantities from damage history
  const totalAllocated = item
    ? parseFloat(item.dhap || 0) * parseFloat(item.fold || 0)
    : 0;

  // DAMAGE: Only records with action='DAMAGE'
  const totalDamaged = damageHistory
    .filter((record) => record.action === "DAMAGE")
    .reduce((sum, record) => sum + parseFloat(record.damagedQuantity || 0), 0);

  // RETURN: All records with action='RETURN' (both pending and completed)
  const totalReturned = damageHistory
    .filter((record) => record.action === "RETURN")
    .reduce((sum, record) => sum + parseFloat(record.damagedQuantity || 0), 0);

  // PENDING RETURN: Only pending returns
  const totalPendingReturn = damageHistory
    .filter(
      (record) =>
        record.action === "RETURN" && record.status === "RETURN_PENDING",
    )
    .reduce((sum, record) => sum + parseFloat(record.damagedQuantity || 0), 0);

  // COMPLETED RETURN: Only completed returns
  const totalCompletedReturn = damageHistory
    .filter(
      (record) =>
        record.action === "RETURN" && record.status === "RETURN_COMPLETED",
    )
    .reduce((sum, record) => sum + parseFloat(record.damagedQuantity || 0), 0);

  const totalUsed = totalDamaged + totalReturned;
  const availableQuantity = totalAllocated - totalUsed;
  const remainingQuantity = availableQuantity - quantity;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "12px",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
        },
      }}
    >
      <DialogTitle sx={{ pb: 2, px: 3 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "10px",
                backgroundColor: "#fef2f2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Warning sx={{ color: "#dc2626", fontSize: 22 }} />
            </Box>
            <Box>
              <Typography
                sx={{
                  fontWeight: 600,
                  fontSize: "18px",
                  color: "#111827",
                  lineHeight: 1.2,
                }}
              >
                Report Damage/Return
              </Typography>
              <Typography sx={{ fontSize: "13px", color: "#6b7280", mt: 0.5 }}>
                Deduct from memo allocation
              </Typography>
            </Box>
          </Box>

          <IconButton
            onClick={handleClose}
            disabled={submitting}
            sx={{
              color: "#9ca3af",
              "&:hover": { backgroundColor: "#f3f4f6", color: "#6b7280" },
            }}
          >
            <Close fontSize="small" />
          </IconButton>
        </Box>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ px: 3, py: 3 }}>
        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 2.5,
              fontSize: "13px",
              borderRadius: "8px",
              backgroundColor: "#fef2f2",
              color: "#991b1b",
              "& .MuiAlert-icon": { color: "#dc2626" },
            }}
            onClose={() => setError("")}
          >
            {error}
          </Alert>
        )}

        {/* Item Details */}
        {item && (
          <Box
            sx={{
              mb: 3,
              p: 2,
              borderRadius: "10px",
              backgroundColor: "#f9fafb",
              border: "1px solid #e5e7eb",
            }}
          >
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1.5 }}
            >
              {item.imageUrl && (
                <Box
                  component="img"
                  src={resolveImageUrl(item.imageUrl)}
                  alt={item.fabricSKU}
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: "8px",
                    objectFit: "cover",
                  }}
                />
              )}
              <Box sx={{ flex: 1 }}>
                <Typography
                  sx={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#111827",
                    mb: 0.5,
                  }}
                >
                  {item.fabricSKU}
                </Typography>
                <Typography sx={{ fontSize: "12px", color: "#6b7280" }}>
                  {item.fabricTitle && `${item.fabricTitle}`}
                  {item.fabricColor && ` • ${item.fabricColor}`}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 1.5 }} />

            <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
              <Chip
                label={`${item.dhap}m dhap`}
                size="small"
                sx={{
                  backgroundColor: "#fef3c7",
                  color: "#92400e",
                  fontWeight: 600,
                  fontSize: "11px",
                  border: "none",
                }}
              />
              <Chip
                label={`${item.fold} fold`}
                size="small"
                sx={{
                  backgroundColor: "#f0fdf4",
                  color: "#14532d",
                  fontWeight: 600,
                  fontSize: "11px",
                  border: "none",
                }}
              />
              <Chip
                label={`${totalAllocated.toFixed(2)}m allocated`}
                size="small"
                sx={{
                  backgroundColor: "#f0f4ff",
                  color: "#667eea",
                  fontWeight: 600,
                  fontSize: "11px",
                  border: "none",
                }}
              />
            </Box>

            {/* Show used quantities if any */}
            {totalUsed > 0 && (
              <Box sx={{ mt: 1.5, pt: 1.5, borderTop: "1px solid #e5e7eb" }}>
                <Typography sx={{ fontSize: "11px", color: "#6b7280", mb: 1 }}>
                  Previously Used:
                </Typography>
                <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                  {totalDamaged > 0 && (
                    <Chip
                      label={`${totalDamaged.toFixed(2)}m damaged`}
                      size="small"
                      sx={{
                        backgroundColor: "#fef2f2",
                        color: "#dc2626",
                        fontWeight: 600,
                        fontSize: "11px",
                        border: "none",
                      }}
                    />
                  )}
                  {totalPendingReturn > 0 && (
                    <Chip
                      label={`${totalPendingReturn.toFixed(2)}m pending return`}
                      size="small"
                      sx={{
                        backgroundColor: "#fffbeb",
                        color: "#f59e0b",
                        fontWeight: 600,
                        fontSize: "11px",
                        border: "none",
                      }}
                    />
                  )}
                  {totalCompletedReturn > 0 && (
                    <Chip
                      label={`${totalCompletedReturn.toFixed(2)}m returned`}
                      size="small"
                      sx={{
                        backgroundColor: "#eff6ff",
                        color: "#2563eb",
                        fontWeight: 600,
                        fontSize: "11px",
                        border: "none",
                      }}
                    />
                  )}
                  <Chip
                    label={`${availableQuantity.toFixed(2)}m available`}
                    size="small"
                    sx={{
                      backgroundColor: "#f0fdf4",
                      color: "#16a34a",
                      fontWeight: 600,
                      fontSize: "11px",
                      border: "none",
                    }}
                  />
                </Box>
              </Box>
            )}
          </Box>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          {/* Damaged Quantity */}
          <Box sx={{ mb: 2.5 }}>
            <Typography
              sx={{
                fontSize: "13px",
                fontWeight: 600,
                color: "#374151",
                mb: 1,
              }}
            >
              Damaged/Returned Quantity (meters)
            </Typography>
            <TextField
              fullWidth
              type="number"
              placeholder={`Enter quantity (max: ${availableQuantity.toFixed(2)}m)`}
              size="small"
              sx={textFieldStyle}
              value={damagedQuantity}
              required
              disabled={submitting || loadingHistory}
              inputProps={{ step: "0.01", min: "0.01", max: availableQuantity }}
              onChange={(e) => setDamagedQuantity(e.target.value)}
              helperText={`Available from memo allocation: ${availableQuantity.toFixed(2)}m`}
            />
          </Box>

          {/* Remaining Quantity Display */}
          {quantity > 0 && (
            <Box
              sx={{
                mb: 2.5,
                p: 2,
                borderRadius: "10px",
                backgroundColor: "#f9fafb",
                border: "1px solid #e5e7eb",
              }}
            >
              <Typography
                sx={{
                  fontSize: "12px",
                  color: "#6b7280",
                  mb: 1.5,
                  fontWeight: 600,
                }}
              >
                Memo Allocation Summary
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 0.75,
                }}
              >
                <Typography sx={{ fontSize: "13px", color: "#374151" }}>
                  Total Allocated:
                </Typography>
                <Typography
                  sx={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}
                >
                  {totalAllocated.toFixed(2)}m
                </Typography>
              </Box>

              {totalUsed > 0 && (
                <>
                  {totalDamaged > 0 && (
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 0.75,
                      }}
                    >
                      <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                        Already Damaged:
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "#dc2626",
                        }}
                      >
                        -{totalDamaged.toFixed(2)}m
                      </Typography>
                    </Box>
                  )}
                  {totalReturned > 0 && (
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 0.75,
                      }}
                    >
                      <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                        Already Returned:
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "#2563eb",
                        }}
                      >
                        -{totalReturned.toFixed(2)}m
                      </Typography>
                    </Box>
                  )}
                </>
              )}

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 0.75,
                }}
              >
                <Typography
                  sx={{
                    fontSize: "13px",
                    color: isReturn ? "#2563eb" : "#dc2626",
                  }}
                >
                  Now {isReturn ? "Returning" : "Damaging"}:
                </Typography>
                <Typography
                  sx={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: isReturn ? "#2563eb" : "#dc2626",
                  }}
                >
                  -{quantity.toFixed(2)}m
                </Typography>
              </Box>

              <Divider sx={{ my: 1 }} />

              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography
                  sx={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}
                >
                  Will Remain:
                </Typography>
                <Typography
                  sx={{
                    fontSize: "15px",
                    fontWeight: 700,
                    color: remainingQuantity >= 0 ? "#16a34a" : "#dc2626",
                  }}
                >
                  {remainingQuantity.toFixed(2)}m
                </Typography>
              </Box>
            </Box>
          )}

          {/* Action Type Indicator */}
          {quantity > 0 && (
            <Box
              sx={{
                mb: 2.5,
                p: 2,
                borderRadius: "10px",
                backgroundColor: isReturn ? "#f0f4ff" : "#fef2f2",
                border: isReturn ? "1px solid #bae6fd" : "1px solid #fca5a5",
              }}
            >
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}
              >
                {isReturn ? (
                  <AssignmentReturn sx={{ fontSize: 20, color: "#667eea" }} />
                ) : (
                  <Warning sx={{ fontSize: 20, color: "#dc2626" }} />
                )}
                <Typography
                  sx={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: isReturn ? "#667eea" : "#dc2626",
                  }}
                >
                  {isReturn
                    ? "RETURN WILL BE INITIATED"
                    : "DAMAGE WILL BE RECORDED"}
                </Typography>
              </Box>
              <Typography
                sx={{
                  fontSize: "12px",
                  color: isReturn ? "#4f46e5" : "#991b1b",
                  lineHeight: 1.5,
                }}
              >
                {isReturn
                  ? `Quantity ≥ 6m: Will be deducted from memo allocation and marked as pending return. Stock unchanged. Tracked separately from damage.`
                  : `Quantity < 6m: Will be deducted from memo allocation and marked as damaged. Stock unchanged. Tracked separately from returns.`}
              </Typography>
            </Box>
          )}

          {/* Notes */}
          <Box sx={{ mb: 2 }}>
            <Typography
              sx={{
                fontSize: "13px",
                fontWeight: 600,
                color: "#374151",
                mb: 1,
              }}
            >
              Notes (optional)
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="Enter any additional notes about the damage or return..."
              size="small"
              sx={textFieldStyle}
              value={notes}
              disabled={submitting}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Box>
        </Box>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2.5, gap: 1.5 }}>
        <Button
          onClick={handleClose}
          disabled={submitting}
          fullWidth
          sx={{
            textTransform: "none",
            color: "#6b7280",
            fontSize: "14px",
            fontWeight: 600,
            py: 1.25,
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
            "&:hover": {
              backgroundColor: "#f9fafb",
            },
          }}
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={
            submitting ||
            !damagedQuantity ||
            availableQuantity <= 0 ||
            loadingHistory
          }
          fullWidth
          sx={{
            textTransform: "none",
            fontSize: "14px",
            fontWeight: 600,
            py: 1.25,
            borderRadius: "8px",
            background: isReturn ? "#667eea" : "#dc2626",
            boxShadow: "none",
            "&:hover": {
              background: isReturn ? "#5568d3" : "#b91c1c",
            },
          }}
        >
          {submitting
            ? "Processing..."
            : loadingHistory
              ? "Loading..."
              : availableQuantity <= 0
                ? "No Quantity Available"
                : isReturn
                  ? "Initiate Return"
                  : "Record Damage"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DamageFabricModal;
