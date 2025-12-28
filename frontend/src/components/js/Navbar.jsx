// src/Navbar.jsx

import React from "react";
import { Link } from "react-router-dom"; // Importiere Link, da er für die Navigation verwendet wird
import "../css/Navbar.css"; // Optional: Wenn du separates CSS hast

function Navbar() {
  return (
    <div>
      <nav>
        <Link to="/">Home</Link> | <Link to="/about">About</Link> | <Link to="/contact">Contact</Link>
      </nav>
    </div>
  );
}

export default Navbar;
