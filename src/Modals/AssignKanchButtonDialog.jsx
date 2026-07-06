import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import React from "react";
import { CreateButton } from "../components/Styled";

const AssignKanchButtonDialog = ({
  dialogOpen,
  handleCloseDialog,
  tailorForm,
  setTailorForm,
  formErrors,
  submitting,
  handleAssignTailor,
}) => {
  return (
    <Dialog
      open={dialogOpen}
      onClose={handleCloseDialog}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ fontWeight: 600, fontSize: "18px" }}>
        Assign Kanch Button Worker
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label="Worker Name"
            value={tailorForm.name}
            onChange={(e) => {
              const value = e.target.value.replace(/[0-9]/g, "");
              setTailorForm({ ...tailorForm, name: value });
            }}
            error={!!formErrors.name}
            helperText={formErrors.name}
            fullWidth
            required
            autoFocus
          />
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
            helperText={formErrors.phoneNumber}
            fullWidth
            required
            placeholder="10 digit number"
          />
          
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={handleCloseDialog}
          sx={{ textTransform: "none" ,color:"#667eea"}}
          disabled={submitting}
        >
          Cancel
        </Button>
        <CreateButton
          onClick={handleAssignTailor}
          variant="contained"
          disabled={submitting}
        >
          {submitting ? "Assigning..." : "Assign Worker"}
        </CreateButton>
      </DialogActions>
    </Dialog>
  );
};

export default AssignKanchButtonDialog;
