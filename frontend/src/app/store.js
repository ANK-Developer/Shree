import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import adminsReducer from "../features/admins/adminsSlice";
import membersReducer from "../features/members/membersSlice";
import importantDatesReducer from "../features/importantDates/importantDatesSlice";
import eventsReducer from "../features/events/eventsSlice";
import dashboardReducer from "../features/dashboard/dashboardSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    admins: adminsReducer,
    members: membersReducer,
    importantDates: importantDatesReducer,
    events: eventsReducer,
    dashboard: dashboardReducer,
  },
});
