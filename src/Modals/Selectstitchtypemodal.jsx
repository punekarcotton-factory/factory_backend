import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  Chip,
  CircularProgress,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import axiosInstance from "../utils/axiosInstance";
import { showSnackbar } from "../Slice/snackbarSlice";

const SelectStitchTypeModal = ({ open, onClose, memo, onSuccess }) => {
  const dispatch = useDispatch();
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [options, setOptions] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  useEffect(() => {
    if (open) {
      fetchOptions();
      // Reset selected options when opening
      setSelectedOptions([]);
    }
  }, [open]);

  const fetchOptions = async () => {
    try {
      setLoadingOptions(true);
      const res = await axiosInstance.get("/pre-stitchers/options");
      setOptions(res.data?.data || []);
    } catch (err) {
      console.error("Error fetching stitch options", err);
      dispatch(
        showSnackbar({
          open: true,
          message: "Failed to load stitch options",
          severity: "error",
        })
      );
      setOptions([]);
    } finally {
      setLoadingOptions(false);
    }
  };

  const handleSelectionChange = (event) => {
    setSelectedOptions(event.target.value);
  };

  const handleClose = () => {
    if (!loadingOptions) {
      setSelectedOptions([]);
      onClose();
    }
  };

  const handleConfirm = () => {
    if (selectedOptions.length === 0) {
      dispatch(
        showSnackbar({
          open: true,
          message: "Please select at least one stitch type",
          severity: "warning",
        })
      );
      return;
    }

    onSuccess(selectedOptions);
    handleClose();
  };

  if (!memo) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "12px",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pb: 1,
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "18px" }}>
            Select Stitch Types
          </Typography>
          <Typography sx={{ fontSize: "13px", color: "#6b7280", mt: 0.5 }}>
            Choose operations for this delivery memo
          </Typography>
        </Box>
        <IconButton
          onClick={handleClose}
          disabled={loadingOptions}
          sx={{ color: "#6b7280" }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Box
          sx={{
            p: 2,
            backgroundColor: "#f9fafb",
            borderRadius: "8px",
            mb: 3,
          }}
        >
          <Typography
            sx={{ fontSize: "11px", color: "#6b7280", fontWeight: 600 }}
          >
            Delivery Memo Details
          </Typography>
          <Typography sx={{ fontSize: "13px", fontWeight: 600, mt: 0.5 }}>
            {memo.items?.length || 0} items • Total: {memo.totalDhapFold || 0} m
          </Typography>
          <Box sx={{ display: "flex", gap: 1, mt: 1, flexWrap: "wrap" }}>
            {memo.items?.slice(0, 3).map((item, idx) => (
              <Chip
                key={idx}
                label={item.fabricColor}
                size="small"
                sx={{
                  fontSize: "10px",
                  height: "20px",
                  backgroundColor: "#e5e7eb",
                }}
              />
            ))}
            {memo.items?.length > 3 && (
              <Chip
                label={`+${memo.items.length - 3} more`}
                size="small"
                sx={{
                  fontSize: "10px",
                  height: "20px",
                  backgroundColor: "#e5e7eb",
                }}
              />
            )}
          </Box>
        </Box>

        <FormControl fullWidth>
          <InputLabel id="stitch-type-select-label">
            Stitch Type Operations
          </InputLabel>
          <Select
            labelId="stitch-type-select-label"
            label="Stitch Type Operations"
            multiple
            value={selectedOptions}
            onChange={handleSelectionChange}
            disabled={loadingOptions}
            renderValue={(selected) => (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {selected.map((value) => {
                  const option = options.find((opt) => opt.key === value);
                  return (
                    <Chip
                      key={value}
                      label={option?.label || value}
                      size="small"
                      sx={{
                        backgroundColor: "#667eea",
                        color: "#ffffff",
                        fontWeight: 600,
                        fontSize: "11px",
                      }}
                    />
                  );
                })}
              </Box>
            )}
            MenuProps={{
              PaperProps: {
                style: {
                  maxHeight: 300,
                },
              },
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "8px",
              },
            }}
          >
            {loadingOptions ? (
              <MenuItem disabled>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    py: 1,
                  }}
                >
                  <CircularProgress size={20} />
                  <Typography>Loading options...</Typography>
                </Box>
              </MenuItem>
            ) : options.length > 0 ? (
              options.map((option) => (
                <MenuItem key={option.key} value={option.key}>
                  <Checkbox checked={selectedOptions.indexOf(option.key) > -1} />
                  <ListItemText
                    primary={option.label}
                    secondary={option.description}
                  />
                </MenuItem>
              ))
            ) : (
              <MenuItem disabled>No stitch options available</MenuItem>
            )}
          </Select>
        </FormControl>

        {selectedOptions.length > 0 && (
          <Box
            sx={{
              mt: 2,
              p: 2,
              backgroundColor: "#f0f9ff",
              borderRadius: "8px",
              border: "1px solid #3b82f6",
            }}
          >
            <Typography
              sx={{
                fontSize: "11px",
                color: "#1e40af",
                fontWeight: 600,
                mb: 1,
              }}
            >
              SELECTED OPERATIONS ({selectedOptions.length})
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {selectedOptions.map((value) => {
                const option = options.find((opt) => opt.key === value);
                return (
                  <Chip
                    key={value}
                    label={option?.label || value}
                    size="small"
                    onDelete={() => {
                      setSelectedOptions(
                        selectedOptions.filter((opt) => opt !== value)
                      );
                    }}
                    sx={{
                      backgroundColor: "#dbeafe",
                      color: "#1e40af",
                      fontWeight: 600,
                      "& .MuiChip-deleteIcon": {
                        color: "#1e40af",
                      },
                    }}
                  />
                );
              })}
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
        <Button
          onClick={handleClose}
          disabled={loadingOptions}
          sx={{
            textTransform: "none",
            color: "#6b7280",
            fontWeight: 600,
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={loadingOptions || selectedOptions.length === 0}
          sx={{
            textTransform: "none",
            backgroundColor: "#667eea",
            fontWeight: 600,
            px: 3,
            "&:hover": {
              backgroundColor: "#5a74ec",
            },
          }}
        >
          Confirm Selection
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SelectStitchTypeModal;