import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import adminsReducer from "../features/admins/adminsSlice";
import membersReducer from "../features/members/membersSlice";
import importantDatesReducer from "../features/importantDates/importantDatesSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    admins: adminsReducer,
    members: membersReducer,
    importantDates: importantDatesReducer,
  },
});
