import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../services/api";

// params: { range, type, status, search, page, limit }
export const fetchImportantDates = createAsyncThunk("importantDates/fetch", async (params, { rejectWithValue }) => {
  try {
    const { data } = await api.get("/important-dates", { params });
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Something went wrong");
  }
});

const importantDatesSlice = createSlice({
  name: "importantDates",
  initialState: {
    list: [],
    pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
    loading: false,
    requestId: null, // sirf latest request ka response apply hota hai
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchImportantDates.pending, (state, { meta }) => {
        state.loading = true;
        state.requestId = meta.requestId;
      })
      .addCase(fetchImportantDates.fulfilled, (state, { payload, meta }) => {
        if (state.requestId !== meta.requestId) return;
        state.loading = false;
        state.list = payload.dates;
        state.pagination = payload.pagination;
      })
      .addCase(fetchImportantDates.rejected, (state, { meta }) => {
        if (state.requestId !== meta.requestId) return;
        state.loading = false;
      });
  },
});

export default importantDatesSlice.reducer;
