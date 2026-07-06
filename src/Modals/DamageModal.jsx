// components/DamageModal.jsx
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from "@mui/material";

const DamageModal = ({ open, onClose, item, quantity, setQuantity, notes, setNotes, loading, onConfirm }) => {
  const availableShirts = (item?.shirtQuantity || 0) - parseFloat(item?.damagedQuantity || 0);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Mark Item Damage</DialogTitle>
      <DialogContent>
        <Typography sx={{ fontSize: 13, mb: 2, mt: 1 }}>
          {item?.fabricTitle} ({item?.fabricSKU})
        </Typography>
        <TextField
          label="Damaged Quantity (shirts)"
          type="number"
          fullWidth
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          onWheel={(e) => e.target.blur()}
          inputProps={{ min: 1, max: availableShirts }}
          helperText={`Available: ${availableShirts} shirts`}
          sx={{ mb: 2 }}
        />
        <TextField
          label="Notes (optional)"
          fullWidth
          multiline
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          color="error"
          disabled={loading || !quantity || Number(quantity) < 1 || Number(quantity) > availableShirts}
          onClick={onConfirm}
        >
          {loading ? "Saving..." : "Confirm Damage"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DamageModal;