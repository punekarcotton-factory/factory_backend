import { CheckCircle, Close, ExpandMore, Warning } from "@mui/icons-material";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Collapse,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  TextField,
  Typography
} from "@mui/material";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import {
  DialogBox,
  DialogCancelButton,
  DialogFooter,
  DialogHeader,
  DialogSubmitButton,
} from "../components/Styled";
import { showSnackbar } from "../Slice/snackbarSlice";
import axiosInstance from "../utils/axiosInstance";
import { DELIVERY_MEMO_STAGES } from "../utils/deliveryMemo";

const CreateDeliveryMemoModal = ({
  open,
  onClose,
  onMemoCreated,
  currentUser,
  editMemo = null,
}) => {
  const dispatch = useDispatch();

  const [entries, setEntries] = useState([
    { fabricSKU: "", dhap: "", fold: "" },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fabricSKUs, setFabricSKUs] = useState([]);
  const [dmNumber, setDmNumber] = useState("");
  const [loadingSKUs, setLoadingSKUs] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState(0);

  const [damageModalOpen, setDamageModalOpen] = useState(false);
  const [selectedFabricForDamage, setSelectedFabricForDamage] = useState(null);
  const [damageQuantity, setDamageQuantity] = useState("");
  const [damageNotes, setDamageNotes] = useState("");
  const [submittingDamage, setSubmittingDamage] = useState(false);

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

  useEffect(() => {
    if (!open) return;

    // Initialize states based on edit mode
    if (editMemo) {
      setDmNumber(editMemo.dmNumber || "");
      if (editMemo.items && editMemo.items.length > 0) {
        setEntries(
          editMemo.items.map((item) => ({
            fabricSKU: item.fabricSKU || "",
            dhap: String(item.dhap || ""),
            fold: String(item.fold || ""),
          }))
        );
      } else {
        setEntries([{ fabricSKU: "", dhap: "", fold: "" }]);
      }
    } else {
      setDmNumber("");
      setEntries([{ fabricSKU: "", dhap: "", fold: "" }]);
    }
    setError("");

    const fetchSKUs = async () => {
      setLoadingSKUs(true);
      try {
        const response = await axiosInstance.get(
          "/delivery-memos/fabrics/available"
        );
        let fetchedSKUs = response.data.data || [];

        // If in edit mode, ensure the original SKUs are included in the options list even if their available stock is 0
        if (editMemo && editMemo.items) {
          const skuSet = new Set(fetchedSKUs.map((f) => f.sku));
          editMemo.items.forEach((item) => {
            if (item.fabricSKU && !skuSet.has(item.fabricSKU)) {
              fetchedSKUs.push({
                sku: item.fabricSKU,
                quantity: 0,
                title: item.fabricTitle || "",
                color: item.fabricColor || "",
              });
              skuSet.add(item.fabricSKU);
            }
          });
        }

        setFabricSKUs(fetchedSKUs);
      } catch (err) {
        setError("Failed to load fabric SKUs. Please try again.");
      } finally {
        setLoadingSKUs(false);
      }
    };

    fetchSKUs();
  }, [open, editMemo]);

  const handleEntryChange = (index, field, value) => {
    if (field === "fabricSKU" && value) {
      const isDuplicate = entries.some(
        (entry, idx) => idx !== index && entry.fabricSKU === value
      );

      if (isDuplicate) {
        setError(
          `SKU "${value}" is already added. Please select a different SKU.`
        );
        return;
      }
    }

    setEntries((prev) => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
    if (error) setError("");
  };

  const handleWheel = (e) => {
    e.target.blur();
  };

  const handleAddRow = () => {
    setEntries((prev) => [...prev, { fabricSKU: "", dhap: "", fold: "" }]);
    setExpandedIndex(entries.length);
  };

  const handleRemoveRow = (index) => {
    setEntries((prev) => prev.filter((_, i) => i !== index));
    if (expandedIndex === index) {
      setExpandedIndex(Math.max(0, index - 1));
    } else if (expandedIndex > index) {
      setExpandedIndex(expandedIndex - 1);
    }
  };

  const handleToggleExpand = (index) => {
    setExpandedIndex(expandedIndex === index ? -1 : index);
  };

  const isEntryComplete = (entry) => {
    return entry.fabricSKU && entry.dhap && entry.fold;
  };

  const handleOpenDamageModal = (fabric) => {
    setSelectedFabricForDamage(fabric);
    setDamageQuantity(0); 
    setDamageNotes("");
    setDamageModalOpen(true);
  };

  const handleMarkDamage = async () => {
    if (!selectedFabricForDamage) return;

    const quantity = parseFloat(damageQuantity);

    if (!quantity || quantity <= 0) {
      dispatch(
        showSnackbar({
          open: true,
          severity: "error",
          message: "Please enter a valid damage quantity",
        })
      );
      return;
    }

    if (quantity > selectedFabricForDamage.quantity) {
      dispatch(
        showSnackbar({
          open: true,
          severity: "error",
          message: `Cannot damage more than available (${selectedFabricForDamage.quantity}m)`,
        })
      );
      return;
    }

    setSubmittingDamage(true);

    try {
      const userId = currentUser?.id || currentUser?._id || currentUser?.userId;

      await axiosInstance.post(
        `/fabrics/${selectedFabricForDamage.sku}/damage`,
        {
          damagedQuantity: quantity,
          notes: damageNotes || `Damaged ${quantity}m - marked as permanent loss`,
          performedBy: userId,
        }
      );

      dispatch(
        showSnackbar({
          open: true,
          severity: "success",
          message: `Successfully marked ${quantity}m as damaged for ${selectedFabricForDamage.sku}`,
        })
      );

      setDamageModalOpen(false);
      setSelectedFabricForDamage(null);
      setDamageQuantity("");
      setDamageNotes("");

      const response = await axiosInstance.get(
        "/delivery-memos/fabrics/available"
      );
      setFabricSKUs(response.data.data || []);
    } catch (error) {
      dispatch(
        showSnackbar({
          open: true,
          severity: "error",
          message:
            error.response?.data?.message ||
            "Failed to mark fabric as damaged",
        })
      );
    } finally {
      setSubmittingDamage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const invalid = entries.some((e) => !e.fabricSKU || !e.dhap || !e.fold);
    if (invalid) {
      setError("All fields are required for each entry");
      return;
    }

    if (!dmNumber.trim()) {
      setError("Delivery Memo Number (DM Number) is required");
      return;
    }

    const skuCounts = {};
    const duplicates = [];

    entries.forEach((entry) => {
      if (skuCounts[entry.fabricSKU]) {
        duplicates.push(entry.fabricSKU);
      } else {
        skuCounts[entry.fabricSKU] = 1;
      }
    });

    if (duplicates.length > 0) {
      setError(
        `Duplicate SKU(s) found: ${[...new Set(duplicates)].join(
          ", "
        )}. Each SKU can only be added once.`
      );
      return;
    }

    // Validate fabric quantities
    for (const entry of entries) {
      const selectedFabric = fabricSKUs.find((f) => f.sku === entry.fabricSKU);
      const dhapNum = parseFloat(entry.dhap || "0");
      const foldNum = parseFloat(entry.fold || "0");
      const totalNeeded = dhapNum * foldNum;

      // Adjust available quantity by adding back the original quantity of this memo item (if editing)
      const originalItem = editMemo?.items?.find((item) => item.fabricSKU === entry.fabricSKU);
      const originalQty = originalItem ? parseFloat(originalItem.totalDhapFold || "0") : 0;
      const availableQty = (selectedFabric?.quantity || 0) + originalQty;

      if (totalNeeded > availableQty) {
        setError(
          `Insufficient fabric for ${entry.fabricSKU}. Available: ${availableQty}m, Required: ${totalNeeded}m (${dhapNum}m × ${foldNum} fold)`
        );
        return;
      }
    }

    const userId = currentUser?.id || currentUser?._id || currentUser?.userId;
    if (!userId) {
      setError("User information is missing. Please log in again.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        memos: entries.map((e) => {
          const dhapNum = parseFloat(e.dhap || "0");
          const foldNum = parseFloat(e.fold || "0");
          const itemTotal =
            !Number.isNaN(dhapNum) && !Number.isNaN(foldNum)
              ? dhapNum * foldNum
              : 0;

          return {
            fabricSKU: e.fabricSKU,
            dhap: e.dhap,
            fold: e.fold,
            totalDhapFold: itemTotal,
          };
        }),
        dmNumber: dmNumber.trim(),
        createdBy: String(userId),
        stage: DELIVERY_MEMO_STAGES.CREATE_DELIVERY_MEMO.key,
      };

      if (editMemo) {
        await axiosInstance.put(`/delivery-memos/${editMemo.deliveryMemoId}`, payload);
        dispatch(
          showSnackbar({
            open: true,
            severity: "success",
            message: `Delivery memo updated successfully!`,
          })
        );
      } else {
        await axiosInstance.post("/delivery-memos", payload);

        dispatch(
          showSnackbar({
            open: true,
            severity: "success",
            message: `${entries.length} delivery memo(s) created successfully!`,
          })
        );
      }

      setEntries([{ fabricSKU: "", dhap: "", fold: "" }]);
      setDmNumber("");
      setExpandedIndex(0);
      onMemoCreated();
      onClose();
    } catch (error) {
      setError(
        error.response?.data?.message ||
          `Failed to ${editMemo ? "update" : "create"} delivery memo. Please try again.`
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setEntries([{ fabricSKU: "", dhap: "", fold: "" }]);
      setDmNumber("");
      setExpandedIndex(0);
      setError("");
      onClose();
    }
  };

  const getAvailableSKUsForEntry = (currentIndex) => {
    const selectedSKUs = entries
      .map((entry, idx) => (idx !== currentIndex ? entry.fabricSKU : null))
      .filter(Boolean);

    return fabricSKUs.filter((fabric) => !selectedSKUs.includes(fabric.sku));
  };

  return (
    <>
      <DialogBox open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <DialogHeader>{editMemo ? "Edit Delivery Memo" : "Create Delivery Memo"}</DialogHeader>

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
                "& .MuiAlert-icon": { color: "#dc2626" },
              }}
              onClose={() => setError("")}
            >
              {error}
            </Alert>
          )}

          {loadingSKUs && (
            <Box sx={{ mb: 2, textAlign: "center" }}>
              <CircularProgress size={24} />
              <Typography sx={{ fontSize: "12px", color: "#6b7280", mt: 1 }}>
                Loading fabrics...
              </Typography>
            </Box>
          )}

          {!loadingSKUs && fabricSKUs.length === 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              No fabrics with available quantity found. Please add fabrics first.
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <Box sx={{ mb: 3 }}>
              <Typography
                sx={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#374151",
                  mb: 1,
                }}
              >
                Delivery Memo Number (DM Number)
              </Typography>
              <TextField
                fullWidth
                placeholder="e.g., DM-001"
                size="small"
                sx={textFieldStyle}
                value={dmNumber}
                onChange={(e) => setDmNumber(e.target.value)}
                required
                disabled={submitting}
              />
            </Box>

            {entries.map((entry, index) => {
              const dhapNum = parseFloat(entry.dhap || "0");
              const foldNum = parseFloat(entry.fold || "0");
              const itemTotal =
                !Number.isNaN(dhapNum) && !Number.isNaN(foldNum)
                  ? dhapNum * foldNum
                  : 0;

              const selectedFabric = fabricSKUs.find(
                (f) => f.sku === entry.fabricSKU
              );

              // Calculate available quantity taking editMemo original allocation into account
              const originalItem = editMemo?.items?.find((item) => item.fabricSKU === entry.fabricSKU);
              const originalQty = originalItem ? parseFloat(originalItem.totalDhapFold || "0") : 0;
              const availableQty = (selectedFabric?.quantity || 0) + originalQty;

              const hasInsufficientQty =
                selectedFabric && itemTotal > availableQty;

              const hasLowStock = selectedFabric && (availableQty - itemTotal) < 6;

              const isExpanded = expandedIndex === index;
              const isComplete = isEntryComplete(entry);
              const availableSKUsForEntry = getAvailableSKUsForEntry(index);

              return (
                <Box
                  key={index}
                  sx={{
                    mb: 2,
                    border: "1px solid #e5e7eb",
                    borderRadius: "10px",
                    overflow: "hidden",
                    transition: "all 0.2s",
                    backgroundColor: "#ffffff",
                  }}
                >
                  <Box
                    onClick={() => handleToggleExpand(index)}
                    sx={{
                      p: 2,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      backgroundColor: isExpanded ? "#f9fafb" : "transparent",
                      "&:hover": { backgroundColor: "#f9fafb" },
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        flex: 1,
                      }}
                    >
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: "8px",
                          backgroundColor: "#667eea",
                          color: "white",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 600,
                          fontSize: "14px",
                        }}
                      >
                        {index + 1}
                      </Box>

                      <Box sx={{ flex: 1 }}>
                        {isComplete ? (
                          <>
                            <Typography
                              sx={{
                                fontSize: "14px",
                                fontWeight: 600,
                                color: "#111827",
                              }}
                            >
                              {selectedFabric?.sku || "SKU"}
                            </Typography>
                            <Typography
                              sx={{ fontSize: "12px", color: "#6b7280" }}
                            >
                              {dhapNum}m/fold × {foldNum} fold ={" "}
                              {itemTotal.toFixed(2)}m total
                            </Typography>
                          </>
                        ) : (
                          <Typography
                            sx={{
                              fontSize: "14px",
                              fontWeight: 600,
                              color: "#6b7280",
                            }}
                          >
                            SKU #{index + 1} - Click to fill details
                          </Typography>
                        )}
                      </Box>

                      {isComplete && (
                        <CheckCircle sx={{ fontSize: 20, color: "#16a34a" }} />
                      )}
                    </Box>

                    <IconButton
                      size="small"
                      sx={{
                        transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.3s",
                      }}
                    >
                      <ExpandMore />
                    </IconButton>
                  </Box>

                  <Collapse in={isExpanded}>
                    <Box sx={{ p: 2, pt: 0, backgroundColor: "#ffffff" }}>
                      <Box sx={{ mb: 1.5 }}>
                        <Typography
                          sx={{
                            fontSize: "13px",
                            fontWeight: 500,
                            color: "#374151",
                            mb: 0.75,
                          }}
                        >
                          Fabric SKU
                        </Typography>
                        <Autocomplete
                          options={availableSKUsForEntry}
                          getOptionLabel={(option) => {
                            if (typeof option === "string") return option;
                            return option.sku || "";
                          }}
                          value={selectedFabric || null}
                          onChange={(event, newValue) => {
                            const sku = newValue?.sku || "";
                            handleEntryChange(index, "fabricSKU", sku);
                          }}
                          loading={loadingSKUs}
                          disabled={submitting || fabricSKUs.length === 0}
                          isOptionEqualToValue={(option, value) =>
                            option.sku === value?.sku
                          }
                          renderOption={(props, option) => {
                            const isLowStock = option.quantity < 6;
                            
                            return (
                              <Box component="li" {...props} key={option.sku}>
                                <Box
                                  sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    width: "100%",
                                    alignItems: "center",
                                  }}
                                >
                                  <Box sx={{ flex: 1 }}>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                      <Typography
                                        sx={{ fontSize: "14px", fontWeight: 600 }}
                                      >
                                        {option.sku}
                                      </Typography>
                                      {isLowStock && (
                                        <Warning sx={{ fontSize: 16, color: "#f59e0b" }} />
                                      )}
                                    </Box>
                                    <Typography
                                      sx={{ fontSize: "12px", color: "#6b7280" }}
                                    >
                                      {option.title && `${option.title}`}
                                      {option.color && ` • ${option.color}`}
                                    </Typography>
                                  </Box>
                                  <Box
                                    sx={{
                                      ml: 2,
                                      px: 1.5,
                                      py: 0.5,
                                      backgroundColor: isLowStock ? "#fef3c7" : "#f0fdf4",
                                      borderRadius: "6px",
                                    }}
                                  >
                                    <Typography
                                      sx={{
                                        fontSize: "12px",
                                        fontWeight: 600,
                                        color: isLowStock ? "#f59e0b" : "#16a34a",
                                      }}
                                    >
                                      {option.quantity}m
                                    </Typography>
                                  </Box>
                                </Box>
                              </Box>
                            );
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              placeholder="Select Fabric SKU"
                              size="small"
                              sx={textFieldStyle}
                              required
                              InputProps={{
                                ...params.InputProps,
                                endAdornment: (
                                  <>
                                    {loadingSKUs ? (
                                      <CircularProgress size={20} />
                                    ) : null}
                                    {params.InputProps.endAdornment}
                                  </>
                                ),
                              }}
                            />
                          )}
                        />

                        {availableSKUsForEntry.length === 0 &&
                          fabricSKUs.length > 0 && (
                            <Alert
                              severity="info"
                              sx={{ mt: 1, fontSize: "12px" }}
                            >
                              All available SKUs have been added. Remove an entry
                              to add a different SKU.
                            </Alert>
                          )}

                        {selectedFabric && (
                          <Box
                            sx={{
                              mt: 0.5,
                              p: 1,
                              backgroundColor: hasInsufficientQty
                                ? "#fef2f2"
                                : "#f0fdf4",
                              borderRadius: "6px",
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: "12px",
                                color: hasInsufficientQty ? "#dc2626" : "#16a34a",
                                fontWeight: 500,
                              }}
                            >
                              {hasInsufficientQty ? "⚠" : "✓"} Available in stock: {(availableQty - itemTotal).toFixed(2)}m
                            </Typography>
                          </Box>
                        )}

                        {selectedFabric && (
                          <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                              variant="outlined"
                              size="small"
                              color="error"
                              onClick={() => handleOpenDamageModal(selectedFabric)}
                              sx={{
                                fontSize: "12px",
                                textTransform: "none",
                                fontWeight: 600,
                                borderColor: "#dc2626",
                                color: "#dc2626",
                                "&:hover": {
                                  borderColor: "#b91c1c",
                                  backgroundColor: "#fef2f2",
                                },
                              }}
                            >
                              Mark as Damaged
                            </Button>
                          </Box>
                        )}
                        
                        {hasLowStock && !hasInsufficientQty && (
                          <Alert
                            severity="warning"
                            sx={{ mt: 1, fontSize: "12px" }}
                          >
                            ⚠ Low stock ({(availableQty - itemTotal).toFixed(2)}m) remaining
                          </Alert>
                        )}
                      </Box>

                      <Box sx={{ mb: 1.5 }}>
                        <Typography
                          sx={{
                            fontSize: "13px",
                            fontWeight: 500,
                            color: "#374151",
                            mb: 0.75,
                          }}
                        >
                          Dhap (meters per fold)
                        </Typography>
                        <TextField
                          fullWidth
                          type="number"
                          placeholder="Enter DHAP in meters"
                          size="small"
                          sx={textFieldStyle}
                          value={entry.dhap}
                          required
                          disabled={submitting}
                          inputProps={{ step: "0.01", min: "0" }}
                          onChange={(e) =>
                            handleEntryChange(index, "dhap", e.target.value)
                          }
                          onWheel={handleWheel}
                        />
                      </Box>

                      {/* Fold */}
                      <Box sx={{ mb: 1.5 }}>
                        <Typography
                          sx={{
                            fontSize: "13px",
                            fontWeight: 500,
                            color: "#374151",
                            mb: 0.75,
                          }}
                        >
                          Fold (quantity)
                        </Typography>
                        <TextField
                          fullWidth
                          type="number"
                          placeholder="Enter FOLD"
                          size="small"
                          sx={textFieldStyle}
                          value={entry.fold}
                          required
                          disabled={submitting}
                          inputProps={{ step: "1", min: "0" }}
                          onChange={(e) =>
                            handleEntryChange(index, "fold", e.target.value)
                          }
                          onWheel={handleWheel}
                        />
                      </Box>

                      {/* Info boxes */}
                      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                        {/* Total Fabric Required */}
                        <Box
                          sx={{
                            flex: 1,
                            minWidth: "45%",
                            p: 1.5,
                            backgroundColor: hasInsufficientQty
                              ? "#fef2f2"
                              : "#fef3c7",
                            borderRadius: "8px",
                            border: hasInsufficientQty
                              ? "1px solid #fca5a5"
                              : "1px solid #fde68a",
                          }}
                        >
                          <Typography
                            sx={{
                              fontSize: "11px",
                              color: hasInsufficientQty ? "#991b1b" : "#92400e",
                              fontWeight: 500,
                              mb: 0.5,
                            }}
                          >
                            TOTAL FABRIC REQUIRED
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: "16px",
                              fontWeight: 700,
                              color: hasInsufficientQty ? "#991b1b" : "#92400e",
                            }}
                          >
                            {itemTotal.toFixed(2)}m
                          </Typography>
                          {hasInsufficientQty && (
                            <Typography
                              sx={{
                                fontSize: "10px",
                                color: "#991b1b",
                                mt: 0.5,
                              }}
                            >
                              ⚠ Exceeds available stock!
                            </Typography>
                          )}
                        </Box>
                      </Box>

                      {entries.length > 1 && (
                        <Button
                          color="error"
                          size="small"
                          onClick={() => handleRemoveRow(index)}
                          disabled={submitting}
                          sx={{
                            textTransform: "none",
                            fontSize: "13px",
                            mt: 1.5,
                          }}
                        >
                          Remove Entry
                        </Button>
                      )}
                    </Box>
                  </Collapse>
                </Box>
              );
            })}

            <Box sx={{ mb: 2 }}>
              <Button
                variant="outlined"
                fullWidth
                onClick={handleAddRow}
                disabled={
                  submitting ||
                  fabricSKUs.length === 0 ||
                  entries.length >= fabricSKUs.length
                }
                sx={{
                  textTransform: "none",
                  borderColor: "#667eea",
                  color: "#667eea",
                  "&:hover": {
                    borderColor: "#5568d3",
                    backgroundColor: "#f0f4ff",
                  },
                }}
              >
                + Add Another SKU
              </Button>
              {entries.length >= fabricSKUs.length && fabricSKUs.length > 0 && (
                <Typography
                  sx={{
                    fontSize: "11px",
                    color: "#6b7280",
                    textAlign: "center",
                    mt: 1,
                  }}
                >
                  All available SKUs have been added
                </Typography>
              )}
            </Box>
          </Box>
        </DialogContent>

        <Divider sx={{ mb: 2 }} />

        <DialogFooter>
          <DialogCancelButton
            onClick={handleClose}
            disabled={submitting}
            fullWidth
          >
            Cancel
          </DialogCancelButton>

          <DialogSubmitButton
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting || fabricSKUs.length === 0}
            fullWidth
          >
            {submitting ? (editMemo ? "Updating..." : "Creating...") : (editMemo ? "Update Memo" : "Create Memo")}
          </DialogSubmitButton>
        </DialogFooter>
      </DialogBox>

      <DialogBox
        open={damageModalOpen}
        onClose={() => !submittingDamage && setDamageModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <DialogHeader>Mark Fabric as Damaged</DialogHeader>
            <IconButton
              onClick={() => setDamageModalOpen(false)}
              disabled={submittingDamage}
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

        <DialogContent sx={{ px: 3, pb: 3 }}>
          {selectedFabricForDamage && (
            <>
              {/* Fabric Info */}
              <Box
                sx={{
                  mb: 3,
                  p: 2,
                  backgroundColor: "#f9fafb",
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                }}
              >
                <Typography sx={{ fontSize: "14px", fontWeight: 600, mb: 1 }}>
                  Fabric Details
                </Typography>
                <Box sx={{ display: "flex", gap: 1, mb: 0.5 }}>
                  <Typography sx={{ fontSize: "13px", fontWeight: 500 }}>
                    SKU:
                  </Typography>
                  <Typography sx={{ fontSize: "13px" }}>
                    {selectedFabricForDamage.sku}
                  </Typography>
                </Box>
                {selectedFabricForDamage.title && (
                  <Box sx={{ display: "flex", gap: 1, mb: 0.5 }}>
                    <Typography sx={{ fontSize: "13px", fontWeight: 500 }}>
                      Title:
                    </Typography>
                    <Typography sx={{ fontSize: "13px" }}>
                      {selectedFabricForDamage.title}
                    </Typography>
                  </Box>
                )}
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Typography
                    sx={{ fontSize: "13px", fontWeight: 600, color: "#f59e0b" }}
                  >
                    Available:
                  </Typography>
                  <Typography sx={{ fontSize: "13px", fontWeight: 600 }}>
                    {selectedFabricForDamage.quantity}m
                  </Typography>
                </Box>
              </Box>

              {/* Damage Quantity */}
              <Box sx={{ mb: 2 }}>
                <Typography
                  sx={{
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "#374151",
                    mb: 0.75,
                  }}
                >
                  Damaged Quantity (meters)
                </Typography>
                <TextField
                  fullWidth
                  type="number"
                  placeholder="Enter damaged quantity"
                  size="small"
                  sx={textFieldStyle}
                  value={damageQuantity}
                  disabled={submittingDamage}
                  inputProps={{
                    step: "0.01",
                    min: "0.01",
                    max: selectedFabricForDamage.quantity,
                  }}
                  onChange={(e) => setDamageQuantity(e.target.value)}
                  onWheel={handleWheel}
                  helperText={`Maximum: ${selectedFabricForDamage.quantity}m available`}
                />
              </Box>

              {/* Notes */}
              <Box sx={{ mb: 2 }}>
                <Typography
                  sx={{
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "#374151",
                    mb: 0.75,
                  }}
                >
                  Notes (Optional)
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Enter reason for damage..."
                  size="small"
                  sx={textFieldStyle}
                  value={damageNotes}
                  disabled={submittingDamage}
                  onChange={(e) => setDamageNotes(e.target.value)}
                />
              </Box>

              {/* Preview */}
              {parseFloat(damageQuantity) > 0 && (
                <Box
                  sx={{
                    p: 2,
                    backgroundColor: "#fef2f2",
                    borderRadius: "8px",
                    border: "1px solid #fca5a5",
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#991b1b",
                      mb: 1,
                    }}
                  >
                    ⚠ DAMAGE PREVIEW
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 0.5,
                    }}
                  >
                    <Typography sx={{ fontSize: "13px", color: "#7c2d12" }}>
                      Current Available:
                    </Typography>
                    <Typography sx={{ fontSize: "13px", fontWeight: 600 }}>
                      {selectedFabricForDamage.quantity}m
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 0.5,
                    }}
                  >
                    <Typography sx={{ fontSize: "13px", color: "#7c2d12" }}>
                      To be Damaged:
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#dc2626",
                      }}
                    >
                      -{parseFloat(damageQuantity).toFixed(2)}m
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 1, borderColor: "#fca5a5" }} />
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography
                      sx={{ fontSize: "14px", fontWeight: 600, color: "#7c2d12" }}
                    >
                      Remaining Stock:
                    </Typography>
                    <Typography
                      sx={{ fontSize: "16px", fontWeight: 700, color: "#dc2626" }}
                    >
                      {(
                        selectedFabricForDamage.quantity -
                        parseFloat(damageQuantity)
                      ).toFixed(2)}
                      m
                    </Typography>
                  </Box>
                </Box>
              )}
            </>
          )}
        </DialogContent>

        <Divider sx={{ mb: 2 }} />

        <DialogFooter>
          <DialogCancelButton
            onClick={() => setDamageModalOpen(false)}
            disabled={submittingDamage}
            fullWidth
          >
            Cancel
          </DialogCancelButton>

          <DialogSubmitButton
            variant="contained"
            onClick={handleMarkDamage}
            disabled={submittingDamage || !damageQuantity}
            fullWidth
            sx={{
              backgroundColor: "#dc2626",
              "&:hover": {
                backgroundColor: "#b91c1c",
              },
            }}
          >
            {submittingDamage ? "Processing..." : "Mark as Damaged"}
          </DialogSubmitButton>
        </DialogFooter>
      </DialogBox>
    </>
  );
};

export default CreateDeliveryMemoModal;