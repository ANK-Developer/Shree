import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../services/api";

export const fetchDashboard = createAsyncThunk("dashboard/fetch", async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get("/dashboard");
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Something went wrong");
  }
});

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState: {
    stats: { total: 0, active: 0, inactive: 0 },
    upcomingEvents: [],
    importantDates: [],
    loaded: false, // pehli baar data aane tak "–" / Loading dikhane ke liye
  },
  extraReducers: (builder) => {
    builder.addCase(fetchDashboard.fulfilled, (state, { payload }) => {
      state.stats = payload.stats;
      state.upcomingEvents = payload.upcomingEvents;
      state.importantDates = payload.importantDates;
      state.loaded = true;
    });
  },
});

export default dashboardSlice.reducer;
