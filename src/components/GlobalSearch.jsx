import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  TextField,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  Paper,
  Typography,
  CircularProgress,
  ClickAwayListener,
  Fade,
  Chip,
  IconButton,
  Avatar,
  Tooltip,
} from "@mui/material";
import { Search, Close, LocalShipping, ChevronRight, Launch } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import DeliveryMemoDetailsModal from "../Modals/DeliveryMemoDetailsModal";
import { useDebounce } from "./hooks/useDebounce";
import { getMemoTitle } from "../utils/deliveryMemo";

const GlobalSearch = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedMemo, setSelectedMemo] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const debouncedQuery = useDebounce(query, 500);

  const performSearch = useCallback(async (q) => {
    if (!q || q.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await axiosInstance.get(`/delivery-memos/search?q=${encodeURIComponent(q)}`);
      setResults(response.data.data || []);
    } catch (error) {
      console.error("Search failed:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debouncedQuery) {
      performSearch(debouncedQuery);
    } else {
      setResults([]);
    }
  }, [debouncedQuery, performSearch]);

  const getStageRoute = (stage) => {
    if (!stage) return "";
    const stageCaps  = stage.toUpperCase();
    if (stageCaps .includes("CUTTING")) {
      return "/delivery-memo/cutting";
    }
    if (stageCaps .includes("PRE_STITCHER") || stageCaps .includes("ASSIGN_PRE_STITCHER")) {
      return "/delivery-memo/assign-pre-stitcher";
    }
    if (stageCaps .includes("TAILOR") || stageCaps .includes("ASSIGN_TAILOR")) {
      return "/delivery-memo/admin-assign-tailor";
    }
    if (stageCaps .includes("KANCH_BUTTON") || stageCaps .includes("KANCH")) {
      return "/delivery-memo/kanch-button";
    }
    if (stageCaps .includes("CREATE_DELIVERY_MEMO")) {
      return "/delivery-memo/create-delivery-memo";
    }
    return `/delivery-memo/${stage.toLowerCase().replace(/_/g, "-")}`;
  };

  const handleGoToStage = (memo) => {
    if (!memo.stage) return;
    const route = getStageRoute(memo.stage);
    setOpen(false);
    navigate(route);
  };

  const handleResultClick = (memo) => {
    setSelectedMemo(memo);
    setModalOpen(true);
    setOpen(false);
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setOpen(false);
  };

  return (
    <ClickAwayListener onClickAway={() => setOpen(false)}>
      <Box sx={{ position: "relative", width: { xs: "100%", md: "350px" } }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search memos (DM Number, Title, SKU...)"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => query.length >= 2 && setOpen(true)}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "10px",
              backgroundColor: "#f3f4f6",
              "& fieldset": { borderColor: "transparent" },
              "&:hover fieldset": { borderColor: "#cbd5e1" },
              "&.Mui-focused fieldset": { borderColor: "#667eea" },
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: "#94a3b8", fontSize: 20 }} />
              </InputAdornment>
            ),
            endAdornment: query && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={clearSearch}>
                  <Close sx={{ fontSize: 16 }} />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <Fade in={open && (loading || results.length > 0 || (query.length >= 2 && !loading))}>
          <Paper
            elevation={8}
            sx={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              mt: 1,
              maxHeight: "400px",
              overflowY: "auto",
              zIndex: 1300,
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
            }}
          >
            {loading ? (
              <Box sx={{ p: 3, textAlign: "center" }}>
                <CircularProgress size={24} sx={{ color: "#667eea" }} />
                <Typography sx={{ mt: 1, fontSize: "13px", color: "#64748b" }}>Searching...</Typography>
              </Box>
            ) : results.length > 0 ? (
              <List sx={{ py: 0 }}>
                {results.map((memo) => (
                  <ListItem
                    key={memo.deliveryMemoId}
                    button
                    onClick={() => handleResultClick(memo)}
                    sx={{
                      borderBottom: "1px solid #f1f5f9",
                      "&:last-child": { borderBottom: "none" },
                      "&:hover": { backgroundColor: "#f8fafc" },
                      py: 1.5,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, width: "100%" }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: "#e0e7ff", color: "#4338ca" }}>
                        <LocalShipping sx={{ fontSize: 18 }} />
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontWeight: 600, fontSize: "14px", color: "#1e293b" }}>
                          {memo.dmNumber && memo.dmNumber.trim() !== "" ? `DM NO: ${memo.dmNumber}` : getMemoTitle(memo)}
                        </Typography>
                        {memo.dmNumber && memo.items?.[0] && (
                          <Typography sx={{ fontSize: "12px", color: "#64748b" }}>
                            {memo.items[0].fabricTitle}
                          </Typography>
                        )}
                        <Box sx={{ display: "flex", gap: 1, mt: 0.5, flexWrap: "wrap", alignItems: "center" }}>
                          {memo.stage ? (
                            <Tooltip title="Go to Stage Page" arrow>
                              <Chip 
                                label={memo.stage.replace(/_/g, " ")} 
                                size="small" 
                                color="primary"
                                clickable
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleGoToStage(memo);
                                }}
                                sx={{ 
                                  fontSize: "10px", 
                                  height: "18px",
                                  bgcolor: "#e0e7ff",
                                  color: "#4338ca",
                                  border: "1px solid #c7d2fe",
                                  "&:hover": {
                                    bgcolor: "#c7d2fe",
                                    color: "#3730a3",
                                  }
                                }} 
                              />
                            </Tooltip>
                          ) : (
                            <Chip 
                              label="N/A" 
                              size="small" 
                              variant="outlined" 
                              sx={{ fontSize: "10px", height: "18px" }} 
                            />
                          )}
                          {memo.status === "CLOSED" && (
                            <Chip 
                              label="Closed" 
                              size="small" 
                              color="success" 
                              sx={{ fontSize: "10px", height: "18px" }} 
                            />
                          )}
                        </Box>
                      </Box>
                      {memo.stage ? (
                        <Tooltip title="Go to Stage Page" arrow>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleGoToStage(memo);
                            }}
                            sx={{
                              color: "#6366f1",
                              p: 0.25,
                              "&:hover": {
                                backgroundColor: "#e0e7ff",
                              }
                            }}
                          >
                            <Launch sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <ChevronRight sx={{ color: "#94a3b8", fontSize: 20 }} />
                      )}
                    </Box>
                  </ListItem>
                ))}
              </List>
            ) : query.length >= 2 ? (
              <Box sx={{ p: 4, textAlign: "center" }}>
                <Typography sx={{ fontSize: "14px", color: "#64748b" }}>No memos found for "{query}"</Typography>
              </Box>
            ) : null}
          </Paper>
        </Fade>

        {selectedMemo && (
          <DeliveryMemoDetailsModal
            open={modalOpen}
            memo={selectedMemo}
            onClose={() => setModalOpen(false)}
          />
        )}
      </Box>
    </ClickAwayListener>
  );
};

export default GlobalSearch;
