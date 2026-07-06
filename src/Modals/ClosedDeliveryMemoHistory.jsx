import {
  Box,
  Card,
  Chip,
  Container,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Drawer,
} from "@mui/material";
import {
  ViewInAr,
  Palette,
  Person,
  Phone,
  ExpandMore,
  CheckCircle,
  History as HistoryIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import NoResponsePage from "../pages/NoResponsePage";
import axiosInstance from "../utils/axiosInstance";
import ImagePreviewModal from "./ImagePreviewModal";
import { resolveImageUrl } from "../config";

const ClosedDeliveryMemoHistory = () => {
  const dispatch = useDispatch();

  const [memos, setMemos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("All"); // 'Active', 'Closed', 'All'

  // Detail drawer states
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [selectedMemoForDetails, setSelectedMemoForDetails] = useState(null);

  // Image preview states
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState(null);
  const [selectedImageAlt, setSelectedImageAlt] = useState("");

  useEffect(() => {
    fetchMemoHistory();
  }, [statusFilter]);

  // ✅ Fetch memos with server-side filtering
  const fetchMemoHistory = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(
        `/kanch-button/history?status=${statusFilter}`,
      );
      setMemos(response.data.data || []);
    } catch (err) {
      console.error("Error fetching memo history:", err);
      setError("Failed to load memo history");
    } finally {
      setLoading(false);
    }
  };

  const handleImagePreview = (imageUrl, fabricTitle) => {
    setSelectedImageUrl(imageUrl);
    setSelectedImageAlt(fabricTitle || "Fabric image");
    setImagePreviewOpen(true);
  };

  const openDetailDrawer = (memo) => {
    setSelectedMemoForDetails(memo);
    setDetailDrawerOpen(true);
  };

  const closeDetailDrawer = () => {
    setDetailDrawerOpen(false);
    setSelectedMemoForDetails(null);
  };

  // ✅ Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ✅ Get status badge color
  const getStatusColor = (status) => {
    return status === "CLOSED"
      ? { bg: "#f0fdf4", color: "#166534", border: "#86efac" }
      : { bg: "#eff6ff", color: "#1e40af", border: "#93c5fd" };
  };

  if (loading) {
    return (
      <Box sx={{ backgroundColor: "#fafbfc", minHeight: "100vh", py: 4 }}>
        <Container maxWidth="xl">
          <Skeleton variant="text" width={300} height={50} sx={{ mb: 3 }} />
          <Skeleton
            variant="rectangular"
            width={200}
            height={56}
            sx={{ mb: 3 }}
          />
          <Skeleton variant="rectangular" width="100%" height={400} />
        </Container>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ backgroundColor: "#fafbfc", minHeight: "100vh", py: 4 }}>
        <Container maxWidth="xl">
          {/* Filter Section */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
            }}
          >
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel
                sx={{
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                Filter by Status
              </InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Filter by Status"
                sx={{
                  borderRadius: "8px",
                  fontSize: "14px",
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#e5e7eb",
                  },
                }}
              >
                <MenuItem value="All">
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        backgroundColor: "#9ca3af",
                      }}
                    />
                    All Memos
                  </Box>
                </MenuItem>
                <MenuItem value="Active">
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        backgroundColor: "#3b82f6",
                      }}
                    />
                    Active Only
                  </Box>
                </MenuItem>
                <MenuItem value="Closed">
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        backgroundColor: "#22c55e",
                      }}
                    />
                    Closed Only
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>

            <Typography
              sx={{
                fontSize: "14px",
                color: "#6b7280",
                fontWeight: 600,
              }}
            >
              Total: {memos.length} memos
            </Typography>
          </Box>

          {/* Content */}
          {memos.length === 0 ? (
            <NoResponsePage />
          ) : (
            <TableContainer
              component={Paper}
              sx={{
                borderRadius: "12px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              <Table>
                <TableHead>
                  <TableRow
                    sx={{
                      backgroundColor: "#f9fafb",
                    }}
                  >
                    <TableCell
                      sx={{
                        fontWeight: 700,
                        fontSize: "12px",
                        color: "#6b7280",
                        textTransform: "uppercase",
                      }}
                    >
                      Memo Details
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 700,
                        fontSize: "12px",
                        color: "#6b7280",
                        textTransform: "uppercase",
                      }}
                    >
                      Assigned To
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 700,
                        fontSize: "12px",
                        color: "#6b7280",
                        textTransform: "uppercase",
                      }}
                    >
                      Status
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 700,
                        fontSize: "12px",
                        color: "#6b7280",
                        textTransform: "uppercase",
                      }}
                    >
                      Created
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 700,
                        fontSize: "12px",
                        color: "#6b7280",
                        textTransform: "uppercase",
                      }}
                    >
                      Closed On
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 700,
                        fontSize: "12px",
                        color: "#6b7280",
                        textTransform: "uppercase",
                      }}
                    >
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {memos.map((memo) => {
                    const itemCount = memo.items?.length || 0;
                    const uniqueColors = [
                      ...new Set(
                        memo.items?.map((item) => item.fabricColor) || [],
                      ),
                    ];
                    const statusColors = getStatusColor(memo.status);

                    return (
                      <TableRow
                        key={memo._id}
                        sx={{
                          "&:hover": {
                            backgroundColor: "#f9fafb",
                          },
                          opacity: memo.status === "CLOSED" ? 0.85 : 1,
                        }}
                      >
                        {/* Memo Details */}
                        <TableCell>
                          <Box>
                            <Typography
                              sx={{
                                fontSize: "14px",
                                fontWeight: 600,
                                color: "#111827",
                                mb: 0.5,
                              }}
                            >
                              {memo.items
                                ?.map((item) => item.fabricTitle)
                                .filter(Boolean)
                                .join(", ") || "N/A"}
                            </Typography>
                            <Box
                              sx={{
                                display: "flex",
                                gap: 0.5,
                                flexWrap: "wrap",
                              }}
                            >
                              <Chip
                                label={`${itemCount} ${itemCount === 1 ? "item" : "items"}`}
                                size="small"
                                sx={{
                                  fontSize: "11px",
                                  height: "20px",
                                  backgroundColor: "#dbeafe",
                                  color: "#1e40af",
                                }}
                              />
                              {uniqueColors.slice(0, 2).map((color, idx) => (
                                <Chip
                                  key={idx}
                                  icon={<Palette sx={{ fontSize: 12 }} />}
                                  label={color}
                                  size="small"
                                  sx={{
                                    fontSize: "10px",
                                    height: "20px",
                                    backgroundColor: "#f3f4f6",
                                  }}
                                />
                              ))}
                              {uniqueColors.length > 2 && (
                                <Chip
                                  label={`+${uniqueColors.length - 2}`}
                                  size="small"
                                  sx={{
                                    fontSize: "10px",
                                    height: "20px",
                                    backgroundColor: "#f3f4f6",
                                  }}
                                />
                              )}
                            </Box>
                          </Box>
                        </TableCell>

                        {/* Assigned To */}
                        <TableCell>
                          {memo.kanchButtonDetails ? (
                            <Box>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 0.5,
                                  mb: 0.5,
                                }}
                              >
                                <Person
                                  sx={{ fontSize: 14, color: "#64748b" }}
                                />
                                <Typography
                                  sx={{
                                    fontSize: "13px",
                                    fontWeight: 600,
                                    color: "#111827",
                                  }}
                                >
                                  {memo.kanchButtonDetails.name}
                                </Typography>
                              </Box>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 0.5,
                                }}
                              >
                                <Phone
                                  sx={{ fontSize: 14, color: "#64748b" }}
                                />
                                <Typography
                                  sx={{
                                    fontSize: "12px",
                                    color: "#6b7280",
                                  }}
                                >
                                  {memo.kanchButtonDetails.phoneNumber}
                                </Typography>
                              </Box>
                            </Box>
                          ) : (
                            <Typography
                              sx={{
                                fontSize: "12px",
                                color: "#9ca3af",
                                fontStyle: "italic",
                              }}
                            >
                              Not assigned
                            </Typography>
                          )}
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <Chip
                            label={
                              memo.status === "CLOSED" ? "Closed" : "Active"
                            }
                            icon={
                              memo.status === "CLOSED" ? (
                                <CheckCircle sx={{ fontSize: 14 }} />
                              ) : (
                                <CloseIcon sx={{ fontSize: 14 }} />
                              )
                            }
                            sx={{
                              backgroundColor: statusColors.bg,
                              color: statusColors.color,
                              border: `1px solid ${statusColors.border}`,
                              fontWeight: 600,
                              fontSize: "12px",
                            }}
                          />
                        </TableCell>

                        {/* Created Date */}
                        <TableCell>
                          <Typography
                            sx={{ fontSize: "13px", color: "#374151" }}
                          >
                            {formatDate(memo.createdAt)}
                          </Typography>
                        </TableCell>

                        {/* Closed Date */}
                        <TableCell>
                          {memo.status === "CLOSED" && memo.closedAt ? (
                            <Box>
                              <Typography
                                sx={{
                                  fontSize: "13px",
                                  color: "#374151",
                                  mb: 0.5,
                                }}
                              >
                                {formatDate(memo.closedAt)}
                              </Typography>
                              
                            </Box>
                          ) : (
                            <Typography
                              sx={{
                                fontSize: "12px",
                                color: "#9ca3af",
                                fontStyle: "italic",
                              }}
                            >
                              —
                            </Typography>
                          )}
                        </TableCell>

                        {/* Actions */}
                        <TableCell>
                          <IconButton
                            onClick={() => openDetailDrawer(memo)}
                            sx={{
                              color: "#667eea",
                              "&:hover": {
                                backgroundColor: "rgba(102, 126, 234, 0.1)",
                              },
                            }}
                          >
                            <ViewInAr />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Container>
      </Box>

      {/* Image Preview Modal */}
      <ImagePreviewModal
        open={imagePreviewOpen}
        onClose={() => setImagePreviewOpen(false)}
        imageUrl={selectedImageUrl}
        alt={selectedImageAlt}
      />

      {/* Detail Drawer - READ ONLY for Closed Memos */}
      <Drawer
        anchor="right"
        open={detailDrawerOpen}
        onClose={closeDetailDrawer}
        sx={{
          "& .MuiDrawer-paper": {
            width: { xs: "100%", sm: 450 },
          },
        }}
      >
        {selectedMemoForDetails && (
          <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                mb: 3,
                pb: 2,
                borderBottom: "2px solid #e5e7eb",
              }}
            >
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Memo Details
                </Typography>
                <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                  {selectedMemoForDetails.items?.length || 0} items •{" "}
                  {selectedMemoForDetails.status === "CLOSED"
                    ? "Read Only"
                    : "Active"}
                </Typography>
              </Box>
              <IconButton onClick={closeDetailDrawer}>
                <ExpandMore />
              </IconButton>
            </Box>

            {/* Status Banner for Closed Memos */}
            {selectedMemoForDetails.status === "CLOSED" && (
              <Box
                sx={{
                  p: 2,
                  mb: 3,
                  backgroundColor: "#f0fdf4",
                  border: "1px solid #86efac",
                  borderRadius: "8px",
                }}
              >
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
                >
                  <CheckCircle sx={{ fontSize: 20, color: "#166534" }} />
                  <Typography
                    sx={{
                      fontSize: "14px",
                      fontWeight: 700,
                      color: "#166534",
                    }}
                  >
                    Memo Closed
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 1.5,
                    mb: selectedMemoForDetails.notes ? 1.5 : 0,
                  }}
                >
                  <Box>
                    <Typography
                      sx={{
                        fontSize: "11px",
                        color: "#166534",
                        fontWeight: 600,
                        mb: 0.5,
                      }}
                    >
                      CLOSED ON
                    </Typography>
                    <Typography sx={{ fontSize: "12px", color: "#166534" }}>
                      {formatDate(selectedMemoForDetails.closedAt)}
                    </Typography>
                  </Box>
                  {/* <Box>
                    <Typography
                      sx={{
                        fontSize: "11px",
                        color: "#166534",
                        fontWeight: 600,
                        mb: 0.5,
                      }}
                    >
                      CLOSED BY
                    </Typography>
                    <Typography sx={{ fontSize: "12px", color: "#166534" }}>
                      {selectedMemoForDetails.closedBy || "System"}
                    </Typography>
                  </Box> */}
                </Box>

                {/* Completion Notes */}
                {selectedMemoForDetails.notes && (
                  <Box
                    sx={{
                      pt: 1.5,
                      borderTop: "1px solid #86efac",
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: "11px",
                        color: "#166534",
                        fontWeight: 600,
                        mb: 0.5,
                      }}
                    >
                      COMPLETION REMARKS
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: "13px",
                        color: "#166534",
                        lineHeight: 1.5,
                      }}
                    >
                      {selectedMemoForDetails.notes}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}

            {/* Assigned Worker Info */}
            {selectedMemoForDetails.kanchButtonDetails && (
              <Box
                sx={{
                  p: 2,
                  mb: 3,
                  backgroundColor: "#f9fafb",
                  borderRadius: "8px",
                }}
              >
                <Typography
                  sx={{
                    fontSize: "11px",
                    color: "#6b7280",
                    fontWeight: 600,
                    mb: 1,
                    textTransform: "uppercase",
                  }}
                >
                  Assigned Worker
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mb: 0.5,
                  }}
                >
                  <Person sx={{ fontSize: 16, color: "#64748b" }} />
                  <Typography sx={{ fontSize: "14px", fontWeight: 600 }}>
                    {selectedMemoForDetails.kanchButtonDetails.name}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Phone sx={{ fontSize: 16, color: "#64748b" }} />
                  <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                    {selectedMemoForDetails.kanchButtonDetails.phoneNumber}
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Items List */}
            <Typography
              sx={{
                fontSize: "12px",
                fontWeight: 700,
                color: "#6b7280",
                mb: 2,
                textTransform: "uppercase",
              }}
            >
              Items ({selectedMemoForDetails.items?.length || 0})
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {selectedMemoForDetails.items?.map((item, idx) => (
                <Card
                  key={idx}
                  sx={{
                    p: 2,
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                    opacity:
                      selectedMemoForDetails.status === "CLOSED" ? 0.9 : 1,
                  }}
                >
                  {/* Image */}
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
                        cursor: "pointer",
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
                        src={resolveImageUrl(item.imageUrl)}
                        alt={item.fabricTitle}
                        sx={{
                          width: "100%",
                          height: 180,
                          objectFit: "cover",
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
                            handleImagePreview(item.imageUrl, item.fabricTitle)
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

                  {/* Item Details */}
                  <Typography
                    sx={{ fontSize: "16px", fontWeight: 600, mb: 0.5 }}
                  >
                    {item.fabricTitle}
                  </Typography>
                  <Typography
                    sx={{ fontSize: "13px", color: "#6b7280", mb: 2 }}
                  >
                    SKU: {item.fabricSKU} • Color: {item.fabricColor}
                  </Typography>

                  {/* Dhap & Fold */}
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "repeat(2, 1fr)",
                      gap: 1.5,
                      p: 1.5,
                      backgroundColor: "#f9fafb",
                      borderRadius: "8px",
                    }}
                  >
                    <Box>
                      <Typography
                        sx={{ fontSize: "11px", color: "#6b7280", mb: 0.5 }}
                      >
                        Dhap
                      </Typography>
                      <Typography sx={{ fontSize: "15px", fontWeight: 600 }}>
                        {item.dhap}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography
                        sx={{ fontSize: "11px", color: "#6b7280", mb: 0.5 }}
                      >
                        Fold
                      </Typography>
                      <Typography sx={{ fontSize: "15px", fontWeight: 600 }}>
                        {item.fold}
                      </Typography>
                    </Box>
                  </Box>
                </Card>
              ))}
            </Box>
          </Box>
        )}
      </Drawer>
    </>
  );
};

export default ClosedDeliveryMemoHistory;
