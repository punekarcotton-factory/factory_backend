import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField,
  IconButton,
} from "@mui/material";
import { Close as CloseIcon, Checklist, Warning } from "@mui/icons-material";
import { useDispatch } from "react-redux";
import { showSnackbar } from "../Slice/snackbarSlice";

const FullAssignConfirmDialog = ({ open, onCancel, onConfirm, loading }) => (
  <Dialog
    open={open}
    onClose={onCancel}
    maxWidth="xs"
    fullWidth
    PaperProps={{
      sx: { borderRadius: "12px", boxShadow: "0 20px 40px rgba(0,0,0,0.12)" },
    }}
  >
    <DialogTitle sx={{ p: "18px 20px 12px" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box
          sx={{
            width: 36, height: 36, borderRadius: "8px",
            backgroundColor: "#FAEEDA",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}
        >
          <Warning sx={{ color: "#854F0B", fontSize: 20 }} />
        </Box>
        <Typography sx={{ fontWeight: 500, fontSize: "15px", color: "#111827" }}>
          Assign full quantity?
        </Typography>
      </Box>
    </DialogTitle>

    <DialogContent sx={{ px: "20px", pb: "4px" }}>
      <Typography sx={{ fontSize: "13px", color: "#4b5563", lineHeight: 1.6 }}>
        You've entered the full available quantity for every SKU. This is the same as moving the entire memo to the next stage.
      </Typography>
      <Box
        sx={{
          mt: 1.5, p: "10px 14px",
          borderRadius: "8px",
          background: "#FAEEDA",
          border: "0.5px solid #EF9F27",
        }}
      >
        <Typography sx={{ fontSize: "12px", color: "#633806", lineHeight: 1.5 }}>
          Consider using <strong>Move to Pre-Stitching</strong> instead — it's simpler and keeps your workflow clean. Proceed only if you specifically need a partial assign record.
        </Typography>
      </Box>
    </DialogContent>

    <DialogActions sx={{ p: "16px 20px", gap: 1 }}>
      <Button
        onClick={onCancel}
        disabled={loading}
        sx={{
          textTransform: "none", fontSize: "13px", fontWeight: 500,
          color: "#6b7280", borderRadius: "8px",
          "&:hover": { background: "#f3f4f6" },
        }}
      >
        Go back
      </Button>
      <Button
        onClick={onConfirm}
        disabled={loading}
        variant="contained"
        sx={{
          textTransform: "none", fontSize: "13px", fontWeight: 500,
          backgroundColor: "#854F0B", borderRadius: "8px", boxShadow: "none",
          "&:hover": { backgroundColor: "#633806", boxShadow: "none" },
        }}
      >
        {loading ? "Processing..." : "Yes, proceed anyway"}
      </Button>
    </DialogActions>
  </Dialog>
);

const PartialAssignModal = ({ open, onClose, memo, onSubmit, loading }) => {
  const dispatch = useDispatch();
  const [partialData, setPartialData] = useState({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingPayload, setPendingPayload] = useState(null);

  useEffect(() => {
    if (memo && open) {
      const initialData = {};
      memo.items?.forEach((item) => {
        if (item.shirtSKUs && item.shirtSKUs.length > 0) {
          initialData[item._id] = {};
          item.shirtSKUs.forEach((skuObj) => {
            initialData[item._id][skuObj.sku] = {
              max: skuObj.quantity,
              partial: 0,
            };
          });
        }
      });
      setPartialData(initialData);
    }
  }, [memo, open]);

  const handlePartialChange = (itemId, sku, value) => {
    const val = value === "" ? "" : parseInt(value, 10);
    const max = partialData[itemId][sku].max;
    if (val !== "" && (isNaN(val) || val < 0)) return;
    if (val !== "" && val > max) return;
    setPartialData((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [sku]: { ...prev[itemId][sku], partial: val },
      },
    }));
  };

  const buildPayload = () => {
    const payloadItems = [];
    let totalPartial = 0;
    let totalMax = 0;

    for (const itemId in partialData) {
      const partialShirtSKUs = [];
      for (const sku in partialData[itemId]) {
        const qty = parseInt(partialData[itemId][sku].partial, 10) || 0;
        const max = partialData[itemId][sku].max;
        totalMax += max;
        if (qty > 0) {
          partialShirtSKUs.push({ sku, quantity: qty });
          totalPartial += qty;
        }
      }
      if (partialShirtSKUs.length > 0) {
        payloadItems.push({ itemId, partialShirtSKUs });
      }
    }

    return { payloadItems, totalPartial, totalMax };
  };

  const handleSubmit = () => {
    const { payloadItems, totalPartial, totalMax } = buildPayload();

    if (totalPartial === 0) {
      dispatch(
        showSnackbar({ open: true, severity: "warning", message: "Please assign at least one item." })
      );
      return;
    }

    // Check if user entered 100% of all quantities
    const isFullAssignment = totalPartial === totalMax;

    if (isFullAssignment) {
      setPendingPayload(payloadItems);
      setConfirmOpen(true);
      return;
    }

    onSubmit(payloadItems);
  };

  const handleConfirmProceed = () => {
    setConfirmOpen(false);
    onSubmit(pendingPayload);
    setPendingPayload(null);
  };

  const handleConfirmCancel = () => {
    setConfirmOpen(false);
    setPendingPayload(null);
  };

  const handleClose = () => {
    if (!loading) {
      setConfirmOpen(false);
      setPendingPayload(null);
      onClose();
    }
  };

  if (!memo) return null;

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: "12px", boxShadow: "0 20px 40px rgba(0,0,0,0.12)" } }}
      >
        <DialogTitle sx={{ p: "18px 20px 14px", borderBottom: "0.5px solid #e5e7eb" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box
                sx={{
                  width: 36, height: 36, borderRadius: "8px",
                  backgroundColor: "#E6F1FB",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <Checklist sx={{ color: "#185FA5", fontSize: 20 }} />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 500, fontSize: "15px", color: "#111827" }}>
                  Partial assign to pre-stitcher
                </Typography>
                <Typography sx={{ fontSize: "12px", color: "#6b7280", mt: "2px" }}>
                  Enter the quantity of each SKU to move forward
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={handleClose} size="small" disabled={loading}
              sx={{ color: "#9ca3af", "&:hover": { background: "#f3f4f6" } }}
            >
              <CloseIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: "20px" }}>
          {memo.items?.map((item) => (
            <Box key={item._id} sx={{ mb: 3 }}>
              <Typography
                sx={{
                  fontWeight: 500, fontSize: "13px", color: "#374151",
                  borderBottom: "0.5px solid #e5e7eb", pb: 1, mb: 1.5,
                }}
              >
                {item.fabricTitle} ({item.fabricColor}) — {item.fabricSKU}
              </Typography>

              {!partialData[item._id] ? (
                <Box
                  sx={{
                    p: "10px 14px", borderRadius: "8px",
                    background: "#FAEEDA", border: "0.5px solid #EF9F27",
                  }}
                >
                  <Typography sx={{ fontSize: "12px", color: "#633806" }}>
                    No shirt SKUs configured for this item.
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {Object.keys(partialData[item._id] || {}).map((sku) => {
                    const { max, partial } = partialData[item._id][sku];
                    const isMax = (parseInt(partial, 10) || 0) === max;
                    return (
                      <Box
                        key={sku}
                        sx={{
                          display: "flex", alignItems: "center",
                          justifyContent: "space-between",
                          p: "8px 12px", borderRadius: "8px",
                          background: "#f8fafc",
                          border: `0.5px solid ${isMax ? "#EF9F27" : "#e2e8f0"}`,
                          transition: "border-color 0.15s",
                          "&:focus-within": { borderColor: "#85B7EB", background: "#fff" },
                        }}
                      >
                        <Box>
                          <Typography sx={{ fontSize: "13px", fontWeight: 500, color: "#374151" }}>
                            {sku}
                          </Typography>
                          <Typography sx={{ fontSize: "11px", color: "#9ca3af" }}>
                            Max: {max}
                          </Typography>
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          {isMax && (
                            <Typography sx={{ fontSize: "10px", color: "#854F0B", fontWeight: 500 }}>
                              Full qty
                            </Typography>
                          )}
                          <TextField
                            size="small"
                            type="number"
                            placeholder="0"
                            value={partial === 0 ? "" : partial}
                            onChange={(e) => handlePartialChange(item._id, sku, e.target.value)}
                            inputProps={{
                              min: 0, max,
                              style: { padding: "5px 8px", width: "60px", textAlign: "center" },
                            }}
                            sx={{
                              "& .MuiOutlinedInput-root": {
                                borderRadius: "6px", fontSize: "13px", fontWeight: 500,
                                background: "#fff",
                                "&:hover fieldset": { borderColor: "#85B7EB" },
                                "&.Mui-focused fieldset": { borderColor: "#378ADD" },
                              },
                            }}
                          />
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Box>
          ))}
        </DialogContent>

        <DialogActions sx={{ p: "14px 20px", borderTop: "0.5px solid #e5e7eb", gap: 1 }}>
          <Button
            onClick={handleClose}
            disabled={loading}
            sx={{
              textTransform: "none", fontSize: "13px", fontWeight: 500,
              color: "#6b7280", borderRadius: "8px",
              "&:hover": { background: "#f3f4f6" },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
            sx={{
              textTransform: "none", fontSize: "13px", fontWeight: 500,
              backgroundColor: "#185FA5", borderRadius: "8px", boxShadow: "none",
              "&:hover": { backgroundColor: "#0C447C", boxShadow: "none" },
            }}
          >
            {loading ? "Processing..." : "Submit partial assign"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation dialog — shown only when full qty is entered */}
      <FullAssignConfirmDialog
        open={confirmOpen}
        onCancel={handleConfirmCancel}
        onConfirm={handleConfirmProceed}
        loading={loading}
      />
    </>
  );
};

export default PartialAssignModal;