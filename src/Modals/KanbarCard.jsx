import React, { useState } from "react";
import {
  Box,
  Typography,
  Card,
  Button,
  IconButton,
  Collapse,
  Tooltip,
} from "@mui/material";
import { Person, Phone, ViewInAr } from "@mui/icons-material";
import { CreateButton } from "../components/Styled";
import ImagePreviewModal from "./ImagePreviewModal";
import { resolveImageUrl } from "../config";
import { getMemoTitle } from "../utils/deliveryMemo";

const KanbanCard = ({ memo, status, handleOpenDialog, handleMarkComplete }) => {
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState(null);
  const [selectedImageAlt, setSelectedImageAlt] = useState("");
  const [expandedMemos, setExpandedMemos] = useState({});

  const handleImagePreview = (imageUrl, fabricTitle) => {
    setSelectedImageUrl(imageUrl);
    setSelectedImageAlt(fabricTitle || "Fabric image");
    setImagePreviewOpen(true);
  };

  const toggleExpand = (memoId) => {
    setExpandedMemos((prev) => ({
      ...prev,
      [memoId]: !prev[memoId],
    }));
  };

  return (
    <Card
      sx={{
        borderRadius: "12px",
        border: "1px solid #e5e7eb",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        backgroundColor: "#ffffff",
        cursor: "pointer",
        height: "100%",
        transition: "all 0.2s",
        "&:hover": {
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          transform: "translateY(-2px)",
        },
      }}
    >
      <Box sx={{ p: 2.5 }}>
        <Tooltip title={getMemoTitle(memo)} arrow placement="top">
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: "16px",
              mb: 0.5,
              color: "#111827",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              cursor: "help",
            }}
          >
            {getMemoTitle(memo)}
          </Typography>
        </Tooltip>

        {memo.items?.[0] && (
          <>
            <Typography sx={{ fontSize: "12px", color: "#6b7280", mb: 1 }}>
              Fabric: {memo.items[0].fabricTitle}
            </Typography>
          </>
        )}

        {memo.kanchButtonDetails && (
          <Box
            sx={{
              px: 2,
              py: 1.5,
              mb: 2,
              backgroundColor: "#f0f9ff",
              borderRadius: "8px",
              border: "1px solid #e3e8ee",
            }}
          >
            <Typography
              sx={{
                fontSize: "10px",
                fontWeight: 700,
                color: "#0369a1",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                mb: 0.75,
              }}
            >
              Worker
            </Typography>
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.5 }}
            >
              <Person sx={{ fontSize: 14, color: "#64748b" }} />
              <Typography
                sx={{
                  fontSize: "12px",
                  color: "#1e293b",
                  fontWeight: 500,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {memo.kanchButtonDetails.name}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              <Phone sx={{ fontSize: 14, color: "#64748b" }} />
              <Typography sx={{ fontSize: "12px", color: "#475569" }}>
                {memo.kanchButtonDetails.phoneNumber}
              </Typography>
            </Box>
          </Box>
        )}

        {memo.items?.[0] && (
          <Box
            sx={{
              mb: 2,
              p: 1.5,
              borderRadius: "8px",
              backgroundColor: "#f9fafb",
              border: "1px solid #e5e7eb",
            }}
          >
            {/* Image Display Section */}
            {memo.items[0].imageUrl ? (
              <Box
                sx={{
                  position: "relative",
                  mb: 1.5,
                  width: "50%",
                  height: 120,
                  borderRadius: "8px",
                  overflow: "hidden",
                  border: "1px solid #e5e7eb",
                  "&:hover .image-overlay": {
                    backgroundColor: "rgba(0,0,0,0.4)",
                  },
                  "&:hover .view-button": {
                    opacity: 1,
                  },
                }}
              >
                <Box
                  component="img"
                  src={resolveImageUrl(memo.items[0].imageUrl)}
                  alt={memo.items[0].fabricTitle}
                  sx={{
                    width: "100%",
                    height: 120,
                    objectFit: "cover",
                    display: "block",
                  }}
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
                      handleImagePreview(
                        memo.items[0].imageUrl,
                        memo.items[0].fabricTitle,
                      )
                    }
                    sx={{
                      position: "absolute",
                      bottom: 8,
                      right: 8,
                      opacity: 0,
                      transition: "opacity 0.2s ease",
                      width: 40,
                      height: 40,
                      "&:hover": {
                        backgroundColor: "transparent",
                      },
                      boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                      "&:active": {
                        backgroundColor: "transparent",
                      },
                    }}
                  >
                    <ViewInAr sx={{ fontSize: 20, color: "#f3f4f6" }} />
                  </IconButton>
                </Box>
              </Box>
            ) : (
              <Box
                sx={{
                  width: "100%",
                  height: 120,
                  borderRadius: "8px",
                  backgroundColor: "#f3f4f6",
                  border: "2px dashed #d1d5db",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mb: 1.5,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ color: "#9ca3af", fontWeight: 500 }}
                >
                  No Image
                </Typography>
              </Box>
            )}

            <Box sx={{ display: "flex", gap: 1, mb: 0.5 }}>
              <Typography sx={{ fontSize: "13px", fontWeight: 500 }}>
                Color:
              </Typography>
              <Typography sx={{ fontSize: "13px" }}>
                {memo.items[0].fabricColor}
              </Typography>
            </Box>

            <Box sx={{ display: "flex", gap: 1, mb: 0.5 }}>
              <Typography sx={{ fontSize: "13px", fontWeight: 500 }}>
                Dhap:
              </Typography>
              <Typography sx={{ fontSize: "13px" }}>
                {memo.items[0].dhap}
              </Typography>
            </Box>

            <Box sx={{ display: "flex", gap: 1, mb: 0.5 }}>
              <Typography sx={{ fontSize: "13px", fontWeight: 500 }}>
                Fold:
              </Typography>
              <Typography sx={{ fontSize: "13px" }}>
                {memo.items[0].fold}
              </Typography>
            </Box>

            <Box sx={{ display: "flex", gap: 1, mb: 0.5 }}>
              <Typography sx={{ fontSize: "13px", fontWeight: 500 }}>
                Created At:
              </Typography>
              <Typography sx={{ fontSize: "13px" }}>
                {memo.createdAt
                  ? `${new Date(memo.createdAt).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })} ${new Date(memo.createdAt).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}`
                  : "N/A"}
              </Typography>
            </Box>
          </Box>
        )}
        {memo.items?.length > 1 && (
          <Button
            variant="text"
            size="small"
            onClick={() => toggleExpand(memo._id)}
            sx={{ mb: 1, textTransform: "none" }}
          >
            {expandedMemos[memo._id]
              ? "Show Less"
              : `Show ${memo.items.length - 1} More Items`}
          </Button>
        )}
        {memo.items?.length > 1 && (
          <Collapse in={expandedMemos[memo._id]} timeout="auto">
            <Box sx={{ maxHeight: "400px", overflowY: "auto", mb: 1.5 }}>
              {memo.items.slice(1).map((item, index) => (
                <Box
                  key={index}
                  sx={{
                    mb: 1.5,
                    p: 1.5,
                    borderRadius: "8px",
                    backgroundColor: "#f9fafb",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  {item.imageUrl ? (
                    <Box
                      sx={{
                        position: "relative",
                        mb: 1.5,
                        width: "50%",
                        height: 120,
                        borderRadius: "8px",
                        overflow: "hidden",
                        border: "1px solid #e5e7eb",
                        cursor: "pointer",
                        "&:hover .image-overlay": {
                          backgroundColor: "rgba(0,0,0,0.4)",
                        },
                        "&:hover .view-button": {
                          opacity: 1,
                        },
                      }}
                      onClick={() =>
                        handleImagePreview(item.imageUrl, item.fabricTitle)
                      }
                    >
                      <Box
                        component="img"
                        src={resolveImageUrl(item.imageUrl)}
                        alt={item.fabricTitle}
                        sx={{
                          width: "100%",
                          height: 120,
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                      <Box
                        className="image-overlay"
                        sx={{
                          position: "absolute",
                          inset: 0,
                          backgroundColor: "rgba(0,0,0,0)",
                          transition: "background-color 0.2s ease",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <ViewInAr
                          className="view-button"
                          sx={{
                            fontSize: 32,
                            color: "#ffffff",
                            opacity: 0,
                            transition: "opacity 0.2s ease",
                          }}
                        />
                      </Box>
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        width: "100%",
                        height: 120,
                        borderRadius: "8px",
                        backgroundColor: "#f3f4f6",
                        border: "2px dashed #d1d5db",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mb: 1.5,
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ color: "#9ca3af", fontWeight: 500 }}
                      >
                        No Image
                      </Typography>
                    </Box>
                  )}

                  <Box sx={{ display: "flex", gap: 1, mb: 0.5 }}>
                    <Typography sx={{ fontSize: "13px", fontWeight: 500 }}>
                      Color:
                    </Typography>
                    <Typography sx={{ fontSize: "13px" }}>
                      {item.fabricColor}
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", gap: 1, mb: 0.5 }}>
                    <Typography sx={{ fontSize: "13px", fontWeight: 500 }}>
                      Dhap:
                    </Typography>
                    <Typography sx={{ fontSize: "13px" }}>
                      {item.dhap}
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", gap: 1, mb: 0.5 }}>
                    <Typography sx={{ fontSize: "13px", fontWeight: 500 }}>
                      Fold:
                    </Typography>
                    <Typography sx={{ fontSize: "13px" }}>
                      {item.fold}
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", gap: 1, mb: 0.5 }}>
                    <Typography sx={{ fontSize: "13px", fontWeight: 500 }}>
                      Created At:
                    </Typography>
                    <Typography sx={{ fontSize: "13px" }}>
                      {memo.createdAt
                        ? `${new Date(memo.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            },
                          )} ${new Date(memo.createdAt).toLocaleTimeString(
                            "en-US",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}`
                        : "N/A"}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Collapse>
        )}

        {/* Footer Actions */}
        {status === "notAssigned" && (
          <CreateButton
            variant="outlined"
            size="small"
            sx={{ mt: 1, textTransform: "none", borderRadius: "8px" }}
            onClick={() => handleOpenDialog(memo._id)}
            fullWidth
          >
            Assign Worker
          </CreateButton>
        )}

        {status === "assigned" && (
          <Button
            variant="contained"
            fullWidth
            size="small"
            onClick={() => handleMarkComplete(memo._id)}
            sx={{
              mt: 1,
              borderRadius: "8px",
              textTransform: "none",
              fontWeight: 600,
              fontSize: "13px",
              py: 1,
              backgroundColor: "#16a34a",
              boxShadow: "none",
              "&:hover": {
                backgroundColor: "#15803d",
              },
            }}
          >
            Mark Complete
          </Button>
        )}

        {status === "completed" && (
          <Box
            sx={{
              width: "100%",
              mt: 1,
              py: 1,
              backgroundColor: "#f0fdf4",
              border: "1px solid #86efac",
              borderRadius: "8px",
              textAlign: "center",
            }}
          >
            <Typography
              sx={{
                color: "#166534",
                fontWeight: 600,
                fontSize: "13px",
              }}
            >
              ✓ Completed
            </Typography>
          </Box>
        )}
      </Box>

      <ImagePreviewModal
        open={imagePreviewOpen}
        src={resolveImageUrl(selectedImageUrl)}
        onClose={() => setImagePreviewOpen(false)}
      />
    </Card>
  );
};

export default KanbanCard;
