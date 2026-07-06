// src/Modals/TailorAssignmentProgressModal.jsx

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
  Divider,
  Stack,
} from "@mui/material";
import { Add, Remove, Close, TrendingUp } from "@mui/icons-material";
import { useDispatch } from "react-redux";
import { showSnackbar } from "../Slice/snackbarSlice";
import axiosInstance from "../utils/axiosInstance";
import { CreateButton } from "../components/Styled";

const TAILOR_OP_KEYS = ["cuff", "ghera", "collar"];
const PRE_STITCHER_OP_KEYS = [
  "label",
  "flacket",
  "covering",
  "pocket",
  "shoulder",
  "chockPatti",
];

const getOptionLabel = (optionKey) => {
  const labels = {
    cuff: "Cuff",
    ghera: "Ghera",
    collar: "Collar",
    label: "Label",
    flacket: "Flacket",
    covering: "Covering",
    pocket: "Pocket",
    shoulder: "Shoulder",
    chockPatti: "Chock Patti",
  };
  return labels[optionKey] || optionKey;
};


const groupItemsByMax = (items) => {
  const map = {};
  items.forEach((item) => {
    const max = item.totalQuantity - item.currentCompleted;
    if (!map[max]) map[max] = [];
    map[max].push(item);
  });
  return Object.entries(map).map(([max, bucketItems]) => ({
    max: Number(max),
    items: bucketItems,
  }));
};
// ─────────────────────────────────────────────────────────────────────────────

const TailorAssignmentProgressModal = ({
  open,
  onClose,
  assignment,
  onSuccess,
}) => {
  const dispatch = useDispatch();
  const [submitting, setSubmitting] = useState(false);
  const [progressUpdates, setProgressUpdates] = useState([]);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open && assignment) {
      initializeProgress();
    }
  }, [open, assignment]);

  const initializeProgress = () => {
    if (assignment?.optionProgress && assignment.optionProgress.length > 0) {
      setProgressUpdates(
        assignment.optionProgress.map((progress) => {
          const total = progress.totalQuantity ?? 0;
          const completed = progress.completedQuantity ?? 0;
          return {
            option: progress.option,
            completedQuantity: 0,
            totalQuantity: total,
            currentCompleted: completed,
            inProgress: progress.inProgressQuantity ?? 0,
          };
        }),
      );
    } else {
      setProgressUpdates([]);
    }
  };

  
  const applyQuantityToKeys = (targetKeys, value) => {
    const numValue = parseInt(value) || 0;
    setProgressUpdates((prev) =>
      prev.map((item) => {
        if (!targetKeys.includes(item.option)) return item;
        const maxAllowed = item.totalQuantity - item.currentCompleted;
        const clamped = Math.min(Math.max(0, numValue), maxAllowed);
        return { ...item, completedQuantity: clamped };
      }),
    );
  };

  const getTotalCompleting = () =>
    progressUpdates.reduce((sum, item) => sum + item.completedQuantity, 0);

  const getOverallProgress = () => {
    const totalAssigned = progressUpdates.reduce(
      (sum, item) => sum + item.totalQuantity,
      0,
    );
    const totalCompleted = progressUpdates.reduce(
      (sum, item) => sum + item.currentCompleted + item.completedQuantity,
      0,
    );
    return totalAssigned > 0
      ? Math.round((totalCompleted / totalAssigned) * 100)
      : 0;
  };

  const handleSubmit = async () => {
    const updatesToSubmit = progressUpdates.filter(
      (item) => item.completedQuantity > 0,
    );

    if (updatesToSubmit.length === 0) {
      dispatch(
        showSnackbar({
          open: true,
          severity: "warning",
          message: "Please enter at least one completed quantity",
        }),
      );
      return;
    }

    try {
      setSubmitting(true);

      await axiosInstance.patch(
        `/assign-tailor/assignments/${assignment._id}/progress`,
        {
          optionUpdates: updatesToSubmit.map((item) => ({
            option: item.option,
            completedQuantity: item.completedQuantity,
          })),
          performedBy: "ADMIN",
          notes,
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
    setProgressUpdates([]);
    setNotes("");
    onClose();
  };

 
  const renderQuantityInputs = (groupItems) => {
    const buckets = groupItemsByMax(groupItems);
    const isShared = buckets.length === 1;

    return (
      <Stack spacing={2} sx={{ mb: 3 }}>
        {buckets.map((bucket) => {
          // The display value for this bucket = first item's completedQuantity
          // (all items in the bucket are kept in sync by applyQuantityToKeys)
          const currentVal = bucket.items[0].completedQuantity;
          const bucketKeys = bucket.items.map((i) => i.option);

          // Label: shared bucket → "Quantity to Mark Completed"
          //        specific bucket → op names joined
          const inputLabel = isShared
            ? "Quantity to Mark Completed"
            : bucketKeys.map(getOptionLabel).join(" & ");

          return (
            <FormControl key={bucket.max} fullWidth variant="outlined">
              <InputLabel>{inputLabel}</InputLabel>
              <OutlinedInput
                type="number"
                value={currentVal}
                onChange={(e) => applyQuantityToKeys(bucketKeys, e.target.value)}
                onWheel={(e) => e.target.blur()}
                label={inputLabel}
                inputProps={{ min: 0, max: bucket.max }}
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() =>
                        applyQuantityToKeys(bucketKeys, currentVal - 1)
                      }
                      edge="end"
                      size="small"
                      disabled={currentVal <= 0}
                    >
                      <Remove />
                    </IconButton>
                    <IconButton
                      onClick={() =>
                        applyQuantityToKeys(bucketKeys, currentVal + 1)
                      }
                      edge="end"
                      size="small"
                      disabled={currentVal >= bucket.max}
                    >
                      <Add />
                    </IconButton>
                  </InputAdornment>
                }
              />
              {/* Available hint */}
              <Typography
                variant="caption"
                sx={{ mt: 0.5, ml: 0.5, color: "#6b7280" }}
              >
                Available: {bucket.max} shirts
              </Typography>
            </FormControl>
          );
        })}
      </Stack>
    );
  };
  // ─────────────────────────────────────────────────────────────────────────

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
            {assignment?.tailorName}
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
                <Typography sx={{ fontSize: "13px", fontWeight: 700, color: "#1e40af" }}>
                  Overall Progress
                </Typography>
              </Box>
              <Chip
                label={`${getOverallProgress()}%`}
                size="small"
                sx={{ backgroundColor: "#3b82f6", color: "white", fontWeight: 700 }}
              />
            </Box>
            <LinearProgress
              variant="determinate"
              value={getOverallProgress()}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: "#dbeafe",
                "& .MuiLinearProgress-bar": { backgroundColor: "#3b82f6" },
              }}
            />
          </Card>

          {/* Progress Groups */}
          <Box>
            {[
              { label: "Tailor Operations", keys: TAILOR_OP_KEYS },
              { label: "Pre-Stitcher Spill-overs", keys: PRE_STITCHER_OP_KEYS },
            ].map((group) => {
              const groupItems = progressUpdates.filter((item) =>
                group.keys.includes(item.option),
              );
              if (groupItems.length === 0) return null;

              return (
                <Card
                  key={group.label}
                  sx={{
                    p: 2,
                    mb: 3,
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                  }}
                >
                  <Typography
                    sx={{ fontSize: "14px", fontWeight: 700, mb: 2, color: "#111827" }}
                  >
                    {group.label}
                  </Typography>

                  {/* Smart quantity input(s) */}
                  {renderQuantityInputs(groupItems)}

                  {/* Per-op progress breakdown */}
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mb: 1, fontWeight: 600 }}
                  >
                    Breakdown:
                  </Typography>

                  <Stack spacing={2}>
                    {groupItems.map((item, idx) => {
                      const newCompleted =
                        item.currentCompleted + item.completedQuantity;
                      const percentage =
                        item.totalQuantity > 0
                          ? Math.round((newCompleted / item.totalQuantity) * 100)
                          : 0;

                      return (
                        <Box key={idx}>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              mb: 0.5,
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: "12px",
                                fontWeight: 600,
                                textTransform: "capitalize",
                              }}
                            >
                              {getOptionLabel(item.option)}
                            </Typography>
                            <Typography sx={{ fontSize: "11px", fontWeight: 700 }}>
                              {newCompleted}/{item.totalQuantity}
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={percentage}
                            sx={{
                              height: 6,
                              borderRadius: 3,
                              backgroundColor: "#e5e7eb",
                              "& .MuiLinearProgress-bar": {
                                backgroundColor:
                                  newCompleted === item.totalQuantity
                                    ? "#16a34a"
                                    : "#3b82f6",
                              },
                            }}
                          />
                        </Box>
                      );
                    })}
                  </Stack>
                </Card>
              );
            })}
          </Box>

          {/* Total Summary */}
          {getTotalCompleting() > 0 && (
            <Card sx={{ p: 2, bgcolor: "#fef3c7", border: "1px solid #fbbf24" }}>
              <Typography
                sx={{ fontSize: "13px", fontWeight: 700, color: "#92400e", mb: 1 }}
              >
                Total Completing This Update
              </Typography>
              <Typography sx={{ fontSize: "24px", fontWeight: 700, color: "#92400e" }}>
                {getTotalCompleting()}
              </Typography>
            </Card>
          )}

          {/* Previous Notes History */}
          {assignment?.progressEntries?.length > 0 && (
            <Box sx={{ mt: 1 }}>
              <Typography
                sx={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#374151",
                  mb: 1.5,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                Previous Notes History
                <Chip
                  label={assignment.progressEntries.length}
                  size="small"
                  sx={{ height: 20, fontSize: "11px", fontWeight: 700 }}
                />
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.5,
                  maxHeight: "200px",
                  overflowY: "auto",
                  pr: 1,
                  "::-webkit-scrollbar": { width: "6px" },
                  "::-webkit-scrollbar-thumb": {
                    backgroundColor: "#e5e7eb",
                    borderRadius: "3px",
                  },
                }}
              >
                {assignment.progressEntries
                  .slice()
                  .reverse()
                  .map((entry, index) => (
                    <Box
                      key={index}
                      sx={{
                        p: 1.5,
                        borderRadius: "8px",
                        bgcolor: "#f9fafb",
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: 0.5,
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Typography
                            sx={{ fontSize: "12px", fontWeight: 700, color: "#111827" }}
                          >
                            {entry.performedBy}
                          </Typography>
                          <Chip
                            label={`+${entry.completedQuantity}`}
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: "10px",
                              bgcolor: "#dcfce7",
                              color: "#16a34a",
                              fontWeight: 700,
                            }}
                          />
                        </Box>
                        <Typography sx={{ fontSize: "11px", color: "#6b7280" }}>
                          {new Date(entry.timestamp).toLocaleString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Typography>
                      </Box>
                      <Typography
                        sx={{
                          fontSize: "13px",
                          color: "#374151",
                          whiteSpace: "pre-wrap",
                          fontStyle: entry.notes ? "normal" : "italic",
                        }}
                      >
                        {entry.notes || "No notes provided"}
                      </Typography>
                    </Box>
                  ))}
              </Box>
              <Divider sx={{ my: 3 }} />
            </Box>
          )}

          {/* New Notes Input */}
          <TextField
            label="New Notes (Optional)"
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
        <CreateButton
          onClick={handleSubmit}
          disabled={submitting || getTotalCompleting() === 0}
        >
          {submitting ? "Updating..." : "Update Progress"}
        </CreateButton>
      </DialogActions>
    </Dialog>
  );
};

export default TailorAssignmentProgressModal;