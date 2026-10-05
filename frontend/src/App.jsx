import React from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import MembershipForm from "./pages/Form";

const App = () => (
  <div className="min-h-screen flex flex-col bg-royal-50">
    <Navbar />
    <main className="flex-1">
      <MembershipForm />
    </main>
    <Footer />
  </div>
);

export default App;
