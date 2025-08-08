import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

// Initialize SuperAdmin user
export const initializeSuperAdmin = async (user) => {
  try {
    const userRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userRef);
    
    // Check if user already exists and is SuperAdmin
    if (userDoc.exists()) {
      const userData = userDoc.data();
      if (userData.role === "superadmin") {
        console.log("SuperAdmin already initialized");
        return { success: true, data: userData };
      }
    }
    
    // Create/Update SuperAdmin profile
    const superAdminData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || "SuperAdmin",
      photoURL: user.photoURL || "",
      role: "superadmin",
      organizationId: null, // SuperAdmin doesn't belong to specific org
      permissions: [
        "manage_organizations",
        "manage_all_users",
        "manage_all_certificates", 
        "view_analytics",
        "system_settings",
        "blockchain_config"
      ],
      profile: {
        position: "System Administrator",
        department: "Platform Management"
      },
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    };
    
    await setDoc(userRef, superAdminData);
    
    console.log("SuperAdmin initialized successfully");
    return { success: true, data: superAdminData };
    
  } catch (error) {
    console.error("Error initializing SuperAdmin:", error);
    return { success: false, error: error.message };
  }
};

// Create initial demo organizations
export const createDemoData = async () => {
  try {
    // Demo Organization 1: University
    const uiOrg = {
      name: "Universitas Indonesia",
      slug: "universitas-indonesia", 
      type: "university",
      parentOrgId: null,
      level: "institution",
      isActive: true,
      logoUrl: "",
      contactInfo: {
        email: "admin@ui.ac.id",
        phone: "+62-21-7270011",
        address: "Depok, Jawa Barat 16424",
        website: "ui.ac.id"
      },
      settings: {
        certificateIdFormat: "UI-{YEAR}-{NUMBER}",
        qrCodeTemplate: "standard",
        approvalRequired: false,
        allowedCertTypes: ["academic", "achievement"]
      }
    };
    
    // Demo Organization 2: School
    const smaOrg = {
      name: "SMA Negeri 1 Jakarta",
      slug: "sma-negeri-1-jakarta",
      type: "school", 
      parentOrgId: null,
      level: "institution",
      isActive: true,
      logoUrl: "",
      contactInfo: {
        email: "admin@sman1jakarta.sch.id",
        phone: "+62-21-3904502",
        address: "Jakarta Pusat, DKI Jakarta",
        website: "sman1jakarta.sch.id"
      },
      settings: {
        certificateIdFormat: "SMA1JKT-{YEAR}-{NUMBER}",
        qrCodeTemplate: "standard", 
        approvalRequired: true,
        allowedCertTypes: ["academic", "achievement"]
      }
    };
    
    // Demo Organization 3: UKM (child of UI)
    const ukmOrg = {
      name: "UKM Basket UI",
      slug: "ukm-basket-ui",
      type: "ukm",
      parentOrgId: "ui-parent-id", // Will be updated after UI org created
      level: "club",
      isActive: true,
      logoUrl: "",
      contactInfo: {
        email: "basket@ui.ac.id",
        phone: "+62-81234567890",
        address: "Kampus UI Depok",
        website: "basket.ui.ac.id"
      },
      settings: {
        certificateIdFormat: "BASKET-{YEAR}-{NUMBER}",
        qrCodeTemplate: "compact",
        approvalRequired: false,
        allowedCertTypes: ["achievement", "participation"]
      }
    };
    
    console.log("Demo data structure created");
    return { 
      success: true, 
      organizations: [uiOrg, smaOrg, ukmOrg] 
    };
    
  } catch (error) {
    console.error("Error creating demo data:", error);
    return { success: false, error: error.message };
  }
};