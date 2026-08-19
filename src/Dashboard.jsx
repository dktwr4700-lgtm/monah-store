import React, { useState, useEffect } from "react";
import { auth, db, storage } from "./firebase.js";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection, addDoc, query, where, onSnapshot,
  serverTimestamp, doc, setDoc, getDoc, getDocs, writeBatch,
  deleteDoc, updateDoc
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Orders from "./Orders.jsx";

const COLORS = ["#16233F", "#4B6152", "#8B3A3A", "#5B4A8A", "#B9832F"];
const ADMIN_EMAIL = "k1997551@gmail.com";
const MAX_PRODUCT_FILE_MB = 50;
