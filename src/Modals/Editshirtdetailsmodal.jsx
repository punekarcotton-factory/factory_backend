import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  Grid,
  Autocomplete,
  Divider,
  Paper,
  Card,
  Chip,
  Tooltip,
} from "@mui/material";
import {
  Close,
  CheckCircle,
  Inventory,
  ArrowForward,
} from "@mui/icons-material";
import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import axiosInstance from "../utils/axiosInstance";
import { showSnackbar } from "../Slice/snackbarSlice";
import { resolveImageUrl } from "../config";

const EditShirtDetailsModal = ({ open, onClose, items, memoId, onSuccess }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const [itemsData, setItemsData] = useState([]);
  const [skuOptions, setSkuOptions] = useState({});
  const [loadingSkus, setLoadingSkus] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [inputValues, setInputValues] = useState({});
  const [activeItemIndex, setActiveItemIndex] = useState(0);

  const completedCount = useMemo(
    () =>
      itemsData.filter(
        (i) =>
          i.shirtSKUs &&
          i.shirtSKUs.length > 0 &&
          i.shirtSKUs.every((s) => s.quantity > 0),
      ).length,
    [itemsData],
  );

  const allComplete = useMemo(
    () => completedCount === itemsData.length && itemsData.length > 0,
    [completedCount, itemsData.length],
  );

  useEffect(() => {
    if (open && items && items.length > 0) {
      const initialData = items.map((item) => ({
        _id: item._id,
        fabricTitle: item.fabricTitle,
        fabricSKU: item.fabricSKU,
        fabricColor: item.fabricColor,
        imageUrl: item.imageUrl,
        dhap: item.dhap,
        fold: item.fold,
        totalDhapFold: item.totalDhapFold,
        shirtSKUs: item.shirtSKUs || [],
        shirtQuantity: item.shirtQuantity || 0,
      }));
      setItemsData(initialData);
      setInputValues({});
      setActiveItemIndex(0);

      const uniqueFabricSKUs = [...new Set(items.map((item) => item.fabricSKU))];
      uniqueFabricSKUs.forEach((fabricSKU) => {
        if (fabricSKU) fetchSkusForFabric(fabricSKU);
      });
    }
  }, [open, items]);

  const fetchSkusForFabric = async (fabricSKU) => {
    try {
      setLoadingSkus((prev) => ({ ...prev, [fabricSKU]: true }));
      const response = await axiosInstance.get(`/fabrics/${fabricSKU}/shirt-skus`);
      setSkuOptions((prev) => ({ ...prev, [fabricSKU]: response.data.data || [] }));
    } catch (err) {
      console.error(`Failed to fetch SKUs for ${fabricSKU}`, err);
    } finally {
      setLoadingSkus((prev) => ({ ...prev, [fabricSKU]: false }));
    }
  };

  const handleInputChange = (index, field, value) => {
    const updatedItems = [...itemsData];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    if (field === "shirtSKUs") {
      const total = value.reduce((sum, s) => sum + (parseInt(s.quantity, 10) || 0), 0);
      updatedItems[index].shirtQuantity = total;
    }
    setItemsData(updatedItems);
  };

  const handleSkuQuantityChange = (itemIndex, skuIndex, value) => {
    const updatedItems = [...itemsData];
    const skus = [...updatedItems[itemIndex].shirtSKUs];
    const quant = value === "" ? "" : Math.max(0, parseInt(value, 10) || 0);
    skus[skuIndex] = { ...skus[skuIndex], quantity: quant };
    updatedItems[itemIndex].shirtSKUs = skus;
    const total = skus.reduce((sum, s) => sum + (parseInt(s.quantity, 10) || 0), 0);
    updatedItems[itemIndex].shirtQuantity = total;
    setItemsData(updatedItems);
  };

  const handleRemoveSku = (itemIndex, skuIndex) => {
    const updatedItems = [...itemsData];
    const skus = updatedItems[itemIndex].shirtSKUs.filter((_, i) => i !== skuIndex);
    updatedItems[itemIndex].shirtSKUs = skus;
    const total = skus.reduce((sum, s) => sum + (parseInt(s.quantity, 10) || 0), 0);
    updatedItems[itemIndex].shirtQuantity = total;
    setItemsData(updatedItems);
  };

  const commitSKUForItem = (index, raw) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    const parts = [...new Set(trimmed.split(",").map((p) => p.trim()).filter(Boolean))];
    const current = itemsData[index]?.shirtSKUs || [];
    const newSkus = parts
      .filter((p) => !current.find((s) => s.sku === p))
      .map((p) => ({ sku: p, quantity: "" }));
    const merged = [...current, ...newSkus];
    handleInputChange(index, "shirtSKUs", merged);
    setInputValues((prev) => ({ ...prev, [index]: "" }));
  };

  const handleSave = async () => {
    const invalidItems = itemsData.filter(
      (item) =>
        !item.shirtSKUs ||
        item.shirtSKUs.length === 0 ||
        item.shirtSKUs.some((s) => !s.quantity || s.quantity <= 0),
    );

    if (invalidItems.length > 0) {
      dispatch(
        showSnackbar({
          open: true,
          severity: "warning",
          message: "Please ensure all shirt SKUs have a valid quantity greater than 0.",
        }),
      );
      return;
    }

    try {
      setSubmitting(true);
      const updatePromises = itemsData.map(async (item) => {
        const fabricSkus = skuOptions[item.fabricSKU] || [];
        const newSkus = item.shirtSKUs
          .map((s) => s.sku)
          .filter((sku) => !fabricSkus.includes(sku));

        if (newSkus.length > 0) {
          try {
            await axiosInstance.post("/fabrics/shirt-mappings/bulk", {
              fabricSKU: item.fabricSKU,
              shirtSKUs: newSkus,
            });
          } catch (mappingErr) {
            console.error("Failed to create mapping", mappingErr);
          }
        }

        return axiosInstance.patch(`/delivery-memos/items/${item._id}`, {
          shirtSKUs: item.shirtSKUs,
          shirtQuantity: parseInt(item.shirtQuantity, 10),
          performedBy: user?._id,
        });
      });

      await Promise.all(updatePromises);
      dispatch(
        showSnackbar({ open: true, severity: "success", message: "All shirt details updated successfully!" }),
      );
      onSuccess();
      onClose();
    } catch (error) {
      dispatch(
        showSnackbar({
          open: true,
          severity: "error",
          message: error.response?.data?.message || "Failed to update shirt details.",
        }),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setItemsData([]);
      setSkuOptions({});
      setLoadingSkus({});
      setInputValues({});
      setActiveItemIndex(0);
      onClose();
    }
  };

  if (!items || items.length === 0) return null;

  const activeItem = itemsData[activeItemIndex];

  const isItemComplete = (item) =>
    item?.shirtSKUs?.length > 0 && item.shirtSKUs.every((s) => s.quantity > 0);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: { xs: 0, sm: "12px" },
          maxHeight: { xs: "100vh", sm: "90vh" },
          height: { xs: "100vh", sm: "auto" },
          m: { xs: 0, sm: 2 },
          boxShadow: "0 20px 40px rgba(0,0,0,0.12)",
          overflow: "hidden",
        },
      }}
    >
      {/* ── Header ── */}
      <DialogTitle sx={{ p: { xs: 2, sm: "18px 20px 14px" }, borderBottom: "0.5px solid #e5e7eb" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                width: 36, height: 36, borderRadius: "8px",
                backgroundColor: "#E6F1FB",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}
            >
              <Inventory sx={{ color: "#185FA5", fontSize: 18 }} />
            </Box>
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography sx={{ fontWeight: 500, fontSize: { xs: "15px", sm: "16px" }, color: "#111827" }}>
                  Edit shirt details
                </Typography>
                <Chip
                  label={`${completedCount}/${itemsData.length} complete`}
                  size="small"
                  sx={{
                    height: "20px",
                    fontSize: "11px",
                    fontWeight: 500,
                    backgroundColor: allComplete ? "#EAF3DE" : "#FAEEDA",
                    color: allComplete ? "#27500A" : "#633806",
                    "& .MuiChip-label": { px: 1 },
                  }}
                />
              </Box>
              <Typography sx={{ fontSize: "12px", color: "#6b7280", mt: "2px" }}>
                Configure {itemsData.length} item{itemsData.length !== 1 ? "s" : ""} — set SKUs and quantities
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={handleClose}
            disabled={submitting}
            size="small"
            sx={{ color: "#9ca3af", "&:hover": { backgroundColor: "#f3f4f6" } }}
          >
            <Close sx={{ fontSize: 20 }} />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* ── Step navigator (only if multiple items) ── */}
      {itemsData.length > 1 && (
        <Box
          sx={{
            px: 2.5, py: 1,
            borderBottom: "0.5px solid #e5e7eb",
            display: "flex", gap: 1, overflowX: "auto",
            "&::-webkit-scrollbar": { display: "none" },
          }}
        >
          {itemsData.map((item, i) => {
            const done = isItemComplete(item);
            const active = i === activeItemIndex;
            return (
              <Chip
                key={i}
                label={`Item ${i + 1}`}
                size="small"
                icon={
                  done ? (
                    <CheckCircle sx={{ fontSize: "12px !important", ml: "4px !important" }} />
                  ) : (
                    <Box
                      sx={{
                        width: 5, height: 5, borderRadius: "50%",
                        background: "currentColor", ml: "6px !important", flexShrink: 0,
                      }}
                    />
                  )
                }
                onClick={() => setActiveItemIndex(i)}
                sx={{
                  cursor: "pointer",
                  height: "26px",
                  fontSize: "11px",
                  fontWeight: active ? 500 : 400,
                  backgroundColor: done
                    ? "#EAF3DE"
                    : active
                    ? "#E6F1FB"
                    : "transparent",
                  color: done ? "#27500A" : active ? "#0C447C" : "#6b7280",
                  border: `0.5px solid ${done ? "#97C459" : active ? "#85B7EB" : "#d1d5db"}`,
                  "& .MuiChip-label": { px: 1 },
                }}
              />
            );
          })}
        </Box>
      )}

      {/* ── Body ── */}
      <DialogContent
        sx={{
          p: { xs: 2, sm: 2.5 },
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            overflowY: "auto",
            overflowX: "hidden",
            flex: 1,
            pr: 0.5,
            "&::-webkit-scrollbar": { width: "5px" },
            "&::-webkit-scrollbar-track": { backgroundColor: "#f1f5f9", borderRadius: "10px" },
            "&::-webkit-scrollbar-thumb": { backgroundColor: "#cbd5e1", borderRadius: "10px" },
          }}
        >
          {activeItem && (
            <Box sx={{ display: "flex", gap: { xs: 0, sm: "20px" }, flexDirection: { xs: "column", sm: "row" } }}>

              {/* ── Left: fabric panel ── */}
              <Box
                sx={{
                  width: { xs: "100%", sm: "152px" },
                  flexShrink: 0,
                  mb: { xs: 2, sm: 0 },
                }}
              >
                {/* Fabric image */}
                <Box
                  sx={{
                    width: "100%",
                    aspectRatio: "1 / 1",
                    borderRadius: "8px",
                    backgroundColor: "#f3f4f6",
                    border: "0.5px solid #e5e7eb",
                    overflow: "hidden",
                    mb: 1.5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {activeItem.imageUrl ? (
                    <Box
                      component="img"
                      src={resolveImageUrl(activeItem.imageUrl)}
                      alt="Fabric"
                      sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <Inventory sx={{ fontSize: 36, color: "#d1d5db" }} />
                  )}
                </Box>

                {/* Fabric meta */}
                {[
                  { label: "Fabric", value: activeItem.fabricTitle },
                  { label: "Color", value: activeItem.fabricColor },
                  { label: "Fabric SKU", value: activeItem.fabricSKU, mono: true },
                ].map(({ label, value, mono }) => (
                  <Box key={label} sx={{ mb: 1.2 }}>
                    <Typography sx={{ fontSize: "10px", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.4px", mb: "2px" }}>
                      {label}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: "13px", fontWeight: 500, color: "#111827",
                        fontFamily: mono ? "monospace" : "inherit",
                      }}
                    >
                      {value}
                    </Typography>
                  </Box>
                ))}

                {/* Allocated material */}
                <Box
                  sx={{
                    mt: 0.5,
                    p: "10px 12px",
                    borderRadius: "8px",
                    background: "#f0fdf4",
                    border: "0.5px solid #bbf7d0",
                  }}
                >
                  <Typography sx={{ fontSize: "10px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.4px", mb: "4px" }}>
                    Allocated material
                  </Typography>
                  <Typography sx={{ fontSize: "18px", fontWeight: 500, color: "#0F6E56" }}>
                    {parseFloat(activeItem.totalDhapFold || (activeItem.dhap || 0) * (activeItem.fold || 0)).toFixed(2)} m
                  </Typography>
                </Box>
              </Box>

              {/* ── Right: form ── */}
              <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>

                {/* SKU selector */}
                <Box>
                  <Typography sx={{ fontSize: "13px", fontWeight: 500, color: "#111827", mb: "4px" }}>
                    Shirt SKUs
                  </Typography>
                  <Typography sx={{ fontSize: "11px", color: "#6b7280", mb: 1 }}>
                    Select or type SKUs, press Enter to add
                  </Typography>

                  <Autocomplete
                    multiple
                    freeSolo
                    options={skuOptions[activeItem.fabricSKU] || []}
                    value={(activeItem.shirtSKUs || []).map((s) => s.sku)}
                    inputValue={inputValues[activeItemIndex] ?? ""}
                    onInputChange={(_, newVal, reason) => {
                      if (reason === "input" || reason === "reset") {
                        setInputValues((prev) => ({ ...prev, [activeItemIndex]: newVal }));
                      }
                    }}
                    onChange={(_, newValue) => {
                      const current = activeItem.shirtSKUs || [];
                      const updated = newValue.map((sku) => {
                        const existing = current.find((s) => s.sku === sku);
                        return existing ?? { sku, quantity: "" };
                      });
                      handleInputChange(activeItemIndex, "shirtSKUs", updated);
                    }}
                    disabled={loadingSkus[activeItem.fabricSKU] || submitting}
                    loading={loadingSkus[activeItem.fabricSKU]}
                    renderTags={() => null}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Select or type SKUs..."
                        size="small"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            commitSKUForItem(activeItemIndex, inputValues[activeItemIndex] ?? "");
                          }
                        }}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: "8px",
                            fontSize: "13px",
                            backgroundColor: "#fff",
                            "&:hover fieldset": { borderColor: "#85B7EB" },
                            "&.Mui-focused fieldset": { borderColor: "#378ADD", borderWidth: "1.5px" },
                          },
                        }}
                      />
                    )}
                  />
                </Box>

                {/* SKU rows */}
                {(activeItem.shirtSKUs || []).length > 0 && (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    {(activeItem.shirtSKUs || []).map((skuData, skuIdx) => {
                      const hasQty = skuData.quantity > 0;
                      return (
                        <Box
                          key={skuIdx}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                            p: "8px 12px",
                            borderRadius: "8px",
                            background: "#f8fafc",
                            border: `0.5px solid ${hasQty ? "#bbf7d0" : "#e2e8f0"}`,
                            transition: "border-color 0.15s, background 0.15s",
                            "&:focus-within": {
                              borderColor: "#85B7EB",
                              background: "#fff",
                            },
                          }}
                        >
                          {/* Status dot */}
                          <Box
                            sx={{
                              width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
                              background: hasQty ? "#22c55e" : "#d1d5db",
                              transition: "background 0.2s",
                            }}
                          />

                          <Typography sx={{ flex: 1, fontSize: "13px", fontWeight: 500, color: "#374151", minWidth: 0 }}>
                            {skuData.sku}
                          </Typography>

                          <Typography sx={{ fontSize: "11px", color: "#9ca3af", whiteSpace: "nowrap" }}>
                            Qty
                          </Typography>

                          <TextField
                            type="number"
                            size="small"
                            placeholder="0"
                            value={skuData.quantity === "" ? "" : skuData.quantity}
                            onChange={(e) => handleSkuQuantityChange(activeItemIndex, skuIdx, e.target.value)}
                            inputProps={{ min: 1, style: { textAlign: "center", padding: "5px 8px" } }}
                            sx={{
                              width: "72px",
                              "& .MuiOutlinedInput-root": {
                                borderRadius: "6px",
                                fontSize: "13px",
                                fontWeight: 500,
                                background: "#fff",
                                "&:hover fieldset": { borderColor: "#85B7EB" },
                                "&.Mui-focused fieldset": { borderColor: "#378ADD" },
                              },
                            }}
                          />

                          <Tooltip title="Remove SKU">
                            <IconButton
                              size="small"
                              onClick={() => handleRemoveSku(activeItemIndex, skuIdx)}
                              sx={{
                                width: 24, height: 24,
                                color: "#9ca3af",
                                "&:hover": { background: "#FCEBEB", color: "#A32D2D" },
                              }}
                            >
                              <Close sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      );
                    })}
                  </Box>
                )}

                {/* No mappings hint */}
                {(skuOptions[activeItem.fabricSKU] || []).length === 0 &&
                  !loadingSkus[activeItem.fabricSKU] && (
                    <Box
                      sx={{
                        p: "10px 14px",
                        borderRadius: "8px",
                        background: "#FAEEDA",
                        border: "0.5px solid #EF9F27",
                      }}
                    >
                      <Typography sx={{ fontSize: "12px", color: "#633806", lineHeight: 1.5 }}>
                        No existing mappings found. Type a new SKU above to create one.
                      </Typography>
                    </Box>
                  )}

                {/* Total quantity summary */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    p: "10px 14px",
                    borderRadius: "8px",
                    background: "#f8fafc",
                    border: "0.5px solid #e2e8f0",
                    mt: "auto",
                  }}
                >
                  <Typography sx={{ fontSize: "12px", color: "#6b7280" }}>
                    Total quantity
                  </Typography>
                  <Typography sx={{ fontSize: "20px", fontWeight: 500, color: "#111827" }}>
                    {activeItem.shirtQuantity || 0}
                  </Typography>
                </Box>

                {/* Next item button */}
                {itemsData.length > 1 && activeItemIndex < itemsData.length - 1 && (
                  <Button
                    variant="outlined"
                    endIcon={<ArrowForward sx={{ fontSize: 14 }} />}
                    onClick={() => setActiveItemIndex((i) => i + 1)}
                    disabled={!isItemComplete(activeItem)}
                    sx={{
                      textTransform: "none",
                      fontSize: "12px",
                      fontWeight: 500,
                      height: "34px",
                      borderColor: "#85B7EB",
                      color: "#185FA5",
                      alignSelf: "flex-end",
                      "&:hover": { borderColor: "#378ADD", background: "#E6F1FB" },
                      "&:disabled": { borderColor: "#e5e7eb", color: "#9ca3af" },
                    }}
                  >
                    Next item
                  </Button>
                )}
              </Box>
            </Box>
          )}
        </Box>
      </DialogContent>

      {/* ── Footer ── */}
      <Divider sx={{ borderColor: "#e5e7eb" }} />
      <DialogActions sx={{ p: { xs: 2, sm: "14px 20px" }, gap: 1 }}>
        <Button
          onClick={handleClose}
          disabled={submitting}
          sx={{
            textTransform: "none",
            color: "#6b7280",
            fontWeight: 500,
            fontSize: "13px",
            px: 2,
            borderRadius: "8px",
            "&:hover": { background: "#f3f4f6" },
          }}
        >
          Cancel
        </Button>

        <Tooltip title={!allComplete ? "Fill in all SKU quantities to save" : ""}>
          <span>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={submitting || !allComplete}
              startIcon={!submitting && <CheckCircle sx={{ fontSize: "16px !important" }} />}
              sx={{
                textTransform: "none",
                backgroundColor: "#185FA5",
                fontWeight: 500,
                fontSize: "13px",
                px: 2.5,
                borderRadius: "8px",
                boxShadow: "none",
                "&:hover": { backgroundColor: "#0C447C", boxShadow: "none" },
                "&:disabled": { backgroundColor: "#e5e7eb", color: "#9ca3af", boxShadow: "none" },
              }}
            >
              {submitting ? "Saving..." : `Save all (${completedCount}/${itemsData.length})`}
            </Button>
          </span>
        </Tooltip>
      </DialogActions>
    </Dialog>
  );
};

export default EditShirtDetailsModal;