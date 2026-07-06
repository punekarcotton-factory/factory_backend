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
  FormHelperText,
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
import { useDispatch, useSelector } from "react-redux";
import { CreateButton, DialogCancelButton } from "../components/Styled";
import { showSnackbar } from "../Slice/snackbarSlice";
import axiosInstance from "../utils/axiosInstance";


const TAILOR_OP_KEYS = ["cuff", "ghera", "collar"];
const PRE_STITCHER_OP_KEYS = [
  "label",
  "flacket",
  "covering",
  "pocket",
  "shoulder",
  "chockPatti",
];


const groupKeysByRemaining = (keys, remainingFn) => {
  const map = {};
  keys.forEach((k) => {
    const r = remainingFn(k);
    if (!map[r]) map[r] = [];
    map[r].push(k);
  });
  return Object.entries(map).map(([qty, ks]) => ({
    qty: Number(qty),
    keys: ks,
  }));
};

// ─────────────────────────────────────────────────────────────────────────────

const AssignMultipleTailorsModal = ({ open, onClose, memo, onSuccess }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { user } = useSelector((state) => state.auth);

  const [tailors, setTailors] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [availableOptions, setAvailableOptions] = useState([]);
  const [totalShirts, setTotalShirts] = useState(0);

  const [selectedTailor, setSelectedTailor] = useState("");
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [quantityMode, setQuantityMode] = useState("all");

  const [customQtyMap, setCustomQtyMap] = useState({});

  const [showProgressDetails, setShowProgressDetails] = useState(false);
  const [showAssignmentsList, setShowAssignmentsList] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [incompleteOptions, setIncompleteOptions] = useState([]);

  useEffect(() => {
    if (open && memo) {
      fetchTailors();
      fetchAvailableOptions();
      fetchMemoDetails();
    }
  }, [open, memo]);

  const fetchAvailableOptions = async () => {
    try {
      const response = await axiosInstance.get(
        `/assign-tailor/options?memoId=${memo._id}`,
      );
      setAvailableOptions(response.data.data || []);
    } catch (error) {
      console.error("fetchAvailableOptions error", error);
      dispatch(
        showSnackbar({
          open: true,
          severity: "error",
          message: "Failed to fetch available operations",
        }),
      );
    }
  };

  const fetchTailors = async () => {
    try {
      const response = await axiosInstance.get(
        "/assign-tailor/tailors/statistics",
      );
      setTailors(response.data.data || []);
    } catch (error) {
      console.error("fetchTailors error", error);
    }
  };

  const fetchMemoDetails = () => {
    if (!memo) return;
    const items = memo.items || [];
    const total = items.reduce(
      (sum, item) => sum + (item.shirtQuantity || 0),
      0,
    );
    setTotalShirts(total);
  };

  const getRemainingQuantity = (optionKey) => {
    const backendOption = availableOptions.find((o) => o.key === optionKey);
    const initialRemaining = backendOption
      ? backendOption.remaining
      : totalShirts;

    const currentlyAssignedInModal = assignments
      .filter((a) => a.option === optionKey)
      .reduce((sum, a) => sum + a.quantity, 0);

    return initialRemaining - currentlyAssignedInModal;
  };

  const getAvailableOptions = () =>
    availableOptions.filter((opt) => getRemainingQuantity(opt.key) > 0);

  const getAvailableTailorOptions = () =>
    availableOptions.filter(
      (opt) =>
        TAILOR_OP_KEYS.includes(opt.key) &&
        getRemainingQuantity(opt.key) > 0,
    );

  const getAvailablePreStitcherOptions = () =>
    availableOptions.filter(
      (opt) =>
        PRE_STITCHER_OP_KEYS.includes(opt.key) &&
        getRemainingQuantity(opt.key) > 0,
    );

 
  const getQtyBuckets = (groupKeys) => {
    const selected = selectedOptions.filter((k) => groupKeys.includes(k));
    if (selected.length === 0) return [];
    return groupKeysByRemaining(selected, getRemainingQuantity);
  };

  const tailorBuckets = getQtyBuckets(TAILOR_OP_KEYS);
  const preStitcherBuckets = getQtyBuckets(PRE_STITCHER_OP_KEYS);

  
  const bucketMapKey = (bucket, groupPrefix) =>
    bucket.keys.length === 1 ? bucket.keys[0] : `__${groupPrefix}_${bucket.keys[0]}__`;

 
  const resolveCustomQty = (optionKey) => {
    const isTailor = TAILOR_OP_KEYS.includes(optionKey);
    const buckets = isTailor ? tailorBuckets : preStitcherBuckets;
    const groupPrefix = isTailor ? "tailor" : "pre";
    const bucket = buckets.find((b) => b.keys.includes(optionKey));
    if (!bucket) return 0;
    const mapKey = bucketMapKey(bucket, groupPrefix);
    return parseInt(customQtyMap[mapKey]) || 0;
  };

  // Validate all selected ops in custom mode
  const hasCustomQtyError =
    quantityMode === "custom" &&
    selectedOptions.some((k) => {
      const val = resolveCustomQty(k);
      const max = getRemainingQuantity(k);
      return val <= 0 || val > max;
    });

  const isCustomQtyInvalid =
    quantityMode === "custom" &&
    (selectedOptions.length === 0 ||
      hasCustomQtyError ||
      selectedOptions.some((k) => !resolveCustomQty(k)));

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleAddAssignment = () => {
    if (!selectedTailor) {
      dispatch(
        showSnackbar({
          open: true,
          severity: "warning",
          message: "Please select a tailor",
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

    const tailor = tailors.find((t) => t._id === selectedTailor);
    const newAssignments = [];

    for (const optionKey of selectedOptions) {
      const option = availableOptions.find((o) => o.key === optionKey);
      const remaining = getRemainingQuantity(optionKey);

      let quantity;
      if (quantityMode === "all") {
        quantity = remaining;
      } else {
        quantity = resolveCustomQty(optionKey);
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
        tailorId: selectedTailor,
        tailorName: tailor.name,
        tailorPhone: tailor.phoneNumber,
        option: optionKey,
        optionLabel: option.label,
        quantity,
      });
    }

    setAssignments([...assignments, ...newAssignments]);
    resetForm();

    if (isMobile) setShowAssignmentsList(true);

    dispatch(
      showSnackbar({
        open: true,
        severity: "success",
        message: `${newAssignments.length} assignment${newAssignments.length > 1 ? "s" : ""} added successfully`,
      }),
    );
  };

  const resetForm = () => {
    setSelectedTailor("");
    setSelectedOptions([]);
    setQuantityMode("all");
    setCustomQtyMap({});
  };

  const handleRemoveAssignment = (id) => {
    setAssignments(assignments.filter((a) => a.id !== id));
    dispatch(
      showSnackbar({ open: true, severity: "info", message: "Assignment removed" }),
    );
  };

  const groupAssignmentsByTailor = () => {
    const grouped = {};
    assignments.forEach((assignment) => {
      if (!grouped[assignment.tailorId]) {
        grouped[assignment.tailorId] = {
          tailorName: assignment.tailorName,
          tailorPhone: assignment.tailorPhone,
          options: [],
        };
      }
      grouped[assignment.tailorId].options.push({
        option: assignment.option,
        optionLabel: assignment.optionLabel,
        quantity: assignment.quantity,
      });
    });
    return grouped;
  };

  const getMaxOptionTotal = () => {
    const totals = {};
    assignments.forEach((a) => {
      totals[a.option] = (totals[a.option] || 0) + a.quantity;
    });
    return Object.values(totals).length > 0
      ? Math.max(...Object.values(totals))
      : 0;
  };

  const buildPartialPayloadItems = (splitQuantity) => {
    if (!memo?.items || memo.items.length === 0 || totalShirts === 0) return [];
    const ratio = splitQuantity / totalShirts;
    let totalAllocated = 0;

    const items = memo.items
      .filter(
        (item) =>
          item.shirtSKUs &&
          item.shirtSKUs.length > 0 &&
          (item.shirtQuantity || 0) > 0,
      )
      .map((item, itemIdx, arr) => {
        const itemShirts = item.shirtQuantity || 0;
        const isLastItem = itemIdx === arr.length - 1;
        const itemSplitTarget = isLastItem
          ? Math.min(splitQuantity - totalAllocated, itemShirts)
          : Math.min(Math.round(itemShirts * ratio), itemShirts);

        if (itemSplitTarget <= 0) return null;
        totalAllocated += itemSplitTarget;

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
      handleSubmit();
      return;
    }

    const incomplete = availableOptions.filter(
      (opt) => getRemainingQuantity(opt.key) > 0,
    );

    if (incomplete.length > 0) {
      setIncompleteOptions(incomplete);
      setShowConfirmDialog(true);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setShowConfirmDialog(false);

      const grouped = groupAssignmentsByTailor();
      const apiAssignments = Object.entries(grouped).map(
        ([tailorId, data]) => ({
          tailorId,
          options: data.options.map((opt) => ({
            option: opt.option,
            quantity: opt.quantity,
          })),
        }),
      );

      const maxOptionTotal = getMaxOptionTotal();
      const isPartial = maxOptionTotal < totalShirts;

      if (isPartial) {
        const payloadItems = buildPartialPayloadItems(maxOptionTotal);

        if (payloadItems.length === 0) {
          dispatch(
            showSnackbar({
              open: true,
              severity: "error",
              message: "Could not compute a valid partial split.",
            }),
          );
          return;
        }

        await axiosInstance.post(
          `/assign-tailor/memos/${memo._id}/partial-assign-and-assign`,
          {
            items: payloadItems,
            assignments: apiAssignments,
            performedBy: user?._id || user?.id,
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
        await axiosInstance.post("/assign-tailor/assign-multiple", {
          deliveryMemoId: memo._id,
          assignments: apiAssignments,
          performedBy: user?._id || user?.id,
        });

        dispatch(
          showSnackbar({
            open: true,
            severity: "success",
            message: "Tailors assigned successfully!",
          }),
        );
      }

      onSuccess();
      handleClose();
    } catch (error) {
      console.error("Assignment error", error);
      dispatch(
        showSnackbar({
          open: true,
          severity: "error",
          message: error.response?.data?.message || "Failed to assign tailors",
        }),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAssignments([]);
    resetForm();
    setShowConfirmDialog(false);
    onClose();
  };

  const allOptionsAssigned =
    availableOptions.length > 0 &&
    availableOptions.every((opt) => getRemainingQuantity(opt.key) === 0);

  const totalAssignedCount = assignments.length;
  const uniqueTailors = new Set(assignments.map((a) => a.tailorId)).size;

  // ── Smart Quantity Input renderer ─────────────────────────────────────────

  /**
   * Renders the custom quantity section for one group (tailor / pre-stitcher).
   *
   * - If all selected ops in the group share the same remaining qty → ONE input.
   * - Otherwise → one input per distinct-remaining-qty bucket, labelled with
   *   the op names that share that qty.
   */
  const renderCustomQtySection = (buckets, groupPrefix, accentColor) => {
    if (buckets.length === 0) return null;

    const isShared = buckets.length === 1;

    return (
      <Stack spacing={2}>
        {buckets.map((bucket) => {
          const mapKey = bucketMapKey(bucket, groupPrefix);
          const val = customQtyMap[mapKey] || "";
          const parsed = parseInt(val) || 0;
          // Max for this bucket = tightest remaining among its keys
          const max = Math.min(...bucket.keys.map(getRemainingQuantity));
          const hasError = val !== "" && (parsed <= 0 || parsed > max);

          // Label: single op → use its label; multiple ops → join their labels
          const label = isShared && bucket.keys.length > 1
            ? "All Selected Operations"
            : bucket.keys
                .map(
                  (k) =>
                    availableOptions.find((o) => o.key === k)?.label ?? k,
                )
                .join(" & ");

          return (
            <Box key={mapKey}>
              <Typography
                sx={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: accentColor,
                  mb: 0.5,
                }}
              >
                {label}
              </Typography>
              <TextField
                fullWidth
                size="small"
                type="number"
                placeholder={`Max: ${max}`}
                value={val}
                onChange={(e) => {
                  const raw = parseInt(e.target.value) || 0;
                  setCustomQtyMap((prev) => ({
                    ...prev,
                    [mapKey]: raw > max ? String(max) : e.target.value,
                  }));
                }}
                onWheel={(e) => e.target.blur()}
                error={hasError}
                InputProps={{ inputProps: { min: 1, max } }}
              />
              <FormHelperText
                sx={{
                  ml: 0.5,
                  color: hasError ? "#d32f2f" : "#6b7280",
                  fontWeight: hasError ? 700 : 400,
                }}
              >
                {hasError
                  ? `Must be between 1 and ${max}`
                  : `Available: ${max} shirts`}
              </FormHelperText>
            </Box>
          );
        })}
      </Stack>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────

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
                Assign Multiple Tailors
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
                {uniqueTailors > 0 && (
                  <Chip
                    icon={<Person sx={{ fontSize: 14 }} />}
                    label={`${uniqueTailors} tailors`}
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
              {memo?.items?.length > 0 && (
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
                    {memo.items.map((item, itemIdx) =>
                      (item.shirtSKUs || []).map((skuObj, skuIdx) => (
                        <Chip
                          key={`${itemIdx}-${skuIdx}`}
                          label={`${typeof skuObj === "string" ? skuObj : `${skuObj.sku}: ${skuObj.quantity}`}`}
                          size="small"
                          variant="outlined"
                          sx={{
                            borderColor: "#cbd5e1",
                            color: "#334155",
                            fontSize: "11px",
                            fontWeight: 500,
                            height: 24,
                            backgroundColor: "#ffffff",
                          }}
                        />
                      )),
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
            {/* ── Left Panel ── */}
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

                {/* Tailor Select */}
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel id="tailor-select-label">Select Tailor</InputLabel>
                  <Select
                    labelId="tailor-select-label"
                    value={selectedTailor}
                    label="Select Tailor"
                    onChange={(e) => setSelectedTailor(e.target.value)}
                    size={isSmallMobile ? "small" : "medium"}
                  >
                    {tailors.map((tailor) => (
                      <MenuItem key={tailor._id} value={tailor._id}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <Avatar
                            sx={{ width: 28, height: 28, fontSize: 12, backgroundColor: "#667eea" }}
                          >
                            {tailor.name.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography sx={{ fontWeight: 500, fontSize: { xs: 13, sm: 14 } }}>
                              {tailor.name}
                            </Typography>
                            <Typography sx={{ fontSize: { xs: 10, sm: 11 }, color: "#6b7280" }}>
                              {tailor.phoneNumber}
                            </Typography>
                          </Box>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Tailor Operations */}
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel id="operations-select-label">
                    Tailor Operations (Multiple)
                  </InputLabel>
                  <Select
                    labelId="operations-select-label"
                    multiple
                    value={selectedOptions.filter((k) => TAILOR_OP_KEYS.includes(k))}
                    label="Tailor Operations (Multiple)"
                    onChange={(e) => {
                      const otherSelected = selectedOptions.filter(
                        (k) => !TAILOR_OP_KEYS.includes(k),
                      );
                      setSelectedOptions([...otherSelected, ...e.target.value]);
                      // Clean up removed keys from customQtyMap
                      setCustomQtyMap((prev) => {
                        const next = { ...prev };
                        // Remove any map keys that are no longer relevant
                        Object.keys(next).forEach((mk) => {
                          if (
                            TAILOR_OP_KEYS.some(
                              (k) => mk === k || mk.startsWith(`__tailor_${k}__`),
                            ) &&
                            !e.target.value.some(
                              (k) => mk === k || mk.startsWith(`__tailor_${k}__`),
                            )
                          ) {
                            delete next[mk];
                          }
                        });
                        return next;
                      });
                    }}
                    disabled={getAvailableTailorOptions().length === 0}
                    size={isSmallMobile ? "small" : "medium"}
                    renderValue={(selected) =>
                      selected
                        .map((k) => availableOptions.find((o) => o.key === k)?.label)
                        .join(", ")
                    }
                  >
                    {getAvailableTailorOptions().map((opt) => {
                      const remaining = getRemainingQuantity(opt.key);
                      return (
                        <MenuItem key={opt.key} value={opt.key}>
                          <Checkbox checked={selectedOptions.indexOf(opt.key) > -1} />
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
                                <Typography sx={{ fontWeight: 500, fontSize: { xs: 13, sm: 14 } }}>
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

                {/* Pre-Stitcher Operations */}
                {getAvailablePreStitcherOptions().length > 0 && (
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel id="prestitcher-operations-select-label">
                      Pre-Stitcher Spillovers (Multiple)
                    </InputLabel>
                    <Select
                      labelId="prestitcher-operations-select-label"
                      multiple
                      value={selectedOptions.filter((k) =>
                        PRE_STITCHER_OP_KEYS.includes(k),
                      )}
                      label="Pre-Stitcher Spillovers (Multiple)"
                      onChange={(e) => {
                        const otherSelected = selectedOptions.filter(
                          (k) => !PRE_STITCHER_OP_KEYS.includes(k),
                        );
                        setSelectedOptions([...otherSelected, ...e.target.value]);
                        setCustomQtyMap((prev) => {
                          const next = { ...prev };
                          Object.keys(next).forEach((mk) => {
                            if (
                              PRE_STITCHER_OP_KEYS.some(
                                (k) => mk === k || mk.startsWith(`__pre_${k}__`),
                              ) &&
                              !e.target.value.some(
                                (k) => mk === k || mk.startsWith(`__pre_${k}__`),
                              )
                            ) {
                              delete next[mk];
                            }
                          });
                          return next;
                        });
                      }}
                      size={isSmallMobile ? "small" : "medium"}
                      renderValue={(selected) =>
                        selected
                          .map((k) => availableOptions.find((o) => o.key === k)?.label)
                          .join(", ")
                      }
                      sx={{
                        "& .MuiOutlinedInput-notchedOutline": { borderColor: "#f59e0b" },
                        "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#d97706" },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#d97706" },
                      }}
                    >
                      {getAvailablePreStitcherOptions().map((opt) => {
                        const remaining = getRemainingQuantity(opt.key);
                        return (
                          <MenuItem key={opt.key} value={opt.key}>
                            <Checkbox checked={selectedOptions.indexOf(opt.key) > -1} />
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
                                  <Typography sx={{ fontWeight: 500, fontSize: { xs: 13, sm: 14 } }}>
                                    {opt.label}
                                  </Typography>
                                  <Chip
                                    label={`${remaining}/${totalShirts}`}
                                    size="small"
                                    sx={{
                                      backgroundColor: "#fff7ed",
                                      color: "#9a3412",
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
                )}

                {/* Quantity Mode */}
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
                      sx={{ fontWeight: 600, mb: 1.5, fontSize: { xs: 13, sm: 14 } }}
                    >
                      Assign Quantity:
                    </Typography>
                    <RadioGroup
                      value={quantityMode}
                      onChange={(e) => {
                        setQuantityMode(e.target.value);
                        if (e.target.value === "all") setCustomQtyMap({});
                      }}
                    >
                      <FormControlLabel
                        value="all"
                        control={<Radio size="small" />}
                        label={
                          <Typography variant="body2" sx={{ fontSize: { xs: 13, sm: 14 } }}>
                            All Remaining for Each Operation
                          </Typography>
                        }
                      />
                      <FormControlLabel
                        value="custom"
                        control={<Radio size="small" />}
                        label={
                          <Typography variant="body2" sx={{ fontSize: { xs: 13, sm: 14 } }}>
                            Custom Quantity
                          </Typography>
                        }
                      />
                    </RadioGroup>

                    {quantityMode === "custom" && (
                      <Box sx={{ mt: 2 }}>
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 600,
                            fontSize: 11,
                            color: "#6b7280",
                            display: "block",
                            mb: 1.5,
                          }}
                        >
                          Enter quantity for each operation:
                        </Typography>

                        <Stack spacing={3}>
                          {/* Tailor ops buckets */}
                          {tailorBuckets.length > 0 && (
                            <Box>
                              {tailorBuckets.length > 1 && (
                                <Typography
                                  sx={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: "#374151",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.5px",
                                    mb: 1,
                                  }}
                                >
                                  Tailor Operations
                                </Typography>
                              )}
                              {renderCustomQtySection(tailorBuckets, "tailor", "#374151")}
                            </Box>
                          )}

                         
                          {preStitcherBuckets.length > 0 && (
                            <Box>
                              {preStitcherBuckets.length > 1 && (
                                <Typography
                                  sx={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: "#92400e",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.5px",
                                    mb: 1,
                                  }}
                                >
                                  Pre-Stitcher Spill-overs
                                </Typography>
                              )}
                              {renderCustomQtySection(preStitcherBuckets, "pre", "#92400e")}
                            </Box>
                          )}
                        </Stack>
                      </Box>
                    )}
                  </Box>
                )}

                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<Add />}
                  onClick={handleAddAssignment}
                  disabled={
                    !selectedTailor ||
                    selectedOptions.length === 0 ||
                    isCustomQtyInvalid
                  }
                  sx={{
                    backgroundColor: "#667eea",
                    fontWeight: 600,
                    py: { xs: 1.1, sm: 1.3 },
                    fontSize: { xs: "14px", sm: "15px" },
                    "&:hover": { backgroundColor: "#5568d3" },
                    "&:disabled": { backgroundColor: "#e5e7eb", color: "#9ca3af" },
                  }}
                >
                  Add{selectedOptions.length > 0 ? ` ${selectedOptions.length} ` : " "}
                  Assignment{selectedOptions.length > 1 ? "s" : ""}
                </Button>
              </Card>

              {/* Assignment Progress Card */}
              <Card
                sx={{
                  mt: 2,
                  backgroundColor: allOptionsAssigned ? "#dcfce7" : "#fef3c7",
                  borderRadius: 2,
                  border: allOptionsAssigned ? "2px solid #16a34a" : "2px solid #f59e0b",
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
                  onClick={() => isMobile && setShowProgressDetails(!showProgressDetails)}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    {allOptionsAssigned ? (
                      <CheckCircle sx={{ color: "#16a34a", fontSize: { xs: 20, sm: 24 } }} />
                    ) : (
                      <ErrorOutline sx={{ color: "#f59e0b", fontSize: { xs: 20, sm: 24 } }} />
                    )}
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 700,
                        color: allOptionsAssigned ? "#166534" : "#92400e",
                        fontSize: { xs: 13, sm: 14 },
                      }}
                    >
                      {allOptionsAssigned ? "All operations assigned!" : "Assignment Progress"}
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
                      {availableOptions.map((opt) => {
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
                              <Typography variant="caption" sx={{ fontWeight: 600, fontSize: { xs: 11, sm: 12 } }}>
                                {opt.label}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{
                                  fontWeight: 700,
                                  fontSize: { xs: 11, sm: 12 },
                                  color: remaining === 0 ? "#16a34a" : "#f59e0b",
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
                                  backgroundColor: remaining === 0 ? "#16a34a" : "#3b82f6",
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

            {/* ── Right Panel ── */}
            <Box sx={{ flex: 1.5, order: { xs: 2, md: 2 } }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                  cursor: isMobile ? "pointer" : "default",
                }}
                onClick={() => isMobile && setShowAssignmentsList(!showAssignmentsList)}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: { xs: 15, sm: 16 } }}>
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
                    <WorkOutline sx={{ fontSize: 48, color: "#9ca3af", mb: 1 }} />
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: 13, sm: 14 } }}>
                      No assignments added yet. Start by selecting a tailor and operations.
                    </Typography>
                  </Card>
                ) : (
                  <>
                    {!isMobile ? (
                      <TableContainer component={Paper} sx={{ borderRadius: 2, border: "1px solid #e5e7eb" }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ backgroundColor: "#f9fafb" }}>
                              <TableCell sx={{ fontWeight: 700, fontSize: "12px" }}>Tailor</TableCell>
                              <TableCell sx={{ fontWeight: 700, fontSize: "12px" }}>Operation</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700, fontSize: "12px" }}>Quantity</TableCell>
                              <TableCell align="center" sx={{ fontWeight: 700, fontSize: "12px", width: 70 }}>Action</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {assignments.map((assignment) => (
                              <TableRow key={assignment.id} hover>
                                <TableCell>
                                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <Avatar sx={{ width: 24, height: 24, fontSize: 11, backgroundColor: "#667eea" }}>
                                      {assignment.tailorName.charAt(0)}
                                    </Avatar>
                                    <Box>
                                      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 13 }}>
                                        {assignment.tailorName}
                                      </Typography>
                                      <Typography variant="caption" sx={{ fontSize: 10, color: "#6b7280" }}>
                                        {assignment.tailorPhone}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={assignment.optionLabel}
                                    size="small"
                                    sx={{ backgroundColor: "#e0e7ff", color: "#4338ca", fontWeight: 600, fontSize: 11 }}
                                  />
                                </TableCell>
                                <TableCell align="right">
                                  <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 13 }}>
                                    {assignment.quantity}
                                  </Typography>
                                </TableCell>
                                <TableCell align="center">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleRemoveAssignment(assignment.id)}
                                    sx={{ color: "#dc2626", "&:hover": { backgroundColor: "#fee2e2" } }}
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
                              "&:hover": { boxShadow: "0 2px 8px rgba(0,0,0,0.1)" },
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
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1 }}>
                                  <Avatar sx={{ width: 32, height: 32, fontSize: 13, backgroundColor: "#667eea" }}>
                                    {assignment.tailorName.charAt(0)}
                                  </Avatar>
                                  <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 14 }}>
                                      {assignment.tailorName}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: "#4338ca", fontWeight: 600, fontSize: 12 }}>
                                      {assignment.optionLabel}
                                    </Typography>
                                  </Box>
                                </Box>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                  <Chip
                                    label={`${assignment.quantity} shirts`}
                                    size="small"
                                    sx={{ backgroundColor: "#dcfce7", color: "#166534", fontWeight: 700, fontSize: 11, height: 22 }}
                                  />
                                  <IconButton
                                    size="small"
                                    onClick={() => handleRemoveAssignment(assignment.id)}
                                    sx={{ color: "#dc2626", "&:hover": { backgroundColor: "#fee2e2" } }}
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

                    {/* Summary by Tailor */}
                    <Card
                      sx={{
                        mt: 2,
                        p: { xs: 1.5, sm: 2 },
                        backgroundColor: "#f9fafb",
                        borderRadius: 2,
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, fontSize: { xs: 13, sm: 14 } }}>
                        Summary by Tailor:
                      </Typography>
                      <Stack spacing={1.5}>
                        {Object.entries(groupAssignmentsByTailor()).map(([tailorId, data]) => (
                          <Box key={tailorId}>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, fontSize: { xs: 13, sm: 14 } }}>
                              {data.tailorName}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ fontSize: { xs: 10, sm: 11 }, color: "#6b7280", display: "block", mb: 0.5 }}
                            >
                              {data.tailorPhone}
                            </Typography>
                            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
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
                        ))}
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
          <DialogCancelButton onClick={handleClose} fullWidth={isSmallMobile} sx={{ order: { xs: 2, sm: 1 } }}>
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

      {/* Confirmation Dialog */}
      <Dialog
        open={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
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
            Some operations are not fully assigned. Do you want to continue?
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
                    sx={{ backgroundColor: "#fff", color: "#92400e", fontWeight: 600, fontSize: 11 }}
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

export default AssignMultipleTailorsModal;