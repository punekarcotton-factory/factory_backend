import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Autocomplete,
  Typography,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  FormGroup,
} from "@mui/material";
import { useDispatch } from "react-redux";
import { CreateButton } from "../components/Styled";
import { showSnackbar } from "../Slice/snackbarSlice";
import axiosInstance from "../utils/axiosInstance";

const AssignTailorDialog = ({
  open,
  onClose,
  tailorForm,
  setTailorForm,
  formErrors,
  submitting,
  onAssign,
}) => {
  const [tailors, setTailors] = useState([]);
  const [loadingTailors, setLoadingTailors] = useState(false);
  const [selectedTailor, setSelectedTailor] = useState(null);
  const dispatch = useDispatch();

  useEffect(() => {
    if (open) {
      setSelectedTailor(null);
      fetchTailors();
    }
  }, [open]);

  const fetchTailors = async () => {
    try {
      setLoadingTailors(true);
      const response = await axiosInstance.get("/users/role/tailor");
      console.log("Fetched tailors:", response.data.data);
      setTailors(response.data.data || []);
    } catch (error) {
      console.error("Error fetching tailors:", error);
      dispatch(
        showSnackbar({
          open: true,
          severity: "error",
          message: "Failed to load tailors list",
        })
      );
    } finally {
      setLoadingTailors(false);
    }
  };

  const handleTailorSelect = (event, value) => {
    console.log("Selected tailor:", value);
    setSelectedTailor(value);
    
    if (value) {
      // FIXED: Preserve existing checkbox values, only update name and phone
      setTailorForm({
        ...tailorForm,  // Keep existing values including checkboxes
        name: `${value.firstName} ${value.lastName}`,
        phoneNumber: value.phone || "",
      });
    } else {
      // Cleared - reset everything 
      setTailorForm({
        name: "",
        phoneNumber: "",
        cuff: false,
        ghera: false,
        collar: false,
      });
    }
  };

  const handleCheckboxChange = (field) => (event) => {
    console.log(`Checkbox ${field} changed to:`, event.target.checked); // Debug log
    setTailorForm({ ...tailorForm, [field]: event.target.checked });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 600, fontSize: "18px" }}>
        Assign Tailor
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
          {/* Tailor Name Autocomplete */}
          <Autocomplete
            options={tailors}
            value={selectedTailor}
            onChange={handleTailorSelect}
            loading={loadingTailors}
            filterOptions={(options, state) => {
              const inputValue = state.inputValue.toLowerCase().trim();
              if (!inputValue) return options;
              
              return options.filter((option) => {
                const fullName = `${option.firstName || ''} ${option.lastName || ''}`.toLowerCase();
                const phone = (option.phone || '').toString();
                return (
                  fullName.includes(inputValue) ||
                  phone.includes(inputValue) ||
                  (option.firstName || '').toLowerCase().includes(inputValue) ||
                  (option.lastName || '').toLowerCase().includes(inputValue)
                );
              });
            }}
            getOptionLabel={(option) => {
              return `${option.firstName || ""} ${option.lastName || ""}`.trim();
            }}
            renderOption={(props, option) => {
              const { key, ...otherProps } = props;
              return (
                <li key={option._id || option.id} {...otherProps}>
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {option.firstName} {option.lastName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.phone || "No phone number"}
                    </Typography>
                  </Box>
                </li>
              );
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Tailor Name"
                error={!!formErrors.name}
                helperText={formErrors.name || `${tailors.length} tailors available`}
                required
                autoFocus
                placeholder="Search and select a tailor"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loadingTailors ? (
                        <CircularProgress color="inherit" size={20} />
                      ) : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />

          {/* Phone Number */}
          <TextField
            label="Phone Number"
            value={tailorForm.phoneNumber}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "");
              if (value.length <= 10) {
                setTailorForm({ ...tailorForm, phoneNumber: value });
              }
            }}
            error={!!formErrors.phoneNumber}
            helperText={formErrors.phoneNumber || "10 digit mobile number"}
            fullWidth
            required
            placeholder="Enter 10 digit number"
          />

          {/* Divider */}
          <Box
            sx={{
              borderTop: "1px solid #e5e7eb",
              pt: 2,
              mt: 1,
            }}
          >
            <Typography
              sx={{
                fontSize: "13px",
                fontWeight: 600,
                color: "#6b7280",
                mb: 2,
              }}
            >
              Item Types (Optional)
            </Typography>

            {/* Cuff, Ghera, Collar Checkboxes */}
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={tailorForm.cuff || false}
                    onChange={handleCheckboxChange("cuff")}
                  />
                }
                label="Cuff"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={tailorForm.ghera || false}
                    onChange={handleCheckboxChange("ghera")}
                  />
                }
                label="Ghera"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={tailorForm.collar || false}
                    onChange={handleCheckboxChange("collar")}
                  />
                }
                label="Collar"
              />
            </FormGroup>

            <Typography
              sx={{
                fontSize: "11px",
                color: "#9ca3af",
                mt: 1,
                fontStyle: "italic",
              }}
            >
              Select applicable item types
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={{ textTransform: "none" }} disabled={submitting}>
          Cancel
        </Button>
        <CreateButton
          onClick={onAssign}
          variant="contained"
          disabled={submitting}
        >
          {submitting ? "Assigning..." : "Assign Tailor"}
        </CreateButton>
      </DialogActions>
    </Dialog>
  );
};

export default AssignTailorDialog;