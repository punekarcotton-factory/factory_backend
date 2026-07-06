import {
  Add,
  Assignment,
  CheckCircle,
  Checkroom,
  Close,
  Delete,
  ErrorOutline,
  ExpandLess,
  ExpandMore,
  Person,
  Warning,
  WorkOutline,
} from "@mui/icons-material";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  Checkbox,
  Chip,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  ListItemText,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { CreateButton, DialogCancelButton } from "../components/Styled";
import { showSnackbar } from "../Slice/snackbarSlice";
import axiosInstance from "../utils/axiosInstance";

const AVAILABLE_OPTIONS = [
  { key: "label", label: "Label" },
  { key: "flacket", label: "Flacket" },
  { key: "covering", label: "Covering" },
  { key: "pocket", label: "Pocket" },
  { key: "shoulder", label: "Shoulder" },
  { key: "chockPatti", label: "Chock Patti" },
];

const AssignPreStitcherModal = ({
  open,
  onClose,
  memoId,
  onAssignmentSuccess,
}) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [preStitchers, setPreStitchers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalShirts, setTotalShirts] = useState(0);
  const [memoItems, setMemoItems] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);

  // Current assignment being added
  const [selectedPreStitcher, setSelectedPreStitcher] = useState("");
  const [selectedOptions, setSelectedOptions] = useState([]); 
  const [quantityMode, setQuantityMode] = useState("all");
  const [customQuantity, setCustomQuantity] = useState(""); 

  // Mobile UI state
  const [showProgressDetails, setShowProgressDetails] = useState(false);
  const [showAssignmentsList, setShowAssignmentsList] = useState(true);

  // Confirmation dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [incompleteOptions, setIncompleteOptions] = useState([]);

  useEffect(() => {
    if (open && memoId) {
      fetchPreStitchers();
      fetchMemoDetails();
    }
  }, [open, memoId]);

  useEffect(() => {
    if (open) {
      validateAssignments();
    }
  }, [assignments, open]);

  const fetchPreStitchers = async () => {
    try {
      const response = await axiosInstance.get("/pre-stitchers");
      setPreStitchers(response.data.data || []);
    } catch (error) {
      console.error("fetchPreStitchers error", error);
    }
  };

  const fetchMemoDetails = async () => {
    try {
      const response = await axiosInstance.get(`/delivery-memos/${memoId}`);
      const items = response.data.data?.items || [];
      setMemoItems(items);
      const total = items.reduce(
        (sum, item) => sum + (item.shirtQuantity || 0),
        0,
      );
      setTotalShirts(total);
    } catch (error) {
      console.error("fetchMemoDetails error", error);
    }
  };

  const getRemainingQuantity = (optionKey) => {
    const assigned = assignments
      .filter((a) => a.option === optionKey)
      .reduce((sum, a) => sum + a.quantity, 0);
    return totalShirts - assigned;
  };

  const getAvailableOptions = () => {
    return AVAILABLE_OPTIONS.filter((opt) => getRemainingQuantity(opt.key) > 0);
  };

  const handleCustomQuantityChange = (value) => {
    setCustomQuantity(value);
  };

  const handleAddAssignment = () => {
    if (!selectedPreStitcher) {
      dispatch(
        showSnackbar({
          open: true,
          severity: "warning",
          message: "Please select a pre-stitcher",
        }),
      );
      return;
    }

    if (selectedOptions.length === 0) {
      dispatch(
        showSnackbar({
          open: true,
          severity: "warning",
          message: "Please select at least one operation",
        }),
      );
      return;
    }

    const preStitcher = preStitchers.find(
      (ps) => ps._id === selectedPreStitcher,
    );
    const newAssignments = [];

    for (const optionKey of selectedOptions) {
      const option = AVAILABLE_OPTIONS.find((o) => o.key === optionKey);
      const remaining = getRemainingQuantity(optionKey);

      let quantity;
      if (quantityMode === "all") {
        quantity = remaining;
      } else {
        quantity = parseInt(customQuantity) || 0;
      }

      if (quantity <= 0) {
        dispatch(
          showSnackbar({
            open: true,
            severity: "error",
            message: `Quantity for ${option.label} must be greater than 0`,
          }),
        );
        return;
      }

      if (quantity > remaining) {
        dispatch(
          showSnackbar({
            open: true,
            severity: "error",
            message: `Only ${remaining} shirts remaining for ${option.label}`,
          }),
        );
        return;
      }

      newAssignments.push({
        id: Date.now() + Math.random(), 
        preStitcherId: selectedPreStitcher,
        preStitcherName: `${preStitcher.firstName} ${preStitcher.lastName}`,
        option: optionKey,
        optionLabel: option.label,
        quantity: quantity,
      });
    }

    setAssignments([...assignments, ...newAssignments]);

    // Reset form
    setSelectedPreStitcher("");
    setSelectedOptions([]);
    setQuantityMode("all");
    setCustomQuantity("");

    if (isMobile) {
      setShowAssignmentsList(true);
    }

    dispatch(
      showSnackbar({
        open: true,
        severity: "success",
        message: `${newAssignments.length} assignment${newAssignments.length > 1 ? "s" : ""} added successfully`,
      }),
    );
  };

  const handleRemoveAssignment = (id) => {
    setAssignments(assignments.filter((a) => a.id !== id));
    dispatch(
      showSnackbar({
        open: true,
        severity: "info",
        message: "Assignment removed",
      }),
    );
  };

  const groupAssignmentsByPreStitcher = () => {
    const grouped = {};
    assignments.forEach((assignment) => {
      if (!grouped[assignment.preStitcherId]) {
        grouped[assignment.preStitcherId] = {
          preStitcherName: assignment.preStitcherName,
          options: [],
        };
      }
      grouped[assignment.preStitcherId].options.push({
        option: assignment.option,
        optionLabel: assignment.optionLabel,
        quantity: assignment.quantity,
      });
    });
    return grouped;
  };

  const validateAssignments = () => {
    const errors = [];
    const unassignedOptions = AVAILABLE_OPTIONS.filter(
      (opt) => getRemainingQuantity(opt.key) > 0,
    );

    if (unassignedOptions.length > 0 && assignments.length > 0) {
      unassignedOptions.forEach((opt) => {
        const remaining = getRemainingQuantity(opt.key);
        errors.push(`${opt.label}: ${remaining} shirts not assigned yet`);
      });
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  // Compute the maximum total assigned for any single operation.
  // This is the number of shirts that would go into the child memo on a partial split.
  const getMaxOptionTotal = () => {
    const totals = {};
    assignments.forEach((a) => {
      totals[a.option] = (totals[a.option] || 0) + a.quantity;
    });
    return Object.values(totals).length > 0
      ? Math.max(...Object.values(totals))
      : 0;
  };

  const handleSubmitClick = () => {
    if (assignments.length === 0) {
      dispatch(
        showSnackbar({
          open: true,
          severity: "warning",
          message: "Please add at least one assignment",
        }),
      );
      return;
    }

    const maxOptionTotal = getMaxOptionTotal();
    const isPartial = maxOptionTotal < totalShirts;

    if (isPartial) {
      // Partial split — skip the "incomplete options" dialog, submit directly.
      // The parent memo will retain the remaining shirts.
      handleSubmit();
      return;
    }

    // Full or mixed assignment — existing behaviour unchanged.
    const incomplete = AVAILABLE_OPTIONS.filter(
      (opt) => getRemainingQuantity(opt.key) > 0,
    );

    if (incomplete.length > 0) {
      setIncompleteOptions(incomplete);
      setShowConfirmDialog(true);
    } else {
      handleSubmit();
    }
  };

  /**
   * Builds the payloadItems array needed for the partial-split endpoint.
   * Distributes the `splitQuantity` across items proportionally, and
   * within each item distributes across SKUs proportionally.
   */
  const buildPartialPayloadItems = (splitQuantity) => {
    if (!memoItems || memoItems.length === 0 || totalShirts === 0) return [];

    const ratio = splitQuantity / totalShirts;
    let totalAllocated = 0;

    const items = memoItems
      .filter(
        (item) =>
          item.shirtSKUs &&
          item.shirtSKUs.length > 0 &&
          (item.shirtQuantity || 0) > 0,
      )
      .map((item, itemIdx, arr) => {
        const itemShirts = item.shirtQuantity || 0;
        const isLastItem = itemIdx === arr.length - 1;

        // For the last item, give it the exact remaining shirts to avoid rounding drift.
        const itemSplitTarget = isLastItem
          ? Math.min(splitQuantity - totalAllocated, itemShirts)
          : Math.min(Math.round(itemShirts * ratio), itemShirts);

        if (itemSplitTarget <= 0) return null;
        totalAllocated += itemSplitTarget;

        // Distribute itemSplitTarget across the item's SKUs proportionally.
        let skuAllocated = 0;
        const partialShirtSKUs = item.shirtSKUs
          .map((skuObj, skuIdx, skuArr) => {
            const isLastSku = skuIdx === skuArr.length - 1;
            const skuQty = isLastSku
              ? Math.min(itemSplitTarget - skuAllocated, skuObj.quantity)
              : Math.min(
                  Math.round(skuObj.quantity * (itemSplitTarget / itemShirts)),
                  skuObj.quantity,
                );
            skuAllocated += skuQty;
            return { sku: skuObj.sku, quantity: skuQty };
          })
          .filter((s) => s.quantity > 0);

        if (partialShirtSKUs.length === 0) return null;
        return { itemId: item._id, partialShirtSKUs };
      })
      .filter(Boolean);

    return items;
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setShowConfirmDialog(false);

      const grouped = groupAssignmentsByPreStitcher();
      const apiAssignments = Object.entries(grouped).map(
        ([preStitcherId, data]) => ({
          preStitcherId,
          options: data.options.map((opt) => ({
            option: opt.option,
            quantity: opt.quantity,
          })),
        }),
      );

      const maxOptionTotal = getMaxOptionTotal();
      const isPartial = maxOptionTotal < totalShirts;

      if (isPartial) {
        // ── PARTIAL SPLIT PATH ────────────────────────────────────────────
        // Build per-item, per-SKU split payload and call the new endpoint.
        // The backend creates a child memo (goes to In Progress) and keeps
        // the parent memo (stays in Pending Assignment) with remaining qty.
        const payloadItems = buildPartialPayloadItems(maxOptionTotal);

        if (payloadItems.length === 0) {
          dispatch(
            showSnackbar({
              open: true,
              severity: "error",
              message: "Could not compute a valid partial split. Please check quantities.",
            }),
          );
          return;
        }

        await axiosInstance.post(
          `/pre-stitchers/memos/${memoId}/partial-assign-and-assign`,
          {
            items: payloadItems,
            assignments: apiAssignments,
            performedBy: "ADMIN",
          },
        );

        dispatch(
          showSnackbar({
            open: true,
            severity: "success",
            message: `${maxOptionTotal} shirts moved to In Progress. ${totalShirts - maxOptionTotal} shirt(s) remain in Pending Assignment.`,
          }),
        );
      } else {
        // ── FULL ASSIGNMENT PATH (existing, unchanged) ────────────────────
        await axiosInstance.post("/pre-stitchers/assign-multiple", {
          deliveryMemoId: memoId,
          assignments: apiAssignments,
          performedBy: "ADMIN",
        });

        dispatch(
          showSnackbar({
            open: true,
            severity: "success",
            message: "Pre-stitchers assigned successfully!",
          }),
        );
      }

      onAssignmentSuccess();
      handleClose();
    } catch (error) {
      console.error("Assignment error", error);
      dispatch(
        showSnackbar({
          open: true,
          severity: "error",
          message:
            error.response?.data?.message || "Failed to assign pre-stitchers",
        }),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAssignments([]);
    setSelectedPreStitcher("");
    setSelectedOptions([]);
    setQuantityMode("all");
    setCustomQuantity("");
    setValidationErrors([]);
    setShowConfirmDialog(false);
    onClose();
  };

  const allOptionsAssigned = AVAILABLE_OPTIONS.every(
    (opt) => getRemainingQuantity(opt.key) === 0,
  );

  const totalAssignedCount = assignments.length;
  const uniquePreStitchers = new Set(assignments.map((a) => a.preStitcherId))
    .size;

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="lg"
        fullWidth
        fullScreen={isSmallMobile}
        PaperProps={{
          sx: {
            borderRadius: isSmallMobile ? 0 : 3,
            maxHeight: isSmallMobile ? "100vh" : "90vh",
            m: isSmallMobile ? 0 : 2,
          },
        }}
      >
        <DialogTitle
          sx={{
            pb: 2,
            borderBottom: "2px solid #e5e7eb",
            position: "sticky",
            top: 0,
            backgroundColor: "#fff",
            zIndex: 10,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: { xs: 1.5, sm: 2 },
            }}
          >
            <Avatar
              sx={{
                backgroundColor: "#667eea",
                width: { xs: 40, sm: 48 },
                height: { xs: 40, sm: 48 },
              }}
            >
              <Assignment sx={{ fontSize: { xs: 20, sm: 24 } }} />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  mb: 0.5,
                  fontSize: { xs: "16px", sm: "20px" },
                }}
              >
                Assign Pre-Stitchers
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  gap: { xs: 0.5, sm: 1.5 },
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <Chip
                  icon={<Checkroom sx={{ fontSize: 14 }} />}
                  label={`${totalShirts} shirts`}
                  size="small"
                  sx={{
                    backgroundColor: "#dbeafe",
                    color: "#1e40af",
                    fontWeight: 600,
                    fontSize: { xs: "10px", sm: "11px" },
                    height: { xs: 22, sm: 24 },
                  }}
                />
                {totalAssignedCount > 0 && (
                  <Chip
                    icon={<CheckCircle sx={{ fontSize: 14 }} />}
                    label={`${totalAssignedCount} assignments`}
                    size="small"
                    sx={{
                      backgroundColor: "#dcfce7",
                      color: "#166534",
                      fontWeight: 600,
                      fontSize: { xs: "10px", sm: "11px" },
                      height: { xs: 22, sm: 24 },
                    }}
                  />
                )}
                {uniquePreStitchers > 0 && (
                  <Chip
                    icon={<Person sx={{ fontSize: 14 }} />}
                    label={`${uniquePreStitchers} workers`}
                    size="small"
                    sx={{
                      backgroundColor: "#fef3c7",
                      color: "#92400e",
                      fontWeight: 600,
                      fontSize: { xs: "10px", sm: "11px" },
                      height: { xs: 22, sm: 24 },
                    }}
                  />
                )}
              </Box>

              {/* SKU Breakdown */}
              {memoItems.length > 0 && (
                <Box
                  sx={{
                    mt: 1.5,
                    p: 1.5,
                    backgroundColor: "#f9fafb",
                    borderRadius: 2,
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "11px",
                      color: "#6b7280",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      mb: 1,
                    }}
                  >
                    SKU Breakdown
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    {memoItems.map((item, itemIdx) => 
                      (item.shirtSKUs || []).map((skuObj, skuIdx) => (
                        <Chip
                          key={`${itemIdx}-${skuIdx}`}
                          label={`${skuObj.sku}: ${skuObj.quantity}`}
                          size="small"
                          variant="outlined"
                          sx={{
                            borderColor: "#cbd5e1",
                            color: "#334155",
                            fontSize: "11px",
                            fontWeight: 500,
                            height: 24,
                            backgroundColor: "#ffffff"
                          }}
                        />
                      ))
                    )}
                  </Box>
                </Box>
              )}
            </Box>
          </Box>
          <IconButton
            onClick={handleClose}
            sx={{
              position: "absolute",
              right: { xs: 8, sm: 12 },
              top: { xs: 8, sm: 12 },
              backgroundColor: "#f3f4f6",
              "&:hover": { backgroundColor: "#e5e7eb" },
            }}
          >
            <Close fontSize={isSmallMobile ? "small" : "medium"} />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 2, px: { xs: 2, sm: 3 }, pb: 3 }}>
          <Box
            sx={{
              display: "flex",
              gap: 3,
              flexDirection: { xs: "column", md: "row" },
            }}
          >
            <Box sx={{ flex: 1, order: { xs: 1, md: 1 } }}>
              <Card
                sx={{
                  p: { xs: 2, sm: 3 },
                  backgroundColor: "#ffffff",
                  borderRadius: 2,
                  border: "2px solid #667eea",
                  height: "fit-content",
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 700,
                    mb: 2,
                    color: "#667eea",
                    fontSize: { xs: "15px", sm: "16px" },
                  }}
                >
                  Add New Assignment
                </Typography>

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel id="prestitcher-select-label">Select Pre-Stitcher</InputLabel>
                  <Select
                    labelId="prestitcher-select-label"
                    id="prestitcher-select"
                    value={selectedPreStitcher}
                    label="Select Pre-Stitcher"
                    onChange={(e) => setSelectedPreStitcher(e.target.value)}
                    size={isSmallMobile ? "small" : "medium"}
                  >
                    {preStitchers.map((ps) => (
                      <MenuItem key={ps._id} value={ps._id}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                          }}
                        >
                          <Avatar
                            sx={{
                              width: 28,
                              height: 28,
                              fontSize: 12,
                              backgroundColor: "#667eea",
                            }}
                          >
                            {ps.firstName.charAt(0)}
                          </Avatar>
                          <Typography
                            sx={{
                              fontWeight: 500,
                              fontSize: { xs: 13, sm: 14 },
                            }}
                          >
                            {ps.firstName} {ps.lastName}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel id="pre-ops-select-label">Select Operations (Multiple)</InputLabel>
                  <Select
                    labelId="pre-ops-select-label"
                    id="pre-ops-select"
                    multiple
                    value={selectedOptions}
                    label="Select Operations (Multiple)"
                    onChange={(e) => setSelectedOptions(e.target.value)}
                    disabled={getAvailableOptions().length === 0}
                    size={isSmallMobile ? "small" : "medium"}
                    renderValue={(selected) =>
                      selected
                        .map(
                          (key) =>
                            AVAILABLE_OPTIONS.find((o) => o.key === key)?.label,
                        )
                        .join(", ")
                    }
                  >
                    {getAvailableOptions().map((opt) => {
                      const remaining = getRemainingQuantity(opt.key);
                      return (
                        <MenuItem key={opt.key} value={opt.key}>
                          <Checkbox
                            checked={selectedOptions.indexOf(opt.key) > -1}
                          />
                          <ListItemText
                            primary={
                              <Box
                                sx={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  width: "100%",
                                  gap: 1,
                                }}
                              >
                                <Typography
                                  sx={{
                                    fontWeight: 500,
                                    fontSize: { xs: 13, sm: 14 },
                                  }}
                                >
                                  {opt.label}
                                </Typography>
                                <Chip
                                  label={`${remaining}/${totalShirts}`}
                                  size="small"
                                  sx={{
                                    backgroundColor: "#f0f9ff",
                                    color: "#0369a1",
                                    fontWeight: 600,
                                    fontSize: { xs: 9, sm: 10 },
                                    height: { xs: 18, sm: 20 },
                                  }}
                                />
                              </Box>
                            }
                          />
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>

                {selectedOptions.length > 0 && (
                  <Box
                    sx={{
                      p: { xs: 1.5, sm: 2 },
                      backgroundColor: "#f9fafb",
                      borderRadius: 2,
                      border: "1px solid #e5e7eb",
                      mb: 2,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        mb: 1.5,
                        fontSize: { xs: 13, sm: 14 },
                      }}
                    >
                      Assign Quantity:
                    </Typography>
                    <RadioGroup
                      value={quantityMode}
                      onChange={(e) => {
                        setQuantityMode(e.target.value);
                        if (e.target.value === "all") {
                          setCustomQuantity("");
                        }
                      }}
                    >
                      <FormControlLabel
                        value="all"
                        control={<Radio size="small" />}
                        label={
                          <Typography
                            variant="body2"
                            sx={{ fontSize: { xs: 13, sm: 14 } }}
                          >
                            All Remaining for Each Operation
                          </Typography>
                        }
                      />
                      <FormControlLabel
                        value="custom"
                        control={<Radio size="small" />}
                        label={
                          <Typography
                            variant="body2"
                            sx={{ fontSize: { xs: 13, sm: 14 } }}
                          >
                            Custom Count for Each
                          </Typography>
                        }
                      />
                    </RadioGroup>

                    {quantityMode === "custom" && (
                      <Box sx={{ mt: 2 }}>
                        {(() => {
                          const minRemaining = Math.min(
                            ...selectedOptions.map((k) =>
                              getRemainingQuantity(k),
                            ),
                          );
                          return (
                            <>
                              <Typography
                                variant="caption"
                                sx={{
                                  fontWeight: 600,
                                  fontSize: 11,
                                  color: "#6b7280",
                                  display: "block",
                                  mb: 1,
                                }}
                              >
                                This quantity will apply to all selected operations:
                              </Typography>
                              <TextField
                                fullWidth
                                size="small"
                                type="number"
                                placeholder={`Max allowable: ${minRemaining}`}
                                value={customQuantity}
                                onChange={(e) =>
                                  handleCustomQuantityChange(e.target.value)
                                }
                                InputProps={{
                                  inputProps: { min: 1, max: minRemaining },
                                }}
                                helperText={
                                  selectedOptions.length > 0
                                    ? `Applied to ${selectedOptions.length} operation(s).`
                                    : ""
                                }
                              />
                            </>
                          );
                        })()}
                      </Box>
                    )}
                  </Box>
                )}

                {/* Add Button */}
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<Add />}
                  onClick={handleAddAssignment}
                  disabled={
                    !selectedPreStitcher || selectedOptions.length === 0
                  }
                  sx={{
                    backgroundColor: "#667eea",
                    fontWeight: 600,
                    py: { xs: 1.1, sm: 1.3 },
                    fontSize: { xs: "14px", sm: "15px" },
                    "&:hover": {
                      backgroundColor: "#5568d3",
                    },
                    "&:disabled": {
                      backgroundColor: "#e5e7eb",
                      color: "#9ca3af",
                    },
                  }}
                >
                  Add{" "}
                  {selectedOptions.length > 0
                    ? `${selectedOptions.length} `
                    : ""}
                  Assignment{selectedOptions.length > 1 ? "s" : ""}
                </Button>
              </Card>

              <Card
                sx={{
                  mt: 2,
                  backgroundColor: allOptionsAssigned ? "#dcfce7" : "#fef3c7",
                  borderRadius: 2,
                  border: allOptionsAssigned
                    ? "2px solid #16a34a"
                    : "2px solid #f59e0b",
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    p: { xs: 1.5, sm: 2 },
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: isMobile ? "pointer" : "default",
                  }}
                  onClick={() =>
                    isMobile && setShowProgressDetails(!showProgressDetails)
                  }
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    {allOptionsAssigned ? (
                      <CheckCircle
                        sx={{ color: "#16a34a", fontSize: { xs: 20, sm: 24 } }}
                      />
                    ) : (
                      <ErrorOutline
                        sx={{ color: "#f59e0b", fontSize: { xs: 20, sm: 24 } }}
                      />
                    )}
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 700,
                        color: allOptionsAssigned ? "#166534" : "#92400e",
                        fontSize: { xs: 13, sm: 14 },
                      }}
                    >
                      {allOptionsAssigned
                        ? "All operations assigned!"
                        : "Assignment Progress"}
                    </Typography>
                  </Box>
                  {isMobile && (
                    <IconButton size="small">
                      {showProgressDetails ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                  )}
                </Box>

                <Collapse in={!isMobile || showProgressDetails}>
                  <Box sx={{ px: { xs: 1.5, sm: 2 }, pb: { xs: 1.5, sm: 2 } }}>
                    <Stack spacing={1.5}>
                      {AVAILABLE_OPTIONS.map((opt) => {
                        const remaining = getRemainingQuantity(opt.key);
                        const assigned = totalShirts - remaining;
                        const percentage = (assigned / totalShirts) * 100;

                        return (
                          <Box key={opt.key}>
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                mb: 0.5,
                                alignItems: "center",
                              }}
                            >
                              <Typography
                                variant="caption"
                                sx={{
                                  fontWeight: 600,
                                  fontSize: { xs: 11, sm: 12 },
                                }}
                              >
                                {opt.label}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{
                                  fontWeight: 700,
                                  fontSize: { xs: 11, sm: 12 },
                                  color:
                                    remaining === 0 ? "#16a34a" : "#f59e0b",
                                }}
                              >
                                {assigned}/{totalShirts}
                              </Typography>
                            </Box>
                            <Box
                              sx={{
                                height: 6,
                                backgroundColor: "#e5e7eb",
                                borderRadius: 3,
                                overflow: "hidden",
                              }}
                            >
                              <Box
                                sx={{
                                  height: "100%",
                                  width: `${percentage}%`,
                                  backgroundColor:
                                    remaining === 0 ? "#16a34a" : "#3b82f6",
                                  transition: "width 0.3s ease",
                                }}
                              />
                            </Box>
                          </Box>
                        );
                      })}
                    </Stack>
                  </Box>
                </Collapse>
              </Card>
            </Box>

            <Box sx={{ flex: 1.5, order: { xs: 2, md: 2 } }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                  cursor: isMobile ? "pointer" : "default",
                }}
                onClick={() =>
                  isMobile && setShowAssignmentsList(!showAssignmentsList)
                }
              >
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 700,
                    fontSize: { xs: 15, sm: 16 },
                  }}
                >
                  Current Assignments ({assignments.length})
                </Typography>
                {isMobile && assignments.length > 0 && (
                  <IconButton size="small">
                    {showAssignmentsList ? <ExpandLess /> : <ExpandMore />}
                  </IconButton>
                )}
              </Box>

              <Collapse in={!isMobile || showAssignmentsList}>
                {assignments.length === 0 ? (
                  <Card
                    sx={{
                      p: { xs: 3, sm: 4 },
                      textAlign: "center",
                      backgroundColor: "#f9fafb",
                      border: "2px dashed #d1d5db",
                      borderRadius: 2,
                    }}
                  >
                    <WorkOutline
                      sx={{ fontSize: 48, color: "#9ca3af", mb: 1 }}
                    />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: { xs: 13, sm: 14 } }}
                    >
                      No assignments added yet. Start by selecting a
                      pre-stitcher and operations.
                    </Typography>
                  </Card>
                ) : (
                  <>
                    {!isMobile ? (
                      <TableContainer
                        component={Paper}
                        sx={{ borderRadius: 2, border: "1px solid #e5e7eb" }}
                      >
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ backgroundColor: "#f9fafb" }}>
                              <TableCell
                                sx={{ fontWeight: 700, fontSize: "12px" }}
                              >
                                Pre-Stitcher
                              </TableCell>
                              <TableCell
                                sx={{ fontWeight: 700, fontSize: "12px" }}
                              >
                                Operation
                              </TableCell>
                              <TableCell
                                align="right"
                                sx={{ fontWeight: 700, fontSize: "12px" }}
                              >
                                Quantity
                              </TableCell>
                              <TableCell
                                align="center"
                                sx={{
                                  fontWeight: 700,
                                  fontSize: "12px",
                                  width: 70,
                                }}
                              >
                                Action
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {assignments.map((assignment) => (
                              <TableRow key={assignment.id} hover>
                                <TableCell>
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 1,
                                    }}
                                  >
                                    <Avatar
                                      sx={{
                                        width: 24,
                                        height: 24,
                                        fontSize: 11,
                                        backgroundColor: "#667eea",
                                      }}
                                    >
                                      {assignment.preStitcherName.charAt(0)}
                                    </Avatar>
                                    <Typography
                                      variant="body2"
                                      sx={{ fontWeight: 600, fontSize: 13 }}
                                    >
                                      {assignment.preStitcherName}
                                    </Typography>
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={assignment.optionLabel}
                                    size="small"
                                    sx={{
                                      backgroundColor: "#e0e7ff",
                                      color: "#4338ca",
                                      fontWeight: 600,
                                      fontSize: 11,
                                    }}
                                  />
                                </TableCell>
                                <TableCell align="right">
                                  <Typography
                                    variant="body2"
                                    sx={{ fontWeight: 700, fontSize: 13 }}
                                  >
                                    {assignment.quantity}
                                  </Typography>
                                </TableCell>
                                <TableCell align="center">
                                  <IconButton
                                    size="small"
                                    onClick={() =>
                                      handleRemoveAssignment(assignment.id)
                                    }
                                    sx={{
                                      color: "#dc2626",
                                      "&:hover": {
                                        backgroundColor: "#fee2e2",
                                      },
                                    }}
                                  >
                                    <Delete fontSize="small" />
                                  </IconButton>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Stack spacing={1.5}>
                        {assignments.map((assignment) => (
                          <Card
                            key={assignment.id}
                            sx={{
                              border: "1px solid #e5e7eb",
                              borderRadius: 2,
                              transition: "box-shadow 0.2s",
                              "&:hover": {
                                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                              },
                            }}
                          >
                            <Box sx={{ p: 1.5 }}>
                              <Box
                                sx={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "flex-start",
                                  mb: 1,
                                }}
                              >
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                    flex: 1,
                                  }}
                                >
                                  <Avatar
                                    sx={{
                                      width: 32,
                                      height: 32,
                                      fontSize: 13,
                                      backgroundColor: "#667eea",
                                    }}
                                  >
                                    {assignment.preStitcherName.charAt(0)}
                                  </Avatar>
                                  <Box>
                                    <Typography
                                      variant="body2"
                                      sx={{ fontWeight: 600, fontSize: 14 }}
                                    >
                                      {assignment.preStitcherName}
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        color: "#4338ca",
                                        fontWeight: 600,
                                        fontSize: 12,
                                      }}
                                    >
                                      {assignment.optionLabel}
                                    </Typography>
                                  </Box>
                                </Box>
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                  }}
                                >
                                  <Chip
                                    label={`${assignment.quantity} shirts`}
                                    size="small"
                                    sx={{
                                      backgroundColor: "#dcfce7",
                                      color: "#166534",
                                      fontWeight: 700,
                                      fontSize: 11,
                                      height: 22,
                                    }}
                                  />
                                  <IconButton
                                    size="small"
                                    onClick={() =>
                                      handleRemoveAssignment(assignment.id)
                                    }
                                    sx={{
                                      color: "#dc2626",
                                      "&:hover": {
                                        backgroundColor: "#fee2e2",
                                      },
                                    }}
                                  >
                                    <Delete fontSize="small" />
                                  </IconButton>
                                </Box>
                              </Box>
                            </Box>
                          </Card>
                        ))}
                      </Stack>
                    )}

                    <Card
                      sx={{
                        mt: 2,
                        p: { xs: 1.5, sm: 2 },
                        backgroundColor: "#f9fafb",
                        borderRadius: 2,
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: 700,
                          mb: 1.5,
                          fontSize: { xs: 13, sm: 14 },
                        }}
                      >
                        Summary by Pre-Stitcher:
                      </Typography>
                      <Stack spacing={1.5}>
                        {Object.entries(groupAssignmentsByPreStitcher()).map(
                          ([preStitcherId, data]) => (
                            <Box key={preStitcherId}>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 600,
                                  mb: 0.5,
                                  fontSize: { xs: 13, sm: 14 },
                                }}
                              >
                                {data.preStitcherName}
                              </Typography>
                              <Stack
                                direction="row"
                                spacing={0.5}
                                flexWrap="wrap"
                                useFlexGap
                              >
                                {data.options.map((opt, idx) => (
                                  <Chip
                                    key={idx}
                                    label={`${opt.optionLabel}: ${opt.quantity}`}
                                    size="small"
                                    sx={{
                                      backgroundColor: "#dbeafe",
                                      color: "#1e40af",
                                      fontWeight: 600,
                                      fontSize: { xs: 10, sm: 11 },
                                      height: { xs: 20, sm: 22 },
                                    }}
                                  />
                                ))}
                              </Stack>
                            </Box>
                          ),
                        )}
                      </Stack>
                    </Card>
                  </>
                )}
              </Collapse>
            </Box>
          </Box>
        </DialogContent>

        <Divider />

        <DialogActions
          sx={{
            p: { xs: 2, sm: 3 },
            gap: { xs: 1, sm: 2 },
            backgroundColor: "#f9fafb",
            position: "sticky",
            bottom: 0,
            flexDirection: { xs: "column", sm: "row" },
          }}
        >
          <DialogCancelButton
            onClick={handleClose}
            fullWidth={isSmallMobile}
            sx={{ order: { xs: 2, sm: 1 } }}
          >
            Cancel
          </DialogCancelButton>
          <CreateButton
            onClick={handleSubmitClick}
            disabled={loading || assignments.length === 0}
            fullWidth={isSmallMobile}
            sx={{ order: { xs: 1, sm: 2 } }}
          >
            {loading
              ? "Assigning..."
              : `Confirm ${assignments.length} Assignment${assignments.length !== 1 ? "s" : ""}`}
          </CreateButton>
        </DialogActions>
      </Dialog>

      <Dialog
        open={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar sx={{ backgroundColor: "#fbbf24", width: 40, height: 40 }}>
              <Warning />
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Incomplete Assignments
            </Typography>
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2 }}>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Operations that are not fully assigned here will be moved to the Tailor stage. Do you want to continue?
          </Alert>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
            Unassigned Operations:
          </Typography>
          <Stack spacing={1}>
            {incompleteOptions.map((opt) => {
              const remaining = getRemainingQuantity(opt.key);
              return (
                <Box
                  key={opt.key}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    p: 1.5,
                    backgroundColor: "#fef3c7",
                    borderRadius: 1,
                    border: "1px solid #fbbf24",
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {opt.label}
                  </Typography>
                  <Chip
                    label={`${remaining} shirts remaining`}
                    size="small"
                    sx={{
                      backgroundColor: "#fff",
                      color: "#92400e",
                      fontWeight: 600,
                      fontSize: 11,
                    }}
                  />
                </Box>
              );
            })}
          </Stack>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <DialogCancelButton onClick={() => setShowConfirmDialog(false)}>
            Go Back
          </DialogCancelButton>
          <CreateButton onClick={handleSubmit} disabled={loading}>
            {loading ? "Assigning..." : "Continue Anyway"}
          </CreateButton>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AssignPreStitcherModal;
