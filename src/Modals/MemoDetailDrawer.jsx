import {
  Box,
  Button,
  Card,
  Chip,
  Drawer,
  IconButton,
  Typography,
} from "@mui/material";
import { ExpandMore, ViewInAr, Notes } from "@mui/icons-material";
import { useState } from "react";
import { resolveImageUrl } from "../config";
import ImagePreviewModal from "./ImagePreviewModal";

const MemoDetailDrawer = ({
  open,
  onClose,
  memo,
  title,
  onMarkDamage,
  onImagePreview,
  extraContent,
  headerExtra,
  notesHistory, 
}) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");

  if (!memo) return null;

  const handleImagePreviewInternal = (url) => {
    if (onImagePreview) {
      onImagePreview(url);
    } else {
      setPreviewUrl(url);
      setPreviewOpen(true);
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{ "& .MuiDrawer-paper": { width: { xs: "100%", sm: 400 } } }}
    >
      {headerExtra && (
        <Box sx={{ position: "sticky", top: 0, zIndex: 10 }}>
          {headerExtra}
        </Box>
      )}
      
      <Box sx={{ p: 3, pb: 10 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
              {title || "Memo Details"}
            </Typography>
            <Typography sx={{ fontSize: "14px", color: "#6b7280" }}>
              {memo.items?.length || 0} items • Total: {memo.totalDhapFold || 0}{" "}
              m
            </Typography>
          </Box>
          <IconButton onClick={onClose}>
            <ExpandMore />
          </IconButton>
        </Box>
        
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
          {memo.items?.map((item, idx) => (
            <Card
              key={idx}
              sx={{ p: 2, border: "1px solid #e5e7eb", borderRadius: "12px" }}
            >
              {/* Image */}
              {/* {item.imageUrl ? (
                <Box
                  sx={{
                    position: "relative",
                    mb: 2,
                    width: "100%",
                    height: 180,
                    borderRadius: "8px",
                    overflow: "hidden",
                    border: "1px solid #e5e7eb",
                    
                  }}
                >
                  <Box
                    component="img"
                    src={resolveImageUrl(item.imageUrl)}
                    alt={item.fabricTitle}
                    sx={{ width: "100%", height: 180, objectFit: "cover" }}
                  />
                  <Box
                    className="image-overlay"
                    sx={{
                      position: "absolute",
                      inset: 0,
                      backgroundColor: "rgba(0,0,0,0)",
                      transition: "background-color 0.2s ease",
                    }}
                  >
                    
                  </Box>
                </Box>
              ) : (
                <Box
                  sx={{
                    width: "100%",
                    height: 180,
                    borderRadius: "8px",
                    backgroundColor: "#f3f4f6",
                    border: "2px dashed #d1d5db",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 2,
                  }}
                >
                  <Typography sx={{ color: "#9ca3af", fontWeight: 500 }}>
                    No Image
                  </Typography>
                </Box>
              )} */}
                {item.imageUrl ? (
                    <Box
                      sx={{
                        position: "relative",
                        mb: 2,
                        width: "100%",
                        height: 180,
                        borderRadius: "8px",
                        overflow: "hidden",
                        border: "1px solid #e5e7eb",
                        "&:hover .image-overlay": {
                          backgroundColor: "rgba(0,0,0,0.4)",
                        },
                        "&:hover .view-button": { opacity: 1 },
                      }}
                    > 
                      <Box
                        component="img"
                        src={resolveImageUrl(item.imageUrl)}
                        alt={item.fabricTitle}
                        sx={{ width: "100%", height: 180, objectFit: "cover" }}
                      />
                      <Box
                        className="image-overlay"
                        sx={{
                          position: "absolute",
                          inset: 0,
                          backgroundColor: "rgba(0,0,0,0)",
                          transition: "background-color 0.2s ease",
                        }}
                      >
                        <IconButton
                          className="view-button"
                          onClick={() =>
                            handleImagePreviewInternal(item.imageUrl)
                          }
                          sx={{
                            position: "absolute",
                            bottom: 8,
                            right: 8,
                            opacity: 0,
                            transition: "opacity 0.2s ease",
                            width: 40,
                            height: 40,
                            backgroundColor: "rgba(255,255,255,0.9)",
                            "&:hover": {
                              backgroundColor: "rgba(255,255,255,1)",
                            },
                          }}
                        >
                          <ViewInAr sx={{ fontSize: 20, color: "#111827" }} />
                        </IconButton>
                      </Box>
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        width: "100%",
                        height: 180,
                        borderRadius: "8px",
                        backgroundColor: "#f3f4f6",
                        border: "2px dashed #d1d5db",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mb: 2,
                      }}
                    >
                      <Typography sx={{ color: "#9ca3af", fontWeight: 500 }}>
                        No Image
                      </Typography>
                    </Box>
                  )}

              <Typography sx={{ fontSize: "16px", fontWeight: 600, mb: 0.5 }}>
                {item.fabricTitle}
              </Typography>
              <Typography sx={{ fontSize: "13px", color: "#6b7280", mb: 2 }}>
                SKU: {item.fabricSKU} • Color: {item.fabricColor}
              </Typography>
              {(item.shirtSKUs?.length > 0 || item.shirtQuantity) && (
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: 1.5,
                    p: 1.5,
                    backgroundColor: "#f0fdf4",
                    borderRadius: "8px",
                    mb: 1.5,
                  }}
                >
                  {[
                    { 
                      label: "Shirt SKUs", 
                      value: item.shirtSKUs?.map(s => typeof s === 'string' ? s : `${s.sku}: ${s.quantity}`).join(', ') || "—" 
                    },
                    { label: "Shirt Qty", value: item.shirtQuantity ?? "—" },
                  ].map(({ label, value }) => (
                    <Box key={label}>
                      <Typography
                        sx={{ fontSize: "11px", color: "#6b7280", mb: 0.5 }}
                      >
                        {label}
                      </Typography>
                      <Typography sx={{ fontSize: "15px", fontWeight: 600 }}>
                        {value}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
              {/* Stats Grid */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 1.5,
                  p: 1.5,
                  backgroundColor: "#f9fafb",
                  borderRadius: "8px",
                  mb: 1.5,
                }}
              >
                {[
                  { label: "Dhap", value: item.dhap },
                  { label: "Fold", value: item.fold },
                  {
                    label: "Allocated",
                    value: `${parseFloat((item.dhap || 0) * (item.fold || 0)).toFixed(2)} m`,
                    color: "#059669",
                  },
                ].map(({ label, value, color }) => (
                  <Box key={label}>
                    <Typography
                      sx={{ fontSize: "11px", color: "#6b7280", mb: 0.5 }}
                    >
                      {label}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: "15px",
                        fontWeight: 600,
                        color: color || "inherit",
                      }}
                    >
                      {value}
                    </Typography>
                  </Box>
                ))}
              </Box>
              {extraContent?.(item)}
              {/* Optional: extra slot for stage-specific content */}
              {onMarkDamage && (
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  fullWidth
                  onClick={() => {
                    onClose();
                    onMarkDamage(item);
                  }}
                  sx={{ mb: 1.5 }}
                >
                  Mark Damage
                </Button>
              )}

              {item.createdAt && (
                <Typography
                  sx={{ fontSize: "11px", color: "#6b7280", mt: 1.5 }}
                >
                  Created:{" "}
                  {new Date(item.createdAt).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}{" "}
                  {new Date(item.createdAt).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Typography>
              )}
            </Card>
          ))}
        </Box>

        {/* Notes History Section */}
        {notesHistory && notesHistory.length > 0 && (
          <Box sx={{ mt: 4, pt: 3, borderTop: "2px solid #e3e8ee" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <Notes sx={{ fontSize: 20, color: "#111827" }} />
              <Typography sx={{ fontSize: "16px", fontWeight: 700 }}>
                Notes History
              </Typography>
            </Box>
            
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {notesHistory.map((note, idx) => (
                <Box
                  key={idx}
                  sx={{
                    p: 2,
                    backgroundColor: "#f9fafb",
                    borderRadius: "8px",
                    borderLeft: "4px solid #667eea",
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "13px",
                      color: "#374151",
                      lineHeight: 1.5,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {note.notes}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Box>

      <ImagePreviewModal
        open={previewOpen}
        src={resolveImageUrl(previewUrl)}
        onClose={() => setPreviewOpen(false)}
      />
    </Drawer>
  );
};


export default MemoDetailDrawer;
