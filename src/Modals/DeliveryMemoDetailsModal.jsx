import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  Chip,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Typography,
  Stack,
  Avatar,
  Paper,
  Dialog,
  DialogActions,
  Button,
  TextField,
} from "@mui/material";
import {
  Close,
  Timeline,
  Person,
  CheckCircle,
  LocalShipping,
  Assignment,
  History,
  Inventory,
  Edit,
} from "@mui/icons-material";
import { DialogBox, DialogHeader } from "../components/Styled";
import { resolveImageUrl } from "../config";
import { getMemoTitle } from "../utils/deliveryMemo";
import axiosInstance from "../utils/axiosInstance";

const DeliveryMemoDetailsModal = ({ open, memo, onClose }) => {
  const [editOpen, setEditOpen] = useState(false);
  const [newDmNumber, setNewDmNumber] = useState(memo?.dmNumber || "");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (memo) {
      setNewDmNumber(memo.dmNumber || "");
    }
  }, [memo]);

  const handleSaveDmNumber = async () => {
    setUpdating(true);
    try {
      await axiosInstance.put(`/delivery-memos/${memo._id}`, { dmNumber: newDmNumber });
      setEditOpen(false);
      // Mutate prop locally for immediate reflection in this modal
      memo.dmNumber = newDmNumber;
    } catch (error) {
      console.error("Failed to update DM Number:", error);
    } finally {
      setUpdating(false);
    }
  };

  if (!memo) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "CLOSED":
        return { bg: "#f0fdf4", text: "#166534", border: "#86efac", icon: <CheckCircle /> };
      case "ACTIVE":
      default:
        return { bg: "#eff6ff", text: "#1e40af", border: "#93c5fd", icon: <Inventory /> };
    }
  };

  const statusStyle = getStatusColor(memo.status);

  return (
    <DialogBox open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ p: 0 }}>
        <Box
          sx={{
            p: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#667eea",
            color: "#ffffff",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)" }}>
              <LocalShipping />
            </Avatar>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                  Delivery Memo Details
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography sx={{ fontSize: "14px", fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>
                    {memo.dmNumber && memo.dmNumber.trim() !== "" ? `DM Number: ${memo.dmNumber}` : getMemoTitle(memo)}
                  </Typography>
                  <IconButton size="small" sx={{ color: "rgba(255,255,255,0.9)" }} onClick={() => setEditOpen(true)}>
                    <Edit sx={{ fontSize: 16 }} />
                  </IconButton>
                </Box>
               
              </Box>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Chip
              label={memo.status || "ACTIVE"}
              size="small"
              sx={{
                bgcolor: "rgba(255,255,255,0.2)",
                color: "#ffffff",
                fontWeight: 600,
                fontSize: "12px",
                border: "1px solid rgba(255,255,255,0.3)",
              }}
            />
            <IconButton onClick={onClose} sx={{ color: "#ffffff" }}>
              <Close />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0, bgcolor: "#f8fafc" }}>
        <Box sx={{ p: 3 }}>
          <Grid container spacing={3}>
            {/* Left Column: Info and Items */}
            <Grid item xs={12} md={7}>
              <Stack spacing={3}>
                {/* Status & Assignment Summary */}
                <Paper sx={{ p: 2, borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                  <Typography variant="subtitle2" sx={{ color: "#64748b", mb: 2, fontWeight: 700, textTransform: "uppercase" }}>
                    Quick Summary
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box>
                        <Typography sx={{ fontSize: "11px", color: "#64748b" }}>CURRENT STAGE</Typography>
                        <Chip 
                          label={memo.stage?.replace(/_/g, " ") || "N/A"} 
                          size="small" 
                          color="primary" 
                          variant="outlined"
                          sx={{ mt: 0.5, fontWeight: 600, fontSize: "11px" }}
                        />
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box>
                        <Typography sx={{ fontSize: "11px", color: "#64748b" }}>STATUS</Typography>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5, color: statusStyle.text }}>
                          {statusStyle.icon}
                          <Typography sx={{ fontWeight: 700, fontSize: "13px" }}>{memo.status}</Typography>
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Box>
                    <Typography sx={{ fontSize: "11px", color: "#64748b", mb: 1 }}>ASSIGNED PERSONNEL</Typography>
                    {memo.assignedTo && memo.assignedTo.length > 0 ? (
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                        {memo.assignedTo.map((name, i) => (
                          <Chip 
                            key={i} 
                            icon={<Person sx={{ fontSize: "14px !important" }} />} 
                            label={name} 
                            size="small"
                            sx={{ bgcolor: "#f1f5f9", fontWeight: 500 }}
                          />
                        ))}
                      </Box>
                    ) : (
                      <Typography sx={{ fontSize: "13px", color: "#94a3b8", fontStyle: "italic" }}>No personnel assigned yet</Typography>
                    )}
                  </Box>
                </Paper>

                {/* Items Section */}
                <Box>
                  <Typography variant="subtitle2" sx={{ color: "#1e293b", mb: 1.5, fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }}>
                    <Inventory sx={{ fontSize: 18 }} /> ITEMS ({memo.itemCount})
                  </Typography>
                  <Stack spacing={2}>
                    {memo.items?.map((item, idx) => (
                      <Card key={idx} sx={{ p: 2, borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                        <Box sx={{ display: "flex", gap: 2 }}>
                          {item.imageUrl && (
                            <Box 
                              component="img" 
                              src={resolveImageUrl(item.imageUrl)} 
                              sx={{ width: 60, height: 60, borderRadius: "8px", objectFit: "cover", border: "1px solid #e2e8f0" }}
                            />
                          )}
                          <Box sx={{ flex: 1 }}>
                            <Typography sx={{ fontWeight: 600, fontSize: "14px" }}>{item.fabricTitle}</Typography>
                            <Typography sx={{ fontSize: "12px", color: "#64748b" }}>SKU: {item.fabricSKU} • {item.fabricColor}</Typography>
                            <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                              <Chip label={`Qty: ${item.shirtQuantity || 0}`} size="small" sx={{ fontSize: "10px", height: "18px" }} />
                              <Chip label={`Total: ${item.totalDhapFold}m`} size="small" sx={{ fontSize: "10px", height: "18px", bgcolor: "#f0fdf4", color: "#166534" }} />
                            </Box>
                          </Box>
                        </Box>
                      </Card>
                    ))}
                  </Stack>
                </Box>
              </Stack>
            </Grid>

            {/* Right Column: Timeline */}
            <Grid item xs={12} md={5}>
              <Paper sx={{ p: 2, borderRadius: "12px", height: "100%", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                <Typography variant="subtitle2" sx={{ color: "#1e293b", mb: 2, fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }}>
                  <History sx={{ fontSize: 18 }} /> STAGE HISTORY
                </Typography>
                
                <Box sx={{ position: "relative", pl: 3 }}>
                  {/* Vertical Line */}
                  <Box 
                    sx={{ 
                      position: "absolute", 
                      left: "7px", 
                      top: "10px", 
                      bottom: "10px", 
                      width: "2px", 
                      bgcolor: "#e2e8f0" 
                    }} 
                  />
                  
                  <Stack spacing={3}>
                    {memo.stageHistory?.sort((a,b) => new Date(b.enteredAt) - new Date(a.enteredAt)).map((history, i) => (
                      <Box key={i} sx={{ position: "relative" }}>
                        {/* Dot */}
                        <Box 
                          sx={{ 
                            position: "absolute", 
                            left: "-28px", 
                            top: "4px", 
                            width: "12px", 
                            height: "12px", 
                            borderRadius: "50%", 
                            bgcolor: i === 0 ? "#667eea" : "#cbd5e1",
                            border: "3px solid #ffffff",
                            zIndex: 1
                          }} 
                        />
                        <Typography sx={{ fontWeight: 700, fontSize: "13px", color: i === 0 ? "#667eea" : "#334155" }}>
                          {history.stage.replace(/_/g, " ")}
                        </Typography>
                        <Typography sx={{ fontSize: "11px", color: "#64748b", mt: 0.25 }}>
                          {formatDate(history.enteredAt)}
                        </Typography>
                        
                      </Box>
                    ))}
                  </Stack>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      
      {/* Edit DM Number Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Edit DM Number</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="DM Number"
            type="text"
            fullWidth
            variant="outlined"
            value={newDmNumber}
            onChange={(e) => setNewDmNumber(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleSaveDmNumber} color="primary" variant="contained" disabled={updating}>
            {updating ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </DialogBox>
  );
};

export default DeliveryMemoDetailsModal;
